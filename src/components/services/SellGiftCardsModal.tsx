import React, { useState } from 'react';
import { X, CreditCard, AlertCircle, CheckCircle2, Upload, DollarSign } from 'lucide-react';
import { GIFT_CARD_RATES } from '../../data/mockData';
import { GiftCardRate } from '../../types';

interface SellGiftCardsModalProps {
  onClose: () => void;
  onCreditWallet: (amount: number, description: string) => void;
  rates?: GiftCardRate[];
}

export const SellGiftCardsModal: React.FC<SellGiftCardsModalProps> = ({
  onClose,
  onCreditWallet,
  rates = GIFT_CARD_RATES,
}) => {
  const [selectedCard, setSelectedCard] = useState(rates[0] || GIFT_CARD_RATES[0]);
  const [dollarValue, setDollarValue] = useState(100);
  const [cardCode, setCardCode] = useState('');
  const [payoutDestination, setPayoutDestination] = useState<'wallet' | 'bank'>('wallet');
  const [bankDetails, setBankDetails] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const payoutNaira = dollarValue * selectedCard.ratePerDollar;

  const handleSell = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!cardCode.trim()) {
      setError('Please provide the gift card claim code or PIN.');
      return;
    }
    if (dollarValue <= 0) {
      setError('Please enter a valid dollar amount.');
      return;
    }

    if (payoutDestination === 'wallet') {
      onCreditWallet(
        payoutNaira,
        `Sold $${dollarValue} ${selectedCard.brand} Gift Card (Rate: ₦${selectedCard.ratePerDollar}/$)`
      );
    }
    setIsSuccess(true);
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
              <CreditCard className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 font-sans">Sell Gift Cards</h2>
              <p className="text-xs text-slate-500 font-sans">Instant Cash & High Exchange Rates</p>
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
            <h3 className="text-lg font-bold text-slate-900">Trade Accepted!</h3>
            <p className="text-xs text-slate-500">
              ₦{payoutNaira.toLocaleString()} has been credited to your {payoutDestination === 'wallet' ? 'Stevelogs wallet' : 'bank account'}!
            </p>
            <button
              onClick={() => {
                setIsSuccess(false);
                setCardCode('');
              }}
              className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs"
            >
              Sell Another Card
            </button>
          </div>
        ) : (
          <form onSubmit={handleSell} className="p-6 space-y-4 overflow-y-auto">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Select Card Type</label>
              <select
                value={selectedCard.id}
                onChange={(e) => {
                  const c = GIFT_CARD_RATES.find((x) => x.id === e.target.value);
                  if (c) setSelectedCard(c);
                }}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
              >
                {rates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.brand} ({c.country}) — Rate: ₦{c.ratePerDollar}/$
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Face Value (USD $)</label>
              <input
                type="number"
                required
                min={10}
                placeholder="100"
                value={dollarValue}
                onChange={(e) => setDollarValue(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono font-bold text-base"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">E-Code / Card Claim Code</label>
              <input
                type="text"
                required
                placeholder="Enter claim code or PIN..."
                value={cardCode}
                onChange={(e) => setCardCode(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono"
              />
            </div>

            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-emerald-700 block">Instant Payout (₦):</span>
                <span className="text-2xl font-bold text-emerald-950 font-mono block">
                  ₦{payoutNaira.toLocaleString()}
                </span>
              </div>
              <div className="text-right text-[11px] text-emerald-700 font-mono">
                Rate: ₦{selectedCard.ratePerDollar} per $1
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md cursor-pointer"
            >
              Exchange Card for ₦{payoutNaira.toLocaleString()}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
