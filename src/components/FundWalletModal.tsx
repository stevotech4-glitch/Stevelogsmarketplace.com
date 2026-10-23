import React, { useState, useEffect, useRef } from 'react';
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
  Upload,
  Image as ImageIcon,
  FileCheck,
  HelpCircle,
  Sparkles,
  Info
} from 'lucide-react';
import { UserWallet, CustomerRecord, PaymentRecord, ManualPaymentRequest } from '../types';

interface FundWalletModalProps {
  wallet: UserWallet;
  customer?: CustomerRecord | null;
  onClose: () => void;
  onAddFunds: (amount: number) => void;
  initialTab?: 'manual' | 'gateway' | 'history';
}

export const FundWalletModal: React.FC<FundWalletModalProps> = ({
  wallet,
  customer,
  onClose,
  onAddFunds,
  initialTab = 'manual',
}) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'gateway' | 'history'>(initialTab);

  // Common amount state
  const [amount, setAmount] = useState<number>(5000);
  const [customInput, setCustomInput] = useState<string>('5000');
  const [email] = useState<string>(customer?.email || 'customer@stevelogs.com');
  const [phone] = useState<string>(customer?.phone || '08012345678');
  const [name] = useState<string>(customer?.name || 'Stevelogs Customer');

  // Manual payment state
  const [manualSettings, setManualSettings] = useState({
    enabled: true,
    bankName: 'Moniepoint MFB / Wema Bank',
    accountNumber: '8149021844',
    accountName: 'STEVELOGS MARKETPLACE SERVICES',
    instructions: 'Transfer the exact amount to the account details shown above. Take a clear screenshot of the successful transfer receipt and upload it below. Our verification desk operates 24/7 and approves requests within 2 to 5 minutes.',
    minDeposit: 500,
    maxDeposit: 5000000,
    currencySymbol: '₦',
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [transferRef, setTransferRef] = useState('');
  const [receiptBase64, setReceiptBase64] = useState<string | null>(null);
  const [receiptFileName, setReceiptFileName] = useState<string | null>(null);
  const [submittingManual, setSubmittingManual] = useState(false);
  const [manualSuccessReq, setManualSuccessReq] = useState<ManualPaymentRequest | null>(null);
  const [manualRequests, setManualRequests] = useState<ManualPaymentRequest[]>([]);
  const [loadingManualRequests, setLoadingManualRequests] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Flutterwave gateway state
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTxRef, setActiveTxRef] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  // Copy states
  const [copiedAcc, setCopiedAcc] = useState(false);
  const [copiedBank, setCopiedBank] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);

  // History state
  const [historyLoading, setHistoryLoading] = useState(false);
  const [paymentsHistory, setPaymentsHistory] = useState<PaymentRecord[]>([]);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'successful' | 'pending' | 'failed'>('all');

  const quickAmounts = [1000, 2000, 5000, 10000, 20000, 50000];

  // Fetch dynamic manual payment settings
  const loadManualSettings = async () => {
    setSettingsLoading(true);
    try {
      const res = await fetch('/api/payments/manual-settings');
      const data = await res.json();
      if (data && data.bankName) {
        setManualSettings(data);
      }
    } catch (err) {
      console.warn('Could not load dynamic manual payment settings:', err);
    } finally {
      setSettingsLoading(false);
    }
  };

  // Fetch customer's manual payment requests
  const loadCustomerManualRequests = async () => {
    if (!customer?.id) return;
    setLoadingManualRequests(true);
    try {
      const res = await fetch(`/api/customer/manual-requests?customerId=${encodeURIComponent(customer.id)}`, {
        headers: {
          'x-customer-id': customer.id,
        },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setManualRequests(data);
      }
    } catch (err) {
      console.error('Failed to load manual payment requests:', err);
    } finally {
      setLoadingManualRequests(false);
    }
  };

  // Fetch Flutterwave payment history
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
    loadManualSettings();
    if (customer?.id) {
      loadCustomerManualRequests();
    }
  }, [customer?.id]);

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
      loadCustomerManualRequests();
    }
  }, [activeTab]);

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

  // File upload handler for receipts
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage('Receipt image size exceeds 15MB limit. Please upload a smaller image.');
      return;
    }

    setReceiptFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setReceiptBase64(reader.result as string);
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  // Handle Manual Bank Transfer Submission
  const handleSubmitManualPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const minDep = manualSettings.minDeposit || 500;
    if (amount < minDep) {
      setErrorMessage(`Minimum deposit amount is ₦${minDep.toLocaleString()}.`);
      return;
    }

    if (!receiptBase64 && !transferRef.trim()) {
      setErrorMessage('Please upload your transfer payment receipt or enter your transfer reference/notes.');
      return;
    }

    setSubmittingManual(true);
    try {
      const res = await fetch('/api/payments/manual-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-customer-id': customer?.id || '',
        },
        body: JSON.stringify({
          customerId: customer?.id || 'CUST-1001',
          amount,
          transferReference: transferRef.trim() || undefined,
          receiptUrl: receiptBase64 || undefined,
          receiptFileName: receiptFileName || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit payment request.');
      }

      setManualSuccessReq(data.request);
      setSuccessMessage('Payment request submitted successfully! Awaiting administrator approval.');
      setReceiptBase64(null);
      setReceiptFileName(null);
      setTransferRef('');
      loadCustomerManualRequests();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error submitting payment request.');
    } finally {
      setSubmittingManual(false);
    }
  };

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

        const popup = window.open(data.paymentUrl, '_blank');
        if (!popup || popup.closed || typeof popup.closed === 'undefined') {
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

  // Check / Poll Flutterwave Payment Status
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

  const copyToClipboard = (text: string, type: 'acc' | 'bank' | 'ref') => {
    navigator.clipboard.writeText(text);
    if (type === 'acc') {
      setCopiedAcc(true);
      setTimeout(() => setCopiedAcc(false), 2000);
    } else if (type === 'bank') {
      setCopiedBank(true);
      setTimeout(() => setCopiedBank(false), 2000);
    } else if (type === 'ref') {
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  const filteredHistory = paymentsHistory.filter((p) => {
    if (historyFilter === 'all') return true;
    return p.status === historyFilter;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm flex justify-center p-3 sm:p-5">
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto border border-slate-200 max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Brand Color Palette: Deep Blue / Purple Gradient with Gold Accents */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-[#1e3a8a] via-[#1d4ed8] to-[#6d28d9] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md">
              <Wallet className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">Add Money to Wallet</h2>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 shadow-xs">
                  24/7 ACTIVE
                </span>
              </div>
              <p className="text-xs text-blue-100/90">
                Wallet Balance: <span className="font-mono font-black text-amber-300">₦{wallet.balance.toLocaleString()}</span>
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

        {/* 3 Main Choice Tabs: Manual Bank Transfer (New), Instant Flutterwave, History */}
        <div className="flex border-b border-slate-100 bg-slate-50 text-xs font-bold text-slate-600 px-3 pt-2 gap-1 overflow-x-auto">
          <button
            onClick={() => {
              setActiveTab('manual');
              setErrorMessage(null);
            }}
            className={`px-3 sm:px-4 py-2.5 border-b-2 font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'manual'
                ? 'border-amber-500 text-blue-900 bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className={`w-3.5 h-3.5 ${activeTab === 'manual' ? 'text-amber-500' : 'text-slate-500'}`} />
            <span>Manual Bank Transfer</span>
            <span className="text-[9px] bg-amber-400/30 text-amber-900 font-extrabold px-1.5 py-0.2 rounded-full">
              Recommended
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('gateway');
              setErrorMessage(null);
            }}
            className={`px-3 sm:px-4 py-2.5 border-b-2 font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'gateway'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCard className={`w-3.5 h-3.5 ${activeTab === 'gateway' ? 'text-blue-600' : 'text-slate-500'}`} />
            <span>Instant Flutterwave</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('history');
              setErrorMessage(null);
            }}
            className={`px-3 sm:px-4 py-2.5 border-b-2 font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span>History</span>
            {manualRequests.filter((r) => r.status === 'Pending Approval').length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            )}
          </button>
        </div>

        {/* Global Notifications */}
        {errorMessage && (
          <div className="m-4 mb-0 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 1: MANUAL BANK TRANSFER (REQUIREMENTS 4, 5, 6, 8)    */}
        {/* ======================================================== */}
        {activeTab === 'manual' && (
          <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
            {/* If a new request was just submitted */}
            {manualSuccessReq && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-2 animate-in fade-in">
                <div className="flex items-center gap-2 font-bold text-emerald-800 text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Transfer Request Submitted (Pending Approval)</span>
                </div>
                <p className="text-emerald-700 leading-relaxed text-[11px]">
                  Your transfer request of <span className="font-bold font-mono">₦{manualSuccessReq.amount.toLocaleString()}</span> has been recorded with reference <span className="font-bold font-mono text-emerald-950 bg-emerald-100/70 px-1 rounded">{manualSuccessReq.reference}</span>. Our administrators will verify your receipt and credit your wallet within 2-5 minutes.
                </p>
                <div className="pt-1 flex gap-2">
                  <button
                    onClick={() => setManualSuccessReq(null)}
                    className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] cursor-pointer"
                  >
                    Make Another Deposit
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className="py-1.5 px-3 rounded-lg bg-white border border-emerald-300 text-emerald-800 font-bold text-[11px] hover:bg-emerald-100 cursor-pointer"
                  >
                    View Status in History
                  </button>
                </div>
              </div>
            )}

            {/* Official Admin Bank Account Details Display */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-900 via-indigo-950 to-purple-950 text-white shadow-md relative overflow-hidden border border-blue-800/60">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between text-xs mb-3">
                <span className="font-extrabold uppercase text-amber-300 flex items-center gap-1.5 tracking-wider text-[11px]">
                  <Building2 className="w-4 h-4 text-amber-400" />
                  Official Bank Transfer Account
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Instant Verification
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                {/* Bank Name */}
                <div className="flex justify-between items-center py-1 border-b border-white/10">
                  <span className="text-blue-200">Bank Name:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-white text-sm">{manualSettings.bankName}</span>
                    <button
                      onClick={() => copyToClipboard(manualSettings.bankName, 'bank')}
                      className="p-1 rounded bg-white/10 hover:bg-white/20 text-white/80 cursor-pointer"
                      title="Copy Bank Name"
                    >
                      {copiedBank ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                {/* Account Number */}
                <div className="flex justify-between items-center py-1 border-b border-white/10">
                  <span className="text-blue-200">Account Number:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base sm:text-lg font-black text-amber-300 tracking-wider">
                      {manualSettings.accountNumber}
                    </span>
                    <button
                      onClick={() => copyToClipboard(manualSettings.accountNumber, 'acc')}
                      className="px-2 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px] shadow-sm flex items-center gap-1 cursor-pointer"
                      title="Copy Account Number"
                    >
                      {copiedAcc ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedAcc ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* Account Name */}
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-blue-200">Account Name:</span>
                  <span className="font-bold text-white text-right max-w-[220px] truncate">
                    {manualSettings.accountName}
                  </span>
                </div>
              </div>

              {/* Instructions */}
              <div className="mt-3 p-2.5 rounded-xl bg-white/10 backdrop-blur-xs text-[11px] text-blue-100/90 leading-relaxed border border-white/10">
                <span className="font-bold text-amber-300 block mb-0.5">Instructions:</span>
                <p>{manualSettings.instructions}</p>
              </div>
            </div>

            {/* Manual Payment Submission Form */}
            <form onSubmit={handleSubmitManualPayment} className="space-y-4">
              {/* Quick Amount Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Select Quick Amount (NGN)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {quickAmounts.map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleSelectQuickAmount(val)}
                      className={`py-2 px-2.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                        amount === val
                          ? 'bg-blue-600 text-white shadow-xs border border-blue-600'
                          : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200/60'
                      }`}
                    >
                      ₦{val.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Amount Input */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Deposit Amount to Transfer (₦) *
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Min: ₦{manualSettings.minDeposit.toLocaleString()}
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                    ₦
                  </span>
                  <input
                    type="number"
                    min={manualSettings.minDeposit || 500}
                    step="100"
                    required
                    value={customInput}
                    onChange={handleCustomInputChange}
                    placeholder="Enter amount to deposit"
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-blue-600 outline-none transition-all shadow-xs"
                  />
                </div>
              </div>

              {/* Sender Name / Bank Reference */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Transfer Reference / Sender Name (Optional but recommended)
                </label>
                <input
                  type="text"
                  placeholder="e.g. John Doe / OPay / GTBank Session ID"
                  value={transferRef}
                  onChange={(e) => setTransferRef(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:bg-white focus:border-blue-600 outline-none transition-all shadow-xs"
                />
              </div>

              {/* Receipt File Upload */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Upload Payment Receipt or Transfer Screenshot *
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {receiptBase64 ? (
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={receiptBase64}
                        alt="Receipt preview"
                        className="w-12 h-12 object-cover rounded-xl border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-800 block truncate">
                          {receiptFileName || 'receipt_screenshot.png'}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Image attached
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setReceiptBase64(null);
                        setReceiptFileName(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] cursor-pointer"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-4 rounded-2xl border-2 border-dashed border-slate-200 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/50 flex flex-col items-center justify-center text-center transition-all cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                      <Upload className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">
                      Click to upload receipt screenshot
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      JPG, PNG, or WEBP (Max 15MB)
                    </span>
                  </button>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submittingManual}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-500 hover:to-amber-500 text-slate-950 font-black text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99] disabled:opacity-50"
              >
                {submittingManual ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Submitting Payment Request...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>I Have Paid ₦{amount.toLocaleString()} — Submit Payment</span>
                  </>
                )}
              </button>
            </form>

            {/* Pending Requests List if Any */}
            {manualRequests.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-800">Recent Manual Requests:</span>
                  <button
                    onClick={() => setActiveTab('history')}
                    className="text-blue-600 hover:underline text-[11px] font-bold cursor-pointer"
                  >
                    View All
                  </button>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {manualRequests.slice(0, 3).map((r) => (
                    <div
                      key={r.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900">₦{r.amount.toLocaleString()}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              r.status === 'Approved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : r.status === 'Pending Approval'
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {r.status}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono block">Ref: {r.reference}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: FLUTTERWAVE GATEWAY (PRESERVED 100%)              */}
        {/* ======================================================== */}
        {activeTab === 'gateway' && (
          <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
            {successMessage && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-3 animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold block">Payment Confirmed!</span>
                  <p className="text-emerald-700">{successMessage}</p>
                </div>
              </div>
            )}

            {/* If Flutterwave session in progress */}
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
                    <span>Reference:</span>
                    <span className="font-mono font-bold text-slate-900 text-[11px]">{activeTxRef}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Deposit Amount:</span>
                    <span className="font-mono font-black text-slate-900 text-sm">₦{amount.toLocaleString()}</span>
                  </div>
                </div>

                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Complete your payment in Flutterwave (Cards, Bank Transfer, USSD). Then click below to verify and credit your wallet.
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
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-2">
                    Select Quick Amount (NGN)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {quickAmounts.map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleSelectQuickAmount(val)}
                        className={`py-2 px-2.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                          amount === val
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        ₦{val.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-700">Custom Amount (₦)</label>
                    <span className="text-[10px] text-slate-500 font-mono">Min: ₦500</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₦</span>
                    <input
                      type="number"
                      min={500}
                      step="100"
                      value={customInput}
                      onChange={handleCustomInputChange}
                      className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-blue-600 outline-none transition-all shadow-xs"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-100 text-[11px] text-blue-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span>Protected by Flutterwave 256-Bit SSL</span>
                  </div>
                  <p className="text-blue-700">
                    Supports Mastercard, Visa, Verve, Bank Transfer, USSD, and OPay.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleInitiatePayment}
                  disabled={loading || amount < 500}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99] disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Connecting to Gateway...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Pay ₦{amount.toLocaleString()} with Flutterwave</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: DEPOSIT HISTORY (COMBINED MANUAL & GATEWAY)       */}
        {/* ======================================================== */}
        {activeTab === 'history' && (
          <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
            {/* Section 1: Manual Bank Transfer Requests */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                <Building2 className="w-4 h-4 text-amber-500" />
                <span>Manual Bank Transfer Requests</span>
              </h4>

              {loadingManualRequests ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-1 text-slate-400" />
                  <span>Loading manual deposit requests...</span>
                </div>
              ) : manualRequests.length === 0 ? (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                  No manual bank transfer requests found.
                </div>
              ) : (
                <div className="space-y-2">
                  {manualRequests.map((r) => (
                    <div
                      key={r.id}
                      className="p-3.5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-slate-900 text-sm">
                            ₦{r.amount.toLocaleString()}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              r.status === 'Approved'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : r.status === 'Pending Approval'
                                ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                : 'bg-rose-100 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {r.status}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(r.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-600 flex justify-between items-center">
                        <span className="font-mono text-[10px] text-slate-500">Ref: {r.reference}</span>
                        {r.receiptUrl && (
                          <a
                            href={r.receiptUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-1 font-bold text-[10px]"
                          >
                            <ImageIcon className="w-3 h-3" />
                            <span>View Receipt</span>
                          </a>
                        )}
                      </div>

                      {r.status === 'Rejected' && r.rejectionReason && (
                        <div className="p-2 rounded-xl bg-rose-50 border border-rose-100 text-[10px] text-rose-800">
                          <span className="font-bold">Reason:</span> {r.rejectionReason}
                        </div>
                      )}

                      {r.status === 'Approved' && r.approvedAt && (
                        <div className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Credited to wallet by verification desk</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 2: Flutterwave Gateway Transactions */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span>Instant Flutterwave Transactions</span>
              </h4>

              {historyLoading ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-1 text-slate-400" />
                  <span>Loading payment records...</span>
                </div>
              ) : paymentsHistory.length === 0 ? (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                  No gateway payments recorded yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {paymentsHistory.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900">₦{p.amount.toLocaleString()}</span>
                          <span
                            className={`px-2 py-0.2 rounded text-[9px] font-black uppercase ${
                              p.status === 'successful'
                                ? 'bg-emerald-100 text-emerald-800'
                                : p.status === 'pending'
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {p.status}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">Ref: {p.reference}</span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {new Date(p.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
