import React, { useState, useEffect, useRef } from 'react';
import { Lock, X, KeyRound, AlertCircle, ShieldCheck, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';

interface AdminPasscodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isFullScreen?: boolean;
}

export const AdminPasscodeModal: React.FC<AdminPasscodeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  isFullScreen = false,
}) => {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPasscode('');
      setError(false);
      setErrorMessage('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleVerify = async (codeToTest = passcode) => {
    if (!codeToTest || codeToTest.length < 4) {
      setError(true);
      setErrorMessage('Please enter the administrative passcode.');
      return;
    }

    setLoading(true);
    setError(false);
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth/admin-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: codeToTest }),
      });

      const data = await res.json();
      if (res.ok && data.authorized && data.adminToken) {
        sessionStorage.setItem('stevelogs_admin_token', data.adminToken);
        sessionStorage.setItem('stevelogs_admin_unlocked', 'true');
        setError(false);
        onSuccess();
      } else {
        setError(true);
        setErrorMessage(data.error || 'Incorrect passcode. Access denied.');
        setPasscode('');
        inputRef.current?.focus();
      }
    } catch {
      setError(true);
      setErrorMessage('Server connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  const handleDigitClick = (digit: string) => {
    if (loading) return;
    if (passcode.length < 8) {
      const nextCode = passcode + digit;
      setPasscode(nextCode);
      if (nextCode.length === 6) {
        handleVerify(nextCode);
      }
    }
  };

  const handleDeleteDigit = () => {
    if (loading) return;
    setPasscode((prev) => prev.slice(0, -1));
    setError(false);
    setErrorMessage('');
  };

  const cardContent = (
    <div 
      className={`relative w-full max-w-sm sm:max-w-md bg-slate-900 border ${
        error ? 'border-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.35)]' : 'border-slate-800 shadow-2xl'
      } rounded-3xl p-6 sm:p-8 text-center space-y-5 text-slate-100 transition-all`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Close / Return Button */}
      {!isFullScreen ? (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      ) : (
        <button
          onClick={onClose}
          className="absolute top-4 left-4 flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white hover:bg-slate-800/80 px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Customer Dashboard</span>
        </button>
      )}

      {/* Security Shield Icon */}
      <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-inner">
        <Lock className="w-7 h-7 stroke-[2]" />
      </div>

      <div className="space-y-1">
        <h3 className="text-xl font-bold tracking-tight text-white font-sans">
          Administrator Gateway
        </h3>
        <p className="text-xs text-slate-400 max-w-xs mx-auto">
          Enter authorized administrative passcode to unlock management controls and server configurations.
        </p>
      </div>

      {/* Hidden real input for accessibility & keyboard typing */}
      <input
        ref={inputRef}
        type="password"
        maxLength={8}
        value={passcode}
        onChange={(e) => {
          const val = e.target.value.replace(/\D/g, '');
          setPasscode(val);
          if (val.length === 6) {
            handleVerify(val);
          }
        }}
        onKeyDown={handleKeyDown}
        className="opacity-0 absolute -z-10"
        autoFocus
      />

      {/* Visual PIN Dots */}
      <div 
        onClick={() => inputRef.current?.focus()}
        className="flex justify-center items-center gap-3 py-2 cursor-pointer select-none"
      >
        {[0, 1, 2, 3, 4, 5].map((idx) => {
          const isFilled = idx < passcode.length;
          return (
            <div
              key={idx}
              className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                isFilled
                  ? 'bg-blue-500 scale-125 shadow-[0_0_12px_rgba(59,130,246,0.8)]'
                  : 'bg-slate-800 border border-slate-700'
              }`}
            />
          );
        })}
      </div>

      {/* Error / Status message */}
      {error && (
        <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center justify-center gap-1.5 animate-shake">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Numeric Keypad for Touch & Quick Access */}
      <div className="grid grid-cols-3 gap-2 sm:gap-2.5 max-w-[260px] mx-auto pt-2">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <button
            key={digit}
            type="button"
            disabled={loading}
            onClick={() => handleDigitClick(digit)}
            className="h-11 sm:h-12 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 active:bg-blue-600/30 border border-slate-700/60 font-mono text-lg font-bold text-slate-100 transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
          >
            {digit}
          </button>
        ))}
        <button
          type="button"
          disabled={loading}
          onClick={handleDeleteDigit}
          className="h-11 sm:h-12 rounded-2xl bg-slate-800/40 hover:bg-slate-800 active:bg-slate-700 border border-slate-700/40 text-xs font-semibold text-slate-400 transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
        >
          Clear
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => handleDigitClick('0')}
          className="h-11 sm:h-12 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 active:bg-blue-600/30 border border-slate-700/60 font-mono text-lg font-bold text-slate-100 transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
        >
          0
        </button>
        <button
          type="button"
          disabled={loading || passcode.length < 4}
          onClick={() => handleVerify()}
          className="h-11 sm:h-12 rounded-2xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 border border-blue-500 text-white font-semibold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-blue-600/20"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ArrowRight className="w-4 h-4" />
          )}
        </button>
      </div>

      <div className="pt-2 text-[11px] text-slate-400 font-sans border-t border-slate-800/80">
        <p className="flex items-center justify-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span>PBKDF2 Salted Hashing & Brute-Force Rate Limiting Active</span>
        </p>
      </div>
    </div>
  );

  if (isFullScreen) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
        {cardContent}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex justify-center items-center p-4">
      {cardContent}
    </div>
  );
};
