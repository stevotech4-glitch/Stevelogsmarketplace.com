import { 
  ServiceItem, 
  UserWallet, 
  Transaction, 
  LogAccountProduct, 
  SocialBoostPackage, 
  GiftCardRate, 
  ProxyPackage,
  AdminSettings
} from '../types';

export const MAIN_SERVICES: ServiceItem[] = [
  { id: 'usa-numbers', name: 'USA Numbers', iconType: 'globe' },
  { id: 'buy-numbers', name: 'Buy Numbers', iconType: 'file-text' },
  { id: 'log-accounts', name: 'Log Accounts', iconType: 'shield' },
  { id: 'special-marketplace', name: 'Special Marketplace 2', iconType: 'sparkles' },
  { id: 'marketplace', name: 'Marketplace', iconType: 'shopping-bag' },
  { id: 'boost-accounts', name: 'Boost Accounts', iconType: 'users' },
  { id: 'telegram-tick', name: 'Telegram Tick', iconType: 'radio' },
  { id: 'transaction-history', name: 'Transaction History', iconType: 'file-text', isPrimary: true },
  { id: 'rent-number', name: 'Rent number', iconType: 'key' },
  { id: 'esim', name: 'eSIM', iconType: 'cpu' },
  { id: 'ng-airtime', name: 'NG airtime', iconType: 'phone-call' },
  { id: 'buy-gift-cards', name: 'Buy gift cards', iconType: 'credit-card' },
  { id: 'sell-gift-cards', name: 'Sell gift cards', iconType: 'wallet' },
  { id: 'proxies', name: 'Proxies', iconType: 'shield-check' },
  { id: 'developer-api', name: 'Developer API', iconType: 'code' },
  { id: 'partner-program', name: 'Refer & Earn', iconType: 'award' },
  { id: 'worldwide-gifts', name: 'Worldwide Gifts', iconType: 'gift' },
  { id: 'tracking-center', name: 'Track Order', iconType: 'truck' },
  { id: 'video-tutorials', name: 'Video Tutorials', iconType: 'video' },
];

// Strict No-Fake-Data Policy: Wallet starts at 0 until verified by backend/database
export const initialWallet: UserWallet = {
  balance: 0,
  currency: '₦',
  bonus: 0,
  accountNumber: '',
  bankName: 'Not configured',
  accountName: 'Not configured',
};

// Available service catalogues with baseline catalogue pricing
export const USA_SERVICES = [
  { id: 'whatsapp', name: 'WhatsApp', price: 1800, icon: '💬', popular: true },
  { id: 'telegram', name: 'Telegram', price: 1600, icon: '✈️', popular: true },
  { id: 'google', name: 'Google / Gmail / YouTube', price: 1200, icon: '🔴', popular: true },
  { id: 'paypal', name: 'PayPal', price: 2400, icon: '🅿️', popular: true },
  { id: 'openai', name: 'OpenAI / ChatGPT', price: 1400, icon: '🤖', popular: true },
  { id: 'cashapp', name: 'Cash App', price: 2800, icon: '💵', popular: false },
  { id: 'tinder', name: 'Tinder', price: 1500, icon: '🔥', popular: false },
  { id: 'discord', name: 'Discord', price: 1100, icon: '🎮', popular: false },
  { id: 'instagram', name: 'Instagram', price: 1300, icon: '📷', popular: false },
  { id: 'apple', name: 'Apple ID', price: 2100, icon: '🍏', popular: false },
  { id: 'facebook', name: 'Facebook', price: 1200, icon: '📘', popular: false },
  { id: 'twitter', name: 'Twitter / X', price: 1300, icon: '🐦', popular: false },
  { id: 'uber', name: 'Uber / Lyft', price: 1500, icon: '🚗', popular: false },
  { id: 'amazon', name: 'Amazon', price: 1400, icon: '📦', popular: false },
  { id: 'any-other', name: 'Any Other (General SMS)', price: 1900, icon: '📱', popular: true },
];

// Strict No-Fake-Data Policy: Real stock starts empty until populated by verified provider or backend
export const LOG_ACCOUNTS_INVENTORY: LogAccountProduct[] = [];

export const COUNTRIES_LIST = [
  { code: 'US', name: 'United States', flag: '🇺🇸', dialCode: '+1', minPrice: 1200 },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', dialCode: '+44', minPrice: 1600 },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', dialCode: '+1', minPrice: 1500 },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', dialCode: '+49', minPrice: 2200 },
  { code: 'FR', name: 'France', flag: '🇫🇷', dialCode: '+33', minPrice: 2100 },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', dialCode: '+31', minPrice: 1900 },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', dialCode: '+234', minPrice: 900 },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', dialCode: '+55', minPrice: 1400 },
  { code: 'IN', name: 'India', flag: '🇮🇳', dialCode: '+91', minPrice: 1100 },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩', dialCode: '+62', minPrice: 1250 },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', dialCode: '+27', minPrice: 1800 },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪', dialCode: '+254', minPrice: 1600 },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭', dialCode: '+233', minPrice: 1700 },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭', dialCode: '+63', minPrice: 1300 },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', dialCode: '+61', minPrice: 2800 },
];

export const SOCIAL_BOOST_PACKAGES: SocialBoostPackage[] = [
  { id: 'b-ig-fol', platform: 'Instagram', serviceType: 'Instagram High-Quality Followers', ratePerThousand: 2200, min: 100, max: 50000, speed: '10k/Day' },
  { id: 'b-ig-lik', platform: 'Instagram', serviceType: 'Instagram Real Likes', ratePerThousand: 650, min: 50, max: 100000, speed: 'Instant' },
  { id: 'b-tg-mem', platform: 'Telegram', serviceType: 'Telegram Channel/Group Members', ratePerThousand: 1850, min: 100, max: 20000, speed: '5k/Day' },
  { id: 'b-tg-vws', platform: 'Telegram', serviceType: 'Telegram Post Views', ratePerThousand: 250, min: 500, max: 500000, speed: 'Instant' },
  { id: 'b-tw-fol', platform: 'Twitter', serviceType: 'Twitter/X HQ Followers', ratePerThousand: 3400, min: 100, max: 10000, speed: '1k/Day' },
  { id: 'b-tw-rt', platform: 'Twitter', serviceType: 'Twitter/X Retweets & Likes Bundle', ratePerThousand: 1900, min: 50, max: 20000, speed: 'Instant' },
  { id: 'b-tt-fol', platform: 'TikTok', serviceType: 'TikTok Followers', ratePerThousand: 2800, min: 100, max: 30000, speed: '5k/Day' },
  { id: 'b-tt-vws', platform: 'TikTok', serviceType: 'TikTok Video Views', ratePerThousand: 150, min: 1000, max: 1000000, speed: '50k/Hour' },
  { id: 'b-yt-sub', platform: 'YouTube', serviceType: 'YouTube Subscribers', ratePerThousand: 8500, min: 50, max: 5000, speed: '500/Day' },
];

export const GIFT_CARD_RATES: GiftCardRate[] = [
  { id: 'gc-steam', brand: 'Steam Wallet', country: 'USA ($)', type: 'Physical', ratePerDollar: 1480 },
  { id: 'gc-apple', brand: 'Apple / iTunes', country: 'USA ($)', type: 'Physical', ratePerDollar: 1420 },
  { id: 'gc-razer', brand: 'Razer Gold', country: 'Global ($)', type: 'E-code', ratePerDollar: 1460 },
  { id: 'gc-amazon', brand: 'Amazon Card (Cash Receipt)', country: 'USA ($)', type: 'Physical', ratePerDollar: 1390 },
  { id: 'gc-gplay', brand: 'Google Play', country: 'USA ($)', type: 'Physical', ratePerDollar: 1380 },
  { id: 'gc-amex', brand: 'Amex / Vanilla Visa', country: 'USA ($)', type: 'Physical', ratePerDollar: 1350 },
  { id: 'gc-xbox', brand: 'Xbox / Microsoft', country: 'USA ($)', type: 'E-code', ratePerDollar: 1340 },
];

export const PROXY_PACKAGES: ProxyPackage[] = [
  { id: 'pr-res-1gb', name: 'Residential Proxy (1 GB)', type: 'Residential', bandwidth: '1 GB Rotating', protocol: 'HTTP/HTTPS/SOCKS5', price: 4200, location: 'Worldwide' },
  { id: 'pr-res-5gb', name: 'Residential Proxy (5 GB)', type: 'Residential', bandwidth: '5 GB Rotating', protocol: 'HTTP/HTTPS/SOCKS5', price: 18500, location: 'Worldwide' },
  { id: 'pr-mob-usa', name: 'USA Mobile 4G/5G Dedicated', type: 'Mobile 4G/5G', bandwidth: 'Unlimited (30 Days)', protocol: 'HTTP/HTTPS/SOCKS5', price: 29000, location: 'USA' },
  { id: 'pr-dc-stat', name: 'Static Datacenter Dedicated IPv4', type: 'Datacenter', bandwidth: 'Unmetered (30 Days)', protocol: 'HTTP/HTTPS/SOCKS5', price: 8500, location: 'USA / UK' },
];

// Strict No-Fake-Data Policy: Transactions start empty
export const initialTransactions: Transaction[] = [];

export const initialAdminSettings: AdminSettings = {
  systemAnnouncement: '',
  announcementEnabled: false,
  upstreamApiUrl: 'https://www.novasolution.ng',
  upstreamApiKey: '',
  maintenanceMode: false,
  currencySymbol: '₦',
  globalPriceMultiplier: 1.0,
  airtimeDiscountPercent: 3,
  telegramTickPrice: 65000,
};
