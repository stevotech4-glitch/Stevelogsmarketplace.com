import crypto from 'crypto';
import { db } from './db';
import { PaymentRecord, FlutterwaveConfigSummary } from '../types';

export class FlutterwaveService {
  private static FLW_BASE_URL = 'https://api.flutterwave.com/v3';

  /**
   * Resolves the active Flutterwave Secret Key from environment variables first,
   * with secure server-side database configuration as fallback.
   */
  public static getSecretKey(): string {
    const envKey = process.env.FLW_SECRET_KEY;
    if (envKey && envKey.trim() !== '') return envKey.trim();
    const dbKey = db.getSettings().flutterwaveSecretKey;
    if (dbKey && dbKey.trim() !== '') return dbKey.trim();
    return '';
  }

  /**
   * Resolves the active Flutterwave Public Key from environment variables or settings.
   */
  public static getPublicKey(): string {
    const envKey = process.env.FLW_PUBLIC_KEY;
    if (envKey && envKey.trim() !== '') return envKey.trim();
    const dbKey = db.getSettings().flutterwavePublicKey;
    if (dbKey && dbKey.trim() !== '') return dbKey.trim();
    return '';
  }

  /**
   * Resolves the Webhook Secret Hash used to verify incoming webhook requests.
   */
  public static getSecretHash(): string {
    const envHash = process.env.FLW_SECRET_HASH || process.env.FLW_WEBHOOK_SECRET;
    if (envHash && envHash.trim() !== '') return envHash.trim();
    const dbHash = db.getSettings().flutterwaveSecretHash;
    if (dbHash && dbHash.trim() !== '') return dbHash.trim();
    return 'stevelogs_flw_webhook_secret_hash';
  }

  /**
   * Returns current operating mode ('test' vs 'live').
   */
  public static getMode(): 'test' | 'live' {
    const secKey = this.getSecretKey();
    if (secKey.startsWith('FLWSECK_TEST-')) return 'test';
    if (secKey.startsWith('FLWSECK-')) return 'live';
    const settings = db.getSettings();
    return settings.flutterwaveMode || 'test';
  }

  /**
   * Safe masking of keys for admin interface diagnostics.
   * Never exposes the full secret key!
   */
  public static maskKey(key: string): string {
    if (!key || key.trim() === '') return '';
    if (key.length <= 10) return '••••••••';
    const prefix = key.slice(0, 11); // e.g. FLWSECK_TEST- or FLWSECK-
    const suffix = key.slice(-4);
    return `${prefix}••••••••${suffix}`;
  }

  /**
   * Get safe diagnostic summary for administrator dashboard.
   */
  public static async getDiagnostics(appUrl: string): Promise<{
    summary: FlutterwaveConfigSummary;
    apiReachable: boolean;
    pingLatencyMs?: number;
    accountDetails?: {
      accountName?: string;
      merchantId?: string;
    };
    error?: string;
  }> {
    const secretKey = this.getSecretKey();
    const publicKey = this.getPublicKey();
    const secretHash = this.getSecretHash();
    const mode = this.getMode();
    const settings = db.getSettings();

    const cleanAppUrl = appUrl.replace(/\/$/, '');
    const webhookUrl = `${cleanAppUrl}/api/payments/flutterwave/webhook`;

    const summary: FlutterwaveConfigSummary = {
      enabled: settings.flutterwaveEnabled !== false,
      mode,
      isConfigured: Boolean(secretKey && secretKey.length > 5),
      hasSecretKey: Boolean(secretKey && secretKey.length > 5),
      hasPublicKey: Boolean(publicKey && publicKey.length > 5),
      hasSecretHash: Boolean(secretHash && secretHash.length > 3),
      maskedSecretKey: this.maskKey(secretKey),
      publicKey: publicKey,
      webhookUrl,
      secretHashMasked: this.maskKey(secretHash),
      currency: settings.currency || 'NGN',
    };

    let apiReachable = false;
    let pingLatencyMs: number | undefined;
    let error: string | undefined;

    const startPing = Date.now();
    try {
      // Test connectivity against Flutterwave API
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (secretKey) {
        headers['Authorization'] = `Bearer ${secretKey}`;
      }

      const res = await fetch(`${this.FLW_BASE_URL}/banks/NG`, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      pingLatencyMs = Date.now() - startPing;
      if (res.ok || res.status === 401 || res.status === 200) {
        apiReachable = true;
      }

      if (res.status === 401) {
        error = 'Authentication failed: The provided Flutterwave Secret Key is invalid or expired.';
      }
    } catch (e: any) {
      error = e.message || 'Unable to connect to Flutterwave API server.';
    }

    return {
      summary,
      apiReachable,
      pingLatencyMs,
      error,
    };
  }

  /**
   * Initializes a payment session using official Flutterwave API v3 Standard Checkout.
   */
  public static async initializePayment(params: {
    customerId: string;
    customerEmail: string;
    customerName: string;
    customerPhone?: string;
    amount: number;
    redirectUrl: string;
    currency?: string;
  }): Promise<{
    success: boolean;
    paymentUrl?: string;
    txRef: string;
    paymentRecord?: PaymentRecord;
    error?: string;
  }> {
    const settings = db.getSettings();
    if (settings.flutterwaveEnabled === false) {
      return {
        success: false,
        txRef: '',
        error: 'Flutterwave payment gateway is currently disabled in administrator settings.',
      };
    }

    const amount = Number(params.amount);
    const minDeposit = settings.minDeposit || 500;
    const maxDeposit = settings.maxDeposit || 5000000;

    if (isNaN(amount) || amount < minDeposit) {
      return {
        success: false,
        txRef: '',
        error: `Minimum wallet deposit amount is ₦${minDeposit.toLocaleString()}.`,
      };
    }

    if (amount > maxDeposit) {
      return {
        success: false,
        txRef: '',
        error: `Maximum single deposit amount is ₦${maxDeposit.toLocaleString()}.`,
      };
    }

    // Generate guaranteed unique transaction reference: SL-FLW-<TIMESTAMP>-<RANDOM>
    const uniqueNonce = crypto.randomBytes(3).toString('hex').toUpperCase();
    const txRef = `SL-FLW-${Date.now()}-${uniqueNonce}`;
    const currency = (params.currency || settings.currency || 'NGN').toUpperCase();

    const secretKey = this.getSecretKey();

    // Prepare payload according to Flutterwave official API documentation
    const payload = {
      tx_ref: txRef,
      amount: String(amount),
      currency,
      redirect_url: params.redirectUrl,
      payment_options: 'card,banktransfer,ussd,account,mpesa,qr',
      customer: {
        email: params.customerEmail,
        phonenumber: params.customerPhone || '08000000000',
        name: params.customerName,
      },
      customizations: {
        title: `${settings.websiteName} Marketplace`,
        description: `Fund Stevelogs Wallet (Ref: ${txRef})`,
        logo: settings.logoUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80',
      },
      meta: {
        customerId: params.customerId,
        purpose: 'wallet_funding',
        platform: 'STEVELOGS',
      },
    };

    // If a valid Secret Key is configured, make real call to Flutterwave v3 API
    if (secretKey && secretKey.trim().length > 10) {
      try {
        const response = await fetch(`${this.FLW_BASE_URL}/payments`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${secretKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (response.ok && data.status === 'success' && data.data?.link) {
          const paymentRecord = db.createPayment({
            reference: txRef,
            customerId: params.customerId,
            customerEmail: params.customerEmail,
            customerName: params.customerName,
            amount,
            currency,
            paymentUrl: data.data.link,
            paymentMethod: 'Flutterwave Hosted Checkout',
          });

          return {
            success: true,
            paymentUrl: data.data.link,
            txRef,
            paymentRecord,
          };
        } else {
          return {
            success: false,
            txRef,
            error: data.message || 'Flutterwave failed to generate hosted checkout link.',
          };
        }
      } catch (err: any) {
        return {
          success: false,
          txRef,
          error: `Payment initialization error: ${err.message || 'Network failure'}`,
        };
      }
    }

    // If no Secret Key is configured, enforce strict real money policy: no fake payments!
    return {
      success: false,
      txRef,
      error: 'Flutterwave Secret Key is not configured on this server. Please enter your Flutterwave Secret Key in Admin Settings > Payment Gateway or set FLW_SECRET_KEY in server environment variables.',
    };
  }

  /**
   * Generate dedicated virtual bank account using official Flutterwave API v3.
   * Endpoint: POST /v3/virtual-account-numbers
   */
  public static async createVirtualAccount(params: {
    customerId: string;
    email: string;
    name: string;
    phone?: string;
    bvn?: string;
    nin?: string;
  }): Promise<{
    success: boolean;
    virtualAccount?: {
      accountNumber: string;
      bankName: string;
      accountName: string;
      flwRef?: string;
      orderRef?: string;
      note?: string;
    };
    error?: string;
  }> {
    const secretKey = this.getSecretKey();
    if (!secretKey || secretKey.trim().length <= 5) {
      return {
        success: false,
        error: 'Flutterwave Secret Key is not configured on this server. Please configure it in Admin Settings > Payment Gateway.',
      };
    }

    const nameParts = (params.name || 'Stevelogs Customer').trim().split(/\s+/);
    const firstName = nameParts[0] || 'Customer';
    const lastName = nameParts.slice(1).join(' ') || 'Account';
    const txRef = `VA-${params.customerId}-${Date.now()}`;

    const payload: Record<string, any> = {
      email: params.email,
      is_permanent: true,
      tx_ref: txRef,
      phonenumber: params.phone || '08012345678',
      firstname: firstName,
      lastname: lastName,
      narration: `STEVELOGS - ${params.name}`,
    };
    if (params.bvn && params.bvn.trim().length > 0) {
      payload.bvn = params.bvn.trim();
    }
    if (params.nin && params.nin.trim().length > 0) {
      payload.nin = params.nin.trim();
    }

    try {
      const response = await fetch(`${this.FLW_BASE_URL}/virtual-account-numbers`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const json = await response.json();
      if (response.ok && json.status === 'success' && json.data?.account_number) {
        const va = {
          accountNumber: json.data.account_number,
          bankName: json.data.bank_name || 'Wema Bank',
          accountName: `${json.data.first_name || firstName} ${json.data.last_name || lastName}`.trim() || params.name,
          flwRef: json.data.flw_ref,
          orderRef: json.data.order_ref,
          note: json.data.note,
        };

        db.assignCustomerVirtualAccount(params.customerId, va);
        return { success: true, virtualAccount: va };
      }

      return {
        success: false,
        error: json.message || 'Flutterwave API could not generate virtual account. Note that live merchant KYC and BVN verification may be required by your bank partner.',
      };
    } catch (err: any) {
      return {
        success: false,
        error: `Flutterwave Virtual Account generation error: ${err.message || 'Network connection failed'}`,
      };
    }
  }

  /**
   * Verify transaction with official Flutterwave server-side API.
   * Calls GET /v3/transactions/:id/verify
   */
  public static async verifyTransaction(transactionId: string | number): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    const secretKey = this.getSecretKey();

    if (!secretKey || secretKey.trim().length <= 5) {
      return {
        success: false,
        error: 'Flutterwave Secret Key is not configured on this server. Cannot verify payment without merchant credentials.',
      };
    }

    try {
      const response = await fetch(`${this.FLW_BASE_URL}/transactions/${transactionId}/verify`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
      });

      const json = await response.json();
      if (response.ok && json.status === 'success' && json.data) {
        return {
          success: true,
          data: json.data,
        };
      }

      return {
        success: false,
        error: json.message || 'Failed to verify transaction with Flutterwave API.',
      };
    } catch (err: any) {
      return {
        success: false,
        error: `Flutterwave verification request failed: ${err.message}`,
      };
    }
  }

  /**
   * Verify Flutterwave Webhook signature from 'verif-hash' request header.
   */
  public static verifyWebhookSignature(reqHash: string | undefined): boolean {
    const configuredHash = this.getSecretHash();
    if (!reqHash || !configuredHash) return false;

    // Direct comparison
    if (reqHash.trim() === configuredHash.trim()) {
      return true;
    }

    // Timing safe comparison if lengths match
    if (reqHash.length === configuredHash.length) {
      try {
        return crypto.timingSafeEqual(Buffer.from(reqHash), Buffer.from(configuredHash));
      } catch {
        return false;
      }
    }

    return false;
  }

  /**
   * Process payment confirmation idempotently.
   * Verifies payment record, verifies amount and currency, and credits customer wallet only once.
   */
  public static processVerifiedPayment(params: {
    txRef: string;
    flwTransactionId?: string | number;
    flwRef?: string;
    amount: number;
    currency: string;
    paymentType?: string;
    actor?: string;
    customerEmail?: string;
    accountNumber?: string;
  }) {
    return db.creditCustomerWalletFromPayment({
      reference: params.txRef,
      flwTransactionId: params.flwTransactionId,
      flwRef: params.flwRef,
      amount: params.amount,
      currency: params.currency,
      paymentMethod: params.paymentType || 'Flutterwave',
      actor: params.actor || 'Flutterwave Gateway Verification',
      customerEmail: params.customerEmail,
      accountNumber: params.accountNumber,
    });
  }
}
