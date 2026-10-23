import React from 'react';
import { X, Download, Smartphone, Apple, CheckCircle2 } from 'lucide-react';

interface AppDownloadModalProps {
  onClose: () => void;
}

export const AppDownloadModal: React.FC<AppDownloadModalProps> = ({ onClose }) => {
  const [downloadSuccess, setDownloadSuccess] = React.useState(false);

  const handleDownload = () => {
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 4000);
  };
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex justify-center p-3 sm:p-5">
      <div 
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <Download className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 font-sans">Install Stevelogs Mobile App</h2>
              <p className="text-xs text-slate-500 font-sans">Faster access, SMS push alerts & offline tools</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {downloadSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Starting Stevelogs APK download (12.4 MB)...</span>
            </div>
          )}

          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="w-6 h-6 text-blue-600" />
              <div>
                <span className="text-xs font-bold text-slate-900 block">Android APK</span>
                <span className="text-[11px] text-slate-500">Version 2.4.1 (Direct Download)</span>
              </div>
            </div>
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              Download
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Apple className="w-6 h-6 text-slate-800" />
              <div>
                <span className="text-xs font-bold text-slate-900 block">iOS (iPhone & iPad)</span>
                <span className="text-[11px] text-slate-500">Install via Safari & Share menu</span>
              </div>
            </div>
            <span className="text-xs font-mono text-blue-600 font-semibold">PWA Ready</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 text-[11px] text-slate-500 leading-relaxed">
            💡 On iOS: Tap the <strong>Share</strong> button at the bottom of Safari, then select <strong>"Add to Home Screen"</strong> for a native full-screen app experience.
          </div>
        </div>
      </div>
    </div>
  );
};
