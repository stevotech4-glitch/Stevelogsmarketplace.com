import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Search, 
  Globe2, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  RefreshCw, 
  ArrowRight, 
  Phone, 
  Copy, 
  Check, 
  Server, 
  Clock, 
  Wallet,
  ChevronDown,
  Layers,
  Info
} from 'lucide-react';
import { CustomerNumberOffer, UserWallet, CustomerRecord } from '../types';

interface UnifiedNumbersMarketplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: UserWallet;
  onOrderSuccess: (order: any) => void;
  initialServiceCategory?: 'usa' | 'all';
  customer?: CustomerRecord | null;
}

export const UnifiedNumbersMarketplaceModal: React.FC<UnifiedNumbersMarketplaceModalProps> = ({
  isOpen,
  onClose,
  wallet,
  onOrderSuccess,
  initialServiceCategory = 'usa',
  customer,
}) => {
  // Step 1: Category selection ('usa' | 'all')
  const [serviceCategory, setServiceCategory] = useState<'usa' | 'all'>(initialServiceCategory);
  
  // Step 2: Customer-Facing Server Selection
  // USA Servers: 1 to 5
  // All Countries Servers: 1 to 6
  const [selectedServer, setSelectedServer] = useState<number>(1);

  // Search & Selector states
  const [searchServicesQuery, setSearchServicesQuery] = useState('');
  const [searchCountryQuery, setSearchCountryQuery] = useState('');
  const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);

  // Selected Country
  const [selectedCountry, setSelectedCountry] = useState<{
    code: string;
    name: string;
    flag: string;
    dialCode: string;
  } | null>(null);

  // Data states
  const [offers, setOffers] = useState<CustomerNumberOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected offer for purchase
  const [selectedOffer, setSelectedOffer] = useState<CustomerNumberOffer | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  // Order Delivery State
  const [activeOrder, setActiveOrder] = useState<any | null>(null);
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [checkingSms, setCheckingSms] = useState(false);
  const [smsCountdown, setSmsCountdown] = useState<number>(600); // 10 minutes
  const [cancellingOrder, setCancellingOrder] = useState(false);

  const serviceDropdownRef = useRef<HTMLDivElement>(null);
  const countryDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (serviceDropdownRef.current && !serviceDropdownRef.current.contains(e.target as Node)) {
        setIsServiceDropdownOpen(false);
      }
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(e.target as Node)) {
        setIsCountryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchOffers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/marketplace/numbers');
      if (!res.ok) throw new Error('Failed to load number marketplace offerings.');
      const data: CustomerNumberOffer[] = await res.json();
      setOffers(data);
    } catch (err: any) {
      setError(err.message || 'Unable to retrieve numbers catalog from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchOffers();
      setActiveOrder(null);
      setSelectedOffer(null);
      setShowConfirmModal(false);
      setServiceCategory(initialServiceCategory);
      setSearchServicesQuery('');
      setSearchCountryQuery('');
      setIsServiceDropdownOpen(false);
      setIsCountryDropdownOpen(false);

      if (initialServiceCategory === 'usa') {
        setSelectedCountry({ code: 'US', name: 'United States', flag: '🇺🇸', dialCode: '+1' });
      } else {
        setSelectedCountry(null);
      }
    }
  }, [isOpen, initialServiceCategory]);

  // Countdown timer for active order
  useEffect(() => {
    let interval: any;
    if (activeOrder && activeOrder.delivery?.smsCode === 'Waiting for SMS...') {
      interval = setInterval(() => {
        setSmsCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeOrder]);

  if (!isOpen) return null;

  // Filter offers for the active server and category
  // Completely isolated by server and category — no cross-server leakage!
  const serverOffers = offers.filter((o) => {
    return o.category === serviceCategory && o.serverNumber === selectedServer;
  });

  // Extract distinct countries supported on this server
  const availableCountries = Array.from(
    new Map(
      serverOffers.map((o) => [
        o.countryCode,
        { code: o.countryCode, name: o.countryName, flag: o.countryFlag, dialCode: o.dialCode },
      ])
    ).values()
  );

  // Filtered countries based on search query in All Countries category
  const filteredCountries = availableCountries.filter((c) => {
    if (!searchCountryQuery.trim()) return true;
    const q = searchCountryQuery.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.dialCode.includes(q) || c.code.toLowerCase().includes(q);
  });

  // Filtered services for the active view and selected country
  const displayedServices = serverOffers.filter((o) => {
    // 1. Country filter
    if (serviceCategory === 'usa') {
      if (o.countryCode !== 'US') return false;
    } else {
      if (selectedCountry && o.countryCode !== selectedCountry.code) return false;
    }

    // 2. Service search filter
    if (searchServicesQuery.trim()) {
      const q = searchServicesQuery.toLowerCase();
      return (
        o.serviceName.toLowerCase().includes(q) ||
        o.serviceId.toLowerCase().includes(q) ||
        (o.aliases && o.aliases.some((a) => a.toLowerCase().includes(q))) ||
        o.activationType.toLowerCase().includes(q)
      );
    }

    return true;
  });

  // Server switch handler
  const handleServerChange = (num: number) => {
    setSelectedServer(num);
    setSelectedOffer(null);
    setSearchServicesQuery('');
    setSearchCountryQuery('');
    setShowConfirmModal(false);
    setIsServiceDropdownOpen(false);
    setIsCountryDropdownOpen(false);

    if (serviceCategory === 'usa') {
      setSelectedCountry({ code: 'US', name: 'United States', flag: '🇺🇸', dialCode: '+1' });
    } else {
      setSelectedCountry(null);
    }
  };

  // Category switch handler
  const handleCategoryChange = (cat: 'usa' | 'all') => {
    setServiceCategory(cat);
    setSelectedServer(1);
    setSelectedOffer(null);
    setSearchServicesQuery('');
    setSearchCountryQuery('');
    setShowConfirmModal(false);
    setIsServiceDropdownOpen(false);
    setIsCountryDropdownOpen(false);

    if (cat === 'usa') {
      setSelectedCountry({ code: 'US', name: 'United States', flag: '🇺🇸', dialCode: '+1' });
    } else {
      setSelectedCountry(null);
    }
  };

  // Execute purchase
  const handleConfirmPurchase = async () => {
    if (!selectedOffer) return;

    if (wallet.balance < selectedOffer.sellingPrice) {
      setError(
        `Insufficient wallet balance. You need ₦${selectedOffer.sellingPrice.toLocaleString()} but currently have ₦${wallet.balance.toLocaleString()}. Please fund your Naira wallet.`
      );
      setShowConfirmModal(false);
      return;
    }

    setPurchasing(true);
    setError(null);

    const serverLabel = serviceCategory === 'usa' ? `USA Server ${selectedServer}` : `Server ${selectedServer}`;
    const effectiveCustId = customer?.id || localStorage.getItem('stevelogs_customer_id') || 'CUST-1001';
    const effectiveCustName = customer?.name || 'Customer';
    const token = localStorage.getItem('stevelogs_customer_token');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-customer-id': effectiveCustId,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      headers['x-customer-token'] = token;
    }

    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          customerId: effectiveCustId,
          customerName: effectiveCustName,
          serviceType: serviceCategory === 'usa' ? 'USA Numbers' : 'All Countries Numbers',
          productName: `${selectedOffer.serviceName} (${selectedOffer.countryName})`,
          amount: selectedOffer.sellingPrice,
          idempotencyKey: `ord_${effectiveCustId}_${selectedOffer.id}_${Date.now()}`,
          details: {
            offerId: selectedOffer.id,
            dialCode: selectedOffer.dialCode,
            countryCode: selectedOffer.countryCode,
            serviceId: selectedOffer.serviceId,
            serviceName: selectedOffer.serviceName,
            countryName: selectedOffer.countryName,
            serverName: serverLabel,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Server purchase request could not be completed.');
      }

      const order = await res.json();
      setActiveOrder(order);
      setShowConfirmModal(false);
      setSmsCountdown(600);
      onOrderSuccess(order);
    } catch (err: any) {
      setError(err.message || 'Purchase failed.');
    } finally {
      setPurchasing(false);
    }
  };

  // Check SMS / Refresh OTP
  const handleCheckSms = async () => {
    if (!activeOrder) return;
    setCheckingSms(true);
    try {
      const res = await fetch(`/api/orders/${activeOrder.id}/sms`);
      if (res.ok) {
        const data = await res.json();
        if (data.smsCode) {
          setActiveOrder((prev: any) => ({
            ...prev,
            delivery: {
              ...prev.delivery,
              smsCode: data.smsCode,
              fullSms: data.fullSms || prev.delivery?.fullSms,
            },
          }));
        }
      }
    } catch (err) {
      console.error('Failed to poll SMS:', err);
    } finally {
      setCheckingSms(false);
    }
  };

  // Cancel order & Auto-refund
  const handleCancelAndRefund = async () => {
    if (!activeOrder) return;
    setCancellingOrder(true);
    try {
      const res = await fetch(`/api/orders/${activeOrder.id}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-actor': 'Customer Auto-Refund',
        },
      });
      if (res.ok) {
        setActiveOrder(null);
        setError('Order cancelled successfully. Full amount has been refunded to your wallet.');
        fetchOffers();
      } else {
        const d = await res.json();
        setError(d.error || 'Failed to refund order.');
      }
    } catch (err: any) {
      setError(err.message || 'Error processing refund.');
    } finally {
      setCancellingOrder(false);
    }
  };

  const serverLabel = serviceCategory === 'usa' ? `USA Server ${selectedServer}` : `Server ${selectedServer}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm flex justify-center p-3 sm:p-5">
      <div 
        className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto border border-slate-100 max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — Steve Logs Marketplace Branding */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black shadow-md">
              <Zap className="w-5 h-5 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold font-sans">Buy Virtual Numbers</h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold uppercase tracking-wider">
                  Live Terminal
                </span>
              </div>
              <p className="text-xs text-blue-200">
                {serviceCategory === 'usa' 
                  ? 'USA Numbers — Instant search across supported services' 
                  : 'All Countries — Select country, then search available services'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs font-mono">
              <Wallet className="w-3.5 h-3.5 text-blue-400" />
              <span>Wallet:</span>
              <strong className="text-emerald-300 font-bold">₦{wallet.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
            </div>
            <button 
              onClick={onClose} 
              className="p-1.5 rounded-full hover:bg-white/10 text-white/80 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Server & Category Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/80 space-y-4">
          {/* Step 1: Category Selection */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Category:
              </span>
              <div className="inline-flex rounded-xl p-1 bg-slate-200/80 border border-slate-300/50">
                <button
                  onClick={() => handleCategoryChange('usa')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    serviceCategory === 'usa'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  🇺🇸 USA Numbers
                </button>
                <button
                  onClick={() => handleCategoryChange('all')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    serviceCategory === 'all'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  🌐 All Countries Numbers
                </button>
              </div>
            </div>

            <div className="text-xs font-mono text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200 flex items-center gap-1.5 sm:hidden">
              <Wallet className="w-3.5 h-3.5 text-blue-600" />
              <span>Wallet:</span>
              <strong className="text-blue-600 font-bold">₦{wallet.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
            </div>
          </div>

          {/* Step 2: Customer Server Selection Cards */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Select {serviceCategory === 'usa' ? 'USA' : 'Global'} Server Route:
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Active: <strong className="text-blue-600 font-bold">{serverLabel}</strong>
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-2">
              {serviceCategory === 'usa' ? (
                [1, 2, 3, 4, 5].map((num) => {
                  const isSelected = selectedServer === num;
                  return (
                    <button
                      key={num}
                      onClick={() => handleServerChange(num)}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm ring-2 ring-blue-500/20'
                          : 'bg-white border-slate-200 hover:border-blue-300 text-slate-700'
                      }`}
                    >
                      <Server className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                      <span className="text-xs font-extrabold leading-tight">USA Server {num}</span>
                      <span className={`text-[9px] font-mono ${isSelected ? 'text-blue-100' : 'text-emerald-600 font-bold'}`}>
                        Online
                      </span>
                    </button>
                  );
                })
              ) : (
                [1, 2, 3, 4, 5, 6].map((num) => {
                  const isSelected = selectedServer === num;
                  return (
                    <button
                      key={num}
                      onClick={() => handleServerChange(num)}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm ring-2 ring-blue-500/20'
                          : 'bg-white border-slate-200 hover:border-blue-300 text-slate-700'
                      }`}
                    >
                      <Server className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                      <span className="text-xs font-extrabold leading-tight">Server {num}</span>
                      <span className={`text-[9px] font-mono ${isSelected ? 'text-blue-100' : 'text-emerald-600 font-bold'}`}>
                        Online
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* STEP 3 (FOR ALL COUNTRIES): SEARCHABLE COUNTRY SELECTOR */}
          {serviceCategory === 'all' && (
            <div className="space-y-1.5 relative" ref={countryDropdownRef}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Select Country:
                </span>
                {selectedCountry && (
                  <button
                    onClick={() => {
                      setSelectedCountry(null);
                      setSelectedOffer(null);
                    }}
                    className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    Change Country
                  </button>
                )}
              </div>

              {/* Country Selection Button / Search Input */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs flex items-center justify-between cursor-pointer hover:border-slate-300 text-left"
                >
                  {selectedCountry ? (
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="text-base">{selectedCountry.flag}</span>
                      <span>{selectedCountry.name}</span>
                      <span className="text-slate-400 font-mono text-[11px]">({selectedCountry.dialCode})</span>
                    </div>
                  ) : (
                    <span className="text-slate-400 font-medium flex items-center gap-1.5">
                      <Globe2 className="w-4 h-4 text-slate-400" />
                      Select or search a supported country...
                    </span>
                  )}
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {/* Country Dropdown Menu */}
                {isCountryDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 max-h-60 overflow-hidden flex flex-col p-2 space-y-2 animate-in fade-in">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search countries by name or dial code (e.g. Nigeria, United Kingdom)..."
                        value={searchCountryQuery}
                        onChange={(e) => setSearchCountryQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600"
                        autoFocus
                      />
                    </div>

                    <div className="overflow-y-auto space-y-1">
                      {filteredCountries.length === 0 ? (
                        <div className="p-3 text-center text-xs text-slate-400">
                          No matching countries found on {serverLabel}
                        </div>
                      ) : (
                        filteredCountries.map((c) => {
                          const isSelected = selectedCountry?.code === c.code;
                          return (
                            <button
                              key={c.code}
                              type="button"
                              onClick={() => {
                                setSelectedCountry(c);
                                setIsCountryDropdownOpen(false);
                                setSelectedOffer(null);
                                setSearchServicesQuery('');
                              }}
                              className={`w-full px-3 py-2 rounded-xl text-xs flex items-center justify-between cursor-pointer transition-colors ${
                                isSelected ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-base">{c.flag}</span>
                                <span>{c.name}</span>
                              </div>
                              <span className="font-mono text-slate-400 text-[11px]">{c.dialCode}</span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3/4: BENOTP SEARCHABLE SERVICE SELECTOR */}
          {(serviceCategory === 'usa' || selectedCountry) && (
            <div className="space-y-1.5 relative" ref={serviceDropdownRef}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Search & Select Service:
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {displayedServices.length} services available
                </span>
              </div>

              {/* Service Input / Selector (BenOTP Style Search) */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search services (e.g. WhatsApp, Telegram, OpenAI, Google, PayPal, Cash App)..."
                  value={searchServicesQuery}
                  onFocus={() => setIsServiceDropdownOpen(true)}
                  onChange={(e) => {
                    setSearchServicesQuery(e.target.value);
                    setIsServiceDropdownOpen(true);
                  }}
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setIsServiceDropdownOpen(!isServiceDropdownOpen)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <ChevronDown className={`w-4 h-4 transition-transform ${isServiceDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown List of Services */}
                {isServiceDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-2xl z-30 max-h-72 overflow-y-auto p-2 space-y-1 animate-in fade-in">
                    {displayedServices.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">
                        No matching services found for &ldquo;{searchServicesQuery}&rdquo; on {serverLabel}
                      </div>
                    ) : (
                      displayedServices.map((offer) => {
                        const isSelected = selectedOffer?.id === offer.id;
                        return (
                          <button
                            key={offer.id}
                            type="button"
                            onClick={() => {
                              setSelectedOffer(offer);
                              setIsServiceDropdownOpen(false);
                              setError(null);
                            }}
                            className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-blue-50 border border-blue-200 text-blue-900 shadow-xs'
                                : 'hover:bg-slate-50 text-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="text-xl">{offer.countryFlag}</span>
                              <div>
                                <h4 className="text-xs font-bold leading-tight">{offer.serviceName}</h4>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mt-0.5">
                                  <span>{offer.countryName}</span>
                                  <span>•</span>
                                  <span>{offer.activationType}</span>
                                </div>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="text-xs font-mono font-black text-blue-600 block">
                                ₦{offer.sellingPrice.toLocaleString()}
                              </span>
                              <span className="text-[10px] font-mono text-emerald-600 font-bold uppercase">
                                In Stock
                              </span>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
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

        {/* Main Content Area: Selected Product Summary (BenOTP Style) & Delivery Section */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* Active Successful Delivery Card */}
          {activeOrder && (
            <div className="p-6 rounded-3xl bg-emerald-50/80 border border-emerald-200 space-y-4 animate-in fade-in">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                    <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase font-bold text-emerald-800 bg-emerald-200/60 px-2 py-0.5 rounded-md">
                      Live Delivery Ready
                    </span>
                    <h3 className="text-base font-bold text-emerald-950 mt-0.5">
                      {activeOrder.productName}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCheckSms}
                    disabled={checkingSms}
                    className="px-3 py-1.5 rounded-xl bg-white border border-emerald-200 text-xs font-bold text-emerald-900 hover:bg-emerald-100 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${checkingSms ? 'animate-spin text-emerald-600' : ''}`} />
                    <span>Check SMS Code</span>
                  </button>
                  <button
                    onClick={() => setActiveOrder(null)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 cursor-pointer shadow-xs"
                  >
                    Buy Another
                  </button>
                </div>
              </div>

              {/* Delivery Numbers & SMS OTP Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Allocated Phone Number
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-base font-mono font-bold text-slate-900">
                      {activeOrder.delivery?.phoneNumber}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(activeOrder.delivery?.phoneNumber || '');
                        setCopiedNumber(true);
                        setTimeout(() => setCopiedNumber(false), 2000);
                      }}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer flex items-center gap-1 text-[11px]"
                      title="Copy Number"
                    >
                      {copiedNumber ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700 font-bold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      SMS Verification Code (OTP)
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-500" />
                      {Math.floor(smsCountdown / 60)}:{(smsCountdown % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xl font-mono font-black text-blue-600 tracking-widest bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">
                      {activeOrder.delivery?.smsCode || 'Waiting for SMS...'}
                    </span>
                    {activeOrder.delivery?.smsCode && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(activeOrder.delivery?.smsCode || '');
                          setCopiedCode(true);
                          setTimeout(() => setCopiedCode(false), 2000);
                        }}
                        className="p-1.5 rounded-lg bg-blue-100 text-blue-700 text-[11px] font-bold cursor-pointer"
                      >
                        {copiedCode ? 'Copied' : 'Copy OTP'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Footer & Auto-refund option */}
              <div className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-xs flex flex-wrap items-center justify-between gap-2">
                <span>Order Ref: <strong className="text-emerald-400">{activeOrder.id}</strong></span>
                <span>Server Route: <strong className="text-amber-400 font-bold">{serverLabel}</strong></span>
                <button
                  onClick={handleCancelAndRefund}
                  disabled={cancellingOrder}
                  className="text-xs text-rose-300 hover:text-rose-100 font-sans font-bold underline cursor-pointer"
                >
                  {cancellingOrder ? 'Cancelling...' : 'Cancel & Refund Wallet'}
                </button>
              </div>
            </div>
          )}

          {/* BENOTP SELECTED PRODUCT PREVIEW CARD */}
          {selectedOffer && !activeOrder && (
            <div className="p-6 rounded-3xl bg-blue-50/70 border-2 border-blue-600/40 space-y-4 shadow-sm animate-in fade-in">
              <div className="flex items-center justify-between border-b border-blue-200/60 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-3xl">{selectedOffer.countryFlag}</span>
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                      Selected Product
                    </span>
                    <h3 className="text-lg font-black text-slate-900 mt-0.5">
                      {selectedOffer.serviceName}
                    </h3>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-500 uppercase font-mono block">Selling Price</span>
                  <span className="text-2xl font-black font-mono text-blue-600">
                    ₦{selectedOffer.sellingPrice.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-white p-4 rounded-2xl border border-blue-100">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Country</span>
                  <strong className="text-slate-800">{selectedOffer.countryName} ({selectedOffer.dialCode})</strong>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Server Route</span>
                  <strong className="text-blue-700">{serverLabel}</strong>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Verification Type</span>
                  <strong className="text-slate-800">{selectedOffer.activationType}</strong>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Delivery Speed</span>
                  <strong className="text-emerald-600 flex items-center gap-1 font-bold">
                    <Zap className="w-3.5 h-3.5 fill-emerald-500" /> Instant (0-min)
                  </strong>
                </div>
              </div>

              {/* Action Button (BenOTP Style Prominent Buy Button) */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Payment deducted directly from your Naira wallet. Auto-refund if OTP is not received.</span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowConfirmModal(true)}
                  className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Buy Number — ₦{selectedOffer.sellingPrice.toLocaleString()}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Quick Selection Catalog Grid (Below preview or when browsing) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>Available Services Catalog on {serverLabel}</span>
              </h4>
              <span className="text-[11px] font-mono text-slate-400">
                {displayedServices.length} items
              </span>
            </div>

            {loading ? (
              <div className="py-16 text-center space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                <p className="text-sm font-semibold text-slate-600">Connecting to {serverLabel} inventory...</p>
              </div>
            ) : displayedServices.length === 0 ? (
              <div className="py-12 text-center space-y-3 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <Globe2 className="w-10 h-10 text-slate-400 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800">
                  {serviceCategory === 'usa'
                    ? `No services found on ${serverLabel}`
                    : selectedCountry
                    ? `No services found for ${selectedCountry.name} on ${serverLabel}`
                    : `Please select a country on ${serverLabel} to view services`}
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {serviceCategory === 'usa'
                    ? 'Try searching with another keyword or switch to another USA Server (1 to 5).'
                    : 'Select a supported country from the selector above to view all genuine services and prices.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {displayedServices.map((offer) => {
                  const isSelected = selectedOffer?.id === offer.id;
                  return (
                    <div
                      key={offer.id}
                      onClick={() => {
                        setSelectedOffer(offer);
                        setError(null);
                      }}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/70 shadow-xs ring-2 ring-blue-500/20'
                          : 'border-slate-200 hover:border-blue-400 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{offer.countryFlag}</span>
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 leading-tight">
                              {offer.serviceName}
                            </h4>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {offer.countryName} ({offer.dialCode})
                            </span>
                          </div>
                        </div>

                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-100">
                          In Stock
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                        <span className="text-[10px] text-slate-400 font-mono">Price</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-black text-blue-600">
                            ₦{offer.sellingPrice.toLocaleString()}
                          </span>
                          <span className="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px]">
                            Select
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* CONFIRMATION POPUP MODAL */}
        {showConfirmModal && selectedOffer && (
          <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h4 className="text-sm font-bold text-slate-900">Confirm Number Purchase</h4>
                <button onClick={() => setShowConfirmModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 text-xs font-sans">
                <p className="text-slate-600">
                  You are purchasing a verified <strong>{selectedOffer.serviceName}</strong> number for <strong>{selectedOffer.countryName} ({selectedOffer.dialCode})</strong> routed via <strong>{serverLabel}</strong>.
                </p>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 font-mono">
                  <div className="flex justify-between text-slate-600">
                    <span>Selected Service:</span>
                    <strong className="text-slate-900">{selectedOffer.serviceName}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Country & Route:</span>
                    <span>{selectedOffer.countryName} ({serverLabel})</span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-bold pt-1.5 border-t border-slate-200">
                    <span>Total Selling Price:</span>
                    <strong className="text-blue-600 font-mono text-base">₦{selectedOffer.sellingPrice.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600 pt-1">
                    <span>Current Wallet Balance:</span>
                    <span>₦{wallet.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-bold pt-1 border-t border-slate-200/60">
                    <span>Balance After Purchase:</span>
                    <span>₦{(wallet.balance - selectedOffer.sellingPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 italic">
                  Instant number allocation. An automated 10-minute timer will activate. If SMS is not delivered, you can cancel and auto-refund at any time.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  disabled={purchasing}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPurchase}
                  disabled={purchasing}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {purchasing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                      <span>Allocating Number...</span>
                    </>
                  ) : (
                    <span>Confirm & Buy</span>
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
