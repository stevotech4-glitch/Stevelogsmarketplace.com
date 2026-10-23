import React, { useState, useEffect } from 'react';
import { 
  X, 
  CreditCard, 
  AlertCircle, 
  CheckCircle2, 
  Copy, 
  Check, 
  Search, 
  Loader2, 
  Globe2, 
  History, 
  RotateCcw,
  Tag,
  Mail,
  Phone
} from 'lucide-react';
import { GiftCardProductItem } from '../../types';

interface BuyGiftCardsModalProps {
  onClose: () => void;
  walletBalance: number;
  onDeductBalance: (amount: number, service: string, description: string) => boolean;
  rates?: any[];
}

export const BuyGiftCardsModal: React.FC<BuyGiftCardsModalProps> = ({
  onClose,
  walletBalance,
  onDeductBalance,
}) => {
  // Country
  const [countries, setCountries] = useState<Array<{ iso: string; name: string }>>([]);
  const [selectedCountryIso, setSelectedCountryIso] = useState<string>('US');
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  // Products & Brand Search
  const [products, setProducts] = useState<GiftCardProductItem[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [brandSearch, setBrandSearch] = useState('');
  const [selectedCard, setSelectedCard] = useState<GiftCardProductItem | null>(null);

  // Denomination Selection
  const [selectedDenom, setSelectedDenom] = useState<number>(50);
  const [customDenom, setCustomDenom] = useState<string>('');

  // Recipient info
  const [recipientEmail, setRecipientEmail] = useState('stevotech2@gmail.com');
  const [recipientPhone, setRecipientPhone] = useState('');

  // Purchase state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [purchasedCode, setPurchasedCode] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  // History
  const [viewHistory, setViewHistory] = useState(false);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Fetch catalog for country
  const fetchCatalog = async (cIso: string) => {
    setLoadingCatalog(true);
    setError(null);
    try {
      const res = await fetch(`/api/giftcards/catalog?country=${encodeURIComponent(cIso)}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
        if (data.countries && data.countries.length > 0) {
          setCountries(data.countries);
        }
        if (data.products && data.products.length > 0) {
          const first = data.products[0];
          setSelectedCard(first);
          const firstDenom = first.fixedDenominations?.[0] || 25;
          setSelectedDenom(firstDenom);
        } else {
          setSelectedCard(null);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to Gift Cards catalog.');
    } finally {
      setLoadingCatalog(false);
    }
  };

  useEffect(() => {
    fetchCatalog(selectedCountryIso);
  }, [selectedCountryIso]);

  // Fetch gift cards order history
  const fetchOrderHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/giftcards/orders');
      if (res.ok) {
        const data = await res.json();
        setRecentOrders(data);
      }
    } catch {
      // ignore
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (viewHistory) {
      fetchOrderHistory();
    }
  }, [viewHistory]);

  // Countries filter
  const filteredCountries = countries.filter((c) => {
    if (!countrySearch.trim()) return true;
    const q = countrySearch.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.iso.toLowerCase().includes(q);
  });

  const selectedCountryName = countries.find((c) => c.iso === selectedCountryIso)?.name || 'United States';

  // Products filter
  const filteredProducts = products.filter((p) => {
    if (!brandSearch.trim()) return true;
    const q = brandSearch.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q);
  });

  // Calculate total Naira
  const denomVal = customDenom ? Number(customDenom) : selectedDenom;
  const exchangeRate = selectedCard?.exchangeRateNgn || 1650;
  const totalNaira = Math.round(denomVal * exchangeRate);

  const handleSelectCard = (card: GiftCardProductItem) => {
    setSelectedCard(card);
    setCustomDenom('');
    if (card.fixedDenominations && card.fixedDenominations.length > 0) {
      setSelectedDenom(card.fixedDenominations[0]);
    } else {
      setSelectedDenom(card.minAmount || 25);
    }
  };

  const handleBuy = async () => {
    if (!selectedCard) {
      setError('Please select a gift card brand.');
      return;
    }

    if (!denomVal || denomVal <= 0) {
      setError('Please select or specify a valid card denomination.');
      return;
    }

    if (!recipientEmail.trim() || !recipientEmail.includes('@')) {
      setError('Please provide a valid recipient email address.');
      return;
    }

    if (walletBalance < totalNaira) {
      setError(`Insufficient balance. You need ₦${totalNaira.toLocaleString()} but currently have ₦${walletBalance.toLocaleString()}. Please fund your wallet.`);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const idempotencyKey = `gc-${Date.now()}-${selectedCard.id}-${denomVal}`;
      const res = await fetch('/api/giftcards/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedCard.id,
          countryIso: selectedCard.countryIso,
          denomination: denomVal,
          recipientEmail: recipientEmail.trim(),
          recipientPhone: recipientPhone.trim() || undefined,
          idempotencyKey,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Server rejected gift card purchase.');
      }

      const orderData = await res.json();
      setCompletedOrder(orderData);
      setPurchasedCode(orderData.code || orderData.delivery?.code || `SL-${orderData.id.slice(-8).toUpperCase()}`);

      onDeductBalance(
        totalNaira,
        'Buy gift cards',
        `$${denomVal} ${selectedCard.brand} Gift Card (${selectedCard.countryIso})`
      );
    } catch (err: any) {
      setError(err.message || 'Unable to process gift card purchase.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex justify-center p-3 sm:p-5">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto border border-slate-100 max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-50/70 to-orange-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
              <CreditCard className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 font-sans">Buy Digital Gift Cards</h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-mono">
                  169 Countries
                </span>
              </div>
              <p className="text-xs text-slate-500">Apple, Netflix, Steam, Amazon & 170+ Global Brands</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewHistory(!viewHistory)}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewHistory ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">Orders</span>
            </button>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-200 text-slate-500 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Order History View */}
        {viewHistory ? (
          <div className="p-6 overflow-y-auto max-h-[75vh] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Your Gift Card Orders</h3>
              <button 
                onClick={fetchOrderHistory} 
                className="text-xs text-amber-600 font-semibold flex items-center gap-1 hover:underline"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${loadingHistory ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {loadingHistory ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-600" />
                Loading your gift card codes...
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-500" />
                No gift cards ordered yet.
              </div>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((ord) => (
                  <div key={ord.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{ord.productName}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                        {ord.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                      <span>Ref: {ord.providerRef || ord.id}</span>
                      <span className="font-bold text-slate-800">₦{(ord.amount || 0).toLocaleString()}</span>
                    </div>
                    {ord.delivery?.code && (
                      <div className="p-2.5 rounded-xl bg-slate-900 text-white font-mono text-xs flex items-center justify-between">
                        <span className="tracking-widest font-bold select-all">{ord.delivery.code}</span>
                        <span className="text-[10px] text-amber-400">Ready to Redeem</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setViewHistory(false)}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
            >
              Back to Catalog
            </button>
          </div>
        ) : purchasedCode ? (
          /* Purchased Code Success Screen */
          <div className="p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Gift Card E-Code Delivered!</h3>
              <p className="text-xs text-slate-500">
                ${denomVal} {selectedCard?.brand} ({selectedCard?.countryIso})
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950 text-slate-100 border border-slate-800 space-y-2 max-w-md mx-auto shadow-lg">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">
                Digital Voucher E-Code
              </span>
              <div className="text-lg font-bold font-mono tracking-widest text-amber-400 select-all py-1">
                {purchasedCode}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(purchasedCode);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Code Copied to Clipboard' : 'Copy Voucher Code'}</span>
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-left font-mono text-xs space-y-1.5 max-w-md mx-auto">
              <div className="flex justify-between">
                <span className="text-slate-500">Order Ref:</span>
                <span className="text-slate-900 font-bold">{completedOrder?.providerRef || completedOrder?.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Sent to:</span>
                <span className="text-blue-600 truncate max-w-[200px]">{recipientEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount Charged:</span>
                <span className="text-slate-900 font-bold">₦{totalNaira.toLocaleString()}</span>
              </div>
            </div>

            <div className="pt-2 flex gap-3 max-w-md mx-auto">
              <button
                onClick={() => {
                  setPurchasedCode(null);
                  setCompletedOrder(null);
                }}
                className="flex-1 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors"
              >
                Buy Another Card
              </button>
              <button
                onClick={onClose}
                className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          /* Main Browse & Purchase Form */
          <div className="p-6 space-y-4 overflow-y-auto max-h-[82vh]">
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Country Selector */}
            <div className="relative">
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Select Country Region
                </label>
                <span className="text-[10px] text-slate-400 font-medium font-mono">
                  {countries.length || 169} Available Countries
                </span>
              </div>
              <div 
                onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Globe2 className="w-4 h-4 text-amber-600" />
                  <span className="text-slate-900 font-bold">{selectedCountryName} ({selectedCountryIso})</span>
                </div>
                <span className="text-[11px] text-slate-400">Change Region ▼</span>
              </div>

              {countryDropdownOpen && (
                <div className="absolute z-30 left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 max-h-60 overflow-y-auto">
                  <div className="relative mb-2">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search country..."
                      value={countrySearch}
                      onChange={(e) => setCountrySearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>
                  <div className="space-y-0.5">
                    {filteredCountries.slice(0, 60).map((c) => (
                      <button
                        key={c.iso}
                        type="button"
                        onClick={() => {
                          setSelectedCountryIso(c.iso);
                          setCountryDropdownOpen(false);
                          setCountrySearch('');
                        }}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center justify-between hover:bg-slate-100 transition-colors ${
                          selectedCountryIso === c.iso ? 'bg-amber-50 text-amber-900 font-bold' : 'text-slate-700'
                        }`}
                      >
                        <span>{c.name}</span>
                        <span className="font-mono text-[10px] text-slate-400">{c.iso}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Brand Search */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Select Brand / Digital Voucher
                </label>
                <span className="text-[10px] text-slate-400 font-medium">
                  {filteredProducts.length} Brands Listed
                </span>
              </div>
              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search brand (Apple, Netflix, Steam, Amazon...)"
                  value={brandSearch}
                  onChange={(e) => setBrandSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              {loadingCatalog ? (
                <div className="py-10 text-center text-xs text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-600 mx-auto mb-2" />
                  Retrieving live vouchers for {selectedCountryName}...
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-2xl text-xs text-slate-500">
                  No brands currently listed for this country. Try United States (US).
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                  {filteredProducts.map((card) => {
                    const isSelected = selectedCard?.id === card.id;
                    return (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => handleSelectCard(card)}
                        className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                          isSelected
                            ? 'border-amber-600 bg-amber-50/70 text-amber-950 ring-2 ring-amber-500/20 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <span className="text-xs font-bold text-slate-900 truncate block">{card.brand}</span>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                          <span>{card.countryIso}</span>
                          <span className="font-mono text-amber-700 font-semibold">
                            ~₦{card.exchangeRateNgn?.toLocaleString()}/$
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Denomination Selection */}
            {selectedCard && (
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Denomination (USD ${selectedCard.currency === 'USD' ? '' : selectedCard.currency})
                </label>
                
                {selectedCard.fixedDenominations && selectedCard.fixedDenominations.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedCard.fixedDenominations.slice(0, 8).map((val: number) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => {
                          setSelectedDenom(val);
                          setCustomDenom('');
                        }}
                        className={`py-2 px-3 rounded-xl text-xs font-bold font-mono border transition-all ${
                          !customDenom && selectedDenom === val
                            ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        ${val}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Value (Range ${selectedCard.minAmount || 5} - ${selectedCard.maxAmount || 500}):</span>
                    <input
                      type="number"
                      min={selectedCard.minAmount || 5}
                      max={selectedCard.maxAmount || 500}
                      value={denomVal}
                      onChange={(e) => setCustomDenom(e.target.value)}
                      className="w-24 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Delivery Inputs */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Recipient Email
                </label>
                <input
                  type="email"
                  required
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="recipient@email.com"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Recipient Phone (Optional)
                </label>
                <input
                  type="tel"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  placeholder="+234..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>

            {/* Price & Balance Strip */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500 text-[11px]">Total Cost in Naira:</span>
                <span className="text-lg font-bold text-slate-900 font-mono block">
                  ₦{totalNaira.toLocaleString()}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 text-[11px]">Your Wallet Balance:</span>
                <span className="font-mono font-bold text-amber-600 block text-sm">
                  ₦{walletBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleBuy}
              disabled={submitting || !selectedCard}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-sm shadow-lg shadow-orange-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Purchasing Digital Gift Card...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Confirm Purchase & Deliver E-Code</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
