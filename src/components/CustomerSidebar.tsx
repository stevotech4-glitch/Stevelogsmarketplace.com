import React from 'react';
import { 
  X, 
  LayoutDashboard, 
  Wallet, 
  Clock, 
  Globe, 
  Shield, 
  Search, 
  Layers, 
  Sparkles, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  Award, 
  Bell, 
  Bot, 
  MessageSquare, 
  HelpCircle, 
  HelpCircle as FaqIcon, 
  User, 
  ShieldCheck, 
  LogOut, 
  Lock,
  ChevronRight,
  ExternalLink,
  MessageCircle,
  Plus,
  Gift,
  Truck,
  PlayCircle,
  Megaphone
} from 'lucide-react';
import { UserWallet, WebsiteMasterSettings, CustomerRecord } from '../types';

export type CustomerPanelTab =
  | 'overview'
  | 'balance'
  | 'recent-activity'
  | 'browse-products'
  | 'special-marketplace'
  | 'browse-logs'
  | 'search-products'
  | 'categories'
  | 'featured-products'
  | 'my-orders'
  | 'profile'
  | 'fund-wallet'
  | 'wallet-transactions'
  | 'rewards'
  | 'notifications'
  | 'announcements'
  | 'order-history'
  | 'successful-orders'
  | 'pending-orders'
  | 'failed-orders'
  | 'worldwide-gifts'
  | 'tracking-center'
  | 'video-tutorials'
  | 'ai-support'
  | 'live-chat'
  | 'whatsapp-support'
  | 'help-center'
  | 'faqs';

interface CustomerSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: CustomerPanelTab;
  onSelectTab: (tab: CustomerPanelTab) => void;
  wallet: UserWallet;
  settings?: WebsiteMasterSettings;
  customer?: CustomerRecord | null;
  onOpenAuth?: (mode?: 'login' | 'register') => void;
  onLogout?: () => void;
}

export const CustomerSidebar: React.FC<CustomerSidebarProps> = ({
  isOpen,
  onClose,
  currentTab,
  onSelectTab,
  wallet,
  settings,
  customer,
  onOpenAuth,
  onLogout,
}) => {
  const handleItemClick = (tab: CustomerPanelTab) => {
    onSelectTab(tab);
    onClose();
  };

  const navSections = [
    {
      title: 'DASHBOARD',
      items: [
        { id: 'overview' as CustomerPanelTab, label: 'Dashboard Overview', icon: LayoutDashboard },
        { id: 'balance' as CustomerPanelTab, label: 'Account Balance', icon: Wallet },
        { id: 'recent-activity' as CustomerPanelTab, label: 'Recent Activity', icon: Clock },
      ],
    },
    {
      title: 'MARKETPLACE SERVICES',
      items: [
        { id: 'special-marketplace' as CustomerPanelTab, label: 'Special Marketplace 2', icon: Sparkles },
        { id: 'browse-products' as CustomerPanelTab, label: 'Browse All Products', icon: Globe },
        { id: 'browse-logs' as CustomerPanelTab, label: 'Browse Available Logs', icon: Shield },
        { id: 'worldwide-gifts' as CustomerPanelTab, label: 'Worldwide Gift Delivery', icon: Gift },
        { id: 'tracking-center' as CustomerPanelTab, label: 'Track an Order', icon: Truck },
        { id: 'video-tutorials' as CustomerPanelTab, label: 'Video Tutorials', icon: PlayCircle },
        { id: 'search-products' as CustomerPanelTab, label: 'Search Products', icon: Search },
        { id: 'categories' as CustomerPanelTab, label: 'Categories', icon: Layers },
        { id: 'featured-products' as CustomerPanelTab, label: 'Featured Products', icon: Sparkles },
        { id: 'my-orders' as CustomerPanelTab, label: 'My Orders', icon: FileText },
      ],
    },
    {
      title: 'ACCOUNT & WALLET',
      items: [
        { id: 'profile' as CustomerPanelTab, label: 'My Profile', icon: User },
        { id: 'fund-wallet' as CustomerPanelTab, label: 'Fund Wallet', icon: Plus },
        { id: 'announcements' as CustomerPanelTab, label: 'Announcements & Updates', icon: Megaphone },
        { id: 'wallet-transactions' as CustomerPanelTab, label: 'Wallet Transactions', icon: TrendingUp },
        { id: 'rewards' as CustomerPanelTab, label: 'Referral & Rewards', icon: Award },
        { id: 'notifications' as CustomerPanelTab, label: 'Notifications', icon: Bell },
      ],
    },
    {
      title: 'ORDER HISTORY',
      items: [
        { id: 'order-history' as CustomerPanelTab, label: 'Order History', icon: FileText },
        { id: 'successful-orders' as CustomerPanelTab, label: 'Successful Orders', icon: CheckCircle2 },
        { id: 'pending-orders' as CustomerPanelTab, label: 'Pending Orders', icon: Clock },
        { id: 'failed-orders' as CustomerPanelTab, label: 'Failed Orders', icon: XCircle },
      ],
    },
    {
      title: 'SUPPORT',
      items: [
        { id: 'ai-support' as CustomerPanelTab, label: 'AI Customer Support', icon: Bot },
        { id: 'live-chat' as CustomerPanelTab, label: 'Live Chat', icon: MessageSquare },
        { id: 'whatsapp-support' as CustomerPanelTab, label: 'WhatsApp Support', icon: MessageCircle },
        { id: 'help-center' as CustomerPanelTab, label: 'Help Center', icon: HelpCircle },
        { id: 'faqs' as CustomerPanelTab, label: 'FAQs', icon: FaqIcon },
      ],
    },
  ];

  return (
    <>
      {/* Dark overlay backdrop for mobile & when sidebar opens */}
      <div
        className={`fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-in sidebar drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 sm:w-80 bg-[#0f172a] text-slate-200 border-r border-slate-800 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header with Brand */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between bg-[#0a0f1d]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black flex items-center justify-center shadow-md font-sans text-sm">
              SL
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-white leading-tight font-sans">
                {settings?.websiteName || 'STEVE LOGS MARKETPLACE'}
              </span>
              <span className="text-[10px] text-amber-400 font-semibold tracking-wide">
                Unified Multi-Provider
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Account / Auth & Wallet Pill Card */}
        <div className="p-4 bg-slate-900/60 border-b border-slate-800 space-y-3">
          {customer ? (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  {customer.name ? customer.name.slice(0, 2).toUpperCase() : 'ST'}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">{customer.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono truncate">{customer.email}</div>
                </div>
              </div>
              {onLogout && (
                <button
                  onClick={() => {
                    onClose();
                    onLogout();
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between gap-2">
              <div className="text-xs text-slate-300 font-medium">Guest User</div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    onClose();
                    onOpenAuth?.('login');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onOpenAuth?.('register');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold cursor-pointer"
                >
                  Register
                </button>
              </div>
            </div>
          )}

          <div className="p-3 rounded-2xl bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-slate-700/60 shadow-sm flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                Wallet Balance
              </span>
              <div className="text-base sm:text-lg font-black text-white font-mono flex items-center gap-1">
                <span>{wallet.currency}</span>
                <span>{wallet.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
            <button
              onClick={() => handleItemClick('fund-wallet')}
              className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs shadow-xs transition-transform active:scale-95 cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Fund</span>
            </button>
          </div>
        </div>

        {/* Scrollable Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin scrollbar-thumb-slate-800">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <div className="px-3 py-1 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                {section.title}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md font-bold'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      <ChevronRight className={`w-3.5 h-3.5 opacity-50 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* WhatsApp Channel & Support Quick Link */}
          <div className="pt-2 border-t border-slate-800 space-y-1">
            <div className="px-3 py-1 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              OFFICIAL CHANNELS
            </div>
            {settings?.whatsappChannelUrl && (
              <a
                href={settings.whatsappChannelUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <ExternalLink className="w-4 h-4 text-emerald-400" />
                  <span>Join VIP Updates Channel</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                  LIVE
                </span>
              </a>
            )}
          </div>
        </div>

        {/* Customer Sidebar Footer */}
        <div className="p-3 bg-[#0a0f1d] border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-medium text-slate-400">Verified Marketplace Node</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">256-bit Encrypted</span>
        </div>
      </aside>
    </>
  );
};
