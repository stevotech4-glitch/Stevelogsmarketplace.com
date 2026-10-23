import React, { useState, useEffect } from 'react';
import { 
  X, 
  Gift, 
  Send, 
  MapPin, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Heart, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Loader2, 
  Package, 
  ChevronRight, 
  ChevronLeft, 
  Eye, 
  DollarSign, 
  FileText,
  RotateCcw,
  Truck
} from 'lucide-react';
import { CustomerRecord, GiftDeliveryOrder } from '../../types';

interface WorldwideGiftDeliveryModalProps {
  onClose: () => void;
  customer?: CustomerRecord | null;
  walletBalance: number;
  onOpenTracking?: (trackingNumber?: string) => void;
}

const GIFT_CATEGORIES = [
  { id: 'flowers', name: 'Flowers & Fresh Bouquets', icon: '💐', desc: 'Roses, lilies, orchids & seasonal floral arrangements' },
  { id: 'cakes', name: 'Cakes & Celebration Treats', icon: '🎂', desc: 'Custom birthday, wedding, anniversary & cupcakes' },
  { id: 'chocolates', name: 'Chocolates & Luxury Gift Hampers', icon: '🍫', desc: 'Ferrero Rocher, Godiva, Lindt & gourmet snack baskets' },
  { id: 'perfumes', name: 'Perfumes & Personal Luxury', icon: '✨', desc: 'Designer fragrances, cologne & wellness beauty sets' },
  { id: 'birthday', name: 'Birthday Surprise Packages', icon: '🎈', desc: 'Balloons, stuffed animals, cakes & gift boxes' },
  { id: 'anniversary', name: 'Anniversary & Romantic Gifts', icon: '❤️', desc: 'Jewelry, wine/cider, keepsake items & romance packages' },
  { id: 'custom', name: 'Custom Curated Arrangement', icon: '🎁', desc: 'Special requests, corporate gifts or personalized care packs' },
];

const OCCASIONS = [
  'Birthday',
  'Anniversary',
  'Valentine / Romance',
  'Wedding / Bridal',
  'Mother\'s / Father\'s Day',
  'Get Well Soon',
  'Congratulations / Graduation',
  'Corporate / Client Appreciation',
  'Holiday / Christmas / New Year',
  'Just Because / Thinking of You',
];

const COMMON_COUNTRIES = [
  { name: 'United Kingdom', dial: '+44', flag: '🇬🇧' },
  { name: 'United States', dial: '+1', flag: '🇺🇸' },
  { name: 'Canada', dial: '+1', flag: '🇨🇦' },
  { name: 'Nigeria', dial: '+234', flag: '🇳🇬' },
  { name: 'Ghana', dial: '+233', flag: '🇬🇭' },
  { name: 'South Africa', dial: '+27', flag: '🇿🇦' },
  { name: 'United Arab Emirates', dial: '+971', flag: '🇦🇪' },
  { name: 'Germany', dial: '+49', flag: '🇩🇪' },
  { name: 'France', dial: '+33', flag: '🇫🇷' },
  { name: 'Italy', dial: '+39', flag: '🇮🇹' },
  { name: 'Australia', dial: '+61', flag: '🇦🇺' },
  { name: 'Kenya', dial: '+254', flag: '🇰🇪' },
  { name: 'India', dial: '+91', flag: '🇮🇳' },
  { name: 'Other Worldwide Destination', dial: '+', flag: '🌐' },
];

export const WorldwideGiftDeliveryModal: React.FC<WorldwideGiftDeliveryModalProps> = ({
  onClose,
  customer,
  walletBalance,
  onOpenTracking,
}) => {
  const [activeTab, setActiveTab] = useState<'new_order' | 'my_orders'>('new_order');
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Sender Details
  const [senderName, setSenderName] = useState(customer?.name || '');
  const [senderEmail, setSenderEmail] = useState(customer?.email || '');
  const [senderPhone, setSenderPhone] = useState(customer?.phone || '');

  // Recipient Details
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [destinationCountry, setDestinationCountry] = useState('United Kingdom');
  const [stateProvince, setStateProvince] = useState('');
  const [city, setCity] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');

  // Gift Details
  const [category, setCategory] = useState(GIFT_CATEGORIES[0].name);
  const [description, setDescription] = useState('');
  const [preferredItem, setPreferredItem] = useState('');
  const [occasion, setOccasion] = useState(OCCASIONS[0]);
  const [preferredDeliveryDate, setPreferredDeliveryDate] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [budgetAmount, setBudgetAmount] = useState<number>(35000);
  const [currency, setCurrency] = useState<'NGN' | 'USD' | 'GBP' | 'EUR'>('NGN');

  // Submit and Order State
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdOrder, setCreatedOrder] = useState<GiftDeliveryOrder | null>(null);

  // My Orders List
  const [myOrders, setMyOrders] = useState<GiftDeliveryOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const effectiveCustomerId = customer?.id || 'CUST-1001';

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await fetch(`/api/gifts/orders?customerId=${encodeURIComponent(effectiveCustomerId)}`);
      if (res.ok) {
        const data = await res.json();
        setMyOrders(data);
      }
    } catch {
      // ignore
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'my_orders') {
      fetchOrders();
    }
  }, [activeTab]);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/gifts/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: effectiveCustomerId,
          senderName,
          senderEmail,
          senderPhone,
          recipientName,
          recipientPhone,
          recipientEmail,
          destinationCountry,
          stateProvince,
          city,
          deliveryAddress,
          postalCode,
          category,
          description: description.trim() || `${category} for ${occasion}`,
          preferredItem: preferredItem.trim() || category,
          occasion,
          preferredDeliveryDate,
          specialInstructions,
          budgetAmount,
          currency,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit gift delivery order.');
      }

      setCreatedOrder(data.order);
      setStep(4);
      fetchOrders();
    } catch (err: any) {
      setError(err.message || 'Error creating gift order.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending Review':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Quotation Sent':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Payment Confirmed':
      case 'Preparing Gift':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Dispatched / In Transit':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Delivered':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Cancelled':
        return 'bg-rose-100 text-rose-800 border-rose-200';
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
            <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
              <Gift className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 font-sans">Worldwide Gift Delivery</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  Global Concierge
                </span>
              </div>
              <p className="text-xs text-slate-500 font-sans">Deliver flowers, cakes, perfumes & celebration gifts to loved ones anywhere</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab(activeTab === 'new_order' ? 'my_orders' : 'new_order')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'my_orders'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{activeTab === 'my_orders' ? 'New Gift Request' : 'My Gift Orders'}</span>
            </button>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              title="Close and return to dashboard"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        {activeTab === 'my_orders' ? (
          /* My Orders View */
          <div className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Your Submitted Gift Orders</h3>
              <button 
                onClick={fetchOrders}
                className="text-xs text-blue-600 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${loadingOrders ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {loadingOrders ? (
              <div className="p-12 text-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-rose-600" />
                <p className="text-xs">Loading your gift deliveries...</p>
              </div>
            ) : myOrders.length === 0 ? (
              <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl space-y-2">
                <Gift className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-700">No Gift Orders Yet</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Surprise someone special abroad! Send flowers, cakes, chocolates or customized gifts worldwide.
                </p>
                <button
                  onClick={() => setActiveTab('new_order')}
                  className="mt-3 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Create Gift Request
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {myOrders.map((ord) => (
                  <div key={ord.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-900">{ord.reference}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(ord.status)}`}>
                            {ord.status}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-800">{ord.category} ({ord.occasion})</h4>
                        <p className="text-[11px] text-slate-500">
                          To: <strong className="text-slate-700">{ord.recipientName}</strong> in {ord.city}, {ord.destinationCountry}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-900 font-mono block">
                          Budget: {ord.currency} {ord.budgetAmount.toLocaleString()}
                        </span>
                        {ord.quotedPrice ? (
                          <span className="text-[11px] text-emerald-700 font-bold block">
                            Quoted: ₦{ord.quotedPrice.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-600 font-medium">Quote pending</span>
                        )}
                      </div>
                    </div>

                    {/* Timeline snippet */}
                    {ord.timeline && ord.timeline.length > 0 && (
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
                        <div className="flex items-center justify-between text-slate-400 text-[10px]">
                          <span className="font-semibold text-slate-700">Latest Update</span>
                          <span>{new Date(ord.timeline[ord.timeline.length - 1].timestamp).toLocaleString()}</span>
                        </div>
                        <p className="font-medium text-slate-800">{ord.timeline[ord.timeline.length - 1].title}</p>
                        <p className="text-slate-500">{ord.timeline[ord.timeline.length - 1].description}</p>
                      </div>
                    )}

                    {/* Real tracking number or concierge action */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Requested: {ord.preferredDeliveryDate}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {ord.trackingNumber ? (
                          <button
                            onClick={() => {
                              onClose();
                              if (onOpenTracking) onOpenTracking(ord.trackingNumber);
                            }}
                            className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Truck className="w-3 h-3" />
                            <span>Track Shipment</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              onClose();
                              if (onOpenTracking) onOpenTracking(ord.reference);
                            }}
                            className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Truck className="w-3 h-3" />
                            <span>Track Order</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* New Order Wizard View */
          <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
            {/* Step Indicators */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-xs font-semibold">
              <div className={`flex items-center gap-1.5 ${step === 1 ? 'text-blue-600 font-bold' : step > 1 ? 'text-emerald-600' : 'text-slate-400'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 1 ? 'bg-blue-600 text-white' : step > 1 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  1
                </span>
                <span>Sender</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <div className={`flex items-center gap-1.5 ${step === 2 ? 'text-blue-600 font-bold' : step > 2 ? 'text-emerald-600' : 'text-slate-400'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 2 ? 'bg-blue-600 text-white' : step > 2 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  2
                </span>
                <span>Recipient & Country</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <div className={`flex items-center gap-1.5 ${step === 3 ? 'text-blue-600 font-bold' : step > 3 ? 'text-emerald-600' : 'text-slate-400'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 3 ? 'bg-blue-600 text-white' : step > 3 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  3
                </span>
                <span>Gift & Date</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <div className={`flex items-center gap-1.5 ${step === 4 ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 4 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  4
                </span>
                <span>Confirmed</span>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* STEP 1: Sender Details */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in">
                <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-100 text-xs text-blue-900">
                  <p className="font-bold">Step 1: Your Information (Sender)</p>
                  <p className="text-[11px] text-blue-700 mt-0.5">
                    We will send the quotation, progress milestones, and gift verification photos to this contact info.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Stevo Tech"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Your Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. stevotech2@gmail.com"
                      value={senderEmail}
                      onChange={(e) => setSenderEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Your Phone / WhatsApp Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+2348149021844"
                      value={senderPhone}
                      onChange={(e) => setSenderPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (!senderName.trim() || !senderEmail.trim()) {
                        setError('Please provide your name and email address.');
                        return;
                      }
                      setError(null);
                      setStep(2);
                    }}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Next: Recipient & Destination</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Recipient Details */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in">
                <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-100 text-xs text-blue-900">
                  <p className="font-bold">Step 2: Recipient Worldwide Destination</p>
                  <p className="text-[11px] text-blue-700 mt-0.5">
                    Address formats adapt automatically to the destination country.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Recipient's Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Jane Smith"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Destination Country *</label>
                    <select
                      value={destinationCountry}
                      onChange={(e) => setDestinationCountry(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                    >
                      {COMMON_COUNTRIES.map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.flag} {c.name} ({c.dial})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Recipient Phone Number (with Country Code) *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+44 7911 123456"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Recipient Email (Optional)</label>
                    <input
                      type="email"
                      placeholder="e.g. jane@domain.com"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">City *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. London / Manchester"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">State / Province / County</label>
                    <input
                      type="text"
                      placeholder="e.g. Greater London"
                      value={stateProvince}
                      onChange={(e) => setStateProvince(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Postal / ZIP Code</label>
                    <input
                      type="text"
                      placeholder="e.g. SW1A 1AA / 10001"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Full Physical Delivery Address *</label>
                    <textarea
                      rows={2}
                      required
                      placeholder="Street address, house/flat/apartment number, building name..."
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!recipientName.trim() || !recipientPhone.trim() || !city.trim() || !deliveryAddress.trim()) {
                        setError('Please provide recipient name, phone, city, and delivery address.');
                        return;
                      }
                      setError(null);
                      setStep(3);
                    }}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Next: Gift Details & Date</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Gift Details & Budget */}
            {step === 3 && (
              <form onSubmit={handleSubmitOrder} className="space-y-4 animate-in fade-in">
                <div className="p-3 bg-rose-50/60 rounded-2xl border border-rose-100 text-xs text-rose-900">
                  <p className="font-bold">Step 3: Gift Selection, Date & Personalized Card</p>
                  <p className="text-[11px] text-rose-700 mt-0.5">
                    Select the gift type, occasion, target delivery date and accompanying card note.
                  </p>
                </div>

                {/* Gift Categories Grid */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Select Gift Category *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {GIFT_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.name)}
                        className={`p-2.5 text-left rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                          category === cat.name
                            ? 'border-rose-500 bg-rose-50/60 ring-2 ring-rose-500/20'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-xl">{cat.icon}</span>
                        <div>
                          <div className="text-xs font-bold text-slate-900">{cat.name}</div>
                          <div className="text-[10px] text-slate-500 leading-tight">{cat.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Occasion / Celebration *</label>
                    <select
                      value={occasion}
                      onChange={(e) => setOccasion(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                    >
                      {OCCASIONS.map((occ) => (
                        <option key={occ} value={occ}>{occ}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Preferred Delivery Date *</label>
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={preferredDeliveryDate}
                      onChange={(e) => setPreferredDeliveryDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Specific Gift Item or Requested Arrangement</label>
                    <input
                      type="text"
                      placeholder="e.g. 24 Red Roses Bouquet with 16pc Ferrero Rocher & Red Ribbon"
                      value={preferredItem}
                      onChange={(e) => setPreferredItem(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Estimated Budget Amount</label>
                    <input
                      type="number"
                      min={5000}
                      step={1000}
                      value={budgetAmount}
                      onChange={(e) => setBudgetAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Budget Currency</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                    >
                      <option value="NGN">NGN (₦ - Nigerian Naira)</option>
                      <option value="USD">USD ($ - US Dollar)</option>
                      <option value="GBP">GBP (£ - British Pound)</option>
                      <option value="EUR">EUR (€ - Euro)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Personalized Message to Accompany Gift (Card Note)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Happy 30th Birthday to my favorite person in London! With all my love, Steve."
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Submitting Gift Order...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Submit Worldwide Gift Request</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 4: Order Confirmation */}
            {step === 4 && createdOrder && (
              <div className="space-y-5 text-center animate-in zoom-in-95">
                <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-xs">
                  <CheckCircle2 className="w-9 h-9 stroke-[2.2]" />
                </div>

                <div className="space-y-1">
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Order Ref: {createdOrder.reference}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900">Gift Request Submitted Successfully!</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Your request for <strong>{createdOrder.category}</strong> to <strong>{createdOrder.recipientName}</strong> in <strong>{createdOrder.destinationCountry}</strong> has been logged into the concierge queue.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
                  <h4 className="font-bold text-slate-900">What Happens Next?</h4>
                  <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[11px]">
                    <li>Our worldwide concierge confirms local inventory and fulfillment provider availability in <strong>{createdOrder.destinationCountry}</strong>.</li>
                    <li>You will receive a confirmed quotation and payment options on your dashboard.</li>
                    <li>Upon confirmation, the local partner arranges fresh florist / gift preparation.</li>
                    <li>Actual shipment tracking will be provided as soon as the gift is dispatched for delivery.</li>
                  </ol>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
                  <button
                    onClick={() => {
                      onClose();
                      if (onOpenTracking) onOpenTracking(createdOrder.reference);
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Truck className="w-4 h-4" />
                    <span>Track Order in Tracking Center</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('my_orders');
                      setStep(1);
                      fetchOrders();
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    View All My Gift Orders
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
