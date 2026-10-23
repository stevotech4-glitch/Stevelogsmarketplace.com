import React, { useState, useEffect } from 'react';
import { 
  X, 
  Globe, 
  Smartphone, 
  Copy, 
  Check, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  Terminal, 
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { USA_SERVICES } from '../../data/mockData';
import { VirtualNumberOrder, UsaServiceItem } from '../../types';

interface UsaNumbersModalProps {
  onClose: () => void;
  walletBalance: number;
  onDeductBalance: (amount: number, service: string, description: string) => boolean;
  servicesList?: UsaServiceItem[];
}

export const UsaNumbersModal: React.FC<UsaNumbersModalProps> = ({
  onClose,
  walletBalance,
  onDeductBalance,
  servicesList = USA_SERVICES,
}) => {
  const [selectedService, setSelectedService] = useState(servicesList[0] || USA_SERVICES[0]);
  const [areaCode, setAreaCode] = useState('Any (Fastest)');
  const [carrier, setCarrier] = useState('Any Carrier');
  const [activeOrder, setActiveOrder] = useState<VirtualNumberOrder | null>(null);
  const [countdown, setCountdown] = useState(600); // 10 minutes
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [viewTab, setViewTab] = useState<'buy' | 'api'>('buy');

  // Strict No-Fake-Data Policy: Do not fabricate OTP code arrivals or phone numbers
  useEffect(() => {
    let timer: any;
    if (activeOrder && activeOrder.status === 'Waiting for SMS') {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        clearInterval(timer);
      };
    }
  }, [activeOrder]);

  const handleBuyNumber = async () => {
    setError('');
    if (walletBalance < selectedService.price) {
      setError(`Insufficient wallet balance. You need ₦${selectedService.price.toLocaleString()} but have ₦${walletBalance.toLocaleString()}.`);
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch('/api/orders/usa-number', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: selectedService.id,
          serviceName: selectedService.name,
          price: selectedService.price,
          areaCode,
          carrier,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setIsProcessing(false);
        setError(data.message || 'Unable to load data. Please try again.');
        return;
      }

      const orderData = await res.json();
      const success = onDeductBalance(
        selectedService.price,
        'USA Numbers',
        `USA Number for ${selectedService.name}`
      );

      if (!success) {
        setIsProcessing(false);
        setError('Transaction could not be completed.');
        return;
      }

      setActiveOrder(orderData);
      setCountdown(orderData.expiresInSeconds || 600);
      setIsProcessing(false);
    } catch (e) {
      setIsProcessing(false);
      setError('Unable to load data. Please try again.');
    }
  };

  const handleCopy = (text: string, type: 'number' | 'code') => {
    navigator.clipboard.writeText(text);
    if (type === 'number') {
      setCopiedNumber(true);
      setTimeout(() => setCopiedNumber(false), 2000);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex justify-center p-3 sm:p-5">
      <div 
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-blue-100/80 text-blue-600 flex items-center justify-center">
              <Globe className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 font-sans">USA Virtual Numbers</h2>
              <p className="text-xs text-slate-500 font-sans">Instant SMS Verification & OTPs</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewTab(viewTab === 'buy' ? 'api' : 'buy')}
              className="px-2.5 py-1 text-xs font-mono font-semibold rounded-lg bg-slate-200/80 text-slate-700 hover:bg-slate-300 transition-colors"
            >
              {viewTab === 'buy' ? 'API Spec' : 'Console'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {viewTab === 'api' ? (
          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs font-mono">
            <div className="p-3 bg-slate-900 text-slate-100 rounded-xl space-y-2">
              <span className="text-emerald-400 font-bold">POST /api/v1/usa-numbers/order</span>
              <pre className="text-[11px] text-slate-300 overflow-x-auto leading-relaxed">
{`curl -X POST https://api.stevelogs.com/v1/usa-numbers/order \\
  -H "Authorization: Bearer YOUR_STEVELOGS_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "service": "${selectedService.id}",
    "area_code": "any"
  }'`}
              </pre>
            </div>
            <div className="p-3 bg-slate-900 text-slate-100 rounded-xl space-y-2">
              <span className="text-cyan-400 font-bold">GET /api/v1/usa-numbers/check-otp?order_id=ORD_123</span>
              <pre className="text-[11px] text-slate-300 overflow-x-auto leading-relaxed">
{`{
  "status": "success",
  "phone": "+14158902419",
  "sms_code": "491032",
  "message": "Your verification code is 491032"
}`}
              </pre>
            </div>
            <button
              onClick={() => setViewTab('buy')}
              className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs"
            >
              Back to Order Console
            </button>
          </div>
        ) : activeOrder ? (
          /* Live OTP Receiver View */
          <div className="p-6 space-y-5">
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 text-center space-y-2">
              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
                Assigned Phone Number ({activeOrder.serviceName})
              </span>
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl font-mono font-bold text-slate-900 tracking-wide">
                  {activeOrder.phoneNumber}
                </span>
                <button
                  onClick={() => handleCopy(activeOrder.phoneNumber, 'number')}
                  className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-blue-600 transition-colors shadow-sm"
                  title="Copy Phone Number"
                >
                  {copiedNumber ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-slate-500">
                Copy and enter this number into {activeOrder.serviceName} to trigger your OTP.
              </p>
            </div>

            {/* OTP Status Box */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Verification Code (OTP):</span>
                <div className="flex items-center gap-1.5 text-slate-500 font-mono">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Valid: {formatTime(countdown)}</span>
                </div>
              </div>

              {activeOrder.status === 'Waiting for SMS' ? (
                <div className="py-6 flex flex-col items-center justify-center space-y-3">
                  <div className="w-10 h-10 rounded-full border-3 border-blue-200 border-t-blue-600 animate-spin" />
                  <span className="text-sm font-semibold text-slate-700 animate-pulse">
                    Waiting for incoming SMS from {activeOrder.serviceName}...
                  </span>
                  <span className="text-xs text-slate-400">
                    Listening to US telecommunication gateway in real-time
                  </span>
                </div>
              ) : (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs text-emerald-700 font-semibold block">OTP Received!</span>
                      <span className="text-2xl font-mono font-extrabold text-emerald-950 tracking-wider">
                        {activeOrder.code}
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopy(activeOrder.code!, 'code')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold text-xs flex items-center gap-1 shadow-sm"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCode ? 'Copied' : 'Copy OTP'}</span>
                    </button>
                  </div>

                  {activeOrder.fullSms && (
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs font-mono text-slate-700">
                      <span className="text-slate-400 block text-[10px] uppercase">Original Carrier Message:</span>
                      {activeOrder.fullSms}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                onClick={() => setActiveOrder(null)}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors"
              >
                Order Another Number
              </button>
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition-colors shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Order Configuration Form */
          <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            {/* Service Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                1. Select Service / Application
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {servicesList.map((srv) => (
                  <button
                    key={srv.id}
                    onClick={() => setSelectedService(srv)}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      selectedService.id === srv.id
                        ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-blue-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">{srv.icon}</span>
                      <span className="text-xs font-semibold text-slate-800 truncate">{srv.name}</span>
                    </div>
                    <div className="mt-2 text-xs font-mono font-bold text-blue-600">
                      ₦{srv.price.toLocaleString()}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Area Code Filter */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Area Code Preference</label>
                <select
                  value={areaCode}
                  onChange={(e) => setAreaCode(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  <option value="Any (Fastest)">Any US Area (Fastest Activation)</option>
                  <option value="415 (San Francisco, CA)">415 (San Francisco, CA)</option>
                  <option value="212 (New York, NY)">212 (New York, NY)</option>
                  <option value="310 (Los Angeles, CA)">310 (Los Angeles, CA)</option>
                  <option value="305 (Miami, FL)">305 (Miami, FL)</option>
                  <option value="773 (Chicago, IL)">773 (Chicago, IL)</option>
                  <option value="512 (Austin, TX)">512 (Austin, TX)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Carrier Network</label>
                <select
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  <option value="Any Carrier">Any Tier-1 Carrier</option>
                  <option value="AT&T">AT&T Mobility</option>
                  <option value="Verizon">Verizon Wireless</option>
                  <option value="T-Mobile">T-Mobile USA</option>
                </select>
              </div>
            </div>

            {/* Price & Balance Summary */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500 block">Service Cost:</span>
                <span className="text-base font-bold text-slate-900 font-mono">
                  ₦{selectedService.price.toLocaleString()}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block">Your Balance:</span>
                <span className="font-mono font-semibold text-blue-600">
                  ₦{walletBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleBuyNumber}
              disabled={isProcessing}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm transition-all shadow-md active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Allocating Carrier Line...</span>
                </>
              ) : (
                <>
                  <span>Purchase & Receive SMS</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
