import React from 'react';
import { 
  Home, 
  ShoppingBag, 
  Wallet, 
  Headphones, 
  User,
  Sparkles,
  Zap
} from 'lucide-react';
import { UserWallet, CustomerRecord } from '../types';

interface CustomerBottomNavProps {
  currentTab: string;
  onSelectTab: (tab: 'home' | 'marketplace' | 'wallet' | 'support' | 'profile') => void;
  wallet: UserWallet;
  customer?: CustomerRecord | null;
}

export const CustomerBottomNav: React.FC<CustomerBottomNavProps> = ({
  currentTab,
  onSelectTab,
  wallet,
  customer,
}) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/90 shadow-[0_-6px_25px_rgba(0,0,0,0.4)] px-2 py-1.5 transition-all">
      <div className="max-w-md mx-auto grid grid-cols-5 items-center justify-around">
        {/* 1. Home */}
        <button
          onClick={() => onSelectTab('home')}
          className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all cursor-pointer ${
            currentTab === 'home'
              ? 'text-amber-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Home className={`w-5 h-5 ${currentTab === 'home' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            {currentTab === 'home' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            )}
          </div>
          <span className="text-[10px] font-bold mt-1 tracking-tight">Home</span>
        </button>

        {/* 2. Marketplace */}
        <button
          onClick={() => onSelectTab('marketplace')}
          className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all cursor-pointer relative ${
            currentTab === 'marketplace'
              ? 'text-amber-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <ShoppingBag className={`w-5 h-5 ${currentTab === 'marketplace' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400"></span>
            {currentTab === 'marketplace' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            )}
          </div>
          <span className="text-[10px] font-bold mt-1 tracking-tight">Market</span>
        </button>

        {/* 3. Wallet (Prominent Elevated Gold Center Action) */}
        <button
          onClick={() => onSelectTab('wallet')}
          className="flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all cursor-pointer -mt-3.5 group"
          title="Add Money / Wallet Details"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 via-yellow-400 to-amber-500 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-950/40 group-active:scale-95 transition-transform border-2 border-slate-950">
            <Wallet className="w-5 h-5 stroke-[2.8] text-slate-950" />
          </div>
          <span className="text-[10px] font-black text-amber-300 mt-0.5 tracking-tight font-mono">
            ₦{wallet.balance >= 1000 ? `${(wallet.balance / 1000).toFixed(1)}k` : wallet.balance}
          </span>
        </button>

        {/* 4. Support */}
        <button
          onClick={() => onSelectTab('support')}
          className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all cursor-pointer ${
            currentTab === 'support'
              ? 'text-amber-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Headphones className={`w-5 h-5 ${currentTab === 'support' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            {currentTab === 'support' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            )}
          </div>
          <span className="text-[10px] font-bold mt-1 tracking-tight">Support</span>
        </button>

        {/* 5. Profile */}
        <button
          onClick={() => onSelectTab('profile')}
          className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all cursor-pointer ${
            currentTab === 'profile'
              ? 'text-amber-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <User className={`w-5 h-5 ${currentTab === 'profile' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            {currentTab === 'profile' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            )}
          </div>
          <span className="text-[10px] font-bold mt-1 tracking-tight">
            {customer ? 'Account' : 'Sign In'}
          </span>
        </button>
      </div>
    </nav>
  );
};
