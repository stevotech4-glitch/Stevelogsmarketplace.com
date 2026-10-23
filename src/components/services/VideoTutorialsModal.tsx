import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  RotateCcw, 
  Search, 
  X, 
  PlayCircle, 
  Clock, 
  Eye, 
  Sparkles, 
  ExternalLink, 
  CheckCircle2, 
  Film, 
  HelpCircle, 
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  SlidersHorizontal,
  Layers,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { VideoTutorial, ServiceId } from '../../types';

interface VideoTutorialsModalProps {
  onClose: () => void;
  onSelectService?: (serviceId: ServiceId) => void;
  initialTutorialId?: string;
}

export const VideoTutorialsModal: React.FC<VideoTutorialsModalProps> = ({
  onClose,
  onSelectService,
  initialTutorialId,
}) => {
  const [tutorials, setTutorials] = useState<VideoTutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search and Category Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Currently Selected / Playing Video
  const [activeTutorial, setActiveTutorial] = useState<VideoTutorial | null>(null);

  // Custom Video Player Controls State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [videoError, setVideoError] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  // Fetch published tutorials from backend
  const fetchTutorials = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/tutorials');
      if (!res.ok) throw new Error('Failed to load video tutorials');
      const data: VideoTutorial[] = await res.json();
      setTutorials(data);

      if (data.length > 0) {
        if (initialTutorialId) {
          const matched = data.find((t) => t.id === initialTutorialId);
          setActiveTutorial(matched || data[0]);
        } else {
          setActiveTutorial(data[0]);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Unable to connect to tutorials service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTutorials();
  }, [initialTutorialId]);

  // Record view on tutorial switch
  useEffect(() => {
    if (activeTutorial?.id) {
      fetch(`/api/tutorials/${activeTutorial.id}/view`, { method: 'POST' }).catch(() => {});
      // Reset player state
      setIsPlaying(false);
      setCurrentTime(0);
      setVideoError(false);
    }
  }, [activeTutorial?.id]);

  // Derived categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    tutorials.forEach((t) => {
      if (t.category) set.add(t.category);
    });
    return Array.from(set);
  }, [tutorials]);

  // Filtered tutorials
  const filteredTutorials = useMemo(() => {
    return tutorials.filter((t) => {
      const matchesCategory = selectedCategory === 'all' || t.category.toLowerCase() === selectedCategory.toLowerCase();
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch = !query || 
        t.title.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        (t.category && t.category.toLowerCase().includes(query));
      return matchesCategory && matchesSearch;
    });
  }, [tutorials, selectedCategory, searchQuery]);

  // Helper for YouTube embed URL conversion
  const getEmbedUrl = (url: string): string | null => {
    if (!url) return null;
    // YouTube
    const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const ytMatch = url.match(ytRegex);
    if (ytMatch && ytMatch[1]) {
      return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0&modestbranding=1`;
    }
    // Vimeo
    const vimeoRegex = /(?:vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+))/;
    const vimeoMatch = url.match(vimeoRegex);
    if (vimeoMatch && vimeoMatch[3]) {
      return `https://player.vimeo.com/video/${vimeoMatch[3]}?autoplay=1`;
    }
    return null;
  };

  const isEmbedVideo = useMemo(() => {
    if (!activeTutorial?.videoUrl) return false;
    return activeTutorial.videoType === 'embed' || Boolean(getEmbedUrl(activeTutorial.videoUrl));
  }, [activeTutorial]);

  const embedSrc = useMemo(() => {
    if (!activeTutorial?.videoUrl) return '';
    const converted = getEmbedUrl(activeTutorial.videoUrl);
    if (converted) return converted;
    if (activeTutorial.videoType === 'embed') return activeTutorial.videoUrl;
    return '';
  }, [activeTutorial]);

  // Player controls handlers
  const handleTogglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleToggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !videoRef.current.muted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const handleVolumeChange = (newVol: number) => {
    if (!videoRef.current) return;
    videoRef.current.volume = newVol;
    setVolume(newVol);
    setIsMuted(newVol === 0);
  };

  const handleSeek = (newTime: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleSpeedChange = (rate: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSpeedMenu(false);
  };

  const handleToggleFullscreen = () => {
    if (!videoRef.current) return;
    if (!document.fullscreenElement) {
      videoRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const formatSeconds = (sec: number) => {
    if (isNaN(sec)) return '0:00';
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Navigate to previous/next tutorial
  const currentIndex = activeTutorial ? filteredTutorials.findIndex((t) => t.id === activeTutorial.id) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < filteredTutorials.length - 1;

  const handlePrev = () => {
    if (hasPrev) {
      setActiveTutorial(filteredTutorials[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      setActiveTutorial(filteredTutorials[currentIndex + 1]);
    }
  };

  // Map serviceId to readable name for quick action button
  const getServiceName = (serviceId?: string) => {
    if (!serviceId) return null;
    switch (serviceId) {
      case 'usa-numbers':
      case 'buy-numbers':
        return 'Open Virtual Numbers';
      case 'log-accounts':
      case 'marketplace':
        return 'Browse Log Accounts';
      case 'fund-wallet':
      case 'wallet':
        return 'Fund Wallet Now';
      case 'telegram-tick':
        return 'Telegram Verification';
      case 'esim':
        return 'Get Global eSIM';
      case 'boost-accounts':
        return 'Boost Socials';
      case 'buy-gift-cards':
      case 'sell-gift-cards':
        return 'Exchange Gift Cards';
      case 'proxies':
        return 'Buy Proxies';
      case 'tracking-center':
        return 'Track Your Order';
      default:
        return 'Launch Feature';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-6xl max-h-[96vh] bg-white rounded-3xl shadow-2xl flex flex-col border border-slate-200 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Top Header */}
        <header className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/70 via-white to-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#1a73e8] text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <PlayCircle className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Video Tutorials & Guides
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-[#1a73e8] text-[10px] sm:text-xs font-semibold">
                  Official STEVELOGS Help
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Master how to buy virtual numbers, receive instant OTPs, purchase aged logs, fund wallets, and track orders.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              title="Return to Marketplace Homepage"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return Home</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Modal Subheader: Search Bar & Category Filters */}
        <div className="px-4 sm:px-6 py-3 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tutorial by title, keyword, or service..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Categories Scrollable Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-[#1a73e8] text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              All ({tutorials.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl font-medium transition-all shrink-0 cursor-pointer ${
                  selectedCategory.toLowerCase() === cat.toLowerCase()
                    ? 'bg-[#1a73e8] text-white font-semibold shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Modal Body: Theater Player + Tutorial Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-sm font-semibold text-slate-600">Loading STEVELOGS Video Guides...</p>
            </div>
          ) : error ? (
            <div className="py-16 px-4 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3 max-w-md mx-auto">
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
              <h3 className="text-sm font-bold text-rose-900">Failed to Load Video Tutorials</h3>
              <p className="text-xs text-rose-700">{error}</p>
              <button
                onClick={fetchTutorials}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                Retry Loading
              </button>
            </div>
          ) : filteredTutorials.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No tutorials found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No published video tutorials matched "{searchQuery}" in category "{selectedCategory}".
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="px-4 py-2 rounded-xl bg-blue-50 text-[#1a73e8] text-xs font-bold hover:bg-blue-100 transition-colors cursor-pointer"
              >
                Reset Search Filters
              </button>
            </div>
          ) : (
            <>
              {/* Theater Mode Active Video Section */}
              {activeTutorial && (
                <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-lg border border-slate-800 text-white">
                  {/* Video Viewport Container */}
                  <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
                    {isEmbedVideo && embedSrc ? (
                      <iframe
                        src={embedSrc}
                        title={activeTutorial.title}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <>
                        <video
                          ref={videoRef}
                          src={activeTutorial.videoUrl}
                          poster={activeTutorial.thumbnailUrl}
                          playsInline
                          crossOrigin="anonymous"
                          onTimeUpdate={() => {
                            if (videoRef.current) {
                              setCurrentTime(videoRef.current.currentTime);
                            }
                          }}
                          onLoadedMetadata={() => {
                            if (videoRef.current) {
                              setDuration(videoRef.current.duration);
                            }
                          }}
                          onPlay={() => setIsPlaying(true)}
                          onPause={() => setIsPlaying(false)}
                          onError={() => setVideoError(true)}
                          className="w-full h-full object-contain cursor-pointer"
                          onClick={handleTogglePlay}
                        />

                        {/* Video Error Message Fallback */}
                        {videoError && (
                          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-4 text-center space-y-2">
                            <AlertCircle className="w-8 h-8 text-amber-400" />
                            <p className="text-xs sm:text-sm font-semibold text-slate-200">
                              Direct video stream preview unavailable
                            </p>
                            <p className="text-[11px] text-slate-400 max-w-md">
                              This video source can still be opened directly or tested via admin dashboard.
                            </p>
                            {activeTutorial.videoUrl && (
                              <a
                                href={activeTutorial.videoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-1.5 mt-1"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Open Video Source</span>
                              </a>
                            )}
                          </div>
                        )}

                        {/* Large Play Button Overlay when paused */}
                        {!isPlaying && !videoError && (
                          <button
                            onClick={handleTogglePlay}
                            className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors group cursor-pointer"
                            aria-label="Play video"
                          >
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#1a73e8]/90 group-hover:bg-[#1a73e8] text-white flex items-center justify-center shadow-xl transform transition-transform group-hover:scale-110">
                              <Play className="w-7 h-7 sm:w-9 sm:h-9 ml-1 fill-white" />
                            </div>
                          </button>
                        )}

                        {/* Custom Player Control Bar */}
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-3 sm:p-4 space-y-2">
                          {/* Scrub Bar Slider */}
                          <div className="relative w-full flex items-center group cursor-pointer">
                            <input
                              type="range"
                              min={0}
                              max={duration || 100}
                              value={currentTime}
                              onChange={(e) => handleSeek(parseFloat(e.target.value))}
                              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#1a73e8] group-hover:h-2 transition-all"
                            />
                          </div>

                          {/* Controls Row */}
                          <div className="flex items-center justify-between text-xs text-slate-200">
                            <div className="flex items-center gap-3">
                              {/* Play / Pause */}
                              <button
                                onClick={handleTogglePlay}
                                className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                                title={isPlaying ? 'Pause' : 'Play'}
                              >
                                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                              </button>

                              {/* Replay 10s */}
                              <button
                                onClick={() => handleSeek(Math.max(0, currentTime - 10))}
                                className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                                title="Rewind 10 seconds"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>

                              {/* Volume & Mute */}
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={handleToggleMute}
                                  className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                                >
                                  {isMuted || volume === 0 ? (
                                    <VolumeX className="w-4 h-4 text-rose-400" />
                                  ) : (
                                    <Volume2 className="w-4 h-4" />
                                  )}
                                </button>
                                <input
                                  type="range"
                                  min={0}
                                  max={1}
                                  step={0.05}
                                  value={isMuted ? 0 : volume}
                                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                                  className="w-14 sm:w-20 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#1a73e8]"
                                />
                              </div>

                              {/* Time Display */}
                              <span className="font-mono text-[11px] text-slate-300">
                                {formatSeconds(currentTime)} / {formatSeconds(duration || 0)}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Playback Speed Menu */}
                              <div className="relative">
                                <button
                                  onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                                  className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-[11px] font-mono font-bold cursor-pointer"
                                  title="Playback Speed"
                                >
                                  {playbackRate}x
                                </button>
                                {showSpeedMenu && (
                                  <div className="absolute bottom-8 right-0 bg-slate-800 border border-slate-700 rounded-xl p-1 shadow-xl flex flex-col z-20">
                                    {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
                                      <button
                                        key={rate}
                                        onClick={() => handleSpeedChange(rate)}
                                        className={`px-3 py-1 text-left text-xs rounded-lg hover:bg-blue-600/30 cursor-pointer ${
                                          playbackRate === rate ? 'text-blue-400 font-bold' : 'text-slate-300'
                                        }`}
                                      >
                                        {rate}x
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Fullscreen */}
                              <button
                                onClick={handleToggleFullscreen}
                                className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                                title="Fullscreen"
                              >
                                <Maximize className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Active Video Info & Next/Prev Controls */}
                  <div className="p-4 sm:p-5 bg-slate-900 border-t border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[11px] font-semibold">
                          {activeTutorial.category}
                        </span>
                        {activeTutorial.duration && (
                          <span className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                            <Clock className="w-3 h-3" />
                            {activeTutorial.duration}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Eye className="w-3 h-3" />
                          {(activeTutorial.viewsCount || 0).toLocaleString()} views
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
                        {activeTutorial.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
                        {activeTutorial.description}
                      </p>
                    </div>

                    {/* Action Buttons: Try This Service + Prev/Next Video */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {activeTutorial.serviceId && onSelectService && getServiceName(activeTutorial.serviceId) && (
                        <button
                          onClick={() => {
                            const svcId = activeTutorial.serviceId as ServiceId;
                            onClose();
                            onSelectService(svcId);
                          }}
                          className="px-3.5 py-2 rounded-xl bg-[#1a73e8] hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/25 flex items-center gap-1.5 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{getServiceName(activeTutorial.serviceId)}</span>
                        </button>
                      )}

                      <div className="flex items-center gap-1 bg-slate-800 rounded-xl p-1 border border-slate-700">
                        <button
                          onClick={handlePrev}
                          disabled={!hasPrev}
                          className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                          title="Previous Tutorial"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-[11px] font-mono px-2 text-slate-400">
                          {currentIndex + 1} / {filteredTutorials.length}
                        </span>
                        <button
                          onClick={handleNext}
                          disabled={!hasNext}
                          className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                          title="Next Tutorial"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* All Tutorials Grid Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Browse All Video Tutorials ({filteredTutorials.length})
                    </h4>
                    <p className="text-xs text-slate-500">
                      Click any card below to watch the tutorial and learn how to use the feature.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                  {filteredTutorials.map((tut) => {
                    const isCurrent = activeTutorial?.id === tut.id;
                    return (
                      <div
                        key={tut.id}
                        onClick={() => {
                          setActiveTutorial(tut);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={`group bg-white rounded-2xl border p-3 flex flex-col justify-between transition-all duration-200 cursor-pointer ${
                          isCurrent
                            ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md bg-blue-50/20'
                            : 'border-slate-200 hover:border-blue-300 hover:shadow-md'
                        }`}
                      >
                        {/* Thumbnail Container */}
                        <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-900 mb-3 shadow-xs">
                          {tut.thumbnailUrl ? (
                            <img
                              src={tut.thumbnailUrl}
                              alt={tut.title}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-white p-3 text-center">
                              <Film className="w-8 h-8 text-blue-400 mb-1 opacity-80" />
                              <span className="text-[11px] font-semibold text-slate-300">{tut.category}</span>
                            </div>
                          )}

                          {/* Play Button Overlay */}
                          <div className={`absolute inset-0 flex items-center justify-center transition-all ${
                            isCurrent ? 'bg-blue-600/30' : 'bg-black/25 group-hover:bg-black/40'
                          }`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 shadow-md ${
                              isCurrent ? 'bg-blue-600 text-white' : 'bg-white/90 text-[#1a73e8]'
                            }`}>
                              <Play className="w-4 h-4 ml-0.5 fill-current" />
                            </div>
                          </div>

                          {/* Duration Badge */}
                          {tut.duration && (
                            <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-xs text-white text-[10px] font-mono font-medium">
                              {tut.duration}
                            </span>
                          )}

                          {/* Currently Watching Badge */}
                          {isCurrent && (
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold shadow-xs">
                              PLAYING NOW
                            </span>
                          )}
                        </div>

                        {/* Tutorial Content */}
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-[#1a73e8] bg-blue-50 px-2 py-0.5 rounded-md">
                              {tut.category}
                            </span>
                            <span className="text-slate-400 flex items-center gap-1 font-mono">
                              <Eye className="w-3 h-3" />
                              {(tut.viewsCount || 0).toLocaleString()}
                            </span>
                          </div>

                          <h5 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-[#1a73e8] transition-colors">
                            {tut.title}
                          </h5>

                          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                            {tut.description}
                          </p>
                        </div>

                        {/* Card Footer with Quick Try Link */}
                        <div className="pt-2.5 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 font-medium">
                            Step-by-step
                          </span>
                          <span className="font-semibold text-[#1a73e8] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                            Watch Tutorial <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <footer className="px-4 sm:px-6 py-3 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Updated tutorials directly by STEVELOGS administrators</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold transition-colors cursor-pointer"
          >
            Close & Back to Marketplace
          </button>
        </footer>
      </div>
    </div>
  );
};
