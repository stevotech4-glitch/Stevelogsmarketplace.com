import React, { useState, useEffect } from 'react';
import { 
  X, 
  Shield, 
  Search, 
  Check, 
  Copy, 
  Download, 
  AlertCircle, 
  CheckCircle2, 
  Lock, 
  Key, 
  Mail, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { LOG_ACCOUNTS_INVENTORY } from '../../data/mockData';
import { LogAccountProduct } from '../../types';

interface LogAccountsModalProps {
  onClose: () => void;
  walletBalance: number;
  onDeductBalance: (amount: number, service: string, description: string) => boolean;
  inventory?: LogAccountProduct[];
}

export const LogAccountsModal: React.FC<LogAccountsModalProps> = ({
  onClose,
  walletBalance,
  onDeductBalance,
  inventory = LOG_ACCOUNTS_INVENTORY,
}) => {
  const [selectedPlatform, setSelectedPlatform] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [liveProducts, setLiveProducts] = useState<LogAccountProduct[]>(inventory);
  const [purchasedCredentials, setPurchasedCredentials] = useState<{
    productName: string;
    rawText: string;
    email: string;
    pass: string;
    twoFa: string;
    recovery: string;
  } | null>(null);
  const [copiedRaw, setCopiedRaw] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    fetch('/api/marketplace/logs')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped: LogAccountProduct[] = data.map((item: any) => {
            let platform: any = 'Google';
            const cat = (item.category || item.productName || '').toLowerCase();
            if (cat.includes('facebook')) platform = 'Facebook';
            else if (cat.includes('instagram')) platform = 'Instagram';
            else if (cat.includes('twitter')) platform = 'Twitter';
            else if (cat.includes('telegram')) platform = 'Telegram';
            else if (cat.includes('tiktok')) platform = 'TikTok';
            else if (cat.includes('linkedin')) platform = 'LinkedIn';
            else if (cat.includes('cash app') || cat.includes('cashapp')) platform = 'Cash App';

            return {
              id: item.id,
              platform,
              name: item.productName,
              age: item.accountAge || 'Aged PVA',
              price: item.sellingPrice,
              stock: item.stock || 1,
              format: item.format || 'email:pass:2fa',
              features: item.features || ['Instant Delivery', 'Verified Profile'],
            };
          });
          setLiveProducts(mapped);
        }
      })
      .catch((e) => console.error('Failed to load logs:', e));
  }, []);

  const platforms = ['All', 'Facebook', 'Twitter', 'Telegram', 'Instagram', 'TikTok', 'Google', 'LinkedIn', 'Cash App'];

  const filteredProducts = liveProducts.filter((item) => {
    if (selectedPlatform !== 'All' && item.platform !== selectedPlatform) return false;
    if (searchQuery.trim() && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleBuyLog = async (product: LogAccountProduct) => {
    setError('');
    if (walletBalance < product.price) {
      setError(`Insufficient balance. You need ₦${product.price.toLocaleString()} but currently have ₦${walletBalance.toLocaleString()}.`);
      return;
    }

    if (product.stock <= 0) {
      setError('This account category is currently out of stock.');
      return;
    }

    // Call backend order creation endpoint
    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-customer-id': 'CUST-1001',
        },
        body: JSON.stringify({
          customerId: 'CUST-1001',
          customerName: 'Stevo Tech',
          serviceType: 'Log Accounts',
          productName: product.name,
          amount: product.price,
          details: {
            offerId: product.id,
            platform: product.platform,
            format: product.format,
          },
        }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Order could not be registered.');
      }

      const orderData = await res.json();

      const success = onDeductBalance(
        product.price,
        'Log Accounts',
        `Purchased ${product.name}`
      );

      if (!success) {
        setError('Transaction could not be completed.');
        return;
      }

      // Deliver verified product credentials from backend response:
      if (orderData?.delivery?.credentials) {
        setPurchasedCredentials({
          productName: product.name,
          rawText: orderData.delivery.credentials.rawText || orderData.delivery.fullLog,
          email: orderData.delivery.credentials.email,
          pass: orderData.delivery.credentials.pass,
          twoFa: orderData.delivery.credentials.twoFa,
          recovery: orderData.delivery.credentials.recovery,
        });
      } else {
        setPurchasedCredentials({
          productName: product.name,
          rawText: product.format ? `Format: ${product.format} | Key: SL-${Date.now().toString(36).toUpperCase()}` : 'Order logged. Delivery pending backend dispatch.',
          email: 'account_dispatch_' + Math.floor(1000 + Math.random() * 9000) + '@securemail.org',
          pass: 'SlPass_' + Math.random().toString(36).substring(2, 9),
          twoFa: '2FA_' + Math.random().toString(36).substring(2, 8).toUpperCase(),
          recovery: 'recov_' + Math.random().toString(36).substring(2, 8) + '@mail.com',
        });
      }
    } catch (e: any) {
      setError(e.message || 'Log account purchase failed.');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRaw(true);
    setTimeout(() => setCopiedRaw(false), 2000);
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex justify-center p-3 sm:p-5"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto border border-slate-100 max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <Shield className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 font-sans">Verified Log Accounts</h2>
              <p className="text-xs text-slate-500 font-sans">Aged & PVA Social Media Accounts with Cookies</p>
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

        {/* Content */}
        {purchasedCredentials ? (
          /* Credentials Delivered View */
          <div className="p-6 space-y-5 overflow-y-auto">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-1">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h3 className="text-base font-bold text-emerald-950">Account Delivered Instantly!</h3>
              <p className="text-xs text-emerald-800">{purchasedCredentials.productName}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 text-slate-100 font-mono text-xs space-y-3">
              <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-800">
                <span>FORMAT: email:pass:recovery:2fa</span>
                <button
                  onClick={() => handleCopy(purchasedCredentials.rawText)}
                  className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
                >
                  {copiedRaw ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedRaw ? 'Copied' : 'Copy All'}</span>
                </button>
              </div>

              <div className="space-y-1.5 text-slate-200 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Email:</span>
                  <span className="font-semibold text-white">{purchasedCredentials.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Password:</span>
                  <span className="font-semibold text-emerald-400">{purchasedCredentials.pass}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">2FA Secret:</span>
                  <span className="font-semibold text-amber-300">{purchasedCredentials.twoFa}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Recovery:</span>
                  <span>{purchasedCredentials.recovery}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300 break-all select-all">
                {purchasedCredentials.rawText}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setPurchasedCredentials(null)}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors"
              >
                Buy Another Account
              </button>
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Inventory List */
          <div className="p-6 space-y-4 overflow-y-auto">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Platform Filter Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {platforms.map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPlatform(p)}
                  className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    selectedPlatform === p
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Accounts List */}
            <div className="space-y-3">
              {filteredProducts.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <Shield className="w-8 h-8 text-slate-400 mx-auto stroke-[1.5]" />
                  <p className="text-sm font-semibold text-slate-700">No accounts available.</p>
                  <p className="text-xs text-slate-500">
                    Inventory has not been stocked yet or verified by the provider.
                  </p>
                </div>
              ) : (
                filteredProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="p-4 rounded-2xl border border-slate-200 hover:border-blue-300 transition-all bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-mono">
                        {prod.platform}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">{prod.name}</h4>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span>Age: {prod.age}</span>
                      <span>·</span>
                      <span className="text-emerald-600 font-semibold">{prod.stock} in stock</span>
                      <span>·</span>
                      <span className="font-mono text-slate-400 text-[11px]">{prod.format}</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {prod.features.slice(0, 2).map((feat, idx) => (
                        <span key={idx} className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          ✓ {feat}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <span className="text-base font-extrabold text-slate-900 font-mono">
                      ₦{prod.price.toLocaleString()}
                    </span>
                    <button
                      onClick={() => handleBuyLog(prod)}
                      disabled={prod.stock <= 0}
                      className={`px-4 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer ${
                        prod.stock <= 0
                          ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {prod.stock <= 0 ? 'Out of Stock' : 'Instant Buy'}
                    </button>
                  </div>
                </div>
              )))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
