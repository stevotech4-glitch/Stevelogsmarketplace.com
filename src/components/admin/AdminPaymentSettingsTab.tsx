import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Lock,
  Eye,
  EyeOff,
  Server,
  Activity,
  PlayCircle,
  Clock,
  XCircle,
  HelpCircle,
  ArrowUpRight,
  Building2,
  Upload,
  Image as ImageIcon,
  FileCheck
} from 'lucide-react';
import { WebsiteMasterSettings, PaymentRecord, ManualPaymentRequest } from '../../types';

interface AdminPaymentSettingsTabProps {
  settings: WebsiteMasterSettings;
  onSaveSettings: (updates: Partial<WebsiteMasterSettings>) => void;
  onShowNotice: (msg: string) => void;
}

export const AdminPaymentSettingsTab: React.FC<AdminPaymentSettingsTabProps> = ({
  settings,
  onSaveSettings,
  onShowNotice,
}) => {
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [copiedSecretHash, setCopiedSecretHash] = useState(false);
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(false);
  const [diagnosticsData, setDiagnosticsData] = useState<any>(null);
  const [showSecretKeyInput, setShowSecretKeyInput] = useState(false);
  const [newSecretKey, setNewSecretKey] = useState('');
  const [newPublicKey, setNewPublicKey] = useState(settings.flutterwavePublicKey || '');
  const [newSecretHash, setNewSecretHash] = useState('');
  const [mode, setMode] = useState<'test' | 'live'>(settings.flutterwaveMode || 'test');
  const [isEnabled, setIsEnabled] = useState(settings.flutterwaveEnabled !== false);
  const [minDeposit, setMinDeposit] = useState(settings.minDeposit || 500);
  const [maxDeposit, setMaxDeposit] = useState(settings.maxDeposit || 5000000);

  // Test Suite state
  const [runningTestSuite, setRunningTestSuite] = useState(false);
  const [testSuiteResults, setTestSuiteResults] = useState<any>(null);

  // Payments ledger state
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'successful' | 'pending' | 'failed'>('all');
  const [paymentsSummary, setPaymentsSummary] = useState({
    totalCount: 0,
    successfulCount: 0,
    pendingCount: 0,
    failedCount: 0,
    totalDepositedNgn: 0,
  });

  // Manual Payment Settings State
  const [manualBankName, setManualBankName] = useState(settings.bankName || 'Moniepoint MFB / Wema Bank');
  const [manualAccountName, setManualAccountName] = useState(settings.accountName || 'STEVELOGS MARKETPLACE SERVICES');
  const [manualAccountNumber, setManualAccountNumber] = useState(settings.accountNumber || '8149021844');
  const [manualInstructions, setManualInstructions] = useState(
    settings.manualPaymentInstructions ||
    'Transfer the exact amount to the account details shown above. Take a clear screenshot of the successful transfer receipt and upload it below. Our verification desk operates 24/7 and approves requests within 2 to 5 minutes.'
  );
  const [manualMinDeposit, setManualMinDeposit] = useState(settings.manualPaymentMinDeposit || 500);
  const [manualEnabled, setManualEnabled] = useState(settings.manualPaymentEnabled !== false);
  const [savingManualSettings, setSavingManualSettings] = useState(false);

  // Manual Payment Requests State
  const [manualRequests, setManualRequests] = useState<ManualPaymentRequest[]>([]);
  const [manualRequestsLoading, setManualRequestsLoading] = useState(false);
  const [manualFilter, setManualFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState<string | null>(null);
  const [rejectingReq, setRejectingReq] = useState<ManualPaymentRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionProcessingId, setActionProcessingId] = useState<string | null>(null);

  const getAdminHeaders = (): HeadersInit => {
    const token = sessionStorage.getItem('stevelogs_admin_token') || '';
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'x-admin-token': token,
    };
  };

  const liveProductionWebhookUrl = 'https://stevelogsmarketplace.shop/api/payments/flutterwave/webhook';
  const currentEnvWebhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/payments/flutterwave/webhook`
    : liveProductionWebhookUrl;
  const webhookUrl = liveProductionWebhookUrl;

  const loadDiagnostics = async () => {
    setDiagnosticsLoading(true);
    try {
      const res = await fetch('/api/admin/payments/diagnostics', {
        headers: getAdminHeaders(),
      });
      const data = await res.json();
      if (data.success && data.diagnostics) {
        setDiagnosticsData(data.diagnostics);
      }
    } catch (err: any) {
      console.error('Diagnostics load error:', err);
    } finally {
      setDiagnosticsLoading(false);
    }
  };

  const loadPaymentsLedger = async () => {
    setPaymentsLoading(true);
    try {
      const res = await fetch('/api/admin/payments', {
        headers: getAdminHeaders(),
      });
      const data = await res.json();
      if (data.payments) {
        setPayments(data.payments);
        setPaymentsSummary({
          totalCount: data.totalCount || 0,
          successfulCount: data.successfulCount || 0,
          pendingCount: data.pendingCount || 0,
          failedCount: data.failedCount || 0,
          totalDepositedNgn: data.totalDepositedNgn || 0,
        });
      }
    } catch (err: any) {
      console.error('Payments load error:', err);
    } finally {
      setPaymentsLoading(false);
    }
  };

  const runTestSuite = async () => {
    setRunningTestSuite(true);
    try {
      const res = await fetch('/api/admin/payments/test-suite', {
        method: 'POST',
        headers: getAdminHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setTestSuiteResults(data);
        onShowNotice('Automated payment test suite completed successfully!');
        loadPaymentsLedger();
      } else {
        onShowNotice('Test suite encountered issues: ' + (data.error || 'Unknown error'));
      }
    } catch (err: any) {
      onShowNotice('Failed to run test suite: ' + err.message);
    } finally {
      setRunningTestSuite(false);
    }
  };

  const loadManualRequests = async () => {
    setManualRequestsLoading(true);
    try {
      const res = await fetch('/api/admin/payments/manual-requests', {
        headers: getAdminHeaders(),
      });
      const data = await res.json();
      if (data && Array.isArray(data.requests)) {
        setManualRequests(data.requests);
      }
    } catch (err: any) {
      console.error('Failed to load manual payment requests:', err);
    } finally {
      setManualRequestsLoading(false);
    }
  };

  useEffect(() => {
    loadDiagnostics();
    loadPaymentsLedger();
    loadManualRequests();
  }, []);

  const handleSaveManualSettings = async () => {
    setSavingManualSettings(true);
    try {
      const res = await fetch('/api/payments/manual-settings', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({
          bankName: manualBankName.trim(),
          accountName: manualAccountName.trim(),
          accountNumber: manualAccountNumber.trim(),
          manualPaymentInstructions: manualInstructions.trim(),
          manualPaymentMinDeposit: Number(manualMinDeposit),
          manualPaymentEnabled: manualEnabled,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onSaveSettings({
          bankName: manualBankName.trim(),
          accountName: manualAccountName.trim(),
          accountNumber: manualAccountNumber.trim(),
          manualPaymentInstructions: manualInstructions.trim(),
          manualPaymentMinDeposit: Number(manualMinDeposit),
          manualPaymentEnabled: manualEnabled,
        });
        onShowNotice('Manual bank transfer payment settings saved successfully!');
      } else {
        onShowNotice('Failed to update manual payment settings.');
      }
    } catch (err: any) {
      onShowNotice('Error saving settings: ' + err.message);
    } finally {
      setSavingManualSettings(false);
    }
  };

  const handleApproveManualPayment = async (reqItem: ManualPaymentRequest, overrideAmount?: number) => {
    if (!window.confirm(`Are you sure you want to approve manual deposit of ₦${(overrideAmount || reqItem.amount).toLocaleString()} for ${reqItem.customerName}? This will credit their wallet balance immediately.`)) {
      return;
    }

    setActionProcessingId(reqItem.id);
    try {
      const res = await fetch(`/api/admin/payments/manual-requests/${encodeURIComponent(reqItem.id)}/approve`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({
          approvedAmount: overrideAmount || reqItem.amount,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onShowNotice(`Manual payment approved! ₦${(overrideAmount || reqItem.amount).toLocaleString()} credited to ${reqItem.customerName}'s wallet.`);
        loadManualRequests();
        loadPaymentsLedger();
      } else {
        onShowNotice(`Approval failed: ${data.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      onShowNotice(`Error approving payment: ${err.message}`);
    } finally {
      setActionProcessingId(null);
    }
  };

  const handleRejectManualPayment = async () => {
    if (!rejectingReq) return;
    setActionProcessingId(rejectingReq.id);
    try {
      const res = await fetch(`/api/admin/payments/manual-requests/${encodeURIComponent(rejectingReq.id)}/reject`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({
          reason: rejectReason.trim() || 'Payment could not be verified by administration.',
        }),
      });

      const data = await res.json();
      if (data.success) {
        onShowNotice(`Manual payment [Ref: ${rejectingReq.reference}] has been rejected.`);
        setRejectingReq(null);
        setRejectReason('');
        loadManualRequests();
      } else {
        onShowNotice(`Rejection failed: ${data.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      onShowNotice(`Error rejecting payment: ${err.message}`);
    } finally {
      setActionProcessingId(null);
    }
  };

  const handleSaveCredentials = () => {
    const updates: Partial<WebsiteMasterSettings> = {
      flutterwaveEnabled: isEnabled,
      flutterwaveMode: mode,
      flutterwavePublicKey: newPublicKey.trim(),
      minDeposit: Number(minDeposit),
      maxDeposit: Number(maxDeposit),
    };

    if (newSecretKey.trim() !== '') {
      updates.flutterwaveSecretKey = newSecretKey.trim();
    }
    if (newSecretHash.trim() !== '') {
      updates.flutterwaveSecretHash = newSecretHash.trim();
    }

    onSaveSettings(updates);
    setNewSecretKey('');
    setShowSecretKeyInput(false);
    onShowNotice('Flutterwave payment settings updated successfully.');
    setTimeout(() => loadDiagnostics(), 600);
  };

  const filteredPayments = payments.filter((p) => {
    if (paymentFilter === 'all') return true;
    return p.status === paymentFilter;
  });

  const filteredManualRequests = manualRequests.filter((r) => {
    if (manualFilter === 'all') return true;
    if (manualFilter === 'pending') return r.status === 'Pending Approval';
    if (manualFilter === 'approved') return r.status === 'Approved';
    if (manualFilter === 'rejected') return r.status === 'Rejected';
    return true;
  });

  const pendingManualCount = manualRequests.filter((r) => r.status === 'Pending Approval').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                Flutterwave Payment Gateway
                <span
                  className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                    isEnabled
                      ? mode === 'live'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {isEnabled ? (mode === 'live' ? '● Live Production' : '● Test Sandbox Mode') : '● Disabled'}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Official API v3 payment integration for automated customer wallet funding in Nigerian Naira (NGN).
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadDiagnostics}
            disabled={diagnosticsLoading}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${diagnosticsLoading ? 'animate-spin text-amber-400' : ''}`} />
            <span>Diagnostics</span>
          </button>
          <button
            onClick={runTestSuite}
            disabled={runningTestSuite}
            className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <PlayCircle className={`w-4 h-4 ${runningTestSuite ? 'animate-spin' : ''}`} />
            <span>{runningTestSuite ? 'Running Tests...' : 'Run Security Suite'}</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. MANUAL PAYMENT REQUESTS & VERIFICATION DESK           */}
      {/* ======================================================== */}
      <div className="p-6 rounded-2xl bg-[#0f172a] border border-amber-500/30 shadow-xl space-y-4 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-black">
                <Building2 className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Manual Bank Transfer Requests
                {pendingManualCount > 0 ? (
                  <span className="text-xs font-mono font-black px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 animate-pulse">
                    {pendingManualCount} Pending Review
                  </span>
                ) : (
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                    0 Pending
                  </span>
                )}
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Verify customer payment screenshots, approve atomic wallet crediting, or reject invalid transfers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setManualFilter(f)}
                  className={`px-3 py-1 rounded-lg font-bold capitalize transition-colors cursor-pointer ${
                    manualFilter === f
                      ? 'bg-amber-400 text-slate-950 shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {f === 'pending' ? 'Pending' : f}
                </button>
              ))}
            </div>

            <button
              onClick={loadManualRequests}
              disabled={manualRequestsLoading}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer"
              title="Refresh Requests"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${manualRequestsLoading ? 'animate-spin text-amber-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Requests Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="p-3">Reference / Date</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Bank Reference / Notes</th>
                <th className="p-3">Receipt Screenshot</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-900/40 text-slate-300">
              {filteredManualRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-500">
                    No manual bank transfer requests found under "{manualFilter}".
                  </td>
                </tr>
              ) : (
                filteredManualRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-mono">
                      <span className="font-bold text-white block text-[11px]">{req.reference}</span>
                      <span className="text-[10px] text-slate-500 font-normal">
                        {new Date(req.createdAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-white block">{req.customerName}</span>
                      <span className="text-[10px] text-slate-400 font-mono block">{req.customerEmail}</span>
                      <span className="text-[10px] text-slate-500 font-mono">ID: {req.customerId}</span>
                    </td>
                    <td className="p-3 font-mono font-black text-amber-300 text-sm">
                      ₦{req.amount.toLocaleString()}
                    </td>
                    <td className="p-3 text-[11px] max-w-xs">
                      {req.transferReference ? (
                        <span className="font-mono bg-slate-950 px-2 py-0.5 rounded text-slate-200 border border-slate-800 block truncate">
                          {req.transferReference}
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">Not provided</span>
                      )}
                    </td>
                    <td className="p-3">
                      {req.receiptUrl ? (
                        <div className="flex items-center gap-2">
                          <img
                            src={req.receiptUrl}
                            alt="Receipt"
                            className="w-9 h-9 object-cover rounded-lg border border-slate-700 cursor-pointer hover:opacity-80"
                            onClick={() => setSelectedReceiptUrl(req.receiptUrl || null)}
                          />
                          <button
                            onClick={() => setSelectedReceiptUrl(req.receiptUrl || null)}
                            className="px-2 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 font-bold text-[10px] border border-blue-500/30 cursor-pointer flex items-center gap-1"
                          >
                            <ImageIcon className="w-3 h-3" />
                            <span>View</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500">No image</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          req.status === 'Approved'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : req.status === 'Pending Approval'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {req.status}
                      </span>
                      {req.status === 'Rejected' && req.rejectionReason && (
                        <span className="block text-[10px] text-rose-400 mt-0.5 max-w-xs truncate" title={req.rejectionReason}>
                          {req.rejectionReason}
                        </span>
                      )}
                      {req.status === 'Approved' && req.approvedBy && (
                        <span className="block text-[9px] text-emerald-400 font-mono mt-0.5">
                          By: {req.approvedBy}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {req.status === 'Pending Approval' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleApproveManualPayment(req)}
                            disabled={actionProcessingId === req.id}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-[11px] shadow-sm cursor-pointer disabled:opacity-50 transition-all"
                            title="Approve and Credit Exact Amount to Wallet"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setRejectingReq(req);
                              setRejectReason('');
                            }}
                            disabled={actionProcessingId === req.id}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-bold text-[11px] cursor-pointer disabled:opacity-50 transition-all"
                            title="Reject Payment"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-mono">Completed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. MANUAL PAYMENT SETTINGS (ADMIN CONFIGURABLE)          */}
      {/* ======================================================== */}
      <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-400" />
              Manual Bank Transfer Settings
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Configure the bank account details displayed to customers on the wallet funding page.
            </p>
          </div>

          {/* Enabled Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300 font-bold">Manual Deposits:</span>
            <button
              onClick={() => setManualEnabled(!manualEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                manualEnabled ? 'bg-amber-400' : 'bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-slate-950 transition-transform ${
                  manualEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-xs font-bold ${manualEnabled ? 'text-amber-400' : 'text-slate-500'}`}>
              {manualEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          {/* Bank Name */}
          <div>
            <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
              Bank Name *
            </label>
            <input
              type="text"
              value={manualBankName}
              onChange={(e) => setManualBankName(e.target.value)}
              placeholder="e.g. Moniepoint MFB / Wema Bank"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold text-xs focus:border-amber-400 outline-none"
            />
          </div>

          {/* Account Number */}
          <div>
            <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
              Account Number *
            </label>
            <input
              type="text"
              value={manualAccountNumber}
              onChange={(e) => setManualAccountNumber(e.target.value)}
              placeholder="e.g. 8149021844"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-amber-300 font-mono font-black text-xs focus:border-amber-400 outline-none"
            />
          </div>

          {/* Account Name */}
          <div>
            <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
              Account Name *
            </label>
            <input
              type="text"
              value={manualAccountName}
              onChange={(e) => setManualAccountName(e.target.value)}
              placeholder="e.g. STEVELOGS MARKETPLACE SERVICES"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold text-xs focus:border-amber-400 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          {/* Minimum Deposit */}
          <div>
            <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
              Minimum Permitted Wallet Deposit (₦)
            </label>
            <input
              type="number"
              min={100}
              step={50}
              value={manualMinDeposit}
              onChange={(e) => setManualMinDeposit(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:border-amber-400 outline-none"
            />
          </div>

          {/* Instructions */}
          <div className="sm:col-span-2">
            <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
              Additional Payment Instructions
            </label>
            <textarea
              rows={2}
              value={manualInstructions}
              onChange={(e) => setManualInstructions(e.target.value)}
              placeholder="Instructions displayed to customers when paying..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-400 outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSaveManualSettings}
            disabled={savingManualSettings}
            className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs shadow-lg transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {savingManualSettings ? 'Saving...' : 'Save Manual Payment Settings'}
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* RECEIPT PREVIEW MODAL                                    */}
      {/* ======================================================== */}
      {selectedReceiptUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          onClick={() => setSelectedReceiptUrl(null)}
        >
          <div
            className="relative max-w-xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-4 overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-amber-400" />
                Customer Payment Receipt Proof
              </span>
              <button
                onClick={() => setSelectedReceiptUrl(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="py-4 flex justify-center">
              <img
                src={selectedReceiptUrl}
                alt="Receipt proof"
                className="max-h-[70vh] rounded-2xl object-contain border border-slate-800"
              />
            </div>
            <div className="flex justify-end pt-2">
              <a
                href={selectedReceiptUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5"
              >
                <span>Open Full Size in New Tab</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* REJECT REASON MODAL                                      */}
      {/* ======================================================== */}
      {rejectingReq && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          onClick={() => setRejectingReq(null)}
        >
          <div
            className="relative max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 overflow-hidden shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-400" />
                Reject Payment Request
              </span>
              <button
                onClick={() => setRejectingReq(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Rejecting request for <span className="font-bold text-white">{rejectingReq.customerName}</span> (₦{rejectingReq.amount.toLocaleString()}).
            </p>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                Reason for Rejection (Displayed to customer)
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Transfer receipt does not match account records, or transfer not received."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none focus:border-rose-400"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingReq(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectManualPayment}
                disabled={actionProcessingId === rejectingReq.id}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connection Diagnostics Card */}
      <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <Activity className="w-4 h-4 text-amber-400" />
            <span>Gateway Connection & Server Status</span>
          </div>
          {diagnosticsData?.pingLatencyMs && (
            <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              API Latency: {diagnosticsData.pingLatencyMs}ms
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-mono uppercase">API Connectivity</span>
            <div className="mt-1 flex items-center gap-1.5 font-bold">
              {diagnosticsData?.apiReachable ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-emerald-300">Connected to api.flutterwave.com</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-amber-300">Pending Ping Check</span>
                </>
              )}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-mono uppercase">Secret Key Storage</span>
            <div className="mt-1 flex items-center gap-1.5 font-bold">
              {diagnosticsData?.summary?.hasSecretKey ? (
                <>
                  <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-white font-mono text-[11px]">
                    {diagnosticsData.summary.maskedSecretKey || 'Configured (Server-Side)'}
                  </span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="text-rose-300">Not Configured</span>
                </>
              )}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-mono uppercase">Webhook Signature Hash</span>
            <div className="mt-1 flex items-center gap-1.5 font-bold">
              {diagnosticsData?.summary?.hasSecretHash ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-emerald-300">Signature Protected</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-amber-300">Default Hash Active</span>
                </>
              )}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-mono uppercase">Active Environment</span>
            <div className="mt-1 flex items-center gap-1.5 font-bold">
              <span className="font-mono text-xs uppercase px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
                {mode === 'live' ? 'Live Production (NGN)' : 'Test Mode (Sandbox)'}
              </span>
            </div>
          </div>
        </div>

        {diagnosticsData?.error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{diagnosticsData.error}</span>
          </div>
        )}
      </div>

      {/* Automated Requirement 14 Test Results */}
      {testSuiteResults && (
        <div className="p-5 rounded-2xl bg-[#0f172a] border border-amber-500/30 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">
                Automated Security & Verification Results ({testSuiteResults.passedTests} / {testSuiteResults.totalTests} Passed)
              </h3>
            </div>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                testSuiteResults.allPassed
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/20 text-rose-400'
              }`}
            >
              {testSuiteResults.allPassed ? 'All Security Checks Passed' : 'Verification Alerts Detected'}
            </span>
          </div>

          <div className="space-y-2">
            {testSuiteResults.results?.map((res: any, idx: number) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {res.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span className="font-bold text-white">{res.testName}</span>
                  </div>
                  <p className="text-[11px] text-slate-400">{res.description}</p>
                  <p className="text-[11px] font-mono text-slate-300">{res.details}</p>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${
                    res.passed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                  }`}
                >
                  {res.passed ? 'PASSED' : 'FAILED'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gateway Configuration & Credentials Form */}
      <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-6">
        <div>
          <h3 className="text-base font-bold text-white">Gateway Settings & Webhook Configuration</h3>
          <p className="text-xs text-slate-400">
            Configure Flutterwave API credentials. Secrets are stored safely on the server and masked in all UI responses.
          </p>
        </div>

        {/* Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">Enable Flutterwave Payments</span>
              <span className="text-[11px] text-slate-400">Allow customers to fund wallets via Flutterwave</span>
            </div>
            <button
              onClick={() => setIsEnabled(!isEnabled)}
              className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                isEnabled ? 'bg-amber-400' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                  isEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">Environment Mode</span>
              <span className="text-[11px] text-slate-400">
                {mode === 'test' ? 'Test Sandbox (FLWSECK_TEST-...)' : 'Live Production (FLWSECK-...)'}
              </span>
            </div>
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setMode('test')}
                className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  mode === 'test' ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Test
              </button>
              <button
                onClick={() => setMode('live')}
                className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  mode === 'live' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Live
              </button>
            </div>
          </div>
        </div>

        {/* Webhook Endpoint Display */}
        <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/20 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
              <Server className="w-4 h-4 text-blue-400" />
              Official Webhook Notification URL
            </span>
            <span className="text-[10px] bg-blue-500/20 text-blue-300 font-mono px-2 py-0.5 rounded">
              HTTP POST (Signature Verified)
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Add this webhook endpoint into your{' '}
            <a
              href="https://app.flutterwave.com/dashboard/settings/webhooks"
              target="_blank"
              rel="noreferrer"
              className="text-amber-400 underline font-semibold inline-flex items-center gap-0.5"
            >
              Flutterwave Webhook Settings <ExternalLink className="w-3 h-3" />
            </a>{' '}
            to receive instantaneous payment notifications.
          </p>
          <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <input
              type="text"
              readOnly
              value={webhookUrl}
              className="w-full bg-transparent font-mono text-xs text-blue-200 outline-none select-all"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(webhookUrl);
                setCopiedWebhook(true);
                setTimeout(() => setCopiedWebhook(false), 2000);
              }}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 shrink-0 cursor-pointer"
            >
              {copiedWebhook ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedWebhook ? 'Copied' : 'Copy URL'}</span>
            </button>
          </div>
        </div>

        {/* Credentials Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Public Key */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-slate-400 uppercase block">
              Flutterwave Public Key (FLWPUBK_...)
            </label>
            <input
              type="text"
              value={newPublicKey}
              onChange={(e) => setNewPublicKey(e.target.value)}
              placeholder="FLWPUBK_TEST-xxxxxxxxxxxxxxxx"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:border-amber-400 outline-none"
            />
          </div>

          {/* Webhook Secret Hash */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-slate-400 uppercase block">
              Webhook Secret Hash (verif-hash)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newSecretHash}
                onChange={(e) => setNewSecretHash(e.target.value)}
                placeholder={settings.flutterwaveSecretHash ? '••••••••••••' : 'Enter secret hash configured in Flutterwave'}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:border-amber-400 outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  const gen = 'sl_flw_' + Math.random().toString(36).substring(2, 15);
                  setNewSecretHash(gen);
                }}
                className="px-2.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] shrink-0 font-mono cursor-pointer"
                title="Generate Random Secret Hash"
              >
                Generate
              </button>
            </div>
          </div>

          {/* Secret Key */}
          <div className="space-y-1 sm:col-span-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-mono text-slate-400 uppercase block">
                Flutterwave Secret Key (FLWSECK_...)
              </label>
              <button
                type="button"
                onClick={() => setShowSecretKeyInput(!showSecretKeyInput)}
                className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                {showSecretKeyInput ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{showSecretKeyInput ? 'Cancel Editing Secret' : 'Update Secret Key'}</span>
              </button>
            </div>

            {showSecretKeyInput ? (
              <input
                type="password"
                value={newSecretKey}
                onChange={(e) => setNewSecretKey(e.target.value)}
                placeholder="Paste your FLWSECK_TEST-... or FLWSECK-... key"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-amber-500/50 text-white font-mono text-xs focus:border-amber-400 outline-none"
              />
            ) : (
              <div className="px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-400 flex items-center justify-between">
                <span>
                  {diagnosticsData?.summary?.maskedSecretKey ||
                    (settings.flutterwaveSecretKey ? '••••••••••••••••' : 'No Secret Key Saved')}
                </span>
                <span className="text-[10px] text-emerald-400 font-sans font-bold flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Secure Server Storage
                </span>
              </div>
            )}
            <p className="text-[10px] text-slate-500">
              Never exposed to the browser or client-side storage. Can also be set directly in server environment variable <code className="text-slate-300">FLW_SECRET_KEY</code>.
            </p>
          </div>
        </div>

        {/* Deposit Limits */}
        <div className="border-t border-slate-800 pt-4 space-y-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Deposit Limits & Safety Thresholds</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                Minimum Deposit Amount (₦)
              </label>
              <input
                type="number"
                value={minDeposit}
                onChange={(e) => setMinDeposit(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                Maximum Single Deposit Amount (₦)
              </label>
              <input
                type="number"
                value={maxDeposit}
                onChange={(e) => setMaxDeposit(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleSaveCredentials}
            className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs shadow-lg transition-transform active:scale-95 cursor-pointer"
          >
            Save Gateway Settings
          </button>
        </div>
      </div>

      {/* Payment Ledger & Reconciliation Table (Requirement 9) */}
      <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Payment Transactions & Audit Ledger
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {paymentsSummary.totalCount} Total
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Full record of initiated, pending, failed, and verified customer deposits.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {(['all', 'successful', 'pending', 'failed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setPaymentFilter(f)}
                className={`px-3 py-1 rounded-lg font-bold capitalize transition-colors cursor-pointer ${
                  paymentFilter === f
                    ? 'bg-amber-400 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase font-mono">Total Verified Deposits</span>
            <span className="text-base font-black text-emerald-400 font-mono mt-0.5 block">
              ₦{paymentsSummary.totalDepositedNgn.toLocaleString()}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase font-mono">Successful Deposits</span>
            <span className="text-base font-black text-white font-mono mt-0.5 block">
              {paymentsSummary.successfulCount}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase font-mono">Pending Transactions</span>
            <span className="text-base font-black text-amber-400 font-mono mt-0.5 block">
              {paymentsSummary.pendingCount}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase font-mono">Failed / Declined</span>
            <span className="text-base font-black text-rose-400 font-mono mt-0.5 block">
              {paymentsSummary.failedCount}
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="p-3">Reference</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
                <th className="p-3">Wallet Credited</th>
                <th className="p-3">Method</th>
                <th className="p-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-900/40 text-slate-300">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-500">
                    No payment records found under "{paymentFilter}".
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-bold text-white text-[11px]">
                      {p.reference}
                      {p.flwTransactionId && (
                        <span className="block text-[10px] text-slate-500 font-normal">
                          FLW: {p.flwTransactionId}
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-white block">{p.customerName || p.customerId}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{p.customerEmail}</span>
                    </td>
                    <td className="p-3 font-mono font-black text-white">
                      ₦{p.amount.toLocaleString()}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          p.status === 'successful'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : p.status === 'pending'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {p.status}
                      </span>
                      {p.failureReason && (
                        <span className="block text-[10px] text-rose-400 mt-0.5 max-w-xs truncate" title={p.failureReason}>
                          {p.failureReason}
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      {p.creditedToWallet ? (
                        <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Credited
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500">Uncredited</span>
                      )}
                    </td>
                    <td className="p-3 text-[11px] text-slate-400">{p.paymentMethod || 'Flutterwave'}</td>
                    <td className="p-3 text-[10px] text-slate-500 font-mono">
                      {new Date(p.createdAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
