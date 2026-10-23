import React, { useState } from 'react';
import { 
  X, 
  Code2, 
  Key, 
  Copy, 
  Check, 
  Terminal, 
  RefreshCw, 
  Play, 
  ExternalLink,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

interface DeveloperApiModalProps {
  onClose: () => void;
  walletBalance: number;
}

export const DeveloperApiModal: React.FC<DeveloperApiModalProps> = ({
  onClose,
  walletBalance,
}) => {
  const [apiKey, setApiKey] = useState('sl_live_79a2948e918c47b198ef284910283');
  const [apiBaseUrl, setApiBaseUrl] = useState('https://api.stevelogs.com');
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [activeTab, setActiveTab] = useState<'docs' | 'playground' | 'keys'>('docs');
  const [selectedEndpoint, setSelectedEndpoint] = useState<'balance' | 'order_number' | 'check_otp' | 'order_log'>('balance');
  const [sandboxResponse, setSandboxResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateNewKey = () => {
    const newKey = `sl_live_${Math.random().toString(36).substring(2, 14)}${Math.random().toString(36).substring(2, 14)}`;
    setApiKey(newKey);
  };

  const handleRunPlayground = () => {
    setIsLoading(true);
    setTimeout(() => {
      let resp: any = {};
      if (selectedEndpoint === 'balance') {
        resp = {
          status: 'success',
          user: 'stevotech2@gmail.com',
          wallet: {
            balance: walletBalance,
            currency: 'NGN',
            tier: 'Developer VIP',
          },
        };
      } else if (selectedEndpoint === 'order_number') {
        resp = {
          status: 'success',
          order_id: 'ORD_928194',
          service: 'whatsapp',
          country: 'US',
          phone_number: '+14158902419',
          expires_in: 600,
          status_check_url: `${apiBaseUrl}/v1/usa-numbers/otp?order_id=ORD_928194`,
        };
      } else if (selectedEndpoint === 'check_otp') {
        resp = {
          status: 'success',
          order_id: 'ORD_928194',
          otp_code: '491032',
          full_sms: 'Your WhatsApp verification code is: 491-032. Do not share this code.',
          completed: true,
        };
      } else if (selectedEndpoint === 'order_log') {
        resp = {
          status: 'success',
          product_id: 'log-gmail-2018',
          account: {
            email: 'steve.bryan99@gmail.com',
            password: 'Password#2026!',
            recovery_email: 'backup99@mail.com',
            two_fa_secret: 'JBSWY3DPEHPK3PXP',
          },
        };
      }

      setSandboxResponse(JSON.stringify(resp, null, 2));
      setIsLoading(false);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex justify-center p-3 sm:p-5">
      <div 
        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto border border-slate-100 max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <Code2 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 font-sans">Developer API Integration</h2>
              <p className="text-xs text-slate-500 font-sans">REST API Specs, Sandbox & Credentials</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-200/80 p-0.5 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setActiveTab('docs')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  activeTab === 'docs' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'
                }`}
              >
                Docs
              </button>
              <button
                onClick={() => setActiveTab('playground')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  activeTab === 'playground' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'
                }`}
              >
                Test Console
              </button>
              <button
                onClick={() => setActiveTab('keys')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  activeTab === 'keys' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'
                }`}
              >
                API Key
              </button>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 ml-2">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {activeTab === 'keys' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-2">
                <span className="text-xs font-bold text-blue-900 uppercase">Your Active API Token</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={apiKey}
                    className="w-full px-3 py-2 text-xs font-mono font-semibold bg-white border border-slate-200 rounded-xl select-all"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(apiKey);
                      setCopiedKey(true);
                      setTimeout(() => setCopiedKey(false), 2000);
                    }}
                    className="px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold shrink-0 flex items-center gap-1"
                  >
                    {copiedKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Pass this token in the header: <code className="text-blue-600">Authorization: Bearer {apiKey.substring(0, 12)}...</code>
                </p>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Need to rotate credentials?</h4>
                  <p className="text-[11px] text-slate-500">Generate a new key if your current secret is compromised.</p>
                </div>
                <button
                  onClick={handleGenerateNewKey}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Rotate Key</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'playground' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Target Endpoint</label>
                  <select
                    value={selectedEndpoint}
                    onChange={(e) => setSelectedEndpoint(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono"
                  >
                    <option value="balance">GET /v1/user/balance</option>
                    <option value="order_number">POST /v1/usa-numbers/order</option>
                    <option value="check_otp">GET /v1/usa-numbers/otp</option>
                    <option value="order_log">POST /v1/logs/order</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={handleRunPlayground}
                    disabled={isLoading}
                    className="w-full py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
                    <span>{isLoading ? 'Executing...' : 'Send Live API Request'}</span>
                  </button>
                </div>
              </div>

              {sandboxResponse && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                    <span>STATUS: 200 OK</span>
                    <span>Content-Type: application/json</span>
                  </div>
                  <pre className="p-4 rounded-2xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
                    {sandboxResponse}
                  </pre>
                </div>
              )}
            </div>
          )}

          {activeTab === 'docs' && (
            <div className="space-y-5 text-xs">
              <div className="space-y-2">
                <span className="font-bold text-slate-800 uppercase tracking-wide">Base API Endpoint</span>
                <div className="p-2.5 rounded-xl bg-slate-900 text-cyan-400 font-mono text-xs">
                  {apiBaseUrl}
                </div>
              </div>

              {/* Endpoints Breakdown */}
              <div className="space-y-3 font-mono">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold">GET</span>
                    <span className="text-slate-900 font-bold">/v1/user/balance</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-sans">
                    Returns current user wallet balance, currency, and bonus pool.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold">POST</span>
                    <span className="text-slate-900 font-bold">/v1/usa-numbers/order</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-sans">
                    Params: <code className="text-blue-600">service</code> (whatsapp, telegram, google), <code className="text-blue-600">area_code</code> (optional).
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold">GET</span>
                    <span className="text-slate-900 font-bold">/v1/usa-numbers/otp?order_id=...</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-sans">
                    Polls for incoming SMS code and carrier dispatch status.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold">POST</span>
                    <span className="text-slate-900 font-bold">/v1/logs/order</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-sans">
                    Params: <code className="text-blue-600">product_id</code>. Returns instant credentials JSON.
                  </p>
                </div>
              </div>

              {/* cURL Snippet */}
              <div className="p-3.5 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span>cURL Integration Sample:</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`curl -H "Authorization: Bearer ${apiKey}" https://api.stevelogs.com/v1/user/balance`);
                      setCopiedCurl(true);
                      setTimeout(() => setCopiedCurl(false), 2000);
                    }}
                    className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
                  >
                    {copiedCurl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCurl ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="text-[11px] text-slate-300 overflow-x-auto leading-relaxed">
{`curl -X GET "${apiBaseUrl}/v1/user/balance" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Accept: application/json"`}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
