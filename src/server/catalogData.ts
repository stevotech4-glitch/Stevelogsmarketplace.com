import { VirtualNumberOffer, LogOffer } from '../types';

export interface ServiceMeta {
  id: string;
  name: string;
  aliases: string[];
  baseCost: number;
}

export interface CountryMeta {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
}

// 100 Real-World Virtual Number Services
export const MASTER_SERVICES: ServiceMeta[] = [
  { id: 'signal', name: 'Signal Private Messenger', aliases: ['signal', 'sig', 'sms', 'private messenger'], baseCost: 1100 },
  { id: 'whatsapp', name: 'WhatsApp / WhatsApp Business', aliases: ['wa', 'whatsapp', 'watsapp', 'meta'], baseCost: 1350 },
  { id: 'telegram', name: 'Telegram / Telegram Stars', aliases: ['tg', 'telegram', 'tele'], baseCost: 1250 },
  { id: 'openai', name: 'OpenAI / ChatGPT / Codex', aliases: ['gpt', 'chatgpt', 'openai', 'ai'], baseCost: 1100 },
  { id: 'claude', name: 'Claude / Anthropic AI', aliases: ['claude', 'anthropic', 'sonnet', 'ai'], baseCost: 1200 },
  { id: 'google', name: 'Google / Gmail / YouTube', aliases: ['gmail', 'google', 'yt', 'youtube', 'play'], baseCost: 950 },
  { id: 'facebook', name: 'Facebook / Messenger / Marketplace', aliases: ['fb', 'facebook', 'meta', 'messenger'], baseCost: 1000 },
  { id: 'instagram', name: 'Instagram / Threads', aliases: ['ig', 'insta', 'threads', 'instagram'], baseCost: 980 },
  { id: 'twitter', name: 'Twitter / X', aliases: ['x', 'twitter', 'tweet'], baseCost: 1050 },
  { id: 'tiktok', name: 'TikTok / Douyin', aliases: ['tt', 'tiktok', 'douyin'], baseCost: 1150 },
  { id: 'paypal', name: 'PayPal', aliases: ['pp', 'paypal'], baseCost: 1850 },
  { id: 'cashapp', name: 'Cash App', aliases: ['cash', 'cashapp', 'sq'], baseCost: 2200 },
  { id: 'apple', name: 'Apple ID / iCloud', aliases: ['apple', 'icloud', 'ios'], baseCost: 1750 },
  { id: 'tinder', name: 'Tinder / Match', aliases: ['tinder', 'dating', 'match'], baseCost: 1200 },
  { id: 'discord', name: 'Discord', aliases: ['discord', 'disc'], baseCost: 800 },
  { id: 'snapchat', name: 'Snapchat', aliases: ['snap', 'snapchat'], baseCost: 1050 },
  { id: 'amazon', name: 'Amazon / AWS', aliases: ['amazon', 'aws', 'prime'], baseCost: 1150 },
  { id: 'netflix', name: 'Netflix', aliases: ['netflix', 'movie'], baseCost: 1300 },
  { id: 'uber', name: 'Uber / Uber Eats', aliases: ['uber', 'eats', 'ride'], baseCost: 1200 },
  { id: 'microsoft', name: 'Microsoft / Outlook / Office365', aliases: ['outlook', 'hotmail', 'ms', 'office'], baseCost: 900 },
  { id: 'linkedin', name: 'LinkedIn', aliases: ['linkedin', 'job'], baseCost: 1400 },
  { id: 'yahoo', name: 'Yahoo / Yahoo Mail', aliases: ['yahoo', 'yahoomail'], baseCost: 850 },
  { id: 'steam', name: 'Steam Gaming', aliases: ['steam', 'valve', 'game'], baseCost: 950 },
  { id: 'coinbase', name: 'Coinbase Crypto', aliases: ['coinbase', 'crypto'], baseCost: 2100 },
  { id: 'binance', name: 'Binance Exchange', aliases: ['binance', 'crypto', 'bnb'], baseCost: 1950 },
  { id: 'airbnb', name: 'Airbnb', aliases: ['airbnb', 'b&b', 'travel'], baseCost: 1450 },
  { id: 'ebay', name: 'eBay', aliases: ['ebay'], baseCost: 1250 },
  { id: 'reddit', name: 'Reddit', aliases: ['reddit'], baseCost: 850 },
  { id: 'viber', name: 'Viber Messenger', aliases: ['viber'], baseCost: 900 },
  { id: 'line', name: 'Line Messenger', aliases: ['line'], baseCost: 1100 },
  { id: 'wechat', name: 'WeChat', aliases: ['wechat', 'weixin'], baseCost: 1600 },
  { id: 'protonmail', name: 'ProtonMail / Proton VPN', aliases: ['proton', 'protonmail'], baseCost: 1000 },
  { id: 'bolt', name: 'Bolt Ride / Delivery', aliases: ['bolt', 'taxify'], baseCost: 850 },
  { id: 'grab', name: 'Grab Superapp', aliases: ['grab'], baseCost: 900 },
  { id: 'venmo', name: 'Venmo', aliases: ['venmo'], baseCost: 2100 },
  { id: 'zelle', name: 'Zelle Pay', aliases: ['zelle'], baseCost: 2400 },
  { id: 'chime', name: 'Chime Banking', aliases: ['chime'], baseCost: 2600 },
  { id: 'doordash', name: 'DoorDash Delivery', aliases: ['doordash', 'dash'], baseCost: 1300 },
  { id: 'instacart', name: 'Instacart', aliases: ['instacart'], baseCost: 1400 },
  { id: 'lyft', name: 'Lyft Ride', aliases: ['lyft'], baseCost: 1350 },
  { id: 'twitch', name: 'Twitch Interactive', aliases: ['twitch'], baseCost: 950 },
  { id: 'roblox', name: 'Roblox', aliases: ['roblox'], baseCost: 900 },
  { id: 'spotify', name: 'Spotify Music', aliases: ['spotify'], baseCost: 950 },
  { id: 'hinge', name: 'Hinge Dating', aliases: ['hinge'], baseCost: 1500 },
  { id: 'bumble', name: 'Bumble Dating', aliases: ['bumble'], baseCost: 1450 },
  { id: 'pof', name: 'Plenty of Fish (POF)', aliases: ['pof', 'fish'], baseCost: 1200 },
  { id: 'badoo', name: 'Badoo Dating', aliases: ['badoo'], baseCost: 950 },
  { id: 'okcupid', name: 'OkCupid', aliases: ['okcupid'], baseCost: 1100 },
  { id: 'grindr', name: 'Grindr', aliases: ['grindr'], baseCost: 1350 },
  { id: 'revolut', name: 'Revolut Banking', aliases: ['revolut'], baseCost: 2800 },
  { id: 'wise', name: 'Wise (TransferWise)', aliases: ['wise', 'transferwise'], baseCost: 2500 },
  { id: 'skrill', name: 'Skrill Digital Wallet', aliases: ['skrill'], baseCost: 2200 },
  { id: 'neteller', name: 'Neteller', aliases: ['neteller'], baseCost: 2100 },
  { id: 'stripe', name: 'Stripe Payments', aliases: ['stripe'], baseCost: 2700 },
  { id: 'square', name: 'Square Point of Sale', aliases: ['square'], baseCost: 2400 },
  { id: 'kucoin', name: 'KuCoin Exchange', aliases: ['kucoin'], baseCost: 1800 },
  { id: 'bybit', name: 'Bybit Crypto', aliases: ['bybit'], baseCost: 1850 },
  { id: 'okx', name: 'OKX Crypto', aliases: ['okx'], baseCost: 1800 },
  { id: 'kraken', name: 'Kraken Exchange', aliases: ['kraken'], baseCost: 1950 },
  { id: 'gemini', name: 'Gemini Exchange', aliases: ['gemini'], baseCost: 2100 },
  { id: 'paxful', name: 'Paxful P2P', aliases: ['paxful'], baseCost: 1700 },
  { id: 'remitly', name: 'Remitly Money Transfer', aliases: ['remitly'], baseCost: 1900 },
  { id: 'westernunion', name: 'Western Union', aliases: ['wu', 'westernunion'], baseCost: 1850 },
  { id: 'moneygram', name: 'MoneyGram', aliases: ['moneygram'], baseCost: 1850 },
  { id: 'chippercash', name: 'Chipper Cash', aliases: ['chipper', 'chippercash'], baseCost: 1200 },
  { id: 'opay', name: 'OPay Digital Services', aliases: ['opay'], baseCost: 800 },
  { id: 'palmpay', name: 'PalmPay Finance', aliases: ['palmpay'], baseCost: 800 },
  { id: 'kuda', name: 'Kuda Microfinance Bank', aliases: ['kuda'], baseCost: 850 },
  { id: 'moniepoint', name: 'Moniepoint Banking', aliases: ['moniepoint'], baseCost: 900 },
  { id: 'alipay', name: 'AliPay / Taobao', aliases: ['alipay', 'taobao'], baseCost: 1600 },
  { id: 'mercari', name: 'Mercari Marketplace', aliases: ['mercari'], baseCost: 1550 },
  { id: 'depop', name: 'Depop Marketplace', aliases: ['depop'], baseCost: 1300 },
  { id: 'poshmark', name: 'Poshmark', aliases: ['poshmark'], baseCost: 1400 },
  { id: 'etsy', name: 'Etsy Craft Marketplace', aliases: ['etsy'], baseCost: 1200 },
  { id: 'walmart', name: 'Walmart Online', aliases: ['walmart'], baseCost: 1250 },
  { id: 'target', name: 'Target Stores', aliases: ['target'], baseCost: 1250 },
  { id: 'bestbuy', name: 'Best Buy', aliases: ['bestbuy'], baseCost: 1300 },
  { id: 'aliexpress', name: 'AliExpress Global', aliases: ['aliexpress', 'ali'], baseCost: 950 },
  { id: 'shopee', name: 'Shopee Marketplace', aliases: ['shopee'], baseCost: 950 },
  { id: 'lazada', name: 'Lazada Ecommerce', aliases: ['lazada'], baseCost: 950 },
  { id: 'temu', name: 'Temu Shopping', aliases: ['temu'], baseCost: 1100 },
  { id: 'shein', name: 'Shein Fashion', aliases: ['shein'], baseCost: 1050 },
  { id: 'deliveroo', name: 'Deliveroo Food', aliases: ['deliveroo'], baseCost: 1300 },
  { id: 'justeat', name: 'Just Eat Takeaway', aliases: ['justeat'], baseCost: 1250 },
  { id: 'wolt', name: 'Wolt Delivery', aliases: ['wolt'], baseCost: 1200 },
  { id: 'glovo', name: 'Glovo On-Demand', aliases: ['glovo'], baseCost: 1100 },
  { id: 'careem', name: 'Careem Rides & Pay', aliases: ['careem'], baseCost: 1150 },
  { id: 'freenow', name: 'FREE NOW Mobility', aliases: ['freenow'], baseCost: 1250 },
  { id: 'blablacar', name: 'BlaBlaCar Ridesharing', aliases: ['blablacar'], baseCost: 1100 },
  { id: 'didi', name: 'DiDi Mobility', aliases: ['didi'], baseCost: 1200 },
  { id: 'yandex', name: 'Yandex Go / Services', aliases: ['yandex'], baseCost: 1150 },
  { id: 'vk', name: 'VKontakte (VK)', aliases: ['vk', 'vkontakte'], baseCost: 800 },
  { id: 'mailru', name: 'Mail.ru Portal', aliases: ['mailru', 'mail.ru'], baseCost: 750 },
  { id: 'okru', name: 'Odnoklassniki (OK.ru)', aliases: ['okru', 'ok.ru'], baseCost: 750 },
  { id: 'icq', name: 'ICQ New', aliases: ['icq'], baseCost: 750 },
  { id: 'kakaotalk', name: 'KakaoTalk Messenger', aliases: ['kakao', 'kakaotalk'], baseCost: 1450 },
  { id: 'imo', name: 'imo Video Calls & Chat', aliases: ['imo'], baseCost: 850 },
  { id: 'truecaller', name: 'Truecaller Verified', aliases: ['truecaller'], baseCost: 850 },
  { id: 'anthropic', name: 'Anthropic Claude 3.5 Sonnet', aliases: ['claude', 'anthropic', 'sonnet'], baseCost: 1250 },
  { id: 'any-other', name: 'Any Other (General SMS / Universal)', aliases: ['any', 'other', 'general', 'sms'], baseCost: 1450 }
];

// 52 Supported Countries
export const MASTER_COUNTRIES: CountryMeta[] = [
  { code: 'US', name: 'United States', flag: '🇺🇸', dialCode: '+1' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', dialCode: '+44' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', dialCode: '+1' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', dialCode: '+234' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭', dialCode: '+233' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪', dialCode: '+254' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', dialCode: '+27' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', dialCode: '+49' },
  { code: 'FR', name: 'France', flag: '🇫🇷', dialCode: '+33' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', dialCode: '+31' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', dialCode: '+34' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', dialCode: '+39' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', dialCode: '+55' },
  { code: 'IN', name: 'India', flag: '🇮🇳', dialCode: '+91' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭', dialCode: '+63' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳', dialCode: '+84' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩', dialCode: '+62' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭', dialCode: '+66' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾', dialCode: '+60' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷', dialCode: '+90' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', dialCode: '+971' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', dialCode: '+61' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪', dialCode: '+46' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱', dialCode: '+48' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', dialCode: '+52' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', dialCode: '+54' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴', dialCode: '+57' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱', dialCode: '+56' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬', dialCode: '+20' },
  { code: 'MA', name: 'Morocco', flag: '🇲🇦', dialCode: '+212' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', dialCode: '+966' },
  { code: 'UA', name: 'Ukraine', flag: '🇺🇦', dialCode: '+380' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹', dialCode: '+351' },
  { code: 'AT', name: 'Austria', flag: '🇦🇹', dialCode: '+43' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭', dialCode: '+41' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪', dialCode: '+32' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪', dialCode: '+353' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', dialCode: '+65' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', dialCode: '+81' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷', dialCode: '+82' },
  { code: 'CN', name: 'China', flag: '🇨🇳', dialCode: '+86' },
  { code: 'HK', name: 'Hong Kong', flag: '🇭🇰', dialCode: '+852' },
  { code: 'TW', name: 'Taiwan', flag: '🇹🇼', dialCode: '+886' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺', dialCode: '+7' },
  { code: 'KZ', name: 'Kazakhstan', flag: '🇰🇿', dialCode: '+7' },
  { code: 'RO', name: 'Romania', flag: '🇷🇴', dialCode: '+40' },
  { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿', dialCode: '+420' },
  { code: 'HU', name: 'Hungary', flag: '🇭🇺', dialCode: '+36' },
  { code: 'GR', name: 'Greece', flag: '🇬🇷', dialCode: '+30' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴', dialCode: '+47' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰', dialCode: '+45' },
  { code: 'FI', name: 'Finland', flag: '🇫🇮', dialCode: '+358' },
];

/**
 * Generate complete virtual number catalog for BenOTP and Nova Solution
 */
export function generateMasterNumberOffers(
  providerId: 'benotp' | 'nova',
  calcPrice: (cost: number) => number,
  timestamp: string,
  customServices?: { name: string; price: number }[]
): VirtualNumberOffer[] {
  const providerName = providerId === 'benotp' ? 'BenOTP' : 'Nova Solution';
  const offers: VirtualNumberOffer[] = [];
  const prefix = providerId === 'benotp' ? 'ben' : 'nov';

  // 1. Generate full USA catalog
  const usCountry = MASTER_COUNTRIES.find((c) => c.code === 'US')!;
  
  if (customServices && customServices.length > 0) {
    // Incorporate all live custom services from provider
    const seenSvc = new Set<string>();
    for (const cs of customServices) {
      const sId = cs.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'svc';
      if (seenSvc.has(sId)) continue;
      seenSvc.add(sId);

      const cost = Math.max(100, Math.round(cs.price));
      offers.push({
        id: `${prefix}-${sId}-us`,
        providerId,
        providerName,
        serviceId: sId,
        serviceName: cs.name,
        aliases: [cs.name.toLowerCase()],
        countryCode: 'US',
        countryName: usCountry.name,
        countryFlag: usCountry.flag,
        dialCode: usCountry.dialCode,
        providerCost: cost,
        sellingPrice: calcPrice(cost),
        currency: '₦',
        availability: 'in_stock',
        stockCount: 650,
        activationType: 'Single SMS',
        lastRefreshed: timestamp,
      });
    }
  } else {
    for (const svc of MASTER_SERVICES) {
      const cost = providerId === 'benotp' ? svc.baseCost : Math.round(svc.baseCost * 1.03);
      offers.push({
        id: `${prefix}-${svc.id}-us`,
        providerId,
        providerName,
        serviceId: svc.id,
        serviceName: svc.name,
        aliases: svc.aliases,
        countryCode: 'US',
        countryName: usCountry.name,
        countryFlag: usCountry.flag,
        dialCode: usCountry.dialCode,
        providerCost: cost,
        sellingPrice: calcPrice(cost),
        currency: '₦',
        availability: 'in_stock',
        stockCount: Math.floor(250 + Math.random() * 800),
        activationType: 'Single SMS',
        lastRefreshed: timestamp,
      });
    }
  }

  // 2. Generate International countries with top services (including Signal!)
  // Top 16 essential services available in all international countries
  const intlServiceIds = [
    'signal',
    'whatsapp',
    'telegram',
    'openai',
    'google',
    'facebook',
    'instagram',
    'twitter',
    'tiktok',
    'paypal',
    'apple',
    'tinder',
    'discord',
    'snapchat',
    'amazon',
    'netflix',
    'uber',
    'any-other',
  ];

  const intlServices = MASTER_SERVICES.filter((s) => intlServiceIds.includes(s.id));

  for (const country of MASTER_COUNTRIES) {
    // Generate for all countries (including US if not already covered)
    if (country.code === 'US') continue;

    for (const svc of intlServices) {
      const countryCostFactor = country.code === 'NG' ? 0.75 : country.code === 'GB' ? 1.15 : 1.0;
      const cost = Math.round(svc.baseCost * countryCostFactor * (providerId === 'benotp' ? 1.0 : 1.02));

      offers.push({
        id: `${prefix}-${svc.id}-${country.code.toLowerCase()}`,
        providerId,
        providerName,
        serviceId: svc.id,
        serviceName: svc.name,
        aliases: svc.aliases,
        countryCode: country.code,
        countryName: country.name,
        countryFlag: country.flag,
        dialCode: country.dialCode,
        providerCost: cost,
        sellingPrice: calcPrice(cost),
        currency: '₦',
        availability: 'in_stock',
        stockCount: Math.floor(180 + Math.random() * 900),
        activationType: 'Single SMS',
        lastRefreshed: timestamp,
      });
    }
  }

  return offers;
}

/**
 * Generate complete verified Log Accounts catalog
 */
export function generateMasterLogOffers(
  providerId: 'nova' | 'rakib',
  calcPrice: (cost: number) => number,
  timestamp: string
): LogOffer[] {
  const providerName = providerId === 'nova' ? 'Nova Solution' : 'Rakib Socials';
  const prefix = providerId === 'nova' ? 'nov' : 'rak';

  if (providerId === 'nova') {
    return [
      {
        id: `${prefix}-fb-date`,
        providerId: 'nova',
        providerName,
        category: 'Facebook Dating',
        productName: 'Facebook Dating Verified Profile (USA IP)',
        accountAge: '2+ Years Aged',
        providerCost: 12500,
        sellingPrice: calcPrice(12500),
        stock: 18,
        format: 'Email:Pass:2FA:Cookie',
        features: ['Active Dating Feature', 'Marketplace Enabled', 'USA Resident IP Active'],
        availability: 'available',
        lastSync: timestamp,
      },
      {
        id: `${prefix}-ig-aged`,
        providerId: 'nova',
        providerName,
        category: 'Instagram',
        productName: 'Instagram Aged Creator Account (2018-2020)',
        accountAge: '4-6 Years Aged',
        providerCost: 6500,
        sellingPrice: calcPrice(6500),
        stock: 25,
        format: 'Username:Pass:2FA:Original_Email',
        features: ['High Trust Score', 'Original Email Included', 'Clean Followers'],
        availability: 'available',
        lastSync: timestamp,
      },
      {
        id: `${prefix}-fb-mkt`,
        providerId: 'nova',
        providerName,
        category: 'Facebook Marketplace',
        productName: 'Facebook Marketplace 2FA Active USA Resident Profile',
        accountAge: '3+ Years Aged',
        providerCost: 9800,
        sellingPrice: calcPrice(9800),
        stock: 14,
        format: 'Email:Pass:2FA:UserAgent',
        features: ['Shipping Enabled', 'Zero Restriction', 'Active Messenger History'],
        availability: 'available',
        lastSync: timestamp,
      },
      {
        id: `${prefix}-tw-aged`,
        providerId: 'nova',
        providerName,
        category: 'Twitter',
        productName: 'Twitter / X Clean Aged Account (2017-2019)',
        accountAge: '5-7 Years Aged',
        providerCost: 5200,
        sellingPrice: calcPrice(5200),
        stock: 30,
        format: 'Username:Password:AuthToken',
        features: ['Phone Verified', 'Clean Timeline', 'Auth Token Instant Login'],
        availability: 'available',
        lastSync: timestamp,
      },
      {
        id: `${prefix}-tt-creator`,
        providerId: 'nova',
        providerName,
        category: 'TikTok',
        productName: 'TikTok USA Creator Rewards Account (10k+ Followers)',
        accountAge: '1+ Year Aged',
        providerCost: 18500,
        sellingPrice: calcPrice(18500),
        stock: 9,
        format: 'Email:Pass:OriginalMail',
        features: ['Creator Fund Active', 'USA Region Locked', 'Live Streaming Enabled'],
        availability: 'available',
        lastSync: timestamp,
      },
      {
        id: `${prefix}-gv-gmail`,
        providerId: 'nova',
        providerName,
        category: 'Google Voice',
        productName: 'Google Voice + Aged Gmail (Active USA Phone + Recovery Mail)',
        accountAge: '1+ Year Aged',
        providerCost: 4500,
        sellingPrice: calcPrice(4500),
        stock: 45,
        format: 'Email:Password:Recovery:PhoneNumber',
        features: ['Working Phone Number', 'Full Recovery Access', 'Never Blocked'],
        availability: 'available',
        lastSync: timestamp,
      },
      {
        id: `${prefix}-linkedin-aged`,
        providerId: 'nova',
        providerName,
        category: 'LinkedIn',
        productName: 'LinkedIn Aged Professional Profile (500+ Connections)',
        accountAge: '3+ Years Aged',
        providerCost: 14000,
        sellingPrice: calcPrice(14000),
        stock: 11,
        format: 'Email:Password:Cookies',
        features: ['500+ Real Connections', 'SSI Score 70+', 'Recruiter Ready'],
        availability: 'available',
        lastSync: timestamp,
      },
      {
        id: `${prefix}-tg-aged`,
        providerId: 'nova',
        providerName,
        category: 'Telegram',
        productName: 'Telegram Aged Account with Tdata & Session',
        accountAge: '2+ Years Aged',
        providerCost: 3800,
        sellingPrice: calcPrice(3800),
        stock: 35,
        format: 'TData:Session:Phone',
        features: ['2FA Enabled', 'No Spam Block', 'Portable TData Folder'],
        availability: 'available',
        lastSync: timestamp,
      },
    ];
  } else {
    // Rakib Socials Log Offers
    return [
      {
        id: `${prefix}-cash-btc`,
        providerId: 'rakib',
        providerName,
        category: 'Cash App',
        productName: 'Cash App Bitcoin Verified + Card Activated',
        accountAge: '1+ Year Aged',
        providerCost: 28000,
        sellingPrice: calcPrice(28000),
        stock: 12,
        format: 'Cashtag:PIN:Email:SSN_Last4',
        features: ['BTC Deposit & Withdrawal On', 'Virtual Card Active', 'Full Access Email'],
        availability: 'available',
        lastSync: timestamp,
      },
      {
        id: `${prefix}-tw-aged`,
        providerId: 'rakib',
        providerName,
        category: 'Twitter',
        productName: 'Twitter Aged Account (2015-2018 Legacy)',
        accountAge: '6-9 Years Aged',
        providerCost: 6500,
        sellingPrice: calcPrice(6500),
        stock: 22,
        format: 'Username:Password:AuthToken:Email',
        features: ['Legacy Age (2015-2018)', 'High Authority', 'Instant Token Access'],
        availability: 'available',
        lastSync: timestamp,
      },
      {
        id: `${prefix}-ig-pva`,
        providerId: 'rakib',
        providerName,
        category: 'Instagram',
        productName: 'Instagram PVA Bulk Clean Aged Profile',
        accountAge: '2+ Years Aged',
        providerCost: 4200,
        sellingPrice: calcPrice(4200),
        stock: 40,
        format: 'Username:Pass:2FA:Mail',
        features: ['Phone Verified', 'Includes 2FA Secret', 'Zero Flag'],
        availability: 'available',
        lastSync: timestamp,
      },
      {
        id: `${prefix}-tt-aged`,
        providerId: 'rakib',
        providerName,
        category: 'TikTok',
        productName: 'TikTok Aged USA Account (Email Verified)',
        accountAge: '2+ Years Aged',
        providerCost: 5500,
        sellingPrice: calcPrice(5500),
        stock: 19,
        format: 'Email:Password:Cookies',
        features: ['US IP Created', 'Clean For Ads / Live', 'No Shadowban'],
        availability: 'available',
        lastSync: timestamp,
      },
    ];
  }
}
