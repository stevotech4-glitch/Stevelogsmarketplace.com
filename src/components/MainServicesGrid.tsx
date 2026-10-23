import React from 'react';
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
  Sparkles
} from 'lucide-react';
import { ServiceId, ServiceItem } from '../types';
import { MAIN_SERVICES } from '../data/mockData';

interface MainServicesGridProps {
  services?: ServiceItem[];
  onSelectService: (serviceId: ServiceId) => void;
}

export const MainServicesGrid: React.FC<MainServicesGridProps> = ({ 
  services = MAIN_SERVICES, 
  onSelectService 
}) => {
  const [maintenanceNotice, setMaintenanceNotice] = React.useState<string | null>(null);

  const renderIcon = (service: ServiceItem) => {
    const isPrimary = service.isPrimary;
    const iconClass = isPrimary ? "w-6 h-6 text-white stroke-[2]" : "w-6 h-6 text-[#1a73e8] stroke-[2]";

    switch (service.id) {
      case 'usa-numbers':
        return <Globe className={iconClass} />;
      case 'log-accounts':
        return <Shield className={iconClass} />;
      case 'marketplace':
        return <ShoppingBag className={iconClass} />;
      case 'special-marketplace':
        return <Sparkles className={iconClass} />;
      case 'buy-numbers':
        return <FileText className={iconClass} />;
      case 'boost-accounts':
        return <Users className={iconClass} />;
      case 'telegram-tick':
        return <Send className={iconClass} />;
      case 'transaction-history':
        return <FileText className={iconClass} />;
      case 'rent-number':
        return <Key className={iconClass} />;
      case 'esim':
        return <Cpu className={iconClass} />;
      case 'ng-airtime':
        return <Radio className={iconClass} />;
      case 'buy-gift-cards':
        return <CreditCard className={iconClass} />;
      case 'sell-gift-cards':
        return <CreditCard className={iconClass} />;
      case 'proxies':
        return <ShieldCheck className={iconClass} />;
      case 'developer-api':
        return <Code2 className={iconClass} />;
      case 'partner-program':
        return <Award className={iconClass} />;
      case 'worldwide-gifts':
        return <Gift className={iconClass} />;
      case 'tracking-center':
        return <Truck className={iconClass} />;
      case 'video-tutorials':
        return <PlayCircle className={iconClass} />;
      default:
        return <Globe className={iconClass} />;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4">
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

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4.5">
        {services.map((service) => {
          const isPrimary = service.isPrimary;
          const isOnline = service.isEnabled !== false;

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
              className={`group bg-white rounded-2xl p-5 sm:p-6 flex flex-col items-center justify-center text-center shadow-[0_2px_10px_rgba(0,0,0,0.03)] border transition-all duration-200 cursor-pointer active:scale-[0.98] min-h-[145px] relative ${
                isOnline 
                  ? 'border-slate-100 hover:border-blue-200 hover:shadow-md' 
                  : 'border-rose-200/80 opacity-75 bg-rose-50/20'
              }`}
            >
              {!isOnline && (
                <span className="absolute top-2.5 right-2.5 text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-bold">
                  PAUSED
                </span>
              )}

              {/* Circular Icon Container */}
              <div 
                className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-transform duration-200 group-hover:scale-105 ${
                  !isOnline
                    ? 'bg-slate-150 text-slate-400'
                    : isPrimary 
                    ? 'bg-[#1a73e8] shadow-[0_4px_12px_rgba(26,115,232,0.35)]' 
                    : 'bg-[#e8f1fd]'
                }`}
              >
                {renderIcon(service)}
              </div>

              {/* Service Title */}
              <span className="text-sm font-semibold text-slate-800 tracking-tight leading-snug group-hover:text-blue-600 transition-colors">
                {service.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
