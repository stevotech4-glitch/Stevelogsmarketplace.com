import React, { useState } from 'react';
import { 
  Globe, 
  Shield, 
  FileText, 
  Users, 
  Send, 
  Key, 
  Cpu, 
  Radio, 
  CreditCard, 
  ShieldCheck, 
  Code2, 
  Award,
  Wallet, 
  ShoppingBag, 
  Gift, 
  Truck, 
  PlayCircle, 
  Sparkles,
  Plus,
  ArrowUpRight,
  Clock,
  Building2,
  CheckCircle2,
  ChevronRight,
  Headphones
} from 'lucide-react';
import { ServiceId, ServiceItem, UserWallet, CustomerRecord } from '../types';
import { MAIN_SERVICES } from '../data/mockData';

interface MainServicesGridProps {
  services?: ServiceItem[];
  wallet: UserWallet;
  customer?: CustomerRecord | null;
  onSelectService: (serviceId: ServiceId) => void;
  onOpenFundWallet: (tab?: 'manual' | 'gateway') => void;
  onOpenMarketplace: () => void;
  onOpenSpecialMarketplace: () => void;
  onOpenSupport: () => void;
  onOpenHistory: () => void;
}

export const MainServicesGrid: React.FC<MainServicesGridProps> = ({ 
  services = MAIN_SERVICES, 
  wallet,
  customer,
  onSelectService,
  onOpenFundWallet,
  onOpenMarketplace,
  onOpenSpecialMarketplace,
  onOpenSupport,
  onOpenHistory,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [maintenanceNotice, setMaintenanceNotice] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'All Services' },
    { id: 'numbers', label: 'Numbers & OTP' },
    { id: 'accounts', label: 'Accounts & Logs' },
    { id: 'telecom', label: 'eSIM & Telecom' },
    { id: 'gifts', label: 'Gift Cards & Gifts' },
    { id: 'tools', label: 'Tracking & Tools' },
  ];

  const getServiceCategory = (id: ServiceId): string => {
    switch (id) {
      case 'usa-numbers':
      case 'buy-numbers':
      case 'rent-number':
        return 'numbers';
      case 'log-accounts':
      case 'marketplace':
      case 'special-marketplace':
      case 'boost-accounts':
      case 'telegram-tick':
        return 'accounts';
      case 'esim':
      case 'ng-airtime':
      case 'proxies':
        return 'telecom';
      case 'buy-gift-cards':
      case 'sell-gift-cards':
      case 'worldwide-gifts':
      case 'partner-program':
        return 'gifts';
      case 'tracking-center':
      case 'video-tutorials':
      case 'developer-api':
      case 'transaction-history':
        return 'tools';
      default:
        return 'all';
    }
  };

  const filteredServices = services.filter((s) => {
    if (activeCategory === 'all') return true;
    return getServiceCategory(s.id) === activeCategory;
  });

  const renderIcon = (service: ServiceItem) => {
    const iconClass = "w-6 h-6 stroke-[2.2]";

    switch (service.id) {
      case 'usa-numbers':
        return <Globe className={`${iconClass} text-amber-300`} />;
      case 'log-accounts':
        return <Shield className={`${iconClass} text-blue-400`} />;
      case 'marketplace':
        return <ShoppingBag className={`${iconClass} text-purple-400`} />;
      case 'special-marketplace':
        return <Sparkles className={`${iconClass} text-amber-300`} />;
      case 'buy-numbers':
        return <FileText className={`${iconClass} text-emerald-300`} />;
      case 'boost-accounts':
        return <Users className={`${iconClass} text-blue-300`} />;
      case 'telegram-tick':
        return <Send className={`${iconClass} text-sky-300`} />;
      case 'transaction-history':
        return <Clock className={`${iconClass} text-slate-300`} />;
      case 'rent-number':
        return <Key className={`${iconClass} text-amber-400`} />;
      case 'esim':
        return <Cpu className={`${iconClass} text-indigo-300`} />;
      case 'ng-airtime':
        return <Radio className={`${iconClass} text-emerald-400`} />;
      case 'buy-gift-cards':
      case 'sell-gift-cards':
        return <CreditCard className={`${iconClass} text-amber-300`} />;
      case 'proxies':
        return <ShieldCheck className={`${iconClass} text-blue-300`} />;
      case 'developer-api':
        return <Code2 className={`${iconClass} text-purple-300`} />;
      case 'partner-program':
        return <Award className={`${iconClass} text-amber-400`} />;
      case 'worldwide-gifts':
        return <Gift className={`${iconClass} text-rose-300`} />;
      case 'tracking-center':
        return <Truck className={`${iconClass} text-cyan-300`} />;
      case 'video-tutorials':
        return <PlayCircle className={`${iconClass} text-amber-400`} />;
      default:
        return <Globe className={`${iconClass} text-blue-400`} />;
    }
  };

  const getServiceBadge = (id: ServiceId) => {
    switch (id) {
      case 'usa-numbers':
        return { text: '0s OTP', bg: 'bg-amber-400 text-slate-950 font-black' };
      case 'special-marketplace':
        return { text: 'VIP STORE', bg: 'bg-purple-500 text-white font-extrabold' };
      case 'buy-numbers':
        return { text: 'INSTANT', bg: 'bg-emerald-500 text-white font-bold' };
      case 'log-accounts':
        return { text: 'AGED PVA', bg: 'bg-blue-600 text-white font-bold' };
      case 'esim':
        return { text: '5G GLOBAL', bg: 'bg-indigo-600 text-white font-bold' };
      case 'partner-program':
        return { text: '10% REWARD', bg: 'bg-amber-500 text-slate-950 font-black' };
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-3 sm:py-5 space-y-4 sm:space-y-6">
      {/* ======================================================== */}
      {/* 1. PROMINENT TOP HERO WALLET CARD (MATCHING REFERENCE)   */}
      {/* ======================================================== */}
      <div className="relative rounded-3xl p-5 sm:p-7 bg-gradient-to-br from-[#0f172a] via-[#1e3a8a] to-[#4c1d95] text-white shadow-xl border border-blue-800/50 overflow-hidden">
        {/* Subtle background glow circles */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* Left: Customer Info & Big Balance */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-xs font-mono font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-white/10 text-amber-300 border border-white/15 backdrop-blur-xs">
                {customer?.tier || 'Standard Account'}
              </span>
              <span className="text-[10px] text-blue-200/90 font-medium">
                ● 24/7 Verified Servers Active
              </span>
            </div>

            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-blue-100/90 block">
                Total Available Balance
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl sm:text-4xl md:text-5xl font-black font-mono tracking-tight text-amber-400 drop-shadow-sm">
                  ₦{wallet.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-xs sm:text-sm font-bold text-amber-300/80 uppercase font-mono ml-1">
                  NGN
                </span>
              </div>
            </div>

            <p className="text-xs text-blue-100/80 max-w-md leading-relaxed hidden sm:block">
              Welcome back, <span className="font-bold text-white">{customer?.name || 'Customer'}</span>. Your wallet balance is ready for instant 0-second OTP verifications and verified digital accounts.
            </p>
          </div>

          {/* Right: Quick Action Shortcuts Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 gap-2.5 sm:gap-3 shrink-0">
            {/* Primary Action: Add Money (Gold) */}
            <button
              onClick={() => onOpenFundWallet('manual')}
              className="col-span-2 sm:col-span-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-950/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 group"
            >
              <Plus className="w-4 h-4 stroke-[3] group-hover:rotate-90 transition-transform" />
              <span>Add Money (Bank / Card)</span>
            </button>

            {/* Direct Bank Transfer Shortcut */}
            <button
              onClick={() => onOpenFundWallet('manual')}
              className="py-2.5 px-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs backdrop-blur-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
            >
              <Building2 className="w-4 h-4 text-amber-300" />
              <span>Manual Transfer</span>
            </button>

            {/* Transaction History */}
            <button
              onClick={onOpenHistory}
              className="py-2.5 px-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs backdrop-blur-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
            >
              <Clock className="w-4 h-4 text-blue-200" />
              <span>History</span>
            </button>

            {/* Marketplace Button */}
            <button
              onClick={onOpenMarketplace}
              className="col-span-2 py-2.5 px-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
            >
              <ShoppingBag className="w-4 h-4 text-amber-300" />
              <span>Multi-Provider Numbers Store</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Maintenance alert if any */}
      {maintenanceNotice && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="font-bold">⚠️ Notice:</span>
            <span>{maintenanceNotice}</span>
          </div>
          <button
            onClick={() => setMaintenanceNotice(null)}
            className="text-amber-700 hover:text-amber-900 font-bold px-2 py-0.5 rounded-lg hover:bg-amber-100 text-[11px] cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. CATEGORY FILTER TABS (CLEAN & COMPACT)                */}
      {/* ======================================================== */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`py-2 px-3.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeCategory === cat.id
                ? 'bg-blue-900 text-white shadow-xs'
                : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* ======================================================== */}
      {/* 3. MAIN SERVICES GRID (EVENLY SIZED, CONSISTENT CARDS)   */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4.5">
        {filteredServices.map((service) => {
          const isOnline = service.isEnabled !== false;
          const badge = getServiceBadge(service.id);

          return (
            <button
              key={service.id}
              onClick={() => {
                if (!isOnline) {
                  setMaintenanceNotice(
                    service.statusMessage ||
                    `${service.name} is temporarily under maintenance by administrator.`
                  );
                  return;
                }
                setMaintenanceNotice(null);
                onSelectService(service.id);
              }}
              className={`group bg-white rounded-3xl p-4 sm:p-5 flex flex-col items-center justify-between text-center border shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer active:scale-[0.98] min-h-[140px] relative ${
                isOnline 
                  ? 'border-slate-200/90 hover:border-blue-400/80 hover:bg-gradient-to-b hover:from-white hover:to-blue-50/20' 
                  : 'border-rose-200/80 opacity-70 bg-rose-50/20'
              }`}
            >
              {/* Optional Top Badge */}
              <div className="w-full flex justify-end min-h-[18px]">
                {badge && (
                  <span className={`text-[9px] px-2 py-0.5 rounded-full uppercase shadow-2xs ${badge.bg}`}>
                    {badge.text}
                  </span>
                )}
                {!isOnline && (
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold uppercase">
                    PAUSED
                  </span>
                )}
              </div>

              {/* Icon Container: Brand colors with deep dark slate/navy background */}
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 flex items-center justify-center my-1.5 shadow-sm group-hover:scale-105 transition-transform duration-200 border border-slate-800">
                {renderIcon(service)}
              </div>

              {/* Title & Arrow */}
              <div className="w-full pt-1">
                <span className="text-xs sm:text-sm font-bold text-slate-800 tracking-tight leading-snug group-hover:text-blue-700 transition-colors line-clamp-2">
                  {service.name}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
