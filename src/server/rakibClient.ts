import { MarketplaceCategory, MarketplaceProduct, MarketplaceOrder, ProviderSyncReport } from '../types';

export interface RakibCategoryRaw {
  id: number | string;
  name: string;
  [key: string]: any;
}

export interface RakibProductRaw {
  id: number;
  name: string;
  category: number | string;
  category_name?: string;
  price: number | string;
  stock?: number;
  quantity?: number;
  in_stock?: boolean;
  description?: string;
  [key: string]: any;
}

export interface RakibBuyResponse {
  order_id: number | string;
  product: number;
  quantity: number;
  charge: number | string;
  keys: string[];
}

export class RakibSocialsClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string = 'https://rakibsocials.com/api/v1', apiKey: string = '') {
    this.baseUrl = (baseUrl || 'https://rakibsocials.com/api/v1').replace(/\/$/, '');
    this.apiKey = (apiKey || process.env.RAKIB_API_KEY || process.env.RAKIB_SOCIALS_API_KEY || 'keyikh8x4hyb1').trim();
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 StevelogsMarketplace/2.0',
    };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    return headers;
  }

  /**
   * Fetch provider account balance (Admin diagnostics only)
   * GET /balance
   */
  async getBalance(): Promise<{ success: boolean; balance: number; currency: string; message?: string }> {
    if (!this.apiKey) {
      return { success: false, balance: 0, currency: 'USD', message: 'API Key not configured for Rakib Socials.' };
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(`${this.baseUrl}/balance`, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          return { success: false, balance: 0, currency: 'USD', message: 'Authentication failed. Please verify Rakib Socials API Key.' };
        }
        return { success: false, balance: 0, currency: 'USD', message: `Provider returned HTTP ${res.status}: ${res.statusText}` };
      }

      const data = await res.json();
      let balance = 0;
      let currency = 'USD';

      if (typeof data.balance === 'number') {
        balance = data.balance;
      } else if (typeof data.balance === 'string') {
        balance = parseFloat(data.balance) || 0;
      }
      if (data.currency) currency = data.currency;

      return { success: true, balance, currency };
    } catch (err: any) {
      return { success: false, balance: 0, currency: 'USD', message: err.message || 'Network error reaching Rakib Socials /balance' };
    }
  }

  /**
   * Fetch all categories
   * GET /categories
   */
  async getCategories(): Promise<{ success: boolean; categories: MarketplaceCategory[]; error?: string }> {
    if (!this.apiKey) {
      return { success: false, categories: [], error: 'API Key is missing for Rakib Socials. Configure it in Admin Panel.' };
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(`${this.baseUrl}/categories`, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          return { success: false, categories: [], error: 'Authentication failed: Invalid Rakib Socials API Key.' };
        }
        return { success: false, categories: [], error: `Upstream error HTTP ${res.status}: ${res.statusText}` };
      }

      const data = await res.json();
      let rawList: any[] = [];
      if (Array.isArray(data)) {
        rawList = data;
      } else if (data && Array.isArray(data.results)) {
        rawList = data.results;
      } else if (data && Array.isArray(data.categories)) {
        rawList = data.categories;
      }

      const categories: MarketplaceCategory[] = rawList.map((c) => ({
        id: c.id,
        name: c.name || `Category #${c.id}`,
      }));

      return { success: true, categories };
    } catch (err: any) {
      return { success: false, categories: [], error: err.message || 'Unable to connect to Rakib Socials categories API.' };
    }
  }

  /**
   * Fetch all products with full pagination handling
   * GET /products?page=N
   */
  async getAllProducts(options?: {
    categoryId?: number | string;
    inStockOnly?: boolean;
    exchangeRate?: number;
    fixedMarkup?: number;
    markupPercent?: number;
  }): Promise<{
    success: boolean;
    products: MarketplaceProduct[];
    pagesProcessed: number;
    failedRequests: number;
    totalCount: number;
    error?: string;
  }> {
    if (!this.apiKey) {
      return {
        success: false,
        products: [],
        pagesProcessed: 0,
        failedRequests: 0,
        totalCount: 0,
        error: 'API Key is missing for Rakib Socials. Please configure credentials in the Admin Panel.',
      };
    }

    const usdToNgn = options?.exchangeRate || 1550;
    const fixedMarkup = options?.fixedMarkup ?? 500;
    const markupPct = options?.markupPercent ?? 15;

    const allProducts: MarketplaceProduct[] = [];
    const seenProductIds = new Set<number>();
    let page = 1;
    let hasMore = true;
    let pagesProcessed = 0;
    let failedRequests = 0;
    let totalCountReported = 0;

    // Safety limit to prevent infinite loops if provider pagination is malformed
    const MAX_PAGES = 50;

    while (hasMore && page <= MAX_PAGES) {
      try {
        const queryParams = new URLSearchParams();
        queryParams.set('page', String(page));
        if (options?.categoryId !== undefined && options?.categoryId !== '') {
          queryParams.set('category', String(options.categoryId));
        }
        if (options?.inStockOnly) {
          queryParams.set('in_stock', '1');
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000);

        const url = `${this.baseUrl}/products?${queryParams.toString()}`;
        const res = await fetch(url, {
          method: 'GET',
          headers: this.getHeaders(),
          signal: controller.signal,
        });

        clearTimeout(timeout);
        pagesProcessed++;

        if (!res.ok) {
          failedRequests++;
          if (page === 1) {
            return {
              success: false,
              products: [],
              pagesProcessed,
              failedRequests,
              totalCount: 0,
              error: `Provider HTTP ${res.status} (${res.statusText}) on page ${page}.`,
            };
          }
          // If subsequent page failed, terminate loop safely
          break;
        }

        const data = await res.json();
        let pageResults: RakibProductRaw[] = [];

        if (Array.isArray(data)) {
          pageResults = data;
          hasMore = false; // direct unpaginated array
          totalCountReported = data.length;
        } else if (data && typeof data === 'object') {
          if (Array.isArray(data.results)) {
            pageResults = data.results;
            totalCountReported = data.count || (allProducts.length + pageResults.length);
            hasMore = Boolean(data.next) || (pageResults.length > 0 && (allProducts.length + pageResults.length) < totalCountReported);
          } else if (Array.isArray(data.products)) {
            pageResults = data.products;
            hasMore = false;
          } else {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }

        for (const item of pageResults) {
          const rawId = Number(item.id);
          if (!rawId || seenProductIds.has(rawId)) continue;
          seenProductIds.add(rawId);

          const rawCategoryId = item.category_id ?? item.category ?? item.categoryId;
          const rawPrice = typeof item.price === 'number' ? item.price : parseFloat(String(item.price)) || 0;
          // Calculate Selling Price in NGN:
          // If provider price is small (< 100), assume USD; else assume already in NGN
          const baseCostNgn = rawPrice < 100 ? Math.round(rawPrice * usdToNgn) : Math.round(rawPrice);
          const markup = fixedMarkup > 0 ? fixedMarkup : Math.round(baseCostNgn * (markupPct / 100));
          const sellingPrice = baseCostNgn + markup;

          const stock = Number(item.stock ?? item.quantity ?? 0);
          const inStock = item.in_stock !== undefined ? Boolean(item.in_stock) : stock > 0;

          allProducts.push({
            id: rawId,
            name: (item.name || `Product #${rawId}`).trim(),
            category: rawCategoryId,
            categoryName: item.category_name || item.categoryName,
            price: rawPrice,
            sellingPrice,
            currency: '₦',
            stock,
            inStock,
            description: (item.description || '').trim(),
          });
        }

        if (pageResults.length === 0 || !hasMore) {
          hasMore = false;
        } else {
          page++;
        }
      } catch (err: any) {
        failedRequests++;
        console.error(`Error fetching page ${page} from Rakib Socials:`, err.message);
        break;
      }
    }

    return {
      success: allProducts.length > 0 || failedRequests === 0,
      products: allProducts,
      pagesProcessed,
      failedRequests,
      totalCount: totalCountReported || allProducts.length,
    };
  }

  /**
   * Purchase products
   * POST /buy
   * JSON body: { "product": 128, "quantity": 2 }
   */
  async buyProduct(productId: number, quantity: number): Promise<{
    success: boolean;
    orderId?: string | number;
    charge?: number;
    keys?: string[];
    error?: string;
  }> {
    if (!this.apiKey) {
      return { success: false, error: 'Rakib Socials API key is not configured.' };
    }

    if (!productId || quantity <= 0) {
      return { success: false, error: 'Invalid product or quantity specified.' };
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000); // 20s timeout for buy call

      const res = await fetch(`${this.baseUrl}/buy`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          product: productId,
          quantity: quantity,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const data = await res.json().catch(() => null);

      if (!res.ok || !data) {
        let msg = 'Provider rejected purchase.';
        if (data && data.error) {
          if (data.error === 'insufficient_balance') {
            msg = 'Upstream gateway temporarily out of stock or replenishing liquidity. Please try again in 5 minutes.';
          } else {
            msg = `Provider order rejected: ${data.error}`;
          }
        } else if (res.status === 400) {
          msg = 'Invalid product quantity or product unavailable from provider.';
        } else if (res.status === 401 || res.status === 403) {
          msg = 'Provider authentication error. Please contact marketplace administrator.';
        }
        return { success: false, error: msg };
      }

      // Successful purchase response per documentation:
      // { order_id, product, quantity, charge, keys: [...] }
      const orderId = data.order_id || `RAK-${Date.now()}`;
      const keys: string[] = Array.isArray(data.keys) ? data.keys : (data.key ? [data.key] : []);

      if (keys.length === 0) {
        // Fallback: check if delivery text or credential was returned
        if (data.credentials) keys.push(data.credentials);
        else if (data.data) keys.push(data.data);
      }

      const charge = typeof data.charge === 'number' ? data.charge : parseFloat(String(data.charge)) || 0;

      return {
        success: true,
        orderId,
        charge,
        keys,
      };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return {
          success: false,
          error: 'The provider connection timed out. Please check your Marketplace order history before re-ordering to prevent duplicate charges.',
        };
      }
      return { success: false, error: `Upstream connection failed: ${err.message || 'Unknown network error'}` };
    }
  }
}
