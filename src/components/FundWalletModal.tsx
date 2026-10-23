import React, { useState, useEffect } from 'react';
import {
  X,
  Wallet,
  Copy,
  Check,
  CheckCircle2,
  Building2,
  CreditCard,
  ShieldCheck,
  Zap,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Clock,
  History,
  Lock,
  Smartphone
} from 'lucide-react';
import { UserWallet, CustomerRecord, PaymentRecord } from '../types';

interface FundWalletModalProps {
  wallet: UserWallet;
  customer?: CustomerRecord | null;
  onClose: () => void;
  onAddFunds: (amount: number) => void;
}

export const FundWalletModal: React.FC<FundWalletModalProps> = ({
  wallet,
  customer,
  onClose,
  onAddFunds,
}) => {
  const [activeTab, setActiveTab] = useState<'gateway' | 'history' | 'manual'>('gateway');
  const [amount, setAmount] = useState<number>(5000);
  const [customInput, setCustomInput] = useState<string>('5000');
  const [email, setEmail] = useState<string>(customer?.email || 'customer@stevelogs.com');
  const [phone, setPhone] = useState<string>(customer?.phone || '08012345678');
  const [name, setName] = useState<string>(customer?.name || 'Stevelogs Customer');

  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTxRef, setActiveTxRef] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);
  const [copiedAcc, setCopiedAcc] = useState(false);

  // Virtual Account state
  const [virtualAccount, setVirtualAccount] = useState(customer?.virtualAccount || null);
  const [generatingVA, setGeneratingVA] = useState(false);
  const [bvnOrNin, setBvnOrNin] = useState('');
  const [idType, setIdType] = useState<'bvn' | 'nin'>('bvn');
  const [vaError, setVaError] = useState<string | null>(null);
  const [vaSuccess, setVaSuccess] = useState<string | null>(null);

  // History state
  const [historyLoading, setHistoryLoading] = useState(false);
  const [paymentsHistory, setPaymentsHistory] = useState<PaymentRecord[]>([]);
  const [historyTab, setHistoryTab] = useState<'all' | 'successful' | 'pending' | 'failed'>('all');

  const handleGenerateVirtualAccount = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setGeneratingVA(true);
    setVaError(null);
    setVaSuccess(null);

    const cleanId = bvnOrNin.trim();
    if (!cleanId || cleanId.length !== 11 || !/^\d+$/.test(cleanId)) {
      setVaError(`Please enter a valid 11-digit ${idType.toUpperCase()} number.`);
      setGeneratingVA(false);
      return;
    }

    try {
      const res = await fetch('/api/payments/virtual-account/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-customer-id': customer?.id || '',
        },
        body: JSON.stringify({
          customerId: customer?.id || 'CUST-1001',
          bvn: idType === 'bvn' ? cleanId : undefined,
          nin: idType === 'nin' ? cleanId : undefined,
          phone: phone || customer?.phone,
          name: name || customer?.name,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.virtualAccount) {
        setVirtualAccount(data.virtualAccount);
        setVaSuccess('Official Flutterwave dedicated virtual account generated successfully!');
      } else {
        setVaError(data.error || 'Failed to generate dedicated virtual account.');
      }
    } catch (err: any) {
      setVaError(err.message || 'Network error communicating with server.');
    } finally {
      setGeneratingVA(false);
    }
  };

  const quickAmounts = [1000, 2000, 5000, 10000, 20000, 50000];

  const handleSelectQuickAmount = (val: number) => {
    setAmount(val);
    setCustomInput(String(val));
    setErrorMessage(null);
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setCustomInput(raw);
    const num = Number(raw);
    if (!isNaN(num) && num > 0) {
      setAmount(num);
    }
    setErrorMessage(null);
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const customerId = customer?.id || '';
      const headers: Record<string, string> = {};
      if (customerId) headers['x-customer-id'] = customerId;

      const res = await fetch(`/api/payments/history?customerId=${encodeURIComponent(customerId)}`, {
        headers,
      });
      const data = await res.json();
      if (data.payments) {
        setPaymentsHistory(data.payments);
      }
    } catch (err: any) {
      console.error('Failed to load payment history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab]);

  // Initiate Flutterwave Payment
  const handleInitiatePayment = async () => {
    if (amount < 500) {
      setErrorMessage('Minimum deposit amount is ₦500.');
      return;
    }
    if (amount > 5000000) {
      setErrorMessage('Maximum single deposit amount is ₦5,000,000.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/payments/flutterwave/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-customer-id': customer?.id || '',
        },
        body: JSON.stringify({
          amount,
          customerId: customer?.id || 'CUST-1001',
          customerEmail: email,
          customerName: name,
          customerPhone: phone,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.paymentUrl) {
        setActiveTxRef(data.txRef);
        setPaymentUrl(data.paymentUrl);

        // Open Flutterwave checkout in a popup or new tab
        const popup = window.open(data.paymentUrl, '_blank');
        if (!popup || popup.closed || typeof popup.closed === 'undefined') {
          // If popup blocked, redirect directly
          window.location.href = data.paymentUrl;
        }
      } else {
        setErrorMessage(data.error || 'Failed to initialize payment with Flutterwave.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error while connecting to payment service.');
    } finally {
      setLoading(false);
    }
  };

  // Check / Poll Payment Status
  const handleVerifyStatus = async () => {
    if (!activeTxRef) return;
    setVerifying(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/payments/verify/${encodeURIComponent(activeTxRef)}`);
      const data = await res.json();

      if (res.ok && data.success && data.payment) {
        if (data.payment.status === 'successful') {
          setSuccessMessage(`Payment confirmed! ₦${data.payment.amount.toLocaleString()} has been credited to your wallet.`);
          onAddFunds(data.payment.amount);
          setActiveTxRef(null);
          setPaymentUrl(null);
        } else if (data.payment.status === 'failed') {
          setErrorMessage(data.payment.failureReason || 'Payment failed or was declined by bank.');
        } else {
          setErrorMessage('Payment is still pending. If you just completed the transfer or card OTP, please wait a few seconds and try again.');
        }
      } else {
        setErrorMessage(data.error || 'Unable to verify payment status.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error checking payment status.');
    } finally {
      setVerifying(false);
    }
  };

  const filteredHistory = paymentsHistory.filter((p) => {
    if (historyTab === 'all') return true;
    return p.status === historyTab;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex justify-center p-3 sm:p-5">
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto border border-slate-100 max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Stevelogs Yellow and Blue Branding */}
        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight text-white">Fund Stevelogs Wallet</h2>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                  INSTANT
                </span>
              </div>
              <p className="text-xs text-blue-200">
                Current Balance: <span className="font-mono font-bold text-amber-300">₦{wallet.balance.toLocaleString()}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50 text-xs font-bold text-slate-600 px-4 pt-2">
          <button
            onClick={() => setActiveTab('gateway')}
            className={`px-4 py-2.5 border-b-2 font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'gateway'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-xl'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-blue-600" />
            <span>Instant Flutterwave</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2.5 border-b-2 font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-xl'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span>Deposit History</span>
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-4 py-2.5 border-b-2 font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'manual'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-xl'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Bank Details</span>
          </button>
        </div>

        {/* Tab 1: Flutterwave Instant Checkout */}
        {activeTab === 'gateway' && (
          <div className="p-6 space-y-5 overflow-y-auto">
            {successMessage && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-3 animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold block">Wallet Credited Successfully!</span>
                  <p className="text-emerald-700">{successMessage}</p>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* If Payment Session Active (Awaiting Confirmation) */}
            {activeTxRef ? (
              <div className="p-5 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                    <span className="text-xs font-bold text-amber-900 uppercase">Payment In Progress</span>
                  </div>
                  <span className="text-[10px] bg-amber-200 text-amber-900 font-mono px-2 py-0.5 rounded font-bold">
                    Awaiting Credit
                  </span>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-amber-200 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Transaction Reference:</span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono font-bold text-slate-900 text-[11px]">{activeTxRef}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(activeTxRef);
                          setCopiedRef(true);
                          setTimeout(() => setCopiedRef(false), 2000);
                        }}
                        className="p-1 rounded hover:bg-slate-100 text-slate-500"
                      >
                        {copiedRef ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Deposit Amount:</span>
                    <span className="font-mono font-black text-slate-900 text-sm">₦{amount.toLocaleString()}</span>
                  </div>
                </div>

                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Complete your payment in the Flutterwave checkout window (Cards, Bank Transfer, USSD, or OPay). Once completed, click below to verify and credit your wallet.
                </p>

                <div className="flex flex-col sm:flex-row gap-2">
                  {paymentUrl && (
                    <a
                      href={paymentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <span>Re-Open Checkout</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button
                    onClick={handleVerifyStatus}
                    disabled={verifying}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${verifying ? 'animate-spin' : ''}`} />
                    <span>{verifying ? 'Verifying...' : 'I Have Paid / Check Status'}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Amount Selection & Initialization Form */
              <div className="space-y-4">
                {/* Quick Amount Buttons */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-2">
                    Select Quick Amount (NGN)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {quickAmounts.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => handleSelectQuickAmount(q)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                          amount === q
                            ? 'bg-blue-600 text-white shadow-md scale-[1.02]'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                        }`}
                      >
                        ₦{q.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Amount Input */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-bold text-slate-700">Custom Amount (₦)</label>
                    <span className="text-[11px] text-slate-500">Min: ₦500 • Max: ₦5,000,000</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold font-mono text-slate-400 text-base">
                      ₦
                    </span>
                    <input
                      type="number"
                      value={customInput}
                      onChange={handleCustomInputChange}
                      min="500"
                      max="5000000"
                      placeholder="5000"
                      className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-base font-bold text-slate-900 focus:bg-white focus:border-blue-600 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Supported Payment Methods Badge */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Supported Flutterwave Payment Methods
                  </span>
                  <div className="flex flex-wrap gap-1.5 text-[10px] font-bold text-slate-600">
                    <span className="px-2 py-0.5 rounded bg-white border border-slate-200">Debit Cards (Mastercard/Visa/Verve)</span>
                    <span className="px-2 py-0.5 rounded bg-white border border-slate-200">Bank Transfer (OPay / Kuda / Palmpay)</span>
                    <span className="px-2 py-0.5 rounded bg-white border border-slate-200">USSD Codes</span>
                    <span className="px-2 py-0.5 rounded bg-white border border-slate-200">Instant QR</span>
                  </div>
                </div>

                {/* Primary Action Button */}
                <button
                  type="button"
                  onClick={handleInitiatePayment}
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-sm shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <Lock className="w-4 h-4" />
                  <span>
                    {loading ? 'Initializing Secure Payment...' : `Pay ₦${amount.toLocaleString()} with Flutterwave`}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <p className="text-center text-[10px] text-slate-500 flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Secured with official 256-bit encryption by Flutterwave API v3.</span>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Deposit History (Requirement 9) */}
        {activeTab === 'history' && (
          <div className="p-6 space-y-4 overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase">Payment Audit History</h3>
                <p className="text-[11px] text-slate-500">Live transaction records categorized by status.</p>
              </div>
              <button
                onClick={loadHistory}
                disabled={historyLoading}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 cursor-pointer"
                title="Refresh"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${historyLoading ? 'animate-spin text-blue-600' : ''}`} />
              </button>
            </div>

            {/* Status Tabs */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
              {(['all', 'successful', 'pending', 'failed'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setHistoryTab(tab)}
                  className={`flex-1 py-1 rounded-lg capitalize transition-colors cursor-pointer ${
                    historyTab === tab ? 'bg-white text-slate-950 shadow-xs' : 'hover:text-slate-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* List */}
            {historyLoading ? (
              <div className="py-8 text-center text-xs text-slate-500">Loading payment ledger...</div>
            ) : filteredHistory.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No payment history found under "{historyTab}".
              </div>
            ) : (
              <div className="space-y-2">
                {filteredHistory.map((p) => (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-900 text-[11px]">{p.reference}</span>
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          p.status === 'successful'
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500 text-[11px]">
                      <span>{p.paymentMethod || 'Flutterwave'}</span>
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        ₦{p.amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>{new Date(p.createdAt).toLocaleString()}</span>
                      {p.creditedToWallet && (
                        <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3" /> Credited to Wallet
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Dedicated Account Information (Requirement 3 & 10) */}
        {activeTab === 'manual' && (
          <div className="p-6 space-y-4 overflow-y-auto">
            {vaSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{vaSuccess}</span>
              </div>
            )}

            {vaError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{vaError}</span>
              </div>
            )}

            {virtualAccount?.accountNumber || (wallet.accountNumber && wallet.accountNumber.trim() !== '') ? (
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-blue-900 uppercase">Dedicated Transfer Account</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                    AUTOMATIC WEBHOOK CREDIT
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-blue-200/50">
                    <span className="text-slate-500">Bank Name:</span>
                    <span className="font-bold text-slate-900">
                      {virtualAccount?.bankName || wallet.bankName || 'Wema Bank'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-blue-200/50 items-center">
                    <span className="text-slate-500">Account Number:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-base font-extrabold text-blue-700 tracking-wider">
                        {virtualAccount?.accountNumber || wallet.accountNumber}
                      </span>
                      <button
                        onClick={() => {
                          const acc = virtualAccount?.accountNumber || wallet.accountNumber;
                          navigator.clipboard.writeText(acc);
                          setCopiedAcc(true);
                          setTimeout(() => setCopiedAcc(false), 2000);
                        }}
                        className="p-1 rounded bg-white border border-slate-200 text-slate-600 hover:text-blue-600 shadow-xs cursor-pointer"
                        title="Copy Account Number"
                      >
                        {copiedAcc ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Account Name:</span>
                    <span className="font-semibold text-slate-800 text-right">
                      {virtualAccount?.accountName || wallet.accountName || customer?.name || 'STEVELOGS'}
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white/80 border border-blue-100 text-[11px] text-blue-900 space-y-1">
                  <span className="font-bold block">How it works:</span>
                  <p>
                    Transfer funds directly from any Nigerian banking app (OPay, PalmPay, GTB, Zenith, Kuda, etc.) to this dedicated account. Flutterwave webhooks will verify and credit your Stevelogs wallet automatically.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="text-center space-y-1">
                  <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-2">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Generate Official Dedicated Bank Account</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    Under Central Bank of Nigeria (CBN) regulations, Flutterwave requires your 11-digit BVN or NIN to assign a permanent, static virtual account in your name.
                  </p>
                </div>

                <form onSubmit={handleGenerateVirtualAccount} className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                      Verification Identification Type
                    </label>
                    <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setIdType('bvn')}
                        className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer ${
                          idType === 'bvn'
                            ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        BVN (Bank Verification No.)
                      </button>
                      <button
                        type="button"
                        onClick={() => setIdType('nin')}
                        className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer ${
                          idType === 'nin'
                            ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        NIN (National ID No.)
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[11px] font-bold text-slate-700">
                        Enter 11-Digit {idType.toUpperCase()} *
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">11 digits</span>
                    </div>
                    <input
                      type="text"
                      maxLength={11}
                      required
                      placeholder={`Enter 11-digit ${idType.toUpperCase()}`}
                      value={bvnOrNin}
                      onChange={(e) => setBvnOrNin(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-blue-600 outline-none transition-all tracking-wider"
                    />
                  </div>

                  <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-100 text-[10px] text-blue-900 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>Your identity details are encrypted with 256-bit SSL and transmitted securely to Flutterwave API v3.</span>
                  </div>

                  <button
                    type="submit"
                    disabled={generatingVA || bvnOrNin.length !== 11}
                    className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <Building2 className="w-4 h-4" />
                    <span>{generatingVA ? 'Verifying with Flutterwave API...' : `Generate ${idType.toUpperCase()} Dedicated Account`}</span>
                  </button>
                </form>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('gateway')}
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Or Fund Instantly With Card / Bank / USSD (No BVN Required)</span>
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
