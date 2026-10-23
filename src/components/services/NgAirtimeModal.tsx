import React, { useState } from 'react';
import { X, Radio, PhoneCall, AlertCircle, CheckCircle2, Zap } from 'lucide-react';

interface NgAirtimeModalProps {
  onClose: () => void;
  walletBalance: number;
  onDeductBalance: (amount: number, service: string, description: string) => boolean;
}

const NETWORKS = [
  { id: 'mtn', name: 'MTN Nigeria', discount: 0.03, color: 'bg-yellow-400 text-slate-900' },
  { id: 'airtel', name: 'Airtel Nigeria', discount: 0.025, color: 'bg-red-600 text-white' },
  { id: 'glo', name: 'Glo (Globacom)', discount: 0.035, color: 'bg-emerald-600 text-white' },
  { id: '9mobile', name: '9mobile', discount: 0.03, color: 'bg-lime-600 text-white' },
];

export const NgAirtimeModal: React.FC<NgAirtimeModalProps> = ({
  onClose,
  walletBalance,
  onDeductBalance,
}) => {
  const [selectedNet, setSelectedNet] = useState(NETWORKS[0]);
  const [phone, setPhone] = useState('08149021844');
  const [amount, setAmount] = useState('2000');
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const numAmount = Number(amount) || 0;
  const discountedAmount = Math.round(numAmount * (1 - selectedNet.discount));
  const savings = numAmount - discountedAmount;

  const handleTopup = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (numAmount < 100) {
      setError('Minimum airtime top-up is ₦100.');
      return;
    }
    if (phone.length < 11) {
      setError('Please provide a valid 11-digit Nigerian phone number.');
      return;
    }
    if (walletBalance < discountedAmount) {
      setError(`Insufficient balance. You need ₦${discountedAmount.toLocaleString()} but have ₦${walletBalance.toLocaleString()}.`);
      return;
    }

    const success = onDeductBalance(
      discountedAmount,
      'NG airtime',
      `₦${numAmount.toLocaleString()} Airtime to ${phone} (${selectedNet.name})`
    );

    if (success) {
      setIsSuccess(true);
    } else {
      setError('Top-up could not be processed.');
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
              <Radio className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 font-sans">NG Airtime & Data Recharge</h2>
              <p className="text-xs text-slate-500 font-sans">Instant VTU Top-Up with Cashback</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Recharge Successful!</h3>
            <p className="text-xs text-slate-500">
              ₦{numAmount.toLocaleString()} airtime has been delivered instantly to {phone} ({selectedNet.name}).
            </p>
            <button
              onClick={() => setIsSuccess(false)}
              className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs"
            >
              Recharge Another Number
            </button>
          </div>
        ) : (
          <form onSubmit={handleTopup} className="p-6 space-y-4 overflow-y-auto">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Select Network</label>
              <div className="grid grid-cols-2 gap-2">
                {NETWORKS.map((net) => (
                  <button
                    type="button"
                    key={net.id}
                    onClick={() => setSelectedNet(net)}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs font-semibold cursor-pointer transition-all ${
                      selectedNet.id === net.id
                        ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20 text-slate-900'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{net.name}</span>
                    <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-mono">
                      {(net.discount * 100).toFixed(1)}% OFF
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone Number</label>
              <input
                type="tel"
                required
                maxLength={11}
                placeholder="080XXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Amount (₦)</label>
              <input
                type="number"
                required
                min={100}
                placeholder="2000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono text-base font-bold"
              />
              <div className="flex gap-2 mt-2">
                {[500, 1000, 2000, 5000].map((v) => (
                  <button
                    type="button"
                    key={v}
                    onClick={() => setAmount(v.toString())}
                    className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono"
                  >
                    ₦{v.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500">You Pay:</span>
                <span className="text-base font-bold text-emerald-600 font-mono block">
                  ₦{discountedAmount.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400">Saved ₦{savings.toLocaleString()}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500">Wallet Balance:</span>
                <span className="font-mono font-semibold text-blue-600 block">
                  ₦{walletBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md cursor-pointer"
            >
              Recharge Airtime Now
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
