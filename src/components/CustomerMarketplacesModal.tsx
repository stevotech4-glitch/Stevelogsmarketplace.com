import React, { useState, useEffect } from 'react';
import { 
  X, 
  Search, 
  Store, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Zap, 
  RefreshCw, 
  ArrowRight,
  Copy,
  Check,
  ShoppingBag,
  ExternalLink
} from 'lucide-react';
import { UserWallet, LogOffer } from '../types';

interface CustomerMarketplacesModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: UserWallet;
  onOrderSuccess: (order: any) => void;
  initialMarketplace?: 1 | 2 | 3;
}

export const CustomerMarketplacesModal: React.FC<CustomerMarketplacesModalProps> = ({
  isOpen,
  onClose,
  wallet,
  onOrderSuccess,
  initialMarketplace = 1,
}) => {
  // Customer sees Marketplace 1, Marketplace 2, Marketplace 3 ONLY!
  // Backend Mapping:
  // Marketplace 1 -> Rakib Socials
  // Marketplace 2 -> Nova Solution
  // Marketplace 3 -> BenOTP
  const [activeMarketplace, setActiveMarketplace] = useState<1 | 2 | 3>(initialMarketplace);
  const [logs, setLogs] = useState<LogOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const [selectedLog, setSelectedLog] = useState<LogOffer | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState<any | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/marketplace/logs');
      if (!res.ok) throw new Error('Failed to load marketplace listings.');
      const data: LogOffer[] = await res.json();
      setLogs(data);
    } catch (err: any) {
      setError(err.message || 'Unable to retrieve marketplace catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
      setPurchaseSuccess(null);
      setSelectedLog(null);
      setActiveMarketplace(initialMarketplace);
      setSelectedCategory('all');
    }
  }, [isOpen, initialMarketplace]);

  if (!isOpen) return null;

  const getInternalProvider = (mp: 1 | 2 | 3): 'rakib' | 'nova' | 'benotp' => {
    if (mp === 1) return 'rakib';
    if (mp === 2) return 'nova';
    return 'benotp';
  };

  const currentProviderId = getInternalProvider(activeMarketplace);

  const marketplaceLogs = logs.filter((l) => l.providerId === currentProviderId);

  const categories = Array.from(new Set(marketplaceLogs.map((l) => l.category)));

  const displayedLogs = marketplaceLogs.filter((l) => {
    const matchesCategory = selectedCategory === 'all' || l.category === selectedCategory;
    const matchesSearch = 
      !searchQuery.trim() ||
      l.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleBuyLog = async () => {
    if (!selectedLog) return;

    if (wallet.balance < selectedLog.sellingPrice) {
      setError(`Insufficient wallet balance. You need ₦${selectedLog.sellingPrice.toLocaleString()} but currently have ₦${wallet.balance.toLocaleString()}.`);
      return;
    }

    setPurchasing(true);
    setError(null);

    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-customer-id': 'CUST-1001',
        },
        body: JSON.stringify({
          customerId: 'CUST-1001',
          customerName: 'Stevo Tech',
          providerId: selectedLog.providerId,
          serviceType: `Marketplace ${activeMarketplace}`,
          productName: selectedLog.productName,
          amount: selectedLog.sellingPrice,
          providerCost: selectedLog.providerCost,
          details: {
            category: selectedLog.category,
            format: selectedLog.format,
            marketplace: `Marketplace ${activeMarketplace}`,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to complete marketplace purchase.');
      }

      const order = await res.json();
      setPurchaseSuccess(order);
      onOrderSuccess(order);
    } catch (err: any) {
      setError(err.message || 'Purchase error.');
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex justify-center p-3 sm:p-5">
      <div 
        className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto border border-slate-100 max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md">
              <Store className="w-5 h-5 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold font-sans">Verified Digital Marketplaces</h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold uppercase tracking-wider">
                  Live Catalogs
                </span>
              </div>
              <p className="text-xs text-blue-200">
                Browse verified social logs, accounts, and digital credentials across our 3 curated marketplaces
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-full hover:bg-white/10 text-white/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Marketplaces Switcher Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
              <button
                onClick={() => {
                  setActiveMarketplace(1);
                  setSelectedLog(null);
                  setSelectedCategory('all');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeMarketplace === 1
                    ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-500/20'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Marketplace 1</span>
              </button>

              <button
                onClick={() => {
                  setActiveMarketplace(2);
                  setSelectedLog(null);
                  setSelectedCategory('all');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeMarketplace === 2
                    ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-500/20'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Marketplace 2</span>
              </button>

              <button
                onClick={() => {
                  setActiveMarketplace(3);
                  setSelectedLog(null);
                  setSelectedCategory('all');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeMarketplace === 3
                    ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-500/20'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Marketplace 3</span>
              </button>
            </div>

            {/* Search */}
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
              />
            </div>
          </div>

          {/* Categories Selector */}
          {categories.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
                Categories:
              </span>
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1 rounded-lg shrink-0 font-bold transition-colors cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                All Products ({marketplaceLogs.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-lg shrink-0 font-medium transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white font-bold'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Error notification banner */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-rose-500 font-bold hover:underline cursor-pointer">
              Dismiss
            </button>
          </div>
        )}

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* Order Delivery Confirmation */}
          {purchaseSuccess && (
            <div className="p-6 rounded-3xl bg-emerald-50/80 border border-emerald-200 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                    <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase font-bold text-emerald-800 bg-emerald-200/60 px-2 py-0.5 rounded-md">
                      Marketplace Order Fulfilled
                    </span>
                    <h3 className="text-base font-bold text-emerald-950 mt-0.5">
                      {purchaseSuccess.productName}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setPurchaseSuccess(null)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-emerald-200 text-xs font-bold text-emerald-900 hover:bg-emerald-100 cursor-pointer"
                >
                  Buy Another Product
                </button>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Delivery Credentials / Access Format
                </span>
                <div className="p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs flex items-center justify-between">
                  <span className="truncate">
                    {purchaseSuccess.delivery?.credentials || purchaseSuccess.delivery?.fullSms || 'Account activated. Access credentials dished to your account.'}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(purchaseSuccess.delivery?.credentials || purchaseSuccess.delivery?.fullSms || '');
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 2000);
                    }}
                    className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0 ml-2 cursor-pointer"
                  >
                    {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-xs flex items-center justify-between">
                <span>Order ID: <strong className="text-emerald-400">{purchaseSuccess.id}</strong></span>
                <span>Fulfillment: <strong className="text-amber-400 font-bold">Marketplace {activeMarketplace}</strong></span>
              </div>
            </div>
          )}

          {/* Catalog grid */}
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-600">Connecting to Marketplace {activeMarketplace} inventory...</p>
            </div>
          ) : displayedLogs.length === 0 ? (
            <div className="py-16 text-center space-y-3 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
              <Store className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">No accounts currently available in Marketplace {activeMarketplace}</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Inventory has not been stocked yet or verified by the provider for this marketplace. Try Marketplace 1 or Marketplace 2.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
                <span>Marketplace {activeMarketplace} Inventory ({displayedLogs.length} verified listings)</span>
                <span className="text-emerald-600 font-bold">● Instant Delivery Available</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {displayedLogs.map((log) => {
                  const isSelected = selectedLog?.id === log.id;
                  return (
                    <div
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 cursor-pointer ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/40 shadow-md ring-2 ring-blue-500/10'
                          : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            {log.category}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 mt-1">
                            {log.productName}
                          </h4>
                          <span className="text-xs text-slate-500">
                            Format: {log.format}
                          </span>
                        </div>

                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {log.stock} In Stock
                        </span>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">
                            Selling Price
                          </span>
                          <span className="text-base font-black text-slate-900 font-mono">
                            ₦{log.sellingPrice.toLocaleString()}
                          </span>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-900 hover:bg-slate-800 text-white'
                          }`}
                        >
                          <span>Select</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Selected Bottom Action */}
        {selectedLog && (
          <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white">
                  {selectedLog.productName}
                </h4>
                <span className="px-2 py-0.5 rounded bg-blue-800 text-[10px] font-bold text-blue-200">
                  Marketplace {activeMarketplace}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Amount: <strong className="text-amber-400 font-mono">₦{selectedLog.sellingPrice.toLocaleString()}</strong> • Your Balance: <span className="font-mono">₦{wallet.balance.toLocaleString()}</span>
              </p>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleBuyLog}
                disabled={purchasing}
                className="flex-1 sm:flex-initial px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
              >
                {purchasing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing Marketplace Order...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Purchase (₦{selectedLog.sellingPrice.toLocaleString()})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
