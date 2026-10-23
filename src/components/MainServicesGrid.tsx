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
  Headphones,
  Zap,
  MessageCircle,
  PhoneCall
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
    { id: 'numbers', label: 'Virtual Numbers' },
    { id: 'accounts', label: 'Accounts & Logs' },
    { id: 'telecom', label: 'eSIM & Telecom' },
    { id: 'gifts', label: 'Gift Cards' },
    { id: 'tools', label: 'Tools & Tracking' },
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

  const getServiceDescription = (id: ServiceId): string => {
    switch (id) {
      case 'usa-numbers':
        return '0s OTP Verification';
      case 'buy-numbers':
        return '50+ Global Countries';
      case 'log-accounts':
        return 'Aged PVA Accounts';
      case 'special-marketplace':
        return 'Curated VIP Accounts';
      case 'marketplace':
        return 'Multi-Server Store';
      case 'boost-accounts':
        return 'Followers, Likes & Views';
      case 'telegram-tick':
        return 'Stars, Premium & Badges';
      case 'rent-number':
        return 'Long-Term SMS Rental';
      case 'esim':
        return 'Global 5G Roaming';
      case 'ng-airtime':
        return 'Instant VTU Topup';
      case 'buy-gift-cards':
        return 'Instant Codes & Cards';
      case 'sell-gift-cards':
        return 'Instant Cash in NGN';
      case 'proxies':
        return 'Residential & ISP';
      case 'developer-api':
        return 'Reseller API Docs';
      case 'partner-program':
        return 'Earn 10% Referral Reward';
      case 'worldwide-gifts':
        return 'Global Physical Delivery';
      case 'tracking-center':
        return 'Live Order Dispatch';
      case 'video-tutorials':
        return 'Video Guides & Setup';
      case 'transaction-history':
        return 'Receipts & Audit Log';
      default:
        return 'Instant Digital Delivery';
    }
  };

  const renderIcon = (service: ServiceItem) => {
    const iconClass = "w-6 h-6 stroke-[2.2]";

    switch (service.id) {
      case 'usa-numbers':
        return <Globe className={`${iconClass} text-amber-400`} />;
      case 'log-accounts':
        return <Shield className={`${iconClass} text-blue-400`} />;
      case 'marketplace':
        return <ShoppingBag className={`${iconClass} text-purple-400`} />;
      case 'special-marketplace':
        return <Sparkles className={`${iconClass} text-amber-300`} />;
      case 'buy-numbers':
        return <FileText className={`${iconClass} text-emerald-400`} />;
      case 'boost-accounts':
        return <Users className={`${iconClass} text-blue-300`} />;
      case 'telegram-tick':
        return <Send className={`${iconClass} text-sky-400`} />;
      case 'transaction-history':
        return <Clock className={`${iconClass} text-amber-300`} />;
      case 'rent-number':
        return <Key className={`${iconClass} text-amber-400`} />;
      case 'esim':
        return <Cpu className={`${iconClass} text-indigo-400`} />;
      case 'ng-airtime':
        return <Radio className={`${iconClass} text-emerald-400`} />;
      case 'buy-gift-cards':
      case 'sell-gift-cards':
        return <CreditCard className={`${iconClass} text-amber-400`} />;
      case 'proxies':
        return <ShieldCheck className={`${iconClass} text-blue-400`} />;
      case 'developer-api':
        return <Code2 className={`${iconClass} text-purple-400`} />;
      case 'partner-program':
        return <Award className={`${iconClass} text-amber-400`} />;
      case 'worldwide-gifts':
        return <Gift className={`${iconClass} text-rose-400`} />;
      case 'tracking-center':
        return <Truck className={`${iconClass} text-cyan-400`} />;
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
        return { text: 'VIP STORE', bg: 'bg-purple-600 text-white font-extrabold' };
      case 'buy-numbers':
        return { text: 'INSTANT', bg: 'bg-emerald-500 text-white font-bold' };
      case 'log-accounts':
        return { text: 'AGED PVA', bg: 'bg-blue-600 text-white font-bold' };
      case 'esim':
        return { text: '5G GLOBAL', bg: 'bg-indigo-600 text-white font-bold' };
      case 'partner-program':
        return { text: '10% BONUS', bg: 'bg-amber-500 text-slate-950 font-black' };
      case 'boost-accounts':
        return { text: 'ACTIVE', bg: 'bg-sky-500 text-white font-bold' };
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-3 sm:py-5 space-y-4 sm:space-y-6">
      {/* ======================================================== */}
      {/* 1. PROMINENT TOP HERO WALLET CARD (MATCHING REFERENCE)   */}
      {/* ======================================================== */}
      <div className="relative rounded-3xl p-5 sm:p-7 bg-gradient-to-br from-[#070e24] via-[#0d1a45] to-[#1e0e3a] text-white shadow-xl border border-amber-400/30 overflow-hidden">
        {/* Subtle background glow circles */}
        <div className="absolute -top-12 -right-12 w-52 h-52 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-52 h-52 bg-purple-600/25 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* Left: Customer Info & Big Balance */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] sm:text-xs font-mono font-black tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 shadow-xs">
                {customer?.tier || 'Verified Customer'}
              </span>
              <span className="text-[11px] text-emerald-300 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                24/7 Server Verification Active
              </span>
            </div>

            <div className="space-y-0.5">
              <span className="text-xs font-bold text-blue-200 tracking-wide block">
                Total Available Balance
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl sm:text-4xl md:text-5xl font-black font-mono tracking-tight text-amber-400 drop-shadow-md">
                  ₦{wallet.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-xs sm:text-sm font-black text-amber-300/90 uppercase font-mono tracking-wider">
                  NGN
                </span>
              </div>
            </div>

            <p className="text-xs text-blue-100/90 max-w-md leading-relaxed hidden sm:block">
              Welcome, <span className="font-bold text-amber-300">{customer?.name || 'Valued Customer'}</span>. Instant OTP delivery, aged log accounts, and manual bank funding ready.
            </p>
          </div>

          {/* Right: Quick Action Shortcuts Grid (Clean 2x2 row/grid) */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 gap-2.5 sm:gap-3 shrink-0">
            {/* Primary Action: Add Money (Vibrant Gold) */}
            <button
              onClick={() => onOpenFundWallet('manual')}
              className="col-span-2 sm:col-span-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-950/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 group"
            >
              <Plus className="w-4 h-4 stroke-[3] group-hover:rotate-90 transition-transform" />
              <span>Add Money</span>
            </button>

            {/* Direct Manual Bank Transfer Shortcut */}
            <button
              onClick={() => onOpenFundWallet('manual')}
              className="py-2.5 px-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs backdrop-blur-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
              title="Manual Bank Transfer (0% Fee)"
            >
              <Building2 className="w-4 h-4 text-amber-300" />
              <span>Bank Transfer</span>
            </button>

            {/* Transaction History */}
            <button
              onClick={onOpenHistory}
              className="py-2.5 px-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs backdrop-blur-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
            >
              <Clock className="w-4 h-4 text-blue-300" />
              <span>History</span>
            </button>

            {/* Multi-Provider Numbers Store */}
            <button
              onClick={onOpenMarketplace}
              className="col-span-2 py-2.5 px-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
            >
              <ShoppingBag className="w-4 h-4 text-amber-300" />
              <span>Multi-Provider Numbers</span>
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
                ? 'bg-blue-900 text-white shadow-xs border-b-2 border-amber-400'
                : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* ======================================================== */}
      {/* 3. MAIN SERVICES GRID (EVENLY SIZED, BALANCED CARDS)     */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {filteredServices.map((service) => {
          const isOnline = service.isEnabled !== false;
          const badge = getServiceBadge(service.id);
          const desc = getServiceDescription(service.id);

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
              className={`group bg-white rounded-3xl p-3.5 sm:p-4.5 flex flex-col items-center justify-between text-center border shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer active:scale-[0.98] min-h-[145px] sm:min-h-[155px] relative ${
                isOnline 
                  ? 'border-slate-200/90 hover:border-amber-400/80 hover:bg-gradient-to-b hover:from-white hover:to-amber-50/10' 
                  : 'border-rose-200/80 opacity-70 bg-rose-50/20'
              }`}
            >
              {/* Top Badge (keeps uniform vertical alignment) */}
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

              {/* Icon Container: Brand colors with deep dark slate/navy gradient */}
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-slate-950 via-[#0e1a3d] to-[#1c1236] flex items-center justify-center my-1.5 shadow-sm group-hover:scale-105 transition-transform duration-200 border border-slate-800">
                {renderIcon(service)}
              </div>

              {/* Title & Sub-caption */}
              <div className="w-full pt-0.5 space-y-0.5">
                <span className="text-xs sm:text-sm font-black text-slate-800 tracking-tight leading-snug group-hover:text-blue-700 transition-colors line-clamp-1 block">
                  {service.name}
                </span>
                <span className="text-[10px] text-slate-400 font-medium line-clamp-1 block">
                  {desc}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* 4. COMPACT 24/7 SUPPORT & WHATSAPP DESK BANNER           */}
      {/* ======================================================== */}
      <div className="rounded-2xl p-3.5 sm:p-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm border border-blue-800/40">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 font-bold shadow-xs">
            <Headphones className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center justify-center sm:justify-start gap-1.5">
              <span>Official 24/7 Verified Support Desk</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded-full">
                ONLINE
              </span>
            </div>
            <p className="text-[11px] text-blue-200/80">
              WhatsApp: 08152784536 • Direct Calls: 09032912046 • Instant OTP Assistance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href="https://wa.me/2348152784536?text=Hello%20Steve%20Logs%20Marketplace%20Support,%20I%20need%20assistance"
            target="_blank"
            rel="noreferrer"
            className="py-2 px-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Chat WhatsApp</span>
          </a>
          <button
            onClick={onOpenSupport}
            className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all cursor-pointer"
          >
            Help Center
          </button>
        </div>
      </div>
    </div>
  );
};
