import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CheckCircle2, 
  Clock, 
  Filter,
  Copy,
  Check
} from 'lucide-react';
import { Transaction } from '../../types';

interface TransactionHistoryModalProps {
  transactions: Transaction[];
  onClose: () => void;
}

export const TransactionHistoryModal: React.FC<TransactionHistoryModalProps> = ({
  transactions,
  onClose,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'debit' | 'credit'>('all');
  const [search, setSearch] = useState('');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [copied, setCopied] = useState(false);

  const filtered = transactions.filter((tx) => {
    if (filterType !== 'all' && tx.type !== filterType) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        tx.reference.toLowerCase().includes(q) ||
        tx.service.toLowerCase().includes(q) ||
        tx.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex justify-center p-3 sm:p-5">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto border border-slate-100 max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#1a73e8] text-white flex items-center justify-center shadow-sm">
              <FileText className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 font-sans">Transaction History</h2>
              <p className="text-xs text-slate-500 font-sans">All Invoices, Purchases & Wallet Deposits</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {selectedTx ? (
          /* Receipt Modal */
          <div className="p-6 space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Official Transaction Receipt
              </span>
              <div className="text-2xl font-bold font-mono text-slate-900">
                ₦{selectedTx.amount.toLocaleString()}
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {selectedTx.status}
              </span>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Reference:</span>
                <span className="font-mono font-semibold text-slate-800">{selectedTx.reference}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Service:</span>
                <span className="font-semibold text-slate-800">{selectedTx.service}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Date & Time:</span>
                <span className="text-slate-800">{selectedTx.date}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Description:</span>
                <span className="text-slate-800 text-right max-w-xs">{selectedTx.description}</span>
              </div>

              {selectedTx.details && Object.entries(selectedTx.details).map(([k, v]) => (
                <div key={k} className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">{k}:</span>
                  <span className="font-mono text-slate-800 font-medium">{v}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedTx(null)}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
              >
                Back to History
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`Transaction ${selectedTx.reference}: ₦${selectedTx.amount} (${selectedTx.service})`);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-sm"
              >
                {copied ? 'Receipt Copied' : 'Copy Receipt'}
              </button>
            </div>
          </div>
        ) : (
          /* Ledger List */
          <div className="p-6 space-y-4 overflow-y-auto">
            {/* Filter & Search */}
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="relative w-full">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search reference, service..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                />
              </div>

              <div className="flex items-center gap-1 w-full sm:w-auto shrink-0">
                {(['all', 'debit', 'credit'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilterType(t)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize cursor-pointer ${
                      filterType === t
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="space-y-2">
              {filtered.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs font-medium">
                  No orders yet.
                </div>
              ) : (
                filtered.map((tx) => (
                  <div
                    key={tx.id}
                    onClick={() => setSelectedTx(tx)}
                    className="p-3.5 rounded-2xl border border-slate-100 hover:border-blue-200 bg-white hover:bg-slate-50/50 flex items-center justify-between transition-all cursor-pointer shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                        tx.type === 'credit'
                          ? 'bg-emerald-100 text-emerald-600'
                          : 'bg-blue-50 text-blue-600'
                      }`}>
                        {tx.type === 'credit' ? (
                          <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                        )}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{tx.service}</span>
                          <span className="text-[10px] font-mono text-slate-400">{tx.reference}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate max-w-[200px] sm:max-w-xs">{tx.description}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`text-sm font-bold font-mono block ${
                        tx.type === 'credit' ? 'text-emerald-600' : 'text-slate-900'
                      }`}>
                        {tx.type === 'credit' ? '+' : '-'}₦{tx.amount.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400">{tx.date}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
