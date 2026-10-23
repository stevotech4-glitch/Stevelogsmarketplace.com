import React, { useState, useEffect } from 'react';
import { 
  X, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Star, 
  Crown, 
  Check, 
  History, 
  RefreshCw, 
  ArrowRight, 
  Sparkles, 
  ExternalLink,
  Wallet,
  Clock,
  ChevronRight,
  Info
} from 'lucide-react';
import { TelegramOrder, TelegramServiceType, TelegramPricingConfig } from '../../types';

interface TelegramTickModalProps {
  onClose: () => void;
  walletBalance: number;
  onDeductBalance: (amount: number, service: string, description: string) => boolean;
}

interface VerificationQuotation {
  valid: boolean;
  cleanUsername: string;
  serviceType: TelegramServiceType;
  providerPrice: number;
  interestAmount: number;
  totalPrice: number;
  itemDetail: string;
  message: string;
  accountInfo?: {
    status: string;
    verified: boolean;
    canReceiveGift: boolean;
    profileType: string;
  };
}

export const TelegramTickModal: React.FC<TelegramTickModalProps> = ({
  onClose,
  walletBalance,
  onDeductBalance,
}) => {
  // Service Tabs: Stars | Premium | Blue Tick
  const [activeTab, setActiveTab] = useState<TelegramServiceType>('stars');

  // Input states
  const [username, setUsername] = useState('');
  const [starsQuantity, setStarsQuantity] = useState<number>(1000);
  const [customStarsInput, setCustomStarsInput] = useState<string>('1000');
  const [isCustomStars, setIsCustomStars] = useState(false);
  const [premiumDuration, setPremiumDuration] = useState<'3_months' | '6_months' | '12_months'>('6_months');
  const [blueTickOptionId, setBlueTickOptionId] = useState<string>('tg-tick-channel');

  // Pricing config loaded from backend
  const [pricingConfig, setPricingConfig] = useState<TelegramPricingConfig | null>(null);

  // Validation & Live Quotation
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [quotation, setQuotation] = useState<VerificationQuotation | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Confirmation & Purchasing
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState<TelegramOrder | null>(null);

  // Services History View
  const [showHistory, setShowHistory] = useState(false);
  const [historyOrders, setHistoryOrders] = useState<TelegramOrder[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Load pricing config from backend
  const fetchPricing = async () => {
    try {
      const res = await fetch('/api/telegram/config');
      if (res.ok) {
        const data = await res.json();
        setPricingConfig(data);
      }
    } catch (err) {
      console.error('Failed to load telegram config:', err);
    }
  };

  // Load services history
  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/telegram/orders');
      if (res.ok) {
        const data: TelegramOrder[] = await res.json();
        setHistoryOrders(data);
      }
    } catch (err) {
      console.error('Failed to fetch Telegram history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchPricing();
  }, []);

  // When tab changes, reset current quotation and error
  const handleTabChange = (tab: TelegramServiceType) => {
    setActiveTab(tab);
    setQuotation(null);
    setErrorMessage(null);
    setShowConfirmModal(false);
  };

  // Check Username & Generate Live Verified Quotation
  const handleCheckUsername = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setQuotation(null);

    const cleanUser = username.trim();
    if (!cleanUser) {
      setErrorMessage('Please enter a valid Telegram username or channel handle.');
      return;
    }

    setCheckingUsername(true);

    try {
      const payload: any = {
        serviceType: activeTab,
        username: cleanUser,
      };

      if (activeTab === 'stars') {
        payload.quantity = isCustomStars ? Number(customStarsInput) : starsQuantity;
      } else if (activeTab === 'premium') {
        payload.durationKey = premiumDuration;
      } else if (activeTab === 'blue_tick') {
        payload.optionId = blueTickOptionId;
      }

      const res = await fetch('/api/telegram/check-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.valid) {
        setErrorMessage(data.message || 'Username verification failed. Please check the handle format.');
      } else {
        setQuotation(data);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to connect to Telegram verification gateway.');
    } finally {
      setCheckingUsername(false);
    }
  };

  // Proceed to purchase confirmation
  const handleProceedToConfirm = () => {
    if (!quotation) return;

    if (walletBalance < quotation.totalPrice) {
      setErrorMessage(
        `Insufficient wallet balance. You need ₦${quotation.totalPrice.toLocaleString()} but currently have ₦${walletBalance.toLocaleString()}. Please fund your Naira wallet.`
      );
      return;
    }

    setShowConfirmModal(true);
  };

  // Submit purchase
  const handleConfirmPurchase = async () => {
    if (!quotation) return;
    setIsPurchasing(true);
    setErrorMessage(null);

    try {
      const payload: any = {
        customerId: 'CUST-1001',
        serviceType: activeTab,
        username: quotation.cleanUsername,
      };

      if (activeTab === 'stars') {
        payload.quantity = isCustomStars ? Number(customStarsInput) : starsQuantity;
      } else if (activeTab === 'premium') {
        payload.durationKey = premiumDuration;
      } else if (activeTab === 'blue_tick') {
        payload.optionId = blueTickOptionId;
      }

      const res = await fetch('/api/telegram/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Telegram service order processing failed.');
      }

      const order: TelegramOrder = await res.json();

      // Deduct customer wallet state on frontend ledger
      onDeductBalance(
        order.amount,
        `Telegram ${activeTab === 'stars' ? 'Stars' : activeTab === 'premium' ? 'Premium' : 'Blue Tick'}`,
        `${order.itemDetail} for ${order.username}`
      );

      setPurchaseSuccess(order);
      setShowConfirmModal(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Purchase could not be completed.');
      setShowConfirmModal(false);
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex justify-center p-3 sm:p-5">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto border border-slate-100 max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md text-white flex items-center justify-center font-black shadow-inner border border-white/20">
              <Send className="w-5 h-5 fill-white/80" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold font-sans">Telegram Services</h2>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/30 text-white text-[10px] font-mono font-bold uppercase tracking-wider border border-white/20">
                  Instant Delivery
                </span>
              </div>
              <p className="text-xs text-blue-100">Stars, Premium Gifting & Verified Blue Badges</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowHistory(!showHistory);
                if (!showHistory) fetchHistory();
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                showHistory 
                  ? 'bg-white text-blue-700 shadow-md' 
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Services History</span>
            </button>
            <button 
              onClick={onClose} 
              className="p-1.5 rounded-full hover:bg-white/15 text-white/90 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Wallet Balance & Payment Notice */}
        <div className="px-6 py-2.5 bg-blue-50/70 border-b border-blue-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-blue-900 font-medium">
            <Wallet className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Payment is deducted from your <strong>Naira Wallet</strong></span>
          </div>
          <div className="font-mono text-blue-900">
            Available: <strong className="text-blue-700 font-bold">₦{walletBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
          </div>
        </div>

        {/* View Mode: Services History Drawer */}
        {showHistory ? (
          <div className="p-6 overflow-y-auto flex-1 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Telegram Services History</h3>
                <p className="text-xs text-slate-500">Track all your Stars, Premium & Blue Tick orders</p>
              </div>
              <button
                onClick={fetchHistory}
                disabled={loadingHistory}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                title="Refresh History"
              >
                <RefreshCw className={`w-4 h-4 ${loadingHistory ? 'animate-spin text-blue-600' : ''}`} />
              </button>
            </div>

            {loadingHistory ? (
              <div className="py-12 text-center space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
                <p className="text-xs text-slate-500">Retrieving order history from database...</p>
              </div>
            ) : historyOrders.length === 0 ? (
              <div className="py-12 text-center space-y-2 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Info className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-700">No Telegram service orders yet</p>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  When you purchase Stars, Premium, or Blue Tick badges, they will appear here with genuine tracking IDs.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {historyOrders.map((ord) => (
                  <div key={ord.id} className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-blue-300 transition-all shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 font-mono text-[10px] font-bold uppercase">
                          {ord.serviceType.replace('_', ' ')}
                        </span>
                        <span className="text-xs font-bold text-slate-900">{ord.itemDetail}</span>
                      </div>
                      <span className="text-xs font-mono font-black text-blue-600">₦{ord.amount.toLocaleString()}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl font-sans">
                      <div>
                        <span className="text-slate-400 block">Recipient Handle:</span>
                        <strong className="text-slate-800">{ord.username}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Status:</span>
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                          <CheckCircle2 className="w-3 h-3" /> {ord.status}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Order Ref:</span>
                        <code className="font-mono text-slate-700 text-[10px]">{ord.id}</code>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Fulfillment Ref:</span>
                        <code className="font-mono text-blue-600 text-[10px]">{ord.id}</code>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 italic bg-blue-50/50 p-2 rounded-lg border border-blue-100/50">
                      {ord.deliveryStatus}
                    </p>

                    <div className="text-[10px] text-slate-400 font-mono text-right">
                      {new Date(ord.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : purchaseSuccess ? (
          /* Success Screen */
          <div className="p-8 text-center space-y-5 overflow-y-auto flex-1">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm ring-8 ring-emerald-50">
              <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
            </div>

            <div className="space-y-1">
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold uppercase tracking-wider">
                Provider Verified Order Complete
              </span>
              <h3 className="text-lg font-extrabold text-slate-900 pt-1">
                {purchaseSuccess.itemDetail} Activated!
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {purchaseSuccess.deliveryStatus}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2.5 max-w-md mx-auto text-xs font-sans">
              <div className="flex justify-between pb-1 border-b border-slate-200/60">
                <span className="text-slate-500">Recipient Username:</span>
                <strong className="text-slate-900 font-mono">{purchaseSuccess.username}</strong>
              </div>
              <div className="flex justify-between pb-1 border-b border-slate-200/60">
                <span className="text-slate-500">Amount Charged:</span>
                <strong className="text-blue-600 font-mono font-bold">₦{purchaseSuccess.amount.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between pb-1 border-b border-slate-200/60">
                <span className="text-slate-500">Order ID:</span>
                <span className="font-mono text-slate-700">{purchaseSuccess.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Provider Reference:</span>
                <span className="font-mono text-emerald-700 font-bold">{purchaseSuccess.providerRef}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  setPurchaseSuccess(null);
                  setQuotation(null);
                  setUsername('');
                }}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md cursor-pointer"
              >
                Order Another Service
              </button>
              <button
                onClick={() => {
                  setPurchaseSuccess(null);
                  setShowHistory(true);
                  fetchHistory();
                }}
                className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer"
              >
                View in History
              </button>
            </div>
          </div>
        ) : (
          /* Main Service Form */
          <div className="p-6 overflow-y-auto flex-1 space-y-5">
            {/* 3 Selectable Service Tabs: Stars | Premium | Blue Tick */}
            <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-slate-100 border border-slate-200/80">
              <button
                onClick={() => handleTabChange('stars')}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'stars'
                    ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Star className={`w-4 h-4 ${activeTab === 'stars' ? 'fill-white' : 'text-amber-500'}`} />
                <span>Stars</span>
              </button>

              <button
                onClick={() => handleTabChange('premium')}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'premium'
                    ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Crown className={`w-4 h-4 ${activeTab === 'premium' ? 'fill-white' : 'text-purple-500'}`} />
                <span>Premium</span>
              </button>

              <button
                onClick={() => handleTabChange('blue_tick')}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'blue_tick'
                    ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <CheckCircle2 className={`w-4 h-4 ${activeTab === 'blue_tick' ? 'fill-white' : 'text-blue-500'}`} />
                <span>Blue Tick</span>
              </button>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
                <button 
                  onClick={() => setErrorMessage(null)} 
                  className="text-rose-500 font-bold hover:underline cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Username Input Form */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Telegram Recipient Handle / Username
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400 text-sm">
                  @
                </span>
                <input
                  type="text"
                  placeholder="username (e.g. steve_tech or channel_name)"
                  value={username.startsWith('@') ? username.slice(1) : username}
                  onChange={(e) => {
                    const val = e.target.value.trim();
                    setUsername(val);
                    setQuotation(null);
                    setErrorMessage(null);
                  }}
                  className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                />
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Enter the exact handle without accidental spaces.
              </p>
            </div>

            {/* SERVICE SPECIFIC CONTROLS */}

            {/* 1. STARS CONTROLS */}
            {activeTab === 'stars' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Select Stars Quantity
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomStars(!isCustomStars);
                      setQuotation(null);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                  >
                    {isCustomStars ? 'Choose Preset Package' : 'Custom Quantity'}
                  </button>
                </div>

                {!isCustomStars ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[50, 100, 250, 500, 1000, 2500, 5000, 10000].map((qty) => {
                      const isSelected = starsQuantity === qty;
                      const unitCost = pricingConfig?.stars?.unitCostPerStar || 28;
                      const interest = pricingConfig?.stars?.fixedInterestAmount || 2000;
                      const estPrice = (qty * unitCost) + interest;

                      return (
                        <button
                          key={qty}
                          type="button"
                          onClick={() => {
                            setStarsQuantity(qty);
                            setQuotation(null);
                          }}
                          className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                            <span className="text-xs font-extrabold text-slate-900">{qty.toLocaleString()}</span>
                          </div>
                          <span className="font-mono text-[11px] font-bold text-blue-600">
                            ₦{estPrice.toLocaleString()}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="number"
                      min={50}
                      max={500000}
                      step={50}
                      value={customStarsInput}
                      onChange={(e) => {
                        setCustomStarsInput(e.target.value);
                        setQuotation(null);
                      }}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900"
                      placeholder="Enter Stars count (e.g. 1000, 5000)"
                    />
                    <p className="text-[11px] text-slate-400 font-sans">
                      Whole-number quantities only (Minimum 50 Stars).
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 2. PREMIUM CONTROLS */}
            {activeTab === 'premium' && (
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Select Premium Subscription Duration
                </label>

                <div className="space-y-2">
                  {[
                    { key: '3_months', label: '3 Months Premium', cost: 9500, desc: '4GB uploads, faster downloads, voice-to-text, animated emoji & star badge.' },
                    { key: '6_months', label: '6 Months Premium', cost: 18000, desc: 'Continuous premium perks, active badge & instant cloud storage expansion.' },
                    { key: '12_months', label: '12 Months Premium (Full Year)', cost: 32000, desc: 'Full 1-year VIP status gifted directly to recipient handle with annual savings.' },
                  ].map((pkg) => {
                    const isSelected = premiumDuration === pkg.key;
                    return (
                      <div
                        key={pkg.key}
                        onClick={() => {
                          setPremiumDuration(pkg.key as any);
                          setQuotation(null);
                        }}
                        className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                            <Crown className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-900">{pkg.label}</h4>
                            <p className="text-[11px] text-slate-500">{pkg.desc}</p>
                          </div>
                        </div>
                        <span className="font-mono font-bold text-xs text-blue-600 shrink-0 ml-3">
                          ₦{pkg.cost.toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. BLUE TICK CONTROLS */}
            {activeTab === 'blue_tick' && (
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Official Verification Category
                </label>

                <div className="space-y-2">
                  {(pricingConfig?.blueTick?.options || [
                    { id: 'tg-tick-channel', name: 'Public Channel & Bot Blue Badge Verification', description: 'Official verified checkmark for registered channels, media & trading bots', providerCost: 55000, interestAmount: 10000, sellingPrice: 65000 },
                    { id: 'tg-tick-personal', name: 'Personal / Creator Verification Dossier', description: 'Authorized submission for notable creators, public figures & founders', providerCost: 45000, interestAmount: 10000, sellingPrice: 55000 },
                    { id: 'tg-tick-org', name: 'Enterprise / Brand Official Verification', description: 'Comprehensive business verification with trademark & domain proof submission', providerCost: 85000, interestAmount: 15000, sellingPrice: 100000 },
                  ]).map((opt) => {
                    const isSelected = blueTickOptionId === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => {
                          setBlueTickOptionId(opt.id);
                          setQuotation(null);
                        }}
                        className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-900">{opt.name}</h4>
                            <p className="text-[11px] text-slate-500">{opt.description}</p>
                          </div>
                        </div>
                        <span className="font-mono font-bold text-xs text-blue-600 shrink-0 ml-3">
                          ₦{opt.sellingPrice.toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* CHECK USERNAME ACTION BUTTON */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => handleCheckUsername()}
                disabled={checkingUsername || !username.trim()}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {checkingUsername ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Verifying Username with Secure Gateway...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Check Username & Get Verified Quotation</span>
                  </>
                )}
              </button>
            </div>

            {/* LIVE VERIFIED QUOTATION CARD */}
            {quotation && quotation.valid && (
              <div className="p-4 rounded-3xl bg-blue-50/70 border border-blue-200 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-extrabold text-slate-900 block font-mono">
                        {quotation.cleanUsername}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-bold uppercase">
                        {quotation.accountInfo?.status || 'Eligible Recipient'}
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl bg-white border border-blue-200 font-mono text-xs font-extrabold text-blue-700">
                    ₦{quotation.totalPrice.toLocaleString()}
                  </span>
                </div>

                {/* Price Breakdown - Customer Safe */}
                <div className="bg-white p-3 rounded-2xl border border-blue-100 space-y-1.5 text-xs font-sans">
                  <div className="flex justify-between text-slate-500">
                    <span>Service Package:</span>
                    <span className="font-bold text-slate-800">{quotation.itemDetail}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Target Recipient:</span>
                    <span className="font-mono text-slate-800 font-bold">{quotation.cleanUsername}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Delivery Mode:</span>
                    <span className="font-medium text-emerald-600">Direct Gift / Instant Credit</span>
                  </div>
                  <div className="flex justify-between pt-1.5 border-t border-slate-100 font-bold text-slate-900">
                    <span>Total Selling Price:</span>
                    <span className="font-mono text-base text-blue-600">₦{quotation.totalPrice.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleProceedToConfirm}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Proceed to Payment Confirmation</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* CONFIRMATION POPUP MODAL */}
        {showConfirmModal && quotation && (
          <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h4 className="text-sm font-bold text-slate-900">Confirm Telegram Purchase</h4>
                <button onClick={() => setShowConfirmModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <p className="text-slate-600">
                  You are about to purchase <strong>{quotation.itemDetail}</strong> for recipient <strong className="font-mono text-blue-600">{quotation.cleanUsername}</strong>.
                </p>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 font-mono">
                  <div className="flex justify-between text-slate-600">
                    <span>Charge Amount:</span>
                    <strong className="text-blue-600">₦{quotation.totalPrice.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Current Wallet Balance:</span>
                    <span>₦{walletBalance.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200 text-emerald-700 font-bold">
                    <span>Balance After Purchase:</span>
                    <span>₦{(walletBalance - quotation.totalPrice).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  disabled={isPurchasing}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPurchase}
                  disabled={isPurchasing}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isPurchasing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>Confirm & Pay</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
