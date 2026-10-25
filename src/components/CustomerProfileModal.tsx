import React, { useState } from 'react';
import { 
  X, 
  User, 
  Wallet, 
  Shield, 
  Clock, 
  Sparkles, 
  Copy, 
  Check, 
  MessageCircle, 
  Send, 
  Building2, 
  Lock,
  ArrowRight,
  Award,
  LogOut,
  KeyRound,
  Loader2,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { UserWallet, Transaction, WebsiteMasterSettings, InterestProgramConfig, CustomerRecord } from '../types';

interface CustomerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: UserWallet;
  transactions: Transaction[];
  settings: WebsiteMasterSettings;
  interestProgram: InterestProgramConfig;
  onOpenFundWallet: () => void;
  customer?: CustomerRecord | null;
  onLogout?: () => void;
  onOpenAuth?: () => void;
}

export const CustomerProfileModal: React.FC<CustomerProfileModalProps> = ({
  isOpen,
  onClose,
  wallet,
  transactions,
  settings,
  interestProgram,
  onOpenFundWallet,
  customer,
  onLogout,
  onOpenAuth,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'deposits' | 'rewards' | 'security'>('profile');
  const [copiedBank, setCopiedBank] = useState(false);

  // Change password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPass, setChangingPass] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const deposits = transactions.filter((t) => t.type === 'credit');
  const initials = customer?.name ? customer.name.slice(0, 2).toUpperCase() : 'ST';

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);

    if (!currentPassword) {
      setPassError('Please enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      setPassError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError('Passwords do not match.');
      return;
    }

    setChangingPass(true);
    try {
      const token = localStorage.getItem('stevelogs_customer_token');
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update password.');
      }
      setPassSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPassError(err.message || 'Error changing password.');
    } finally {
      setChangingPass(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex justify-center p-3 sm:p-5">
      <div 
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto border border-slate-100 max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#1e293b] text-white flex items-center justify-center shadow-md font-bold text-base">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">{customer?.name || 'Customer Account'}</h3>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold uppercase">
                  {customer?.tier || 'VIP Reseller'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                {customer ? `ID: ${customer.id} • ${customer.email}` : 'Guest Session • Sign in to sync orders'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-200 bg-white px-6">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'profile'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('deposits')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'deposits'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Deposit History ({deposits.length})
          </button>
          {interestProgram.enabled && (
            <button
              onClick={() => setActiveTab('rewards')}
              className={`py-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'rewards'
                  ? 'border-amber-500 text-amber-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Earnings Yield ({interestProgram.annualRatePercent}%)</span>
            </button>
          )}
          <button
            onClick={() => setActiveTab('security')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'security'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Security & Support
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'profile' && (
            <div className="space-y-4">
              {/* Balance Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-900 text-white shadow-md flex items-center justify-between">
                <div>
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-blue-200 block">
                    Available Wallet Balance
                  </span>
                  <div className="text-2xl font-black font-mono mt-0.5">
                    ₦{wallet.balance.toLocaleString()}
                  </div>
                  <span className="text-xs text-blue-300 mt-1 block">
                    Bonus Credit: ₦{wallet.bonus.toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onOpenFundWallet();
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs shadow-md transition-transform active:scale-95"
                >
                  Fund Wallet
                </button>
              </div>

              {/* Dedicated Bank Details */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-slate-500" />
                    Dedicated Virtual Funding Account
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    Official Flutterwave API
                  </span>
                </div>

                {customer?.virtualAccount?.accountNumber || (wallet.accountNumber && wallet.accountNumber.trim() !== '') ? (
                  <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-[11px] text-slate-500 block">
                        {customer?.virtualAccount?.bankName || wallet.bankName || 'Wema Bank'}
                      </span>
                      <span className="text-sm font-mono font-bold text-slate-900">
                        {customer?.virtualAccount?.accountNumber || wallet.accountNumber}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {customer?.virtualAccount?.accountName || wallet.accountName || customer?.name}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        const acc = customer?.virtualAccount?.accountNumber || wallet.accountNumber;
                        navigator.clipboard.writeText(acc);
                        setCopiedBank(true);
                        setTimeout(() => setCopiedBank(false), 2000);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedBank ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedBank ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Not Yet Generated</span>
                      <span className="text-[10px] text-slate-500">Generate your dedicated Naira account to fund via bank transfer</span>
                    </div>
                    <button
                      onClick={() => {
                        onClose();
                        onOpenFundWallet();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-xs cursor-pointer"
                    >
                      Generate Account
                    </button>
                  </div>
                )}
              </div>

              {/* Account Details List */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white border border-slate-200">
                  <span className="text-slate-400 block font-semibold">Account Status</span>
                  <span className="text-emerald-700 font-bold mt-0.5 block">Active & Verified</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200">
                  <span className="text-slate-400 block font-semibold">Pricing Tier</span>
                  <span className="text-blue-700 font-bold mt-0.5 block">VIP Reseller (Lowest Fees)</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'deposits' && (
            <div className="space-y-3">
              {deposits.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No deposits recorded yet.
                </div>
              ) : (
                deposits.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 block">{tx.description}</span>
                      <span className="text-[10px] text-slate-400 font-mono">Ref: {tx.reference} • {tx.date}</span>
                    </div>
                    <span className="font-mono font-bold text-emerald-600 text-sm">
                      +₦{tx.amount.toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'rewards' && interestProgram.enabled && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 space-y-2">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-600" />
                  <h4 className="text-sm font-bold">{interestProgram.programName}</h4>
                </div>
                <p className="text-xs text-amber-800">
                  Current annual reward yield: <strong>{interestProgram.annualRatePercent}% APY</strong> ({interestProgram.calculationFrequency} accrual).
                </p>
                <div className="pt-2 border-t border-amber-200/60 text-[11px] text-amber-900 font-mono">
                  Min qualifying balance: ₦{interestProgram.minEligibleBalance.toLocaleString()}
                </div>
              </div>
              <p className="text-[11px] text-slate-500 italic">
                {interestProgram.disclaimer}
              </p>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-600" />
                    Authentication & Session Status
                  </h4>
                  {customer && onLogout && (
                    <button
                      onClick={() => {
                        onClose();
                        onLogout();
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold border border-rose-200 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>Sign Out</span>
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-600">
                  {customer ? (
                    <>
                      Signed in as <strong>{customer.email}</strong> ({customer.name}). Session is protected with 72-hour rolling inactivity persistence.
                    </>
                  ) : (
                    <>
                      Currently browsing as Guest. Sign in to synchronize your orders and wallet transactions.
                    </>
                  )}
                </p>
                {!customer && onOpenAuth && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenAuth();
                    }}
                    className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    <span>Sign In to Account</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Change Password Form (if logged in) */}
              {customer && (
                <form onSubmit={handleChangePassword} className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
                  <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                    <span>Change Account Password</span>
                  </h5>

                  {passError && (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{passError}</span>
                    </div>
                  )}

                  {passSuccess && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{passSuccess}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="password"
                      placeholder="Current Password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-hidden"
                      required
                    />
                    <input
                      type="password"
                      placeholder="New Password (min 6)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-hidden"
                      required
                    />
                    <input
                      type="password"
                      placeholder="Confirm New Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-hidden"
                      required
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={changingPass}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {changingPass ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Updating...</span>
                        </>
                      ) : (
                        <span>Update Password</span>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* Direct WhatsApp Channel & Support Quick Access */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                {settings.whatsappSupportEnabled && (
                  <a
                    href={`https://wa.me/${settings.whatsappSupportNumber.replace(/\D/g, '')}?text=${encodeURIComponent(
                      settings.whatsappWelcomeMessage
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-2 hover:bg-emerald-100"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="text-xs font-bold block">{settings.whatsappSupportLabel}</span>
                      <span className="text-[10px] text-emerald-700">Official Direct Desk</span>
                    </div>
                  </a>
                )}

                {settings.whatsappChannelEnabled && (
                  <a
                    href={settings.whatsappChannelUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex items-center gap-2 hover:bg-blue-100"
                  >
                    <Send className="w-4 h-4 text-blue-600 shrink-0" />
                    <div>
                      <span className="text-xs font-bold block">{settings.whatsappChannelLabel}</span>
                      <span className="text-[10px] text-blue-700">VIP Channel</span>
                    </div>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
