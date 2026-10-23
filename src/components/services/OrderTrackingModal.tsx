import React, { useState, useEffect } from 'react';
import { 
  X, 
  Truck, 
  Search, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Loader2, 
  Calendar, 
  ExternalLink, 
  Package, 
  ArrowRight,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { TrackingShipment } from '../../types';

interface OrderTrackingModalProps {
  onClose: () => void;
  initialQuery?: string;
}

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  onClose,
  initialQuery = '',
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<'all' | 'gift_delivery' | 'courier_parcel' | 'international' | 'digital_service'>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TrackingShipment | null>(null);
  const [searched, setSearched] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleTrack = async (searchQuery?: string) => {
    const target = (searchQuery ?? query).trim();
    if (!target) {
      setError('Please enter a valid tracking number or order reference.');
      return;
    }

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const categoryParam = category !== 'all' ? `?category=${category}` : '';
      const res = await fetch(`/api/tracking/${encodeURIComponent(target)}${categoryParam}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setResult(null);
        setError(data.error || `No tracking information found for "${target}". If you recently submitted a gift delivery, order review may take a few moments.`);
      } else {
        setResult(data.tracking);
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with tracking system.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery && initialQuery.trim() !== '') {
      handleTrack(initialQuery);
    }
  }, [initialQuery]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Dispatched / In Transit':
      case 'Out for Delivery':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Processing / Preparing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Order Placed':
      case 'In Review':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex justify-center p-3 sm:p-5"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto border border-slate-100 max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <Truck className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 font-sans">Order Tracking Center</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  Universal Shipment Search
                </span>
              </div>
              <p className="text-xs text-slate-500 font-sans">Track gift deliveries, courier parcels, international freight & digital orders</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            title="Close tracking center"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar Section */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/30 space-y-3">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleTrack();
            }}
            className="space-y-3"
          >
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Enter Order Reference (e.g. WGD-849201) or Courier Tracking #"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 placeholder:font-sans placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Tracking...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Track Order</span>
                  </>
                )}
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
              <span className="text-slate-500 font-semibold mr-1">Category:</span>
              {[
                { id: 'all', label: 'All Orders' },
                { id: 'gift_delivery', label: 'Worldwide Gifts' },
                { id: 'courier_parcel', label: 'Courier Parcels' },
                { id: 'international', label: 'International Freight' },
                { id: 'digital_service', label: 'Digital Services' },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id as any)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                    category === c.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </form>
        </div>

        {/* Tracking Results Area */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[65vh]">
          {error && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1 animate-in fade-in">
              <div className="flex items-center gap-2 font-bold">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Tracking Information Notice</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800">{error}</p>
            </div>
          )}

          {result ? (
            /* Found Shipment Card */
            <div className="space-y-5 animate-in fade-in">
              {/* Top Overview Badge */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-100 space-y-3">
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider block">
                      {result.category === 'gift_delivery' ? 'Worldwide Gift Delivery' : result.category.replace('_', ' ').toUpperCase()}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 font-mono">
                      {result.trackingNumber || result.orderReference}
                    </h3>
                    {result.orderReference && result.trackingNumber !== result.orderReference && (
                      <span className="text-[11px] text-slate-500 font-mono">
                        Internal Ref: {result.orderReference}
                      </span>
                    )}
                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(result.currentStatus)}`}>
                    {result.currentStatus}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-blue-100/80 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Carrier / Courier</span>
                    <span className="font-semibold text-slate-800">{result.carrier}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Destination</span>
                    <span className="font-semibold text-slate-800 truncate block">{result.destination}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Estimated Delivery</span>
                    <span className="font-semibold text-emerald-700 font-mono">
                      {result.estimatedDeliveryDate || 'Pending carrier update'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Shipment Journey Timeline */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Shipment Progress & Checkpoints</span>
                </h4>

                <div className="space-y-4 pl-2 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {result.timeline.map((event, idx) => (
                    <div key={idx} className="relative flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 z-10 ${
                        event.completed 
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-slate-200 text-slate-500'
                      }`}>
                        {event.completed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <div className="w-2 h-2 rounded-full bg-slate-400" />}
                      </div>

                      <div className="space-y-0.5 flex-1 p-2.5 bg-slate-50/80 rounded-xl border border-slate-200/60">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">{event.title}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(event.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600">{event.description}</p>
                        {event.location && (
                          <div className="flex items-center gap-1 text-[10px] text-slate-500 pt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{event.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : !searched ? (
            /* Initial Empty State with Quick Helper */
            <div className="p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
                <Truck className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-800">Track Any Steve Logs Order or Delivery</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Enter your unique gift order reference (e.g. <strong>WGD-XXXXXX</strong>) or assigned courier tracking number above to see real-time updates.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Verified End-to-End Delivery Monitoring</span>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
