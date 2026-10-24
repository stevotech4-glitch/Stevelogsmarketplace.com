import React, { useEffect } from 'react';
import { CheckCircle2, X, Wallet, ArrowRight, Sparkles, Copy, Check } from 'lucide-react';
import { CustomerNotification } from '../types';

interface PaymentApprovedModalProps {
  notification: CustomerNotification | null;
  onClose: () => void;
  onOpenWallet?: () => void;
  onOpenMarketplace?: () => void;
}

export const PaymentApprovedModal: React.FC<PaymentApprovedModalProps> = ({
  notification,
  onClose,
  onOpenWallet,
  onOpenMarketplace,
}) => {
  const [copied, setCopied] = React.useState(false);

  // Play a gentle, pleasant success chime using the standard Web Audio API
  useEffect(() => {
    if (!notification) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Note 1: E5 (659.25 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.22);

      // Note 2: G#5 (830.61 Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(830.61, now + 0.12);
      gain2.gain.setValueAtTime(0.15, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.38);

      // Note 3: B5 (987.77 Hz)
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(987.77, now + 0.24);
      gain3.gain.setValueAtTime(0.18, now + 0.24);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.start(now + 0.24);
      osc3.stop(now + 0.65);
    } catch (e) {
      // Audio playback safely ignored if browser policy or device settings disallow autoplay
    }
  }, [notification?.id]);

  if (!notification) return null;

  const formattedAmount = typeof notification.amount === 'number'
    ? notification.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '0.00';

  const formattedBalance = typeof notification.newBalance === 'number'
    ? notification.newBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : null;

  const handleCopyRef = () => {
    if (notification.reference) {
      navigator.clipboard.writeText(notification.reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-emerald-100 flex flex-col text-slate-800 scale-100 transition-all"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-approved-title"
      >
        {/* Top Celebration Accent Bar */}
        <div className="h-2 w-full bg-gradient-to-r from-emerald-500 via-amber-400 to-blue-600"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer z-10"
          aria-label="Close notification"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-7 flex flex-col items-center text-center">
          {/* Animated Glow Icon */}
          <div className="relative mb-4">
            <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 animate-bounce duration-1000">
              <CheckCircle2 className="w-10 h-10 sm:w-11 sm:h-11 stroke-[2.2]" />
            </div>
            <div className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 p-1.5 rounded-full shadow-md animate-pulse">
              <Sparkles className="w-4 h-4 fill-slate-950" />
            </div>
          </div>

          {/* Heading */}
          <h2 id="payment-approved-title" className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-sans mb-2">
            Payment Approved!
          </h2>

          <p className="text-sm sm:text-base text-slate-600 font-medium mb-5 max-w-xs">
            Your manual deposit has been verified by administration.
          </p>

          {/* Amount and New Balance Highlights */}
          <div className="w-full bg-gradient-to-br from-emerald-50 to-blue-50/50 rounded-2xl p-4 sm:p-5 border border-emerald-100/80 mb-5 shadow-xs space-y-3">
            <div>
              <span className="text-[11px] font-bold tracking-wider text-emerald-700 uppercase">
                Credited Amount
              </span>
              <div className="text-3xl sm:text-4xl font-black text-emerald-600 font-mono tracking-tight mt-0.5">
                +₦{formattedAmount}
              </div>
            </div>

            {formattedBalance !== null && (
              <div className="pt-2.5 border-t border-emerald-200/60 flex items-center justify-between text-xs sm:text-sm">
                <span className="text-slate-600 font-medium flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-blue-600" />
                  Your new balance:
                </span>
                <span className="font-mono font-bold text-slate-900 text-base">
                  ₦{formattedBalance}
                </span>
              </div>
            )}
          </div>

          {/* Friendly Confirmation Banner */}
          <div className="w-full bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs text-slate-600 font-medium mb-5">
            Your funds are now available to use across all services and virtual numbers.
          </div>

          {/* Reference Info */}
          {notification.reference && (
            <div className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-100/70 border border-slate-200/60 text-[11px] font-mono text-slate-600 mb-6">
              <span className="text-slate-500">Ref: {notification.reference}</span>
              <button
                onClick={handleCopyRef}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-sans font-bold cursor-pointer"
                title="Copy reference"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="w-full flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={() => {
                onClose();
                if (onOpenMarketplace) onOpenMarketplace();
              }}
              className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <span>Buy Numbers & Services</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="py-3 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
