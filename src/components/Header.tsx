import { 
  ChevronLeft, 
  Wallet, 
  Plus, 
  ShieldCheck, 
  SlidersHorizontal, 
  MessageCircle, 
  Send, 
  User, 
  Zap,
  LogIn,
  LogOut,
  Megaphone,
  Bell
} from 'lucide-react';
import { UserWallet, WebsiteMasterSettings, CustomerRecord } from '../types';

interface HeaderProps {
  wallet: UserWallet;
  settings?: WebsiteMasterSettings;
  customer?: CustomerRecord | null;
  onOpenFundWallet: () => void;
  onOpenProfile?: () => void;
  onOpenMarketplace?: () => void;
  onOpenAnnouncements?: () => void;
  hasAnnouncements?: boolean;
  onToggleSidebar?: () => void;
  onOpenAuth?: (mode?: 'login' | 'register') => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  wallet,
  settings,
  customer,
  onOpenFundWallet,
  onOpenProfile,
  onOpenMarketplace,
  onOpenAnnouncements,
  hasAnnouncements,
  onToggleSidebar,
  onOpenAuth,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full bg-[#f8fafc]/95 backdrop-blur-md border-b border-slate-200/80 px-3 sm:px-6 py-2.5 sm:py-3 transition-all">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
        {/* Left side: Hamburger Menu & Marketplace Brand Title with Logo */}
        <div className="flex items-center gap-2 sm:gap-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="w-9 h-9 rounded-xl bg-white shadow-xs border border-slate-200/90 flex items-center justify-center text-slate-800 hover:text-blue-600 hover:border-amber-400 transition-colors cursor-pointer"
              aria-label="Open Navigation Menu"
              title="Menu"
            >
              <div className="w-4 flex flex-col gap-1 items-center justify-center">
                <span className="w-4 h-0.5 bg-slate-700 rounded-full"></span>
                <span className="w-3.5 h-0.5 bg-amber-500 rounded-full"></span>
                <span className="w-4 h-0.5 bg-slate-700 rounded-full"></span>
              </div>
            </button>
          )}

          <div className="flex items-center gap-2.5">
            <img
              src="/stevelogs-logo.png"
              alt="Steve Logs Marketplace Logo"
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl object-contain ring-1 ring-amber-400/50 shadow-xs shrink-0 bg-slate-950/5"
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <h1 className="text-base sm:text-lg md:text-xl font-black tracking-tight text-slate-900 font-sans leading-tight">
                  STEVE LOGS
                </h1>
                <span className="text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-md bg-amber-400 text-slate-950 uppercase tracking-wide">
                  MARKETPLACE
                </span>
              </div>
              <span className="text-[10px] font-semibold text-blue-700 tracking-wide font-sans flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                {settings?.tagline || 'Fast • Safe • Reliable Digital Services'}
              </span>
            </div>
          </div>
        </div>

        {/* Center / Quick Channel & Support Links */}
        <div className="hidden md:flex items-center gap-2">
          {settings?.whatsappSupportEnabled && (
            <a
              href={`https://wa.me/${settings.whatsappSupportNumber.replace(/\D/g, '')}?text=${encodeURIComponent(
                settings.whatsappWelcomeMessage
              )}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold transition-colors"
              title="Official WhatsApp Support"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600/20" />
              <span>WhatsApp Desk</span>
            </a>
          )}

          {settings?.whatsappChannelEnabled && (
            <a
              href={settings.whatsappChannelUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-semibold transition-colors"
              title="Official WhatsApp Channel"
            >
              <Send className="w-3.5 h-3.5 text-blue-600" />
              <span>VIP Channel</span>
            </a>
          )}

          {onOpenMarketplace && (
            <button
              onClick={onOpenMarketplace}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 fill-slate-950" />
              <span>Multi-Provider Numbers</span>
            </button>
          )}
        </div>

        {/* Right side: Wallet balance, Fund, Profile & Admin */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Balance chip */}
          <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-slate-950 text-white border border-slate-800 shadow-xs text-xs font-semibold">
            <Wallet className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="font-mono font-bold tracking-tight text-amber-300">
              {wallet.currency}{wallet.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Quick Fund Button (Gold Brand Theme) */}
          <button
            onClick={onOpenFundWallet}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black shadow-xs text-xs transition-all cursor-pointer active:scale-95"
            title="Fund Wallet (Manual Bank Transfer or Card)"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span className="hidden sm:inline">Add Money</span>
            <span className="sm:hidden text-[11px]">Add</span>
          </button>

          {/* Announcements & Updates Bell Button */}
          {onOpenAnnouncements && (
            <button
              onClick={onOpenAnnouncements}
              className="relative p-1.5 sm:px-2.5 sm:py-1.5 rounded-full bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200 shadow-xs text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
              title="Announcements & Platform Updates"
            >
              <Megaphone className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden md:inline text-[11px]">Updates</span>
              {hasAnnouncements && (
                <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                </span>
              )}
            </button>
          )}

          {/* Customer Profile or Sign In Button */}
          {customer ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={onOpenProfile}
                className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors cursor-pointer border border-slate-200"
                title={`${customer.name} (${customer.email}) - Open Account`}
              >
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center">
                  {customer.name ? customer.name.slice(0, 2).toUpperCase() : 'ST'}
                </div>
                <span className="text-xs font-bold max-w-[80px] sm:max-w-[120px] truncate hidden sm:inline">
                  {customer.name}
                </span>
              </button>

              {onLogout && (
                <button
                  onClick={onLogout}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-rose-100 hover:text-rose-600 text-slate-500 flex items-center justify-center transition-colors cursor-pointer border border-slate-200"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onOpenAuth?.('login')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-xs text-xs font-semibold transition-colors cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-blue-600" />
                <span>Sign In</span>
              </button>
              <button
                onClick={() => onOpenAuth?.('register')}
                className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <span>Register</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
