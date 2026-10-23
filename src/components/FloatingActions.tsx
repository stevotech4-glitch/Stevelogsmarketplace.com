import React from 'react';
import { Trophy, Headphones, Download } from 'lucide-react';

interface FloatingActionsProps {
  onOpenPartner: () => void;
  onOpenSupport: () => void;
  onOpenDownload: () => void;
}

export const FloatingActions: React.FC<FloatingActionsProps> = ({
  onOpenPartner,
  onOpenSupport,
  onOpenDownload,
}) => {
  return (
    <div className="fixed bottom-5 right-4 sm:right-6 z-40 flex flex-col items-center gap-2.5">
      {/* 1. Amber Rewards / Partner Trophy Button */}
      <button
        onClick={onOpenPartner}
        className="w-12 h-12 rounded-full bg-[#f59e0b] hover:bg-[#d97706] text-slate-900 shadow-[0_4px_14px_rgba(245,158,11,0.4)] flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer"
        title="Partner & Rewards Program"
        aria-label="Rewards"
      >
        <Trophy className="w-5 h-5 text-slate-950 fill-slate-950/20 stroke-[2.2]" />
      </button>

      {/* 2. Navy Support / Headphones Button (with red notification badge) */}
      <button
        onClick={onOpenSupport}
        className="relative w-12 h-12 rounded-full bg-[#1e293b] hover:bg-[#0f172a] text-white shadow-[0_4px_14px_rgba(30,41,59,0.4)] flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer"
        title="Live Customer Support"
        aria-label="Live Support"
      >
        <Headphones className="w-5 h-5 text-white stroke-[2.2]" />
        {/* Red notification dot */}
        <span className="absolute top-1 right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white" />
      </button>

      {/* 3. Blue App Download Button */}
      <button
        onClick={onOpenDownload}
        className="w-12 h-12 rounded-full bg-[#1a73e8] hover:bg-[#1557b0] text-white shadow-[0_4px_14px_rgba(26,115,232,0.4)] flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer"
        title="Download Stevelogs Mobile App"
        aria-label="Download App"
      >
        <Download className="w-5 h-5 text-white stroke-[2.5]" />
      </button>
    </div>
  );
};
