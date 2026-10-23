import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  Server, 
  Copy, 
  Check, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  RotateCcw, 
  History, 
  Globe2, 
  Lock, 
  Layers, 
  Clock, 
  Zap,
  CheckCheck
} from 'lucide-react';
import { ProxyPlanItem, ProxyGateItem, ProxyTypeItem } from '../../types';

interface ProxiesModalProps {
  onClose: () => void;
  walletBalance: number;
  onDeductBalance: (amount: number, service: string, description: string) => boolean;
  packagesList?: any[];
}

const DEFAULT_LOCATIONS = [
  'United States',
  'United Kingdom',
  'Germany',
  'Canada',
  'Global Residential Pool',
  'Nigeria',
  'France',
  'Netherlands',
];

const DURATIONS = ['1 Day', '7 Days', '30 Days'];

export const ProxiesModal: React.FC<ProxiesModalProps> = ({
  onClose,
  walletBalance,
  onDeductBalance,
}) => {
  // Catalog from Nova Solution
  const [types, setTypes] = useState<ProxyTypeItem[]>([]);
  const [gates, setGates] = useState<ProxyGateItem[]>([]);
  const [plans, setPlans] = useState<ProxyPlanItem[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selections
  const [selectedType, setSelectedType] = useState<string>('residential');
  const [selectedGateId, setSelectedGateId] = useState<number>(1);
  const [selectedPlan, setSelectedPlan] = useState<ProxyPlanItem | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string>('United States');
  const [selectedDuration, setSelectedDuration] = useState<string>('30 Days');
  const [quantity, setQuantity] = useState<number>(1);

  // Purchase State
  const [submitting, setSubmitting] = useState(false);
  const [provisionedProxy, setProvisionedProxy] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  // History State
  const [viewHistory, setViewHistory] = useState(false);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // 1. Fetch Proxy Catalog from Nova Solution
  const fetchCatalog = async () => {
    setLoadingCatalog(true);
    setError(null);
    try {
      const res = await fetch('/api/proxies/catalog');
      if (res.ok) {
        const data = await res.json();
        const incomingTypes = data.types || [];
        const incomingGates = data.gates || [];
        const incomingPlans = data.plans || [];

        setTypes(incomingTypes);
        setGates(incomingGates);
        setPlans(incomingPlans);

        if (incomingTypes.length > 0) {
          setSelectedType(incomingTypes[0].id);
        }
        if (incomingGates.length > 0) {
          setSelectedGateId(incomingGates[0].id);
        }

        // Set initial plan
        if (incomingPlans.length > 0) {
          setSelectedPlan(incomingPlans[0]);
        }
      } else {
        throw new Error('Unable to connect to proxy gateway catalog.');
      }
    } catch (err: any) {
      setError(err.message || 'Error loading proxy catalog.');
    } finally {
      setLoadingCatalog(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  // 2. Compute matching plans dynamically and fix the stuck loading issue
  const matchingPlans = plans.filter((p) => {
    if (selectedType && p.proxyType !== selectedType) return false;
    return true;
  });

  // Whenever type or gate changes, automatically select the best matching plan
  useEffect(() => {
    if (plans.length === 0) return;

    // First try exact match on type + gateId
    const exact = plans.find((p) => p.proxyType === selectedType && p.gateId === selectedGateId);
    if (exact) {
      setSelectedPlan(exact);
      return;
    }

    // Next try match on type
    const byType = plans.find((p) => p.proxyType === selectedType);
    if (byType) {
      setSelectedPlan(byType);
      return;
    }

    // Otherwise fallback to first plan
    setSelectedPlan(plans[0]);
  }, [selectedType, selectedGateId, plans]);

  // 3. Fetch Orders History
  const fetchOrderHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/proxies/orders');
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

  // Pricing calculation
  const unitPrice = selectedPlan?.sellingPriceNgn || 3850;
  const totalPrice = unitPrice * Math.max(1, quantity);

  // 4. Handle Purchase
  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedPlan) {
      setError('Please select a valid proxy plan.');
      return;
    }

    if (walletBalance < totalPrice) {
      setError(`Insufficient wallet balance. You need ₦${totalPrice.toLocaleString()} but currently have ₦${walletBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}.`);
      return;
    }

    setSubmitting(true);
    try {
      const idempotencyKey = `proxy-${Date.now()}-${selectedPlan.id}-${quantity}`;
      const res = await fetch('/api/proxies/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlan.id,
          proxyType: selectedType,
          gateId: selectedGateId,
          kind: selectedPlan.kind,
          quantity,
          location: selectedLocation,
          duration: selectedDuration,
          customerId: 'CUST-1001',
          idempotencyKey,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Proxy order could not be completed.');
      }

      // Deduct balance
      const deducted = onDeductBalance(
        totalPrice,
        'Proxies',
        `${quantity}x ${selectedPlan.name} (${selectedLocation})`
      );

      if (!deducted) {
        throw new Error('Wallet transaction failed.');
      }

      setProvisionedProxy(data);
    } catch (err: any) {
      setError(err.message || 'Failed to complete proxy order.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex justify-center p-3 sm:p-5">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto border border-slate-100 max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 font-sans">Proxies & Rotating IPs</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  Verified Proxy Network
                </span>
              </div>
              <p className="text-xs text-slate-500 font-sans">Residential, Mobile 4G/5G & Datacenter Clean Subnets</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewHistory(!viewHistory)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewHistory 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>{viewHistory ? 'Proxy Catalog' : 'Order History'}</span>
            </button>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        {viewHistory ? (
          <div className="p-6 overflow-y-auto max-h-[75vh] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Your Proxy Order History</h3>
              <button 
                onClick={fetchOrderHistory} 
                className="text-xs text-blue-600 font-semibold flex items-center gap-1 hover:underline"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${loadingHistory ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {loadingHistory ? (
              <div className="p-12 text-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                <p className="text-xs">Loading past proxy orders...</p>
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                <Server className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">No Proxy Orders Yet</p>
                <p className="text-xs text-slate-400 mt-1">When you purchase proxies, access endpoints and credentials will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((ord) => (
                  <div key={ord.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {ord.providerOrderId || ord.id}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ord.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {ord.status.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-blue-600">
                        ₦{Number(ord.totalAmount || 0).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600">
                      {ord.productDetails?.packageName || ord.serviceType} · {ord.productDetails?.country || 'USA'}
                    </p>

                    {ord.productDetails?.proxyEndpoint && (
                      <div className="p-2.5 bg-slate-900 rounded-lg font-mono text-[11px] text-emerald-400 flex items-center justify-between">
                        <span className="truncate select-all">{ord.productDetails.proxyEndpoint}</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(ord.productDetails.proxyEndpoint);
                            alert('Copied proxy endpoint!');
                          }}
                          className="ml-2 text-slate-400 hover:text-white shrink-0"
                          title="Copy"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                      <span>Purchased: {new Date(ord.createdAt).toLocaleString()}</span>
                      <span>HTTP/SOCKS5 Active</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : provisionedProxy ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">Proxy Gateway Provisioned!</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedPlan?.name} · {selectedLocation} · {selectedDuration}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 text-slate-100 font-mono text-xs text-left space-y-2 border border-slate-800 shadow-inner">
              <div className="flex items-center justify-between text-[11px] text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-800">
                <span>Access Gateway (Format: host:port:user:pass)</span>
                <span className="text-emerald-400 font-bold">100% CLEAN IP</span>
              </div>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 break-all select-all font-semibold text-emerald-400 text-xs">
                {provisionedProxy.proxyEndpoint || '162.254.120.44:8080:steve_usr99:px_pwd773'}
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 pt-1">
                <div>Protocol: <span className="font-semibold text-white">HTTP / HTTPS / SOCKS5</span></div>
                <div>Status: <span className="font-semibold text-emerald-400">Online & Ready</span></div>
                <div>Server Gateway: <span className="font-semibold text-white">Gate {selectedGateId}</span></div>
                <div>Order Ref: <span className="font-semibold text-white">{provisionedProxy.id}</span></div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(provisionedProxy.proxyEndpoint || '');
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-600/20"
              >
                {copied ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Credentials Copied to Clipboard!' : 'Copy Proxy Endpoint'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setProvisionedProxy(null);
                  fetchCatalog();
                }}
                className="px-4 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs"
              >
                Order Another
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handlePurchase} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* 1. Proxy Type Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>1. Select Proxy Type</span>
                <span className="text-[11px] text-slate-400 font-normal">High-Speed Protocol</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {types.map((t) => {
                  const isSelected = selectedType === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedType(t.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20 text-blue-900 font-bold'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs capitalize">{t.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </div>
                      <span className="text-[10px] text-slate-400 font-normal uppercase block mt-0.5">
                        {t.kind}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Gateway Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>2. Select Delivery Gateway</span>
                <span className="text-[11px] text-slate-400 font-normal">Routing Node</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {gates.map((g) => {
                  const isSelected = selectedGateId === g.id;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setSelectedGateId(g.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20 text-blue-900 font-bold'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs truncate">{g.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {g.fromUsd > 0 ? `From $${g.fromUsd}/mo` : 'Lowest Latency'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Plan / Bandwidth Selection (Fixed Loading Bug) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>3. Select Package Plan</span>
                <span className="text-[11px] text-blue-600 font-semibold">
                  {matchingPlans.length} Available Plans
                </span>
              </label>

              {loadingCatalog ? (
                <div className="p-6 border border-slate-200 rounded-xl bg-slate-50 text-center">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-blue-600 mb-1" />
                  <span className="text-xs text-slate-500">Loading live proxy packages...</span>
                </div>
              ) : matchingPlans.length === 0 ? (
                <div className="p-4 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-500">
                  No specific plan for this combination. Please select another proxy type.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {matchingPlans.map((pl) => {
                    const isSelected = selectedPlan?.id === pl.id;
                    return (
                      <div
                        key={pl.id}
                        onClick={() => setSelectedPlan(pl)}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-500/20'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-900">{pl.name}</h4>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-600 uppercase">
                              {pl.kind}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {pl.duration} · {pl.location} · Unlimited Threads
                          </p>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <span className="font-mono font-bold text-xs text-blue-600 block">
                            ₦{pl.sellingPriceNgn.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ${pl.priceUsd.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 4. Location & Duration & Quantity */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Location
                </label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {DEFAULT_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Duration
                </label>
                <select
                  value={selectedDuration}
                  onChange={(e) => setSelectedDuration(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {DURATIONS.map((dur) => (
                    <option key={dur} value={dur}>{dur}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Quantity
                </label>
                <div className="flex items-center rounded-xl border border-slate-200 bg-white overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-2.5 py-2 text-slate-600 hover:bg-slate-100 font-bold text-xs"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full text-center py-2 text-xs font-bold font-mono text-slate-900 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-2.5 py-2 text-slate-600 hover:bg-slate-100 font-bold text-xs"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Price Summary & Wallet Info */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-[11px] text-slate-500 block">Total Due:</span>
                <span className="text-base font-bold text-slate-900 font-mono">
                  ₦{totalPrice.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 block font-mono">
                  ${((selectedPlan?.priceUsd || 2.5) * quantity).toFixed(2)} USD
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-500 block">Your Balance:</span>
                <span className={`font-mono font-bold text-sm block ${
                  walletBalance >= totalPrice ? 'text-blue-600' : 'text-rose-600'
                }`}>
                  ₦{walletBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
                {walletBalance < totalPrice && (
                  <span className="text-[10px] text-rose-500 font-medium">Insufficient funds</span>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || !selectedPlan || walletBalance < totalPrice}
              className={`w-full py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
                submitting || !selectedPlan || walletBalance < totalPrice
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20 active:scale-[0.99]'
              }`}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Provisioning Proxy Gateway...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Pay ₦{totalPrice.toLocaleString()} & Provision Proxy</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
