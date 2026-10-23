import React, { useState } from 'react';
import { X, Key, Calendar, Smartphone, Copy, Check, ShieldCheck, AlertCircle } from 'lucide-react';

interface RentNumberModalProps {
  onClose: () => void;
  walletBalance: number;
  onDeductBalance: (amount: number, service: string, description: string) => boolean;
}

const RENTAL_DURATIONS = [
  { days: 7, label: '7 Days Rental', price: 9500, desc: 'Ideal for project verification and trials' },
  { days: 30, label: '30 Days (1 Month)', price: 28000, desc: 'Dedicated line for business accounts & continuous 2FA' },
  { days: 90, label: '90 Days (Quarterly)', price: 72000, desc: 'Best value for permanent accounts & banking security' },
];

export const RentNumberModal: React.FC<RentNumberModalProps> = ({
  onClose,
  walletBalance,
  onDeductBalance,
}) => {
  const [selectedDuration, setSelectedDuration] = useState(RENTAL_DURATIONS[1]);
  const [country, setCountry] = useState('United States (+1)');
  const [activeRental, setActiveRental] = useState<{
    phone: string;
    expiresDate: string;
    status: string;
  } | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleRent = async () => {
    setError('');
    if (walletBalance < selectedDuration.price) {
      setError(`Insufficient balance. You need ₦${selectedDuration.price.toLocaleString()} but have ₦${walletBalance.toLocaleString()}.`);
      return;
    }

    try {
      const res = await fetch('/api/orders/rental-number', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          durationDays: selectedDuration.days,
          durationLabel: selectedDuration.label,
          country,
          price: selectedDuration.price,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || 'Unable to load data. Please try again.');
        return;
      }

      const orderData = await res.json();
      const success = onDeductBalance(
        selectedDuration.price,
        'Rent number',
        `${selectedDuration.label} Private Dedicated Line (${country})`
      );

      if (!success) {
        setError('Could not process rental.');
        return;
      }

      setActiveRental({
        phone: orderData.phoneNumber,
        expiresDate: orderData.expiresDate || 'Not available',
        status: orderData.status || 'Active',
      });
    } catch (e) {
      setError('Unable to load data. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex justify-center p-3 sm:p-5">
      <div 
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto border border-slate-100 max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <Key className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 font-sans">Rent Private Number</h2>
              <p className="text-xs text-slate-500 font-sans">Dedicated Long-Term Lines & Unlimited SMS</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {activeRental ? (
          <div className="p-6 space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
              <span className="text-xs font-semibold text-emerald-700">Dedicated Number Allocated</span>
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl font-mono font-bold text-slate-900">{activeRental.phone}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(activeRental.phone);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-emerald-800">
                Active until <strong>{activeRental.expiresDate}</strong>. Receive unlimited SMS from any service 24/7.
              </p>
            </div>

            <button
              onClick={() => setActiveRental(null)}
              className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs"
            >
              Rent Another Line
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-4 overflow-y-auto">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Country</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
              >
                <option value="United States (+1)">United States (+1)</option>
                <option value="United Kingdom (+44)">United Kingdom (+44)</option>
                <option value="Canada (+1)">Canada (+1)</option>
                <option value="Netherlands (+31)">Netherlands (+31)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Rental Period</label>
              <div className="space-y-2">
                {RENTAL_DURATIONS.map((dur) => (
                  <div
                    key={dur.days}
                    onClick={() => setSelectedDuration(dur)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      selectedDuration.days === dur.days
                        ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{dur.label}</h4>
                      <p className="text-[11px] text-slate-500">{dur.desc}</p>
                    </div>
                    <span className="font-mono font-bold text-xs text-blue-600 shrink-0 ml-2">
                      ₦{dur.price.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500">Rental Fee:</span>
                <span className="text-base font-bold text-slate-900 font-mono block">
                  ₦{selectedDuration.price.toLocaleString()}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-500">Wallet Balance:</span>
                <span className="font-mono font-semibold text-blue-600 block">
                  ₦{walletBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <button
              onClick={handleRent}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md cursor-pointer"
            >
              Rent Dedicated Line
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
