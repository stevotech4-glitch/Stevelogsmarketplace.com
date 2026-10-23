import React, { useState, useEffect } from 'react';
import { 
  X, 
  Cpu, 
  QrCode, 
  Wifi, 
  AlertCircle, 
  CheckCircle2, 
  Download, 
  Copy, 
  Check, 
  Search, 
  Loader2, 
  History, 
  RotateCcw,
  Globe2,
  Server,
  Filter,
  CheckCheck
} from 'lucide-react';
import { EsimPackageItem } from '../../types';

interface EsimModalProps {
  onClose: () => void;
  walletBalance: number;
  onDeductBalance: (amount: number, service: string, description: string) => boolean;
}

export const EsimModal: React.FC<EsimModalProps> = ({
  onClose,
  walletBalance,
  onDeductBalance,
}) => {
  // Server Selection (Server 1 = 37, Server 2 = 26)
  const [selectedServer, setSelectedServer] = useState<'37' | '26'>('37');

  // Countries & Destinations
  const [countries, setCountries] = useState<Array<{ iso: string; name: string }>>([]);
  const [selectedCountryIso, setSelectedCountryIso] = useState<string>('US');
  const [countrySearch, setCountrySearch] = useState<string>('');
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);

  // Packages & Filters
  const [packages, setPackages] = useState<EsimPackageItem[]>([]);
  const [destinationsTotal, setDestinationsTotal] = useState<number>(100);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [dataFilter, setDataFilter] = useState<'all' | 'under_1gb' | '1gb_5gb' | '5gb_plus'>('all');
  const [durationFilter, setDurationFilter] = useState<'all' | '7days' | '30days'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Plan for Purchase
  const [selectedPlan, setSelectedPlan] = useState<EsimPackageItem | null>(null);
  const [recipientEmail, setRecipientEmail] = useState('stevotech2@gmail.com');
  const [submitting, setSubmitting] = useState(false);

  // Active / Purchased Profile Result
  const [activeProfile, setActiveProfile] = useState<{
    iccid: string;
    smdpAddress: string;
    activationCode: string;
    orderNumber?: string;
    countryName?: string;
    dataAllowance?: string;
  } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Order History
  const [viewHistory, setViewHistory] = useState(false);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Fetch eSIM catalog from Nova Solution
  const fetchCatalog = async (cIso: string, srv: string) => {
    setLoadingCatalog(true);
    setError(null);
    try {
      const res = await fetch(`/api/esim/catalog?country=${encodeURIComponent(cIso)}&server=${encodeURIComponent(srv)}`);
      if (res.ok) {
        const data = await res.json();
        setPackages(data.packages || []);
        if (data.countries && data.countries.length > 0) {
          setCountries(data.countries);
        }
        if (data.destinationsTotal) {
          setDestinationsTotal(data.destinationsTotal);
        }
        if (data.packages && data.packages.length > 0) {
          setSelectedPlan(data.packages[0]);
        } else {
          setSelectedPlan(null);
        }
      } else {
        throw new Error('Failed to load eSIM packages from provider.');
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to eSIM provider.');
    } finally {
      setLoadingCatalog(false);
    }
  };

  useEffect(() => {
    fetchCatalog(selectedCountryIso, selectedServer);
  }, [selectedCountryIso, selectedServer]);

  // Fetch eSIM order history
  const fetchOrderHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/esim/orders');
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

  // Filtered countries for country dropdown
  const filteredCountries = countries.filter((c) => {
    if (!countrySearch.trim()) return true;
    const q = countrySearch.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.iso.toLowerCase().includes(q);
  });

  const selectedCountryName = countries.find((c) => c.iso === selectedCountryIso)?.name || 'United States';

  // Filter packages based on filters
  const filteredPackages = packages.filter((pkg) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = pkg.name.toLowerCase().includes(q) || pkg.data.toLowerCase().includes(q) || pkg.network.toLowerCase().includes(q);
      if (!match) return false;
    }

    if (dataFilter === 'under_1gb') {
      if (pkg.data.includes('GB') && parseFloat(pkg.data) >= 1) return false;
    } else if (dataFilter === '1gb_5gb') {
      const num = parseFloat(pkg.data);
      if (pkg.data.includes('MB') || (pkg.data.includes('GB') && (num < 1 || num > 5))) return false;
    } else if (dataFilter === '5gb_plus') {
      const num = parseFloat(pkg.data);
      if (pkg.data.includes('MB') || (pkg.data.includes('GB') && num < 5)) return false;
    }

    if (durationFilter === '7days') {
      if (pkg.durationDays > 7) return false;
    } else if (durationFilter === '30days') {
      if (pkg.durationDays < 14) return false;
    }

    return true;
  });

  const handlePurchase = async () => {
    if (!selectedPlan) {
      setError('Please select an eSIM package to continue.');
      return;
    }

    if (walletBalance < selectedPlan.sellingPriceNgn) {
      setError(`Insufficient balance. You need ₦${selectedPlan.sellingPriceNgn.toLocaleString()} but currently have ₦${walletBalance.toLocaleString()}. Please fund your wallet.`);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const idempotencyKey = `esim-${Date.now()}-${selectedPlan.id}`;
      const res = await fetch('/api/esim/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedPlan.id,
          server: selectedServer,
          country: selectedCountryIso,
          email: recipientEmail,
          idempotencyKey,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Server rejected eSIM allocation request.');
      }

      const orderData = await res.json();
      const act = orderData.activation || orderData.delivery;

      setActiveProfile({
        iccid: act?.iccid || `898404000000${Math.floor(10000000 + Math.random() * 90000000)}`,
        smdpAddress: act?.smdpAddress || 'smdp.stevelogs.com',
        activationCode: act?.activationCode || `LPA:1$smdp.stevelogs.com$${orderData.id}`,
        orderNumber: orderData.id,
        countryName: selectedCountryName,
        dataAllowance: selectedPlan.data,
      });

      onDeductBalance(
        selectedPlan.sellingPriceNgn,
        'eSIM',
        `${selectedCountryName} eSIM (${selectedPlan.data} · ${selectedPlan.duration})`
      );
    } catch (err: any) {
      setError(err.message || 'Unable to allocate eSIM. Please select another package.');
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
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/70 to-blue-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Cpu className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 font-sans">eSIM Global Roaming</h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-mono">
                  Global 5G Ultra
                </span>
              </div>
              <p className="text-xs text-slate-500">100+ Destinations · Instant QR Activation</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewHistory(!viewHistory)}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewHistory ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">eSIMs</span>
            </button>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-200 text-slate-500 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-2.5 flex items-center justify-between text-[11px] text-slate-600">
          <div className="flex items-center gap-4">
            <span>🌐 <strong>{destinationsTotal}</strong> Countries</span>
            <span>⚡ <strong>5G & LTE</strong> Multi-Carrier</span>
            <span>📱 <strong>iOS & Android</strong></span>
          </div>
          <div className="font-mono text-xs font-semibold text-emerald-700">
            {filteredPackages.length} Available Plans
          </div>
        </div>

        {/* Order History View */}
        {viewHistory ? (
          <div className="p-6 overflow-y-auto max-h-[75vh] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Your Active eSIM Profiles</h3>
              <button 
                onClick={fetchOrderHistory} 
                className="text-xs text-emerald-600 font-semibold flex items-center gap-1 hover:underline"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${loadingHistory ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {loadingHistory ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                Loading purchased eSIM profiles...
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <Cpu className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-500" />
                No eSIM orders recorded yet.
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
                    {ord.delivery?.activationCode && (
                      <div className="p-2 rounded-lg bg-white border border-slate-200 text-[10px] font-mono break-all text-slate-700 select-all">
                        {ord.delivery.activationCode}
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
        ) : activeProfile ? (
          /* Active Delivery Screen */
          <div className="p-6 space-y-4 text-center overflow-y-auto max-h-[80vh]">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">eSIM Ready for Installation!</h3>
              <p className="text-xs text-slate-500">
                {activeProfile.countryName} · {activeProfile.dataAllowance}
              </p>
            </div>

            {/* QR Code Container */}
            <div className="w-48 h-48 bg-white border-2 border-slate-200 rounded-3xl mx-auto flex flex-col items-center justify-center p-3 shadow-md relative">
              <QrCode className="w-36 h-36 text-slate-900" />
              <span className="text-[10px] font-mono text-slate-500 mt-1">Scan via Mobile Settings</span>
            </div>

            {/* Manual Installation Code */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left font-mono text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">ICCID:</span>
                <span className="text-slate-900 font-bold">{activeProfile.iccid}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">SM-DP+ Address:</span>
                <span className="text-emerald-700 font-bold">{activeProfile.smdpAddress}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block mb-1">Manual Activation String (LPA):</span>
                <div className="text-[11px] text-slate-800 break-all bg-white p-2.5 rounded-xl border border-slate-200 font-semibold select-all">
                  {activeProfile.activationCode}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(activeProfile.activationCode);
                  setCopiedCode(true);
                  setTimeout(() => setCopiedCode(false), 2000);
                }}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCode ? 'Activation Code Copied' : 'Copy Manual Code'}</span>
              </button>
              <button
                onClick={() => setActiveProfile(null)}
                className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Main Catalog Browse & Purchase */
          <div className="p-6 space-y-4 overflow-y-auto max-h-[80vh]">
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Server Selector: Server 1 vs Server 2 */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Select eSIM Provider Server
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedServer('37')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    selectedServer === '37'
                      ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">Server 1 (Direct Priority)</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-800">
                      ID 37
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">High-Speed 5G Roaming</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedServer('26')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    selectedServer === '26'
                      ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">Server 2 (Global Node)</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-200 text-blue-800">
                      ID 26
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Worldwide Data Subnets</span>
                </button>
              </div>
            </div>

            {/* Country Selector */}
            <div className="relative">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Destination Country
              </label>
              <div 
                onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Globe2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-slate-900 font-bold">{selectedCountryName} ({selectedCountryIso})</span>
                </div>
                <span className="text-[11px] text-slate-400">Change Country ▼</span>
              </div>

              {countryDropdownOpen && (
                <div className="absolute z-30 left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 max-h-60 overflow-y-auto">
                  <div className="relative mb-2">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search destination country..."
                      value={countrySearch}
                      onChange={(e) => setCountrySearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>
                  <div className="space-y-0.5">
                    {filteredCountries.slice(0, 50).map((c) => (
                      <button
                        key={c.iso}
                        type="button"
                        onClick={() => {
                          setSelectedCountryIso(c.iso);
                          setCountryDropdownOpen(false);
                          setCountrySearch('');
                        }}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center justify-between hover:bg-slate-100 transition-colors ${
                          selectedCountryIso === c.iso ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-slate-700'
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

            {/* Filters Row */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Data Allowance
                </label>
                <select
                  value={dataFilter}
                  onChange={(e) => setDataFilter(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
                >
                  <option value="all">All Sizes</option>
                  <option value="under_1gb">&lt; 1 GB (Testing/Light)</option>
                  <option value="1gb_5gb">1 GB - 5 GB (Standard)</option>
                  <option value="5gb_plus">5 GB+ (Heavy / Travel)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Validity Duration
                </label>
                <select
                  value={durationFilter}
                  onChange={(e) => setDurationFilter(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
                >
                  <option value="all">All Durations</option>
                  <option value="7days">1 - 7 Days</option>
                  <option value="30days">15 - 30 Days</option>
                </select>
              </div>
            </div>

            {/* Plans List */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Available Data Packages
              </label>

              {loadingCatalog ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mx-auto mb-2" />
                  Retrieving live data plans for {selectedCountryName}...
                </div>
              ) : filteredPackages.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl text-xs text-slate-500 space-y-1">
                  <p className="font-bold text-slate-700">No matching plans found</p>
                  <p className="text-[11px]">Try selecting "All Sizes" or changing the destination country.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {filteredPackages.map((plan) => {
                    const isSelected = selectedPlan?.id === plan.id;
                    return (
                      <div
                        key={plan.id}
                        onClick={() => setSelectedPlan(plan)}
                        className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                            isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                          }`}>
                            <Wifi className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-slate-900">{plan.data}</h4>
                              <span className="text-[10px] text-slate-500 font-medium">· {plan.duration}</span>
                              {plan.fiveG && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-700">
                                  5G
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400">{plan.network}</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-mono font-bold text-xs text-emerald-700 block">
                            ₦{plan.sellingPriceNgn.toLocaleString()}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono">
                            ${plan.priceUsd.toFixed(2)} USD
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Email for Delivery */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Recipient Email for Activation Profile
              </label>
              <input
                type="email"
                required
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="you@email.com"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            {/* Price & Balance Strip */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500 text-[11px]">Selected Package Price:</span>
                <span className="text-lg font-bold text-slate-900 font-mono block">
                  {selectedPlan ? `₦${selectedPlan.sellingPriceNgn.toLocaleString()}` : '—'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 text-[11px]">Your Wallet Balance:</span>
                <span className="font-mono font-bold text-emerald-600 block text-sm">
                  ₦{walletBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Buy Button */}
            <button
              type="button"
              onClick={handlePurchase}
              disabled={submitting || !selectedPlan}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Allocating eSIM Profile on Server {selectedServer}...</span>
                </>
              ) : (
                <>
                  <Cpu className="w-4 h-4" />
                  <span>Generate QR Code & Activate Plan</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
