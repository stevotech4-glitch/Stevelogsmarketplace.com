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
  ArrowUpRight
} from 'lucide-react';
import { WebsiteMasterSettings, PaymentRecord } from '../../types';

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

  useEffect(() => {
    loadDiagnostics();
    loadPaymentsLedger();
  }, []);

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
