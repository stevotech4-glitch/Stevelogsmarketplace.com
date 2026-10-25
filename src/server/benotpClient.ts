/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type BenOtpEndpointType = 'handler_api' | 'handler' | 'all_server_2';

export interface BenOtpEndpointsConfig {
  handlerApiUrl?: string;
  handlerUrl?: string;
  allServer2Url?: string;
  defaultEndpoint?: BenOtpEndpointType;
}

export interface BenOtpGetNumberParams {
  endpointType?: BenOtpEndpointType;
  service: string;
  country?: string;
  carrier?: string;
  areaCode?: string;
  duration?: string;
  specificNumber?: string;
  pool?: string;
  quantity?: number;
  maxPrice?: number;
  operator?: string;
  ref?: string;
}

export interface BenOtpGetNumberResult {
  success: boolean;
  orderId?: string;
  phoneNumber?: string;
  raw?: string;
  error?: string;
}

export interface BenOtpGetStatusResult {
  success: boolean;
  status: 'WAIT_CODE' | 'RECEIVED' | 'CANCELLED' | 'UNKNOWN';
  code?: string;
  fullSms?: string;
  raw?: string;
  error?: string;
}

export class BenOtpClient {
  private apiKey: string;
  private handlerApiUrl: string;
  private handlerUrl: string;
  private allServer2Url: string;

  constructor(
    apiKey: string = '',
    endpoints?: BenOtpEndpointsConfig
  ) {
    this.apiKey = (apiKey || process.env.BENOTP_API_KEY || '').trim();
    this.handlerApiUrl = endpoints?.handlerApiUrl || 'https://benotp.com/stubs/handler_api.php';
    this.handlerUrl = endpoints?.handlerUrl || 'https://benotp.com/stubs/handler.php';
    this.allServer2Url = endpoints?.allServer2Url || 'https://benotp.com/stubs/all_server_2.php';
  }

  private getEndpointUrl(type: BenOtpEndpointType): string {
    switch (type) {
      case 'handler':
        return this.handlerUrl;
      case 'all_server_2':
        return this.allServer2Url;
      case 'handler_api':
      default:
        return this.handlerApiUrl;
    }
  }

  private async fetchWithTimeout(url: string, timeoutMs: number = 8000): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Stevelogs-Marketplace/2.0',
        },
        signal: controller.signal,
      });
      return res;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * 1. Get Balance
   * handler_api: https://benotp.com/stubs/handler_api.php?action=getBalance&api_key=KEY
   * handler:     https://benotp.com/stubs/handler.php?action=getBalance&api_key=KEY
   * all_server_2:https://benotp.com/stubs/all_server_2.php?action=getBalance&api_key=KEY
   */
  async getBalance(endpointType?: BenOtpEndpointType): Promise<{
    success: boolean;
    balance: number;
    endpointUsed: string;
    raw?: string;
    error?: string;
  }> {
    if (!this.apiKey) {
      return {
        success: false,
        balance: 0,
        endpointUsed: this.handlerApiUrl,
        error: 'BenOTP API key is required.',
      };
    }

    const endpointsToTry: BenOtpEndpointType[] = endpointType 
      ? [endpointType] 
      : ['handler_api', 'handler', 'all_server_2'];

    let lastError = 'Unable to connect to BenOTP';

    for (const ep of endpointsToTry) {
      const baseUrl = this.getEndpointUrl(ep);
      const url = `${baseUrl}?action=getBalance&api_key=${encodeURIComponent(this.apiKey)}`;

      try {
        const res = await this.fetchWithTimeout(url);
        if (!res.ok) {
          lastError = `HTTP ${res.status}: ${res.statusText}`;
          continue;
        }

        const rawText = (await res.text()).trim();

        // Check known error strings
        if (rawText === 'BAD_KEY' || rawText === 'ERROR_KEY') {
          return {
            success: false,
            balance: 0,
            endpointUsed: baseUrl,
            raw: rawText,
            error: 'Invalid BenOTP API key (BAD_KEY). Please verify in Provider settings.',
          };
        }

        // Response format 1: ACCESS_BALANCE:15.50
        if (rawText.startsWith('ACCESS_BALANCE:')) {
          const val = parseFloat(rawText.split(':')[1]) || 0;
          return {
            success: true,
            balance: val,
            endpointUsed: baseUrl,
            raw: rawText,
          };
        }

        // Response format 2: JSON { balance: 15.5 }
        try {
          const json = JSON.parse(rawText);
          if (typeof json.balance === 'number') {
            return {
              success: true,
              balance: json.balance,
              endpointUsed: baseUrl,
              raw: rawText,
            };
          } else if (typeof json.balance === 'string') {
            return {
              success: true,
              balance: parseFloat(json.balance) || 0,
              endpointUsed: baseUrl,
              raw: rawText,
            };
          }
        } catch {
          // not json
        }

        // Response format 3: plain number "15.50"
        const numVal = parseFloat(rawText);
        if (!isNaN(numVal)) {
          return {
            success: true,
            balance: numVal,
            endpointUsed: baseUrl,
            raw: rawText,
          };
        }

        lastError = `Unexpected response: ${rawText.slice(0, 100)}`;
      } catch (err: any) {
        lastError = err.message || 'Network connection failed';
      }
    }

    return {
      success: false,
      balance: 0,
      endpointUsed: this.getEndpointUrl(endpointsToTry[0]),
      error: lastError,
    };
  }

  /**
   * 2. Get Services
   * handler_api:  https://benotp.com/stubs/handler_api.php?action=getServices&api_key=KEY
   * handler:      https://benotp.com/stubs/handler.php?action=getServices&api_key=KEY
   * all_server_2: https://benotp.com/stubs/all_server_2.php?action=getServices&api_key=KEY&country=COUNTRY_CODE
   */
  async getServices(options?: {
    endpointType?: BenOtpEndpointType;
    country?: string;
  }): Promise<{
    success: boolean;
    services: Array<{ id: string; name: string; price?: number; count?: number }>;
    raw?: any;
    error?: string;
  }> {
    const ep = options?.endpointType || 'handler_api';
    const baseUrl = this.getEndpointUrl(ep);
    let url = `${baseUrl}?action=getServices&api_key=${encodeURIComponent(this.apiKey)}`;
    if (options?.country) {
      url += `&country=${encodeURIComponent(options.country)}`;
    }

    try {
      const res = await this.fetchWithTimeout(url);
      if (!res.ok) {
        return { success: false, services: [], error: `HTTP ${res.status}: ${res.statusText}` };
      }

      const text = await res.text();
      try {
        const json = JSON.parse(text);
        const list: Array<{ id: string; name: string; price?: number; count?: number }> = [];

        if (Array.isArray(json)) {
          for (const item of json) {
            list.push({
              id: String(item.id || item.code || item.name),
              name: String(item.name || item.title || item.id),
              price: Number(item.price || item.cost) || undefined,
              count: Number(item.count || item.quantity) || undefined,
            });
          }
        } else if (typeof json === 'object' && json !== null) {
          for (const [key, val] of Object.entries(json)) {
            if (typeof val === 'object' && val !== null) {
              const v: any = val;
              list.push({
                id: key,
                name: String(v.name || key),
                price: Number(v.price || v.cost) || undefined,
                count: Number(v.count || v.quantity) || undefined,
              });
            } else {
              list.push({
                id: key,
                name: key,
                price: Number(val) || undefined,
              });
            }
          }
        }

        return { success: true, services: list, raw: json };
      } catch {
        // Plain text parsing (e.g. key=val lines)
        const list: Array<{ id: string; name: string; price?: number }> = [];
        const lines = text.split('\n');
        for (const line of lines) {
          const parts = line.trim().split(/[:=,]/);
          if (parts[0]) {
            list.push({
              id: parts[0].trim(),
              name: parts[1] ? parts[1].trim() : parts[0].trim(),
              price: parts[2] ? parseFloat(parts[2]) : undefined,
            });
          }
        }
        return { success: list.length > 0, services: list, raw: text };
      }
    } catch (err: any) {
      return { success: false, services: [], error: err.message || 'Connection error' };
    }
  }

  /**
   * 3. Get Countries
   * handler:      https://benotp.com/stubs/handler.php?action=getCountries&api_key=KEY
   * all_server_2: https://benotp.com/stubs/all_server_2.php?action=getCountries&api_key=KEY
   */
  async getCountries(endpointType: 'handler' | 'all_server_2' = 'handler'): Promise<{
    success: boolean;
    countries: Array<{ id: string; name: string; code?: string }>;
    raw?: any;
    error?: string;
  }> {
    const baseUrl = this.getEndpointUrl(endpointType);
    const url = `${baseUrl}?action=getCountries&api_key=${encodeURIComponent(this.apiKey)}`;

    try {
      const res = await this.fetchWithTimeout(url);
      if (!res.ok) {
        return { success: false, countries: [], error: `HTTP ${res.status}` };
      }
      const text = await res.text();
      try {
        const json = JSON.parse(text);
        const list: Array<{ id: string; name: string; code?: string }> = [];
        if (Array.isArray(json)) {
          for (const c of json) {
            list.push({
              id: String(c.id || c.country || c.code),
              name: String(c.name || c.country_name || c.id),
              code: c.code || c.iso || undefined,
            });
          }
        } else if (typeof json === 'object' && json !== null) {
          for (const [key, val] of Object.entries(json)) {
            list.push({
              id: key,
              name: typeof val === 'string' ? val : (val as any).name || key,
            });
          }
        }
        return { success: true, countries: list, raw: json };
      } catch {
        return { success: false, countries: [], raw: text, error: 'Could not parse countries JSON' };
      }
    } catch (err: any) {
      return { success: false, countries: [], error: err.message };
    }
  }

  /**
   * 4. Get Area Codes
   * handler: https://benotp.com/stubs/handler.php?action=getAreaCodes&api_key=KEY&country=COUNTRY_CODE
   */
  async getAreaCodes(country: string = 'usa'): Promise<{
    success: boolean;
    areaCodes: string[];
    raw?: any;
    error?: string;
  }> {
    const url = `${this.handlerUrl}?action=getAreaCodes&api_key=${encodeURIComponent(this.apiKey)}&country=${encodeURIComponent(country)}`;
    try {
      const res = await this.fetchWithTimeout(url);
      if (!res.ok) {
        return { success: false, areaCodes: [], error: `HTTP ${res.status}` };
      }
      const text = await res.text();
      try {
        const json = JSON.parse(text);
        if (Array.isArray(json)) {
          return { success: true, areaCodes: json.map(String) };
        } else if (typeof json === 'object' && json !== null) {
          return { success: true, areaCodes: Object.keys(json) };
        }
      } catch {
        // comma separated or line separated
        const codes = text.split(/[\n,;]/).map((s) => s.trim()).filter(Boolean);
        return { success: codes.length > 0, areaCodes: codes, raw: text };
      }
      return { success: false, areaCodes: [] };
    } catch (err: any) {
      return { success: false, areaCodes: [], error: err.message };
    }
  }

  /**
   * 5. Get Pools
   * handler: https://benotp.com/stubs/handler.php?action=getPools&api_key=KEY&country=COUNTRY_CODE&service=SERVICE_ID
   */
  async getPools(country: string, service: string): Promise<{
    success: boolean;
    pools: Array<{ id: string; name: string; price?: number }>;
    raw?: any;
    error?: string;
  }> {
    const url = `${this.handlerUrl}?action=getPools&api_key=${encodeURIComponent(this.apiKey)}&country=${encodeURIComponent(country)}&service=${encodeURIComponent(service)}`;
    try {
      const res = await this.fetchWithTimeout(url);
      if (!res.ok) {
        return { success: false, pools: [], error: `HTTP ${res.status}` };
      }
      const text = await res.text();
      try {
        const json = JSON.parse(text);
        const list: Array<{ id: string; name: string; price?: number }> = [];
        if (Array.isArray(json)) {
          for (const item of json) {
            list.push({
              id: String(item.id || item.pool_id || item.name),
              name: String(item.name || item.title || `Pool #${item.id}`),
              price: item.price !== undefined ? Number(item.price) : undefined,
            });
          }
        }
        return { success: true, pools: list, raw: json };
      } catch {
        return { success: false, pools: [], raw: text };
      }
    } catch (err: any) {
      return { success: false, pools: [], error: err.message };
    }
  }

  /**
   * 6. Get Price
   * handler: https://benotp.com/stubs/handler.php?action=getPrice&api_key=KEY&service=SERVICE_ID&country=COUNTRY_CODE&areacode=AREA_CODE&pool=POOL_ID
   */
  async getPrice(params: {
    service: string;
    country?: string;
    areaCode?: string;
    pool?: string;
  }): Promise<{
    success: boolean;
    price: number;
    raw?: string;
    error?: string;
  }> {
    let url = `${this.handlerUrl}?action=getPrice&api_key=${encodeURIComponent(this.apiKey)}&service=${encodeURIComponent(params.service)}`;
    if (params.country) url += `&country=${encodeURIComponent(params.country)}`;
    if (params.areaCode) url += `&areacode=${encodeURIComponent(params.areaCode)}`;
    if (params.pool) url += `&pool=${encodeURIComponent(params.pool)}`;

    try {
      const res = await this.fetchWithTimeout(url);
      const text = (await res.text()).trim();
      const num = parseFloat(text);
      if (!isNaN(num)) {
        return { success: true, price: num, raw: text };
      }
      return { success: false, price: 0, raw: text, error: text };
    } catch (err: any) {
      return { success: false, price: 0, error: err.message };
    }
  }

  /**
   * 7. Get Prices
   * all_server_2: https://benotp.com/stubs/all_server_2.php?action=getPrices&api_key=KEY&service=SERVICE_ID&country=COUNTRY_CODE
   */
  async getPrices(params?: {
    service?: string;
    country?: string;
  }): Promise<{
    success: boolean;
    prices: Record<string, any>;
    raw?: any;
    error?: string;
  }> {
    let url = `${this.allServer2Url}?action=getPrices&api_key=${encodeURIComponent(this.apiKey)}`;
    if (params?.service) url += `&service=${encodeURIComponent(params.service)}`;
    if (params?.country) url += `&country=${encodeURIComponent(params.country)}`;

    try {
      const res = await this.fetchWithTimeout(url);
      const text = await res.text();
      try {
        const json = JSON.parse(text);
        return { success: true, prices: json, raw: json };
      } catch {
        return { success: false, prices: {}, raw: text };
      }
    } catch (err: any) {
      return { success: false, prices: {}, error: err.message };
    }
  }

  /**
   * 8. Get Number
   * handler_api:  https://benotp.com/stubs/handler_api.php?action=getNumber&api_key=KEY&service=SERVICE&country=usa&carrier=CARRIER&area_codes=AREA_CODE&duration=DURATION&specific_number=NUMBER
   * handler:      https://benotp.com/stubs/handler.php?action=getNumber&api_key=KEY&service=SERVICE_ID&country=COUNTRY_CODE&areacode=AREA_CODE&quantity=QUANTITY&pool=POOL_ID
   * all_server_2: https://benotp.com/stubs/all_server_2.php?action=getNumber&api_key=KEY&service=SERVICE_ID&country=COUNTRY&maxPrice=MAX_PRICE&operator=OPERATOR&ref=REFERENCE
   */
  async getNumber(params: BenOtpGetNumberParams): Promise<BenOtpGetNumberResult> {
    if (!this.apiKey) {
      return { success: false, error: 'BenOTP API Key is required.' };
    }

    const ep = params.endpointType || 'handler_api';
    let url = `${this.getEndpointUrl(ep)}?action=getNumber&api_key=${encodeURIComponent(this.apiKey)}`;

    if (ep === 'handler_api') {
      url += `&service=${encodeURIComponent(params.service)}`;
      url += `&country=${encodeURIComponent(params.country || 'usa')}`;
      if (params.carrier) url += `&carrier=${encodeURIComponent(params.carrier)}`;
      if (params.areaCode) url += `&area_codes=${encodeURIComponent(params.areaCode)}`;
      if (params.duration) url += `&duration=${encodeURIComponent(params.duration)}`;
      if (params.specificNumber) url += `&specific_number=${encodeURIComponent(params.specificNumber)}`;
    } else if (ep === 'handler') {
      url += `&service=${encodeURIComponent(params.service)}`;
      if (params.country) url += `&country=${encodeURIComponent(params.country)}`;
      if (params.areaCode) url += `&areacode=${encodeURIComponent(params.areaCode)}`;
      if (params.quantity) url += `&quantity=${encodeURIComponent(String(params.quantity))}`;
      if (params.pool) url += `&pool=${encodeURIComponent(params.pool)}`;
    } else if (ep === 'all_server_2') {
      url += `&service=${encodeURIComponent(params.service)}`;
      if (params.country) url += `&country=${encodeURIComponent(params.country)}`;
      if (params.maxPrice) url += `&maxPrice=${encodeURIComponent(String(params.maxPrice))}`;
      if (params.operator || params.carrier) url += `&operator=${encodeURIComponent((params.operator || params.carrier)!)}`;
      if (params.ref) url += `&ref=${encodeURIComponent(params.ref)}`;
    }

    try {
      const res = await this.fetchWithTimeout(url, 12000);
      const rawText = (await res.text()).trim();

      // Check standard SMS-activate / BenOTP responses
      // Format 1: ACCESS_NUMBER:ORDER_ID:NUMBER (e.g. ACCESS_NUMBER:98765432:12025550198)
      if (rawText.startsWith('ACCESS_NUMBER:')) {
        const parts = rawText.split(':');
        const orderId = parts[1] || `BEN-${Date.now()}`;
        let phoneNumber = parts[2] || '';
        if (phoneNumber && !phoneNumber.startsWith('+')) {
          phoneNumber = `+${phoneNumber}`;
        }
        return {
          success: true,
          orderId,
          phoneNumber,
          raw: rawText,
        };
      }

      // Format 2: JSON response
      try {
        const json = JSON.parse(rawText);
        if (json.status === 'ACCESS_NUMBER' || json.success === true || json.number || json.phone) {
          const orderId = String(json.id || json.order_id || json.orderId || `BEN-${Date.now()}`);
          let phoneNumber = String(json.number || json.phone || json.phoneNumber || '');
          if (phoneNumber && !phoneNumber.startsWith('+')) {
            phoneNumber = `+${phoneNumber}`;
          }
          return {
            success: true,
            orderId,
            phoneNumber,
            raw: rawText,
          };
        }
        if (json.error || json.message) {
          return {
            success: false,
            error: json.error || json.message,
            raw: rawText,
          };
        }
      } catch {
        // Not JSON
      }

      // Format 3: Known error codes
      if (rawText === 'NO_NUMBERS') {
        return { success: false, error: 'No numbers currently available from provider for this service/area code.', raw: rawText };
      }
      if (rawText === 'NO_BALANCE') {
        return { success: false, error: 'Insufficient balance on upstream BenOTP account.', raw: rawText };
      }
      if (rawText === 'BAD_KEY' || rawText === 'ERROR_KEY') {
        return { success: false, error: 'Invalid BenOTP API key.', raw: rawText };
      }
      if (rawText === 'WRONG_SERVICE') {
        return { success: false, error: 'Selected service ID is not supported by BenOTP.', raw: rawText };
      }

      return {
        success: false,
        error: `Provider response: ${rawText.slice(0, 150)}`,
        raw: rawText,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Connection to BenOTP failed while requesting number.',
      };
    }
  }

  /**
   * 9. Get Status
   * handler_api:  https://benotp.com/stubs/handler_api.php?action=getStatus&api_key=KEY&id=ORDER_ID
   * handler:      https://benotp.com/stubs/handler.php?action=getStatus&api_key=KEY&order_id=ORDER_ID
   * all_server_2: https://benotp.com/stubs/all_server_2.php?action=getStatus&api_key=KEY&id=ORDER_ID
   */
  async getStatus(
    orderId: string,
    endpointType?: BenOtpEndpointType
  ): Promise<BenOtpGetStatusResult> {
    if (!this.apiKey) {
      return { success: false, status: 'UNKNOWN', error: 'API key required' };
    }

    const ep = endpointType || 'handler_api';
    const baseUrl = this.getEndpointUrl(ep);
    const paramName = ep === 'handler' ? 'order_id' : 'id';
    const url = `${baseUrl}?action=getStatus&api_key=${encodeURIComponent(this.apiKey)}&${paramName}=${encodeURIComponent(orderId)}`;

    try {
      const res = await this.fetchWithTimeout(url, 8000);
      const rawText = (await res.text()).trim();

      // STATUS_WAIT_CODE -> still waiting
      if (rawText === 'STATUS_WAIT_CODE' || rawText === 'STATUS_WAIT_RESEND') {
        return {
          success: true,
          status: 'WAIT_CODE',
          raw: rawText,
        };
      }

      // STATUS_OK:CODE -> received code!
      if (rawText.startsWith('STATUS_OK:')) {
        const code = rawText.substring('STATUS_OK:'.length).trim();
        return {
          success: true,
          status: 'RECEIVED',
          code,
          fullSms: `Your verification code is ${code}`,
          raw: rawText,
        };
      }

      // STATUS_CANCEL -> cancelled
      if (rawText === 'STATUS_CANCEL') {
        return {
          success: true,
          status: 'CANCELLED',
          raw: rawText,
        };
      }

      // JSON parsing attempt
      try {
        const json = JSON.parse(rawText);
        if (json.code || json.sms_code || json.sms) {
          const code = String(json.code || json.sms_code || '');
          return {
            success: true,
            status: 'RECEIVED',
            code,
            fullSms: json.sms || `Your verification code is ${code}`,
            raw: rawText,
          };
        }
        if (json.status === 'STATUS_WAIT_CODE' || json.status === 'WAIT') {
          return {
            success: true,
            status: 'WAIT_CODE',
            raw: rawText,
          };
        }
      } catch {
        // Not JSON
      }

      return {
        success: false,
        status: 'UNKNOWN',
        raw: rawText,
        error: `Unexpected status: ${rawText.slice(0, 100)}`,
      };
    } catch (err: any) {
      return {
        success: false,
        status: 'UNKNOWN',
        error: err.message,
      };
    }
  }

  /**
   * 10. Set Status
   * handler_api:  https://benotp.com/stubs/handler_api.php?action=setStatus&api_key=KEY&id=ORDER_ID&status=STATUS_CODE
   * handler:      https://benotp.com/stubs/handler.php?action=setStatus&api_key=KEY&order_id=ORDER_ID&status=8
   * all_server_2: https://benotp.com/stubs/all_server_2.php?action=setStatus&api_key=KEY&id=ORDER_ID&status=STATUS_CODE
   *
   * Common status codes:
   * 1 = SMS sent / ready for SMS
   * 3 = Request another SMS code
   * 6 = Complete activation
   * 8 = Cancel activation
   */
  async setStatus(
    orderId: string,
    status: number | string,
    endpointType?: BenOtpEndpointType
  ): Promise<{
    success: boolean;
    message?: string;
    raw?: string;
    error?: string;
  }> {
    if (!this.apiKey) {
      return { success: false, error: 'API key required' };
    }

    const ep = endpointType || 'handler_api';
    const baseUrl = this.getEndpointUrl(ep);
    const paramName = ep === 'handler' ? 'order_id' : 'id';
    const url = `${baseUrl}?action=setStatus&api_key=${encodeURIComponent(this.apiKey)}&${paramName}=${encodeURIComponent(orderId)}&status=${encodeURIComponent(String(status))}`;

    try {
      const res = await this.fetchWithTimeout(url, 8000);
      const rawText = (await res.text()).trim();

      if (
        rawText === 'ACCESS_READY' ||
        rawText === 'ACCESS_RETRY_GET' ||
        rawText === 'ACCESS_ACTIVATION' ||
        rawText === 'ACCESS_CANCEL' ||
        rawText.includes('SUCCESS') ||
        rawText.includes('OK')
      ) {
        return { success: true, message: rawText, raw: rawText };
      }

      return {
        success: !rawText.includes('BAD') && !rawText.includes('ERROR'),
        message: rawText,
        raw: rawText,
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * 11. Re-use Number
   * handler_api: https://benotp.com/stubs/handler_api.php?action=reUseNumber&api_key=API_KEY&id=NUMBER_ID
   */
  async reUseNumber(numberId: string): Promise<{
    success: boolean;
    orderId?: string;
    phoneNumber?: string;
    raw?: string;
    error?: string;
  }> {
    if (!this.apiKey) {
      return { success: false, error: 'API key required' };
    }

    const url = `${this.handlerApiUrl}?action=reUseNumber&api_key=${encodeURIComponent(this.apiKey)}&id=${encodeURIComponent(numberId)}`;

    try {
      const res = await this.fetchWithTimeout(url, 12000);
      const rawText = (await res.text()).trim();

      if (rawText.startsWith('ACCESS_NUMBER:')) {
        const parts = rawText.split(':');
        const orderId = parts[1] || numberId;
        let phoneNumber = parts[2] || '';
        if (phoneNumber && !phoneNumber.startsWith('+')) {
          phoneNumber = `+${phoneNumber}`;
        }
        return {
          success: true,
          orderId,
          phoneNumber,
          raw: rawText,
        };
      }

      return {
        success: false,
        raw: rawText,
        error: `Could not reuse number: ${rawText.slice(0, 100)}`,
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * 12. Get Active Activations
   * all_server_2: https://benotp.com/stubs/all_server_2.php?action=getActiveActivations&api_key=KEY
   */
  async getActiveActivations(): Promise<{
    success: boolean;
    activations: any[];
    raw?: any;
    error?: string;
  }> {
    if (!this.apiKey) {
      return { success: false, activations: [], error: 'API key required' };
    }

    const url = `${this.allServer2Url}?action=getActiveActivations&api_key=${encodeURIComponent(this.apiKey)}`;

    try {
      const res = await this.fetchWithTimeout(url, 8000);
      const text = await res.text();
      try {
        const json = JSON.parse(text);
        const list = Array.isArray(json) ? json : typeof json === 'object' && json !== null ? Object.values(json) : [];
        return { success: true, activations: list, raw: json };
      } catch {
        return { success: false, activations: [], raw: text };
      }
    } catch (err: any) {
      return { success: false, activations: [], error: err.message };
    }
  }
}
