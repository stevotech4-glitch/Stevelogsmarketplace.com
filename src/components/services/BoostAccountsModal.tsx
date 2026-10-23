import React, { useState, useEffect } from 'react';
import { 
  X, 
  Users, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp, 
  Sparkles, 
  Server, 
  Loader2, 
  History, 
  RotateCcw,
  ExternalLink,
  ShieldCheck,
  Check
} from 'lucide-react';
import { SmmServiceItem } from '../../types';

interface BoostAccountsModalProps {
  onClose: () => void;
  walletBalance: number;
  onDeductBalance: (amount: number, service: string, description: string) => boolean;
  packagesList?: any[];
}

interface ServerOption {
  serverNum: number;
  serverName: string;
  providerId: 'nova' | 'benotp';
  providerName: string;
  status: 'online' | 'offline' | 'checking';
  role: string;
  description: string;
}

export const BoostAccountsModal: React.FC<BoostAccountsModalProps> = ({
  onClose,
  walletBalance,
  onDeductBalance,
}) => {
  // Server Selection
  // Servers 1, 2, 3, 38 -> Nova Solution; Server 4 -> BenOTP
  const [selectedServer, setSelectedServer] = useState<number>(1);
  const [servers, setServers] = useState<ServerOption[]>([]);
  const [loadingServers, setLoadingServers] = useState(false);

  // Services Catalog
  const [services, setServices] = useState<SmmServiceItem[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedService, setSelectedService] = useState<SmmServiceItem | null>(null);

  // Form Inputs
  const [targetLink, setTargetLink] = useState('');
  const [quantity, setQuantity] = useState<number>(1000);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<any | null>(null);

  // Server 4 message
  const [server4Notice, setServer4Notice] = useState<string | null>(null);

  // History
  const [viewHistory, setViewHistory] = useState(false);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Fetch servers mapping
  useEffect(() => {
    const fetchServers = async () => {
      setLoadingServers(true);
      try {
        const res = await fetch('/api/boosting/servers');
        if (res.ok) {
          const data: ServerOption[] = await res.json();
          setServers(data);
        }
      } catch {
        // fallback
      } finally {
        setLoadingServers(false);
      }
    };
    fetchServers();
  }, []);

  // Fetch services for selected server
  const fetchServicesForServer = async (srv: number) => {
    setLoadingServices(true);
    setError(null);
    setServer4Notice(null);
    try {
      const res = await fetch(`/api/boosting/services?server=${srv}`);
      if (res.ok) {
        const data = await res.json();
        if (srv === 4 || !data.supported) {
          setServer4Notice(data.message || 'Server 4 is reserved as a dedicated Virtual Verification Gateway. SMM Boosting campaigns are supported on Servers 1, 2, 3, and 38.');
          setServices([]);
          setSelectedService(null);
        } else {
          const svcList: SmmServiceItem[] = data.services || [];
          setServices(svcList);
          if (svcList.length > 0) {
            setSelectedService(svcList[0]);
            setQuantity(svcList[0].minQty || 1000);
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Unable to retrieve services for selected server.');
    } finally {
      setLoadingServices(false);
    }
  };

  useEffect(() => {
    fetchServicesForServer(selectedServer);
  }, [selectedServer]);

  // Fetch boosting order history
  const fetchOrderHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/boosting/orders');
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

  // Categories
  const categories = ['All', ...Array.from(new Set(services.map((s) => s.category || s.platform)))];
  const filteredServices = services.filter((s) => {
    if (selectedCategory === 'All') return true;
    return (s.category || s.platform) === selectedCategory;
  });

  // Cost calculation
  const totalCost = selectedService
    ? Math.round((quantity / 1000) * selectedService.sellingPricePer1k)
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (selectedServer === 4) {
      setError('Server 4 is reserved for Virtual Numbers. Please select Boosting Server 1, 2, 3, or 38 for social growth.');
      return;
    }

    if (!selectedService) {
      setError('Please select an active boosting service.');
      return;
    }

    if (!targetLink.trim()) {
      setError('Please provide the account or post URL/link.');
      return;
    }

    if (quantity < selectedService.minQty || quantity > selectedService.maxQty) {
      setError(`Quantity must be between ${selectedService.minQty.toLocaleString()} and ${selectedService.maxQty.toLocaleString()}.`);
      return;
    }

    if (walletBalance < totalCost) {
      setError(`Insufficient balance. You need ₦${totalCost.toLocaleString()} but currently have ₦${walletBalance.toLocaleString()}. Please fund your wallet.`);
      return;
    }

    setSubmitting(true);
    try {
      const idempotencyKey = `boost-${Date.now()}-${selectedService.id}-${quantity}`;
      const res = await fetch('/api/boosting/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          server: selectedServer,
          itemId: selectedService.id,
          quantity,
          targetLink: targetLink.trim(),
          idempotencyKey,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Provider rejected campaign submission.');
      }

      const orderData = await res.json();
      setCompletedOrder(orderData);

      onDeductBalance(
        totalCost,
        'Boost Accounts',
        `${quantity.toLocaleString()} ${selectedService.name} (${selectedService.serverLabel})`
      );
    } catch (err: any) {
      setError(err.message || 'Unable to submit boosting order.');
    } finally {
      setSubmitting(false);
    }
  };

  const getPlatformPlaceholder = (platform: string) => {
    const p = platform.toLowerCase();
    if (p.includes('insta')) return 'https://instagram.com/username or post URL';
    if (p.includes('tele')) return 'https://t.me/channel_name or post link';
    if (p.includes('tik')) return 'https://tiktok.com/@username/video/12345';
    if (p.includes('twit')) return 'https://x.com/username or tweet URL';
    if (p.includes('you')) return 'https://youtube.com/watch?v=video_id';
    return 'https://... (Profile or post link)';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex justify-center p-3 sm:p-5">
      <div 
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto border border-slate-100 max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-purple-50/70 to-blue-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-blue-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
              <Users className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 font-sans">Social Boosting</h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-mono">
                  SMM Nodes
                </span>
              </div>
              <p className="text-xs text-slate-500">Instagram, Telegram, TikTok, Twitter & YouTube</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewHistory(!viewHistory)}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewHistory ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
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
              <h3 className="text-sm font-bold text-slate-900">Social Boost Order History</h3>
              <button 
                onClick={fetchOrderHistory} 
                className="text-xs text-purple-600 font-semibold flex items-center gap-1 hover:underline"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${loadingHistory ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {loadingHistory ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-600" />
                Loading your boosting orders...
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-500" />
                No boosting campaigns recorded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((ord) => (
                  <div key={ord.id} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{ord.productName}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        ord.status === 'Successful' ? 'bg-emerald-100 text-emerald-700' :
                        ord.status === 'Processing' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {ord.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Ref: <span className="font-mono text-slate-700">{ord.id}</span></span>
                      <span className="font-bold text-slate-800 font-mono">₦{(ord.amount || 0).toLocaleString()}</span>
                    </div>
                    {ord.delivery?.targetLink && (
                      <div className="text-[11px] text-purple-600 font-medium truncate">
                        Target: {ord.delivery.targetLink}
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
              Back to Campaign Setup
            </button>
          </div>
        ) : completedOrder ? (
          /* Order Success Confirmation */
          <div className="p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Campaign Activated!</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                {completedOrder.productName}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left font-mono text-xs space-y-2 max-w-md mx-auto">
              <div className="flex justify-between">
                <span className="text-slate-500">Order Reference:</span>
                <span className="text-slate-900 font-bold">{completedOrder.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Target URL:</span>
                <span className="text-purple-600 font-bold truncate max-w-[200px]">{completedOrder.delivery?.targetLink || targetLink}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Quantity:</span>
                <span className="text-slate-900 font-bold">{quantity.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Charged Amount:</span>
                <span className="text-slate-900 font-bold">₦{(completedOrder.amount || totalCost).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="text-emerald-600 font-bold">Queued on Steve Logs Network</span>
              </div>
            </div>

            <div className="pt-2 flex gap-3 max-w-md mx-auto">
              <button
                onClick={() => {
                  setCompletedOrder(null);
                  setTargetLink('');
                }}
                className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition-colors"
              >
                Boost Another Account
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
          /* Main Campaign Setup Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            {/* Server Selector: Server 1, 2, 3, 38 & Server 4 */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Select Boosting Server Node
                </label>
                <span className="text-[10px] text-slate-400 font-medium">
                  {selectedServer === 4 ? 'Node: Dedicated SMS Gateway' : 'Node: Verified Social Cluster'}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {[
                  { num: 1, label: 'Server 1' },
                  { num: 2, label: 'Server 2' },
                  { num: 3, label: 'Server 3' },
                  { num: 38, label: 'Server 38' },
                  { num: 4, label: 'Server 4' },
                ].map((s) => (
                  <button
                    key={s.num}
                    type="button"
                    onClick={() => setSelectedServer(s.num)}
                    className={`py-2 px-1 rounded-xl text-center border transition-all ${
                      selectedServer === s.num
                        ? 'border-purple-600 bg-purple-50 text-purple-900 font-bold shadow-sm ring-2 ring-purple-500/20'
                        : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-[11px] font-bold">{s.label}</div>
                    <div className="text-[9px] text-slate-400 truncate">{s.num === 4 ? 'SMS Gateway' : 'Online'}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* If Server 4 selected: display accurate gateway routing information */}
            {selectedServer === 4 && (
              <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/60 space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  Server 4 Configured as Dedicated Virtual Numbers Gateway
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  {server4Notice || 'Server 4 is reserved for OTP and virtual phone number verifications. For social growth campaigns, please select Boosting Server 1, 2, 3, or 38.'}
                </p>
                <div className="pt-1">
                  <span className="text-[11px] text-slate-600 font-medium block mb-1">
                    To start a social boost campaign, please select:
                  </span>
                  <div className="flex gap-2">
                    {[1, 2, 3, 38].map((sNum) => (
                      <button
                        key={sNum}
                        type="button"
                        onClick={() => setSelectedServer(sNum)}
                        className="px-2.5 py-1 rounded-lg bg-purple-600 text-white font-bold text-[11px] hover:bg-purple-700"
                      >
                        {sNum === 38 ? 'Server 38' : `Server ${sNum}`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedServer !== 4 && (
              <>
                {/* Category Pills */}
                {categories.length > 1 && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Platform Filter
                    </label>
                    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                            selectedCategory === cat
                              ? 'bg-purple-600 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Service Selection */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Select Verified Service
                  </label>
                  {loadingServices ? (
                    <div className="p-4 rounded-xl border border-slate-200 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                      Loading live services from Server {selectedServer}...
                    </div>
                  ) : filteredServices.length === 0 ? (
                    <div className="p-4 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
                      No services currently listed for this category.
                    </div>
                  ) : (
                    <select
                      value={selectedService?.id || ''}
                      onChange={(e) => {
                        const s = services.find((x) => String(x.id) === e.target.value);
                        if (s) {
                          setSelectedService(s);
                          setQuantity(Math.max(s.minQty, Math.min(quantity, s.maxQty)));
                        }
                      }}
                      className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    >
                      {filteredServices.map((s) => (
                        <option key={s.id} value={s.id}>
                          [{s.platform}] {s.name} — ₦{s.sellingPricePer1k.toLocaleString()}/1k (Min: {s.minQty.toLocaleString()})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Target URL Input */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Target Account / Post URL
                  </label>
                  <input
                    type="url"
                    required
                    placeholder={selectedService ? getPlatformPlaceholder(selectedService.platform) : 'https://...'}
                    value={targetLink}
                    onChange={(e) => setTargetLink(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>

                {/* Quantity Controls */}
                {selectedService && (
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Order Quantity
                      </label>
                      <span className="font-mono font-bold text-purple-600">
                        {quantity.toLocaleString()} units
                      </span>
                    </div>
                    
                    <input
                      type="range"
                      min={selectedService.minQty}
                      max={Math.min(selectedService.maxQty, 50000)}
                      step={selectedService.minQty < 100 ? 50 : 100}
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-full accent-purple-600 cursor-pointer mb-2"
                    />

                    <div className="flex gap-2">
                      {[selectedService.minQty, 1000, 2500, 5000, 10000]
                        .filter((q) => q >= selectedService.minQty && q <= selectedService.maxQty)
                        .map((q) => (
                          <button
                            key={q}
                            type="button"
                            onClick={() => setQuantity(q)}
                            className={`flex-1 py-1 px-1 rounded-lg text-[10px] font-mono font-bold border ${
                              quantity === q
                                ? 'bg-purple-600 text-white border-purple-600'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {q >= 1000 ? `${q / 1000}k` : q}
                          </button>
                        ))}
                    </div>

                    <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                      <span>Min: {selectedService.minQty.toLocaleString()}</span>
                      <span>Max: {selectedService.maxQty.toLocaleString()}</span>
                    </div>
                  </div>
                )}

                {/* Price & Wallet Summary */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500 text-[11px]">Total Campaign Cost:</span>
                    <span className="text-lg font-bold text-slate-900 font-mono block">
                      ₦{totalCost.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 text-[11px]">Your Wallet Balance:</span>
                    <span className="font-mono font-bold text-purple-600 block text-sm">
                      ₦{walletBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting || !selectedService}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold text-sm shadow-lg shadow-purple-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Dispatching Campaign to Server {selectedServer}...</span>
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4" />
                      <span>Launch Growth Campaign</span>
                    </>
                  )}
                </button>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
