import React, { useState, useEffect } from 'react';
import { 
  X, 
  Award, 
  Users, 
  Copy, 
  Check, 
  DollarSign, 
  ArrowRight, 
  CheckCircle2, 
  Share2, 
  TrendingUp, 
  ShieldCheck, 
  AlertCircle, 
  Loader2,
  ExternalLink,
  MessageCircle,
  Send,
  Sparkles
} from 'lucide-react';
import { CustomerRecord, ReferralStats, ReferralTransaction } from '../../types';

interface PartnerProgramModalProps {
  onClose: () => void;
  walletBalance: number;
  customer?: CustomerRecord | null;
  onClaimCommission?: (amount: number) => void;
  onRefreshWallet?: () => void;
}

export const PartnerProgramModal: React.FC<PartnerProgramModalProps> = ({
  onClose,
  walletBalance,
  customer,
  onClaimCommission,
  onRefreshWallet,
}) => {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimSuccessMsg, setClaimSuccessMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'users'>('overview');

  // Customer ID fallback
  const effectiveCustomerId = customer?.id || 'CUST-1001';

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/referrals/stats?customerId=${encodeURIComponent(effectiveCustomerId)}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        throw new Error('Failed to load referral metrics.');
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching referral metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [effectiveCustomerId]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const referralCode = stats?.referralCode || customer?.referralCode || 'SL-STEVO1';
  const referralLink = stats?.referralLink || customer?.referralLink || `https://stevelogsmarketplace.com/?ref=${referralCode}`;
  const availableBalance = stats?.availableBalance ?? customer?.referralBalance ?? 0;
  const totalEarnings = stats?.totalEarnings ?? customer?.referralEarnings ?? 0;
  const totalReferrals = stats?.totalReferrals ?? customer?.totalReferrals ?? 0;
  const qualifiedReferrals = stats?.qualifiedReferrals ?? customer?.qualifiedReferrals ?? 0;
  const commissionPercent = stats?.commissionPercent || 10;
  const minWithdrawal = stats?.minWithdrawal || 1000;

  const handleWithdraw = async () => {
    if (availableBalance <= 0) return;
    if (availableBalance < minWithdrawal) {
      setError(`Minimum withdrawal threshold is ₦${minWithdrawal.toLocaleString()}. Current balance: ₦${availableBalance.toLocaleString()}.`);
      return;
    }

    setClaiming(true);
    setError(null);
    setClaimSuccessMsg(null);

    try {
      const res = await fetch('/api/referrals/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: effectiveCustomerId,
          amount: availableBalance,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Withdrawal failed.');
      }

      setClaimSuccessMsg(`₦${availableBalance.toLocaleString()} referral commission transferred successfully into your main balance!`);
      if (onClaimCommission) {
        onClaimCommission(availableBalance);
      }
      if (onRefreshWallet) {
        onRefreshWallet();
      }
      fetchStats();
    } catch (err: any) {
      setError(err.message || 'Error withdrawing commission.');
    } finally {
      setClaiming(false);
    }
  };

  const shareText = `Get instant USA phone numbers, verified log accounts & digital services on Steve Logs Marketplace! Register with my referral link: ${referralLink}`;
  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Get instant USA phone numbers & verified logs on Steve Logs Marketplace!')}`;
  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;

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
            <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
              <Award className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 font-sans">Refer & Earn Dashboard</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  {commissionPercent}% Lifetime Commission
                </span>
              </div>
              <p className="text-xs text-slate-500 font-sans">Share your link and earn real commission on every qualifying order</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
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

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 px-6 pt-3 gap-4 bg-slate-50/40 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Overview & Link
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-2.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Commission History ({stats?.transactions?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-2.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'users'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Referred Customers ({stats?.referredUsers?.length || 0})
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {claimSuccessMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{claimSuccessMsg}</span>
            </div>
          )}

          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
              <p className="text-xs">Loading your referral account...</p>
            </div>
          ) : activeTab === 'overview' ? (
            <>
              {/* Earnings Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Referrals</span>
                  <span className="text-xl font-bold text-slate-900 font-mono mt-0.5 block">{totalReferrals}</span>
                  <span className="text-[10px] text-slate-400">Registered users</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Qualified</span>
                  <span className="text-xl font-bold text-slate-900 font-mono mt-0.5 block">{qualifiedReferrals}</span>
                  <span className="text-[10px] text-slate-400">With paid orders</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Earned</span>
                  <span className="text-xl font-bold text-slate-900 font-mono mt-0.5 block">₦{totalEarnings.toLocaleString()}</span>
                  <span className="text-[10px] text-emerald-600 font-semibold">All-time earned</span>
                </div>
                <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200">
                  <span className="text-[10px] text-amber-800 uppercase font-bold block">Available Balance</span>
                  <span className="text-xl font-bold text-amber-900 font-mono mt-0.5 block">₦{availableBalance.toLocaleString()}</span>
                  <span className="text-[10px] text-amber-700 font-semibold">Ready to claim</span>
                </div>
              </div>

              {/* Unique Referral Link & Code Box */}
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-900 uppercase">Your Unique Referral Link</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 font-mono">Code:</span>
                    <span className="px-2 py-0.5 rounded-lg bg-blue-100 text-blue-800 font-mono font-bold text-xs">
                      {referralCode}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(referralCode);
                        setCopiedCode(true);
                        setTimeout(() => setCopiedCode(false), 2000);
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                      title="Copy referral code"
                    >
                      {copiedCode ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={referralLink}
                    className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-xl text-slate-800 select-all"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(referralLink);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shrink-0 flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                  </button>
                </div>

                {/* Social Share Buttons */}
                <div className="pt-2 border-t border-blue-100 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-600 mr-1">Share via:</span>
                  <a
                    href={whatsappShareUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp</span>
                  </a>
                  <a
                    href={telegramShareUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-semibold transition-colors"
                  >
                    <Send className="w-3.5 h-3.5 text-sky-600" />
                    <span>Telegram</span>
                  </a>
                  <a
                    href={twitterShareUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-semibold transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5 text-slate-700" />
                    <span>Twitter / X</span>
                  </a>
                </div>
              </div>

              {/* Withdraw Button */}
              {availableBalance > 0 && (
                <button
                  onClick={handleWithdraw}
                  disabled={claiming || availableBalance < minWithdrawal}
                  className={`w-full py-3 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    availableBalance >= minWithdrawal
                      ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {claiming ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Transferring to Main Balance...</span>
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4" />
                      <span>
                        {availableBalance >= minWithdrawal
                          ? `Withdraw ₦${availableBalance.toLocaleString()} to Main Wallet Balance`
                          : `Minimum ₦${minWithdrawal.toLocaleString()} required to withdraw (Currently ₦${availableBalance.toLocaleString()})`}
                      </span>
                    </>
                  )}
                </button>
              )}

              {/* Rules and Explanation */}
              <div className="p-4 rounded-2xl border border-slate-200 text-xs space-y-2 text-slate-600 bg-slate-50/50">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>How the Referral & Earn System Works</span>
                </h4>
                <ul className="space-y-1.5 text-[11px] list-disc list-inside">
                  <li><strong>Unique Referral Link:</strong> Every registered customer is assigned a permanent, unique referral code and tracking link.</li>
                  <li><strong>Instant Automated Commission:</strong> Whenever your referred customer places an accepted order (USA Numbers, Log Accounts, Boost, Proxies), {commissionPercent}% commission is automatically credited to your referral balance.</li>
                  <li><strong>Anti-Fraud & Fair Play:</strong> Self-referrals and duplicate commissions on the same order are strictly prevented by the ledger engine.</li>
                  <li><strong>Direct Usability:</strong> Claim your earnings directly to your main wallet balance to use for instant orders or withdraw.</li>
                </ul>
              </div>
            </>
          ) : activeTab === 'history' ? (
            /* Commission Transactions History */
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase">Referral Transaction Ledger</h3>
              {(!stats?.transactions || stats.transactions.length === 0) ? (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400">
                  <Award className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700">No Commission Transactions Yet</p>
                  <p className="text-xs text-slate-400 mt-1">When friends or clients order through your link, your commission credits will appear here.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                  {stats.transactions.map((tx: ReferralTransaction) => (
                    <div key={tx.id} className="p-3.5 bg-white flex items-center justify-between text-xs hover:bg-slate-50/80 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{tx.referredCustomerName}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            tx.type === 'withdrawal'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {tx.type === 'withdrawal' ? 'Withdrawn to Wallet' : 'Commission Credited'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">{tx.notes || `Order ${tx.orderId || ''}`}</p>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(tx.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className={`font-mono font-bold text-sm block ${
                          tx.type === 'withdrawal' ? 'text-amber-700' : 'text-emerald-600'
                        }`}>
                          {tx.type === 'withdrawal' ? '-' : '+'}₦{tx.commissionEarned.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{tx.id}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Referred Users List */
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase">Customers Registered Under You</h3>
              {(!stats?.referredUsers || stats.referredUsers.length === 0) ? (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400">
                  <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700">No Referred Customers Yet</p>
                  <p className="text-xs text-slate-400 mt-1">Share your link to invite colleagues and earn commissions on their orders.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                  {stats.referredUsers.map((u) => (
                    <div key={u.id} className="p-3.5 bg-white flex items-center justify-between text-xs hover:bg-slate-50/80 transition-colors">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{u.name}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            u.qualified ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {u.qualified ? 'Qualified (Active Buyer)' : 'Registered (No Orders Yet)'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Joined: {new Date(u.joinedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-900 font-mono block">
                          {u.ordersCount} {u.ordersCount === 1 ? 'Order' : 'Orders'}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Total Spent: ₦{u.totalSpent.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
