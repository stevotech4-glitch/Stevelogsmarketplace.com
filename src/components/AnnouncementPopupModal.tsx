import React, { useState } from 'react';
import { 
  X, 
  Megaphone, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  ExternalLink, 
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Bell
} from 'lucide-react';
import { AnnouncementItem } from '../types';

interface AnnouncementPopupModalProps {
  announcements: AnnouncementItem[];
  onClose: () => void;
  onDismissAnnouncement: (id: string) => void;
}

export const AnnouncementPopupModal: React.FC<AnnouncementPopupModalProps> = ({
  announcements,
  onClose,
  onDismissAnnouncement,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);

  if (!announcements || announcements.length === 0) return null;

  const current = announcements[currentIndex] || announcements[0];
  const isMultiple = announcements.length > 1;

  const handleNext = () => {
    setExpanded(false);
    setCurrentIndex((prev) => (prev + 1) % announcements.length);
  };

  const handlePrev = () => {
    setExpanded(false);
    setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length);
  };

  const handleDismissCurrent = () => {
    onDismissAnnouncement(current.id);
    if (announcements.length <= 1) {
      onClose();
    } else {
      handleNext();
    }
  };

  const isLongContent = current.content && current.content.length > 180;
  const displayContent = isLongContent && !expanded 
    ? `${current.content.slice(0, 180)}...` 
    : current.content;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex justify-center items-center p-3 sm:p-5">
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner Image if available */}
        {current.imageUrl ? (
          <div className="relative w-full h-44 sm:h-52 bg-slate-900 overflow-hidden">
            <img
              src={current.imageUrl}
              alt={current.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Hide broken banner cleanly
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            
            <div className="absolute top-3 right-3 flex items-center gap-1.5">
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] tracking-wider uppercase">
                  {current.isImportant ? 'Important Notice' : 'Official Announcement'}
                </span>
                {isMultiple && (
                  <span className="text-xs text-white/80 font-mono">
                    {currentIndex + 1} of {announcements.length}
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="px-5 py-4 bg-gradient-to-r from-[#0a192f] via-[#1e3a8a] to-[#0a192f] text-white flex items-center justify-between border-b border-blue-900">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 font-black flex items-center justify-center shadow-md">
                <Megaphone className="w-5 h-5 text-slate-950" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-amber-300 block">
                  {current.isImportant ? 'Important Update' : 'Marketplace Notice'}
                </span>
                <span className="text-xs text-blue-200">
                  {isMultiple ? `Update ${currentIndex + 1} of ${announcements.length}` : 'Latest Update'}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-blue-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-snug">
              {current.title}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 font-mono">
              <Calendar className="w-3.5 h-3.5" />
              <span>{new Date(current.startDate || current.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
            </div>
          </div>

          <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-2">
            <p className="whitespace-pre-line">{displayContent}</p>
            {isLongContent && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
              >
                {expanded ? 'Show Less' : 'Read More'}
              </button>
            )}
          </div>

          {/* Multiple Announcements Dots Navigator */}
          {isMultiple && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                onClick={handlePrev}
                className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev</span>
              </button>

              <div className="flex items-center gap-1.5">
                {announcements.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setExpanded(false);
                      setCurrentIndex(idx);
                    }}
                    className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                      currentIndex === idx ? 'bg-blue-600 w-5' : 'bg-slate-200 hover:bg-slate-300'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={handleNext}
                className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between gap-3">
          <button
            onClick={handleDismissCurrent}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            Don't show this again
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95"
          >
            Continue to Marketplace
          </button>
        </div>
      </div>
    </div>
  );
};
