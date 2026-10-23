import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShoppingBag, 
  ShieldCheck, 
  Key, 
  ExternalLink, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  Copy, 
  Check, 
  Wallet, 
  Lock, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  Layers, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { PublicSpecialListing, SpecialMarketplaceOrder, UserWallet, CustomerRecord } from '../types';

interface SpecialMarketplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: UserWallet;
  customer?: CustomerRecord | null;
  onOpenFundWallet: () => void;
  onOrderSuccess: (order: SpecialMarketplaceOrder, newBalance: number) => void;
}

export const SpecialMarketplaceModal: React.FC<SpecialMarketplaceModalProps> = ({
  isOpen,
  onClose,
  wallet,
  customer,
  onOpenFundWallet,
  onOrderSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'browse' | 'my-credentials'>('browse');
  const [listings, setListings] = useState<PublicSpecialListing[]>([]);
  const [purchasedOrders, setPurchasedOrders] = useState<SpecialMarketplaceOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Selected for View Details modal
  const [detailsListing, setDetailsListing] = useState<PublicSpecialListing | null>(null);

  // Selected for Purchase Confirmation modal
  const [purchasingListing, setPurchasingListing] = useState<PublicSpecialListing | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  // Secure Revealed Order modal
  const [revealedOrder, setRevealedOrder] = useState<SpecialMarketplaceOrder | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchListings();
      if (customer?.id) {
        fetchMyOrders();
      }
    }
  }, [isOpen, customer?.id]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/marketplace/special');
      if (res.ok) {
        const data = await res.json();
        setListings(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('Failed to load special marketplace listings:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyOrders = async () => {
    if (!customer?.id) return;
    try {
      const token = localStorage.getItem('stevelogs_customer_token');
      const res = await fetch(`/api/customer/special-orders?customerId=${customer.id}`, {
        headers: token ? { Authorization: `Bearer ${token}`, 'x-customer-token': token } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setPurchasedOrders(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('Failed to load my special orders:', e);
    }
  };

  const handleCopy = (key: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleConfirmPurchase = async () => {
    if (!purchasingListing || !customer) return;
    if (wallet.balance < purchasingListing.price) {
      setPurchaseError('Insufficient wallet balance. Please fund your wallet first.');
      return;
    }

    setPurchasing(true);
    setPurchaseError(null);

    try {
      const token = localStorage.getItem('stevelogs_customer_token');
      const res = await fetch('/api/marketplace/special/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}`, 'x-customer-token': token } : {}),
          'x-customer-id': customer.id,
        },
        body: JSON.stringify({
          listingId: purchasingListing.id,
          customerId: customer.id,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.order) {
        // Successful purchase
        onOrderSuccess(data.order, data.newBalance);
        setPurchasingListing(null);
        setRevealedOrder(data.order);
        fetchListings();
        fetchMyOrders();
      } else {
        setPurchaseError(data.error || 'Purchase could not be completed.');
      }
    } catch (err: any) {
      setPurchaseError(err.message || 'Connection error. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  if (!isOpen) return null;

  const categories = ['ALL', ...Array.from(new Set(listings.map((l) => l.category || 'General Logs')))];

  const filteredListings = listings.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.rules.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.category || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex justify-center items-center p-3 sm:p-5">
      <div 
        className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[90vh] max-h-[760px] border border-slate-200 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with yellow & deep blue branding */}
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-[#0a192f] via-[#1e3a8a] to-[#0a192f] text-white flex items-center justify-between border-b border-blue-900 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 font-black flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-slate-950 fill-slate-950/20" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white font-sans">
                  SPECIAL MARKETPLACE 2
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-extrabold text-[10px] tracking-wide uppercase">
                  Direct Verified Logs
                </span>
              </div>
              <p className="text-xs text-blue-200">
                Hand-curated premium aged accounts & verified profiles added directly by Administration
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Wallet pill */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs">
              <Wallet className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-mono text-white font-bold">
                ₦{wallet.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-blue-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab switch & Search Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('browse')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'browse'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Available Listings ({listings.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('my-credentials')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 relative ${
                activeTab === 'my-credentials'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>My Purchased Credentials</span>
              {purchasedOrders.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[10px] font-extrabold font-mono">
                  {purchasedOrders.length}
                </span>
              )}
            </button>
          </div>

          {activeTab === 'browse' && (
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search listings, categories, rules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600 text-xs bg-white"
              />
            </div>
          )}
        </div>

        {/* Categories Bar */}
        {activeTab === 'browse' && categories.length > 1 && (
          <div className="px-4 py-2 bg-white border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/60 scrollbar-thin scrollbar-thumb-slate-200">
          {activeTab === 'browse' ? (
            loading ? (
              <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
                <span className="text-xs font-semibold">Loading verified listings...</span>
              </div>
            ) : filteredListings.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-500 bg-white rounded-2xl border border-slate-200 p-8 text-center">
                <ShoppingBag className="w-12 h-12 text-slate-300 stroke-[1.5]" />
                <div>
                  <h4 className="font-bold text-sm text-slate-800">No Listings Found</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Check back shortly as administrator publishes new direct logs.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredListings.map((listing) => {
                  const isAvailable = listing.availability === 'available' && listing.stock > 0;
                  return (
                    <div
                      key={listing.id}
                      className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-blue-200 transition-all flex flex-col overflow-hidden"
                    >
                      {/* Card Header with Logo & Availability */}
                      <div className="p-4 border-b border-slate-100 flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                          {listing.logoUrl ? (
                            <img
                              src={listing.logoUrl}
                              alt={listing.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <ShoppingBag className="w-6 h-6 text-blue-600" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold uppercase truncate">
                              {listing.category || 'Special Log'}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono ${
                              isAvailable 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {isAvailable ? `${listing.stock} in stock` : 'Out of Stock'}
                            </span>
                          </div>
                          <h3 className="font-extrabold text-sm text-slate-900 leading-snug line-clamp-2">
                            {listing.name}
                          </h3>
                        </div>
                      </div>

                      {/* Card Body: Rules Preview */}
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div className="space-y-1.5">
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                            Usage Rules & Guidelines
                          </span>
                          <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-sans">
                            {listing.rules || 'Follow standard residential IP rules upon first login.'}
                          </p>
                        </div>

                        {/* Price & Action Buttons */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-mono text-slate-400 uppercase block">
                              Price
                            </span>
                            <div className="text-base font-black text-slate-950 font-mono">
                              {listing.currency}{listing.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setDetailsListing(listing)}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
                            >
                              Details
                            </button>

                            <button
                              disabled={!isAvailable}
                              onClick={() => {
                                setPurchaseError(null);
                                setPurchasingListing(listing);
                              }}
                              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all shadow-xs cursor-pointer ${
                                isAvailable
                                  ? 'bg-amber-400 hover:bg-amber-500 text-slate-950 active:scale-95'
                                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              }`}
                            >
                              Buy Now
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* My Purchased Credentials Tab */
            <div className="space-y-4">
              <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0" />
                <span>
                  Below are the full access credentials (username, password, 2FA link) for products you have purchased.
                </span>
              </div>

              {purchasedOrders.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-500 bg-white rounded-2xl border border-slate-200 p-8 text-center">
                  <Key className="w-12 h-12 text-slate-300 stroke-[1.5]" />
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">No Credentials Yet</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      When you purchase an item from Special Marketplace 2, its credentials will appear here permanently.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('browse')}
                    className="mt-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 cursor-pointer"
                  >
                    Browse Available Listings
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {purchasedOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-slate-900">{ord.listingName}</span>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold font-mono">
                              Verified Order
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono">
                            Ref: {ord.reference} • Purchased on {new Date(ord.purchasedAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-sm font-black font-mono text-slate-900">
                          {ord.currency}{ord.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                      </div>

                      {/* Credentials Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 font-mono text-xs">
                        {/* Username */}
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block">
                            Username / Access ID
                          </span>
                          <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                            <span className="font-bold text-slate-900 truncate mr-2 select-all">
                              {ord.credentials.username}
                            </span>
                            <button
                              onClick={() => handleCopy(`user-${ord.id}`, ord.credentials.username)}
                              className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
                              title="Copy username"
                            >
                              {copiedKey === `user-${ord.id}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block">
                            Password / Secret
                          </span>
                          <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                            <span className="font-bold text-slate-900 truncate mr-2 select-all">
                              {ord.credentials.password}
                            </span>
                            <button
                              onClick={() => handleCopy(`pass-${ord.id}`, ord.credentials.password)}
                              className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
                              title="Copy password"
                            >
                              {copiedKey === `pass-${ord.id}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Login Link */}
                        {ord.credentials.loginUrl && (
                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block">
                              Access / Login URL
                            </span>
                            <a
                              href={ord.credentials.loginUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-blue-600 hover:text-blue-800"
                            >
                              <span className="truncate mr-2 underline">{ord.credentials.loginUrl}</span>
                              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                            </a>
                          </div>
                        )}

                        {/* 2FA Link */}
                        {ord.credentials.twoFactorUrl && (
                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block">
                              2FA Authenticator Link
                            </span>
                            <a
                              href={ord.credentials.twoFactorUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-amber-700 hover:text-amber-900 font-bold"
                            >
                              <span className="truncate mr-2 underline">{ord.credentials.twoFactorUrl}</span>
                              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                            </a>
                          </div>
                        )}
                      </div>

                      {ord.credentials.additionalInstructions && (
                        <div className="text-xs bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-amber-950">
                          <span className="font-bold block mb-0.5">Instructions from Administrator:</span>
                          <p className="whitespace-pre-line leading-relaxed">{ord.credentials.additionalInstructions}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Product Details Modal (Before Purchase) */}
        {detailsListing && (
          <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div 
              className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 border border-slate-200 shadow-2xl animate-in zoom-in-95"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                    {detailsListing.logoUrl ? (
                      <img src={detailsListing.logoUrl} alt={detailsListing.name} className="w-full h-full object-cover" />
                    ) : (
                      <ShoppingBag className="w-6 h-6 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold uppercase">
                      {detailsListing.category || 'Special Direct Log'}
                    </span>
                    <h3 className="font-black text-base text-slate-900 mt-1">{detailsListing.name}</h3>
                  </div>
                </div>
                <button onClick={() => setDetailsListing(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                <span className="font-bold uppercase text-[10px] text-slate-400 block tracking-wider">
                  Usage Rules & Pre-Conditions
                </span>
                <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                  {detailsListing.rules || 'No custom rules provided. Maintain clean residential IP.'}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 block uppercase">Price</span>
                  <span className="text-lg font-black font-mono text-slate-950">
                    {detailsListing.currency}{detailsListing.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setDetailsListing(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    disabled={detailsListing.availability !== 'available' || detailsListing.stock <= 0}
                    onClick={() => {
                      const item = detailsListing;
                      setDetailsListing(null);
                      setPurchasingListing(item);
                    }}
                    className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-extrabold shadow-sm cursor-pointer disabled:opacity-40"
                  >
                    Proceed to Buy
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Purchase Confirmation Modal */}
        {purchasingListing && (
          <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div 
              className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 border border-slate-200 shadow-2xl animate-in zoom-in-95"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-500" />
                  <span>Confirm Purchase</span>
                </h3>
                <button
                  onClick={() => {
                    if (!purchasing) setPurchasingListing(null);
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="text-xs font-bold text-slate-900">{purchasingListing.name}</div>
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Price:</span>
                  <span className="font-mono font-bold text-slate-950 text-sm">
                    {purchasingListing.currency}{purchasingListing.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Your Current Balance:</span>
                  <span className="font-mono font-bold text-blue-700">
                    ₦{wallet.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {wallet.balance < purchasingListing.price ? (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Insufficient Wallet Balance</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    You need ₦{(purchasingListing.price - wallet.balance).toLocaleString()} more to purchase this item.
                  </p>
                  <button
                    onClick={() => {
                      setPurchasingListing(null);
                      onOpenFundWallet();
                    }}
                    className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                  >
                    Fund Wallet Now
                  </button>
                </div>
              ) : (
                <p className="text-xs text-slate-500 leading-relaxed">
                  Upon confirmation, <strong>{purchasingListing.currency}{purchasingListing.price.toLocaleString()}</strong> will be deducted from your wallet balance. Your login credentials and 2FA keys will be delivered immediately on screen and saved permanently to your account.
                </p>
              )}

              {purchaseError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-semibold">
                  {purchaseError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  disabled={purchasing}
                  onClick={() => setPurchasingListing(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  disabled={purchasing || wallet.balance < purchasingListing.price}
                  onClick={handleConfirmPurchase}
                  className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold text-xs shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-40"
                >
                  {purchasing ? 'Verifying & Processing...' : 'Confirm & Buy'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Secure Credentials Revealed Modal (Post Purchase) */}
        {revealedOrder && (
          <div className="fixed inset-0 z-70 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
            <div 
              className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full space-y-4 border border-slate-200 shadow-2xl animate-in zoom-in-95"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">Purchase Successful!</h3>
                    <span className="text-[11px] text-slate-400 font-mono">Ref: {revealedOrder.reference}</span>
                  </div>
                </div>
                <button onClick={() => setRevealedOrder(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 leading-relaxed">
                🎉 Your purchase of <strong>{revealedOrder.listingName}</strong> is complete! Copy your access credentials below. These are also saved under <strong>"My Purchased Credentials"</strong>.
              </div>

              {/* Revealed Credentials Box */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 font-mono text-xs">
                {/* Username */}
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block mb-1">
                    Username
                  </span>
                  <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-900 select-all truncate mr-2">
                      {revealedOrder.credentials.username}
                    </span>
                    <button
                      onClick={() => handleCopy('new-user', revealedOrder.credentials.username)}
                      className="text-slate-500 hover:text-slate-800 cursor-pointer p-1"
                    >
                      {copiedKey === 'new-user' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Password */}
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block mb-1">
                    Password
                  </span>
                  <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-900 select-all truncate mr-2">
                      {showPassword ? revealedOrder.credentials.password : '••••••••••••••••'}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleCopy('new-pass', revealedOrder.credentials.password)}
                        className="text-slate-500 hover:text-slate-800 cursor-pointer p-1"
                      >
                        {copiedKey === 'new-pass' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Login URL */}
                {revealedOrder.credentials.loginUrl && (
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block mb-1">
                      Login URL
                    </span>
                    <a
                      href={revealedOrder.credentials.loginUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-200 text-blue-600 hover:underline"
                    >
                      <span className="truncate mr-2">{revealedOrder.credentials.loginUrl}</span>
                      <ExternalLink className="w-4 h-4 shrink-0" />
                    </a>
                  </div>
                )}

                {/* 2FA Link */}
                {revealedOrder.credentials.twoFactorUrl && (
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block mb-1">
                      2FA Authenticator Link
                    </span>
                    <a
                      href={revealedOrder.credentials.twoFactorUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-200 text-amber-800 font-bold hover:underline"
                    >
                      <span className="truncate mr-2">{revealedOrder.credentials.twoFactorUrl}</span>
                      <ExternalLink className="w-4 h-4 shrink-0" />
                    </a>
                  </div>
                )}
              </div>

              {revealedOrder.credentials.additionalInstructions && (
                <div className="text-xs bg-amber-50 p-3 rounded-2xl border border-amber-200 text-amber-950">
                  <span className="font-bold block mb-0.5">Important Post-Purchase Instructions:</span>
                  <p className="whitespace-pre-line leading-relaxed">{revealedOrder.credentials.additionalInstructions}</p>
                </div>
              )}

              <button
                onClick={() => setRevealedOrder(null)}
                className="w-full py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
