import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  Play,
  Upload,
  Plus,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  MoveUp,
  MoveDown,
  Sparkles,
  Link,
  Film,
  CheckCircle2,
  AlertTriangle,
  X,
  RefreshCw,
  Clock,
  Layers,
  Search,
  ExternalLink,
  FileVideo,
  Image as ImageIcon
} from 'lucide-react';
import { VideoTutorial, ServiceId } from '../../types';

interface AdminVideoTutorialsTabProps {
  onShowNotice: (msg: string) => void;
}

const AVAILABLE_SERVICES: { id: ServiceId | 'account-wallet' | 'general'; name: string; category: string }[] = [
  { id: 'account-wallet', name: 'Account & Wallet Funding', category: 'Account & Wallet' },
  { id: 'buy-numbers', name: 'Buy Virtual Numbers', category: 'Virtual Numbers' },
  { id: 'rent-number', name: 'Rent Virtual Numbers', category: 'Virtual Numbers' },
  { id: 'usa-numbers', name: 'USA Numbers', category: 'Virtual Numbers' },
  { id: 'log-accounts', name: 'Log Accounts & Social Logs', category: 'Social & Boosts' },
  { id: 'marketplace', name: 'Product Marketplace', category: 'Marketplace' },
  { id: 'boost-accounts', name: 'Boost Social Accounts', category: 'Social & Boosts' },
  { id: 'telegram-tick', name: 'Telegram Services & Ticks', category: 'Telegram' },
  { id: 'esim', name: 'eSIM Packages', category: 'Connectivity' },
  { id: 'ng-airtime', name: 'NG Airtime & Data', category: 'Connectivity' },
  { id: 'buy-gift-cards', name: 'Buy Gift Cards', category: 'Gift Cards' },
  { id: 'sell-gift-cards', name: 'Sell Gift Cards', category: 'Gift Cards' },
  { id: 'proxies', name: 'Dedicated Proxies & IPs', category: 'Proxies' },
  { id: 'worldwide-gifts', name: 'Worldwide Gifts Delivery', category: 'Deliveries' },
  { id: 'tracking-center', name: 'Track Order & Shipments', category: 'Order Tracking' },
  { id: 'developer-api', name: 'Developer API Integration', category: 'API & Dev' },
  { id: 'partner-program', name: 'Refer & Earn Rewards', category: 'Loyalty' },
  { id: 'general', name: 'General Platform Guide', category: 'General' },
];

export const AdminVideoTutorialsTab: React.FC<AdminVideoTutorialsTabProps> = ({ onShowNotice }) => {
  const [tutorials, setTutorials] = useState<VideoTutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Form modal state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Virtual Numbers');
  const [serviceId, setServiceId] = useState<string>('buy-numbers');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoType, setVideoType] = useState<'direct' | 'embed' | 'upload'>('direct');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [duration, setDuration] = useState('3:45');
  const [isPublished, setIsPublished] = useState(true);

  // Delete Confirmation Modal State
  const [tutorialToDelete, setTutorialToDelete] = useState<VideoTutorial | null>(null);

  // Preview Modal State
  const [previewTutorial, setPreviewTutorial] = useState<VideoTutorial | null>(null);

  const videoFileInputRef = useRef<HTMLInputElement | null>(null);
  const thumbFileInputRef = useRef<HTMLInputElement | null>(null);

  const adminFetch = async (url: string, init?: RequestInit) => {
    const token = typeof window !== 'undefined' ? sessionStorage.getItem('stevelogs_admin_token') : null;
    const existingHeaders = (init?.headers as Record<string, string>) || {};
    const headers: Record<string, string> = {
      ...existingHeaders,
      ...(token ? { Authorization: `Bearer ${token}`, 'x-admin-token': token } : {}),
      'x-admin-actor': 'Super Admin',
    };
    return fetch(url, { ...init, headers });
  };

  const loadTutorials = async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/api/admin/tutorials');
      if (res.ok) {
        const data = await res.json();
        setTutorials(Array.isArray(data) ? data : []);
      } else {
        onShowNotice('Failed to load tutorials from server');
      }
    } catch (e: any) {
      onShowNotice(`Network error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTutorials();
  }, []);

  // Helper for YouTube embed
  const getEmbedUrl = (url: string): string | null => {
    if (!url) return null;
    const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const ytMatch = url.match(ytRegex);
    if (ytMatch && ytMatch[1]) {
      return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`;
    }
    const vimeoRegex = /(?:vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+))/;
    const vimeoMatch = url.match(vimeoRegex);
    if (vimeoMatch && vimeoMatch[3]) {
      return `https://player.vimeo.com/video/${vimeoMatch[3]}?autoplay=1`;
    }
    return null;
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setCategory('Virtual Numbers');
    setServiceId('buy-numbers');
    setVideoUrl('');
    setVideoType('direct');
    setThumbnailUrl('');
    setDuration('3:00');
    setIsPublished(true);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (t: VideoTutorial) => {
    setEditingId(t.id);
    setTitle(t.title);
    setDescription(t.description);
    setCategory(t.category);
    setServiceId(t.serviceId || '');
    setVideoUrl(t.videoUrl);
    setVideoType(t.videoType);
    setThumbnailUrl(t.thumbnailUrl || '');
    setDuration(t.duration || '3:00');
    setIsPublished(t.isPublished);
    setIsEditorOpen(true);
  };

  // Upload video file directly to backend storage
  const handleVideoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 55 * 1024 * 1024) {
      onShowNotice('File is too large. Maximum file upload size is 50MB.');
      return;
    }

    setUploadingVideo(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        const res = await adminFetch('/api/admin/tutorials/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            fileType: file.type || 'video/mp4',
            fileData: base64Data,
          }),
        });
        const data = await res.json();
        if (data.success && data.url) {
          setVideoUrl(data.url);
          setVideoType('direct');
          onShowNotice(`Video uploaded successfully: ${file.name}`);
        } else {
          onShowNotice(`Upload error: ${data.error || 'Failed to save file'}`);
        }
      } catch (err: any) {
        onShowNotice(`Upload error: ${err.message}`);
      } finally {
        setUploadingVideo(false);
      }
    };
    reader.onerror = () => {
      setUploadingVideo(false);
      onShowNotice('Failed to read file from disk');
    };
    reader.readAsDataURL(file);
  };

  // Upload thumbnail file
  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingThumb(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        const res = await adminFetch('/api/admin/tutorials/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            fileType: file.type || 'image/jpeg',
            fileData: base64Data,
          }),
        });
        const data = await res.json();
        if (data.success && data.url) {
          setThumbnailUrl(data.url);
          onShowNotice('Thumbnail uploaded successfully');
        } else {
          onShowNotice(`Thumbnail error: ${data.error || 'Failed'}`);
        }
      } catch (err: any) {
        onShowNotice(`Thumbnail error: ${err.message}`);
      } finally {
        setUploadingThumb(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Auto detect embed vs direct when typing URL
  const handleVideoUrlChange = (val: string) => {
    setVideoUrl(val);
    const isEmbed = Boolean(getEmbedUrl(val)) || val.includes('youtube') || val.includes('vimeo');
    setVideoType(isEmbed ? 'embed' : 'direct');
  };

  const handleSaveTutorial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      onShowNotice('Title is required');
      return;
    }
    if (!videoUrl.trim()) {
      onShowNotice('Video URL or uploaded video file is required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category,
        serviceId: serviceId || undefined,
        videoUrl: videoUrl.trim(),
        videoType,
        thumbnailUrl: thumbnailUrl.trim() || undefined,
        duration: duration.trim() || '3:00',
        isPublished,
      };

      if (editingId) {
        const res = await adminFetch(`/api/admin/tutorials/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          onShowNotice('Video tutorial updated successfully');
          setIsEditorOpen(false);
          loadTutorials();
        } else {
          onShowNotice(data.error || 'Update failed');
        }
      } else {
        const res = await adminFetch('/api/admin/tutorials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          onShowNotice('New video tutorial published successfully');
          setIsEditorOpen(false);
          loadTutorials();
        } else {
          onShowNotice(data.error || 'Create failed');
        }
      }
    } catch (err: any) {
      onShowNotice(`Save error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Fast toggle published status
  const handleTogglePublish = async (tutorial: VideoTutorial) => {
    try {
      const nextPublished = !tutorial.isPublished;
      const res = await adminFetch(`/api/admin/tutorials/${tutorial.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: nextPublished }),
      });
      const data = await res.json();
      if (data.success) {
        setTutorials((prev) =>
          prev.map((t) => (t.id === tutorial.id ? { ...t, isPublished: nextPublished } : t))
        );
        onShowNotice(
          nextPublished
            ? `Published "${tutorial.title}" - now visible to customers`
            : `Unpublished "${tutorial.title}" - hidden from customers`
        );
      }
    } catch (e: any) {
      onShowNotice(`Failed to update status: ${e.message}`);
    }
  };

  // Delete tutorial
  const handleConfirmDelete = async () => {
    if (!tutorialToDelete) return;
    try {
      const res = await adminFetch(`/api/admin/tutorials/${tutorialToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setTutorials((prev) => prev.filter((t) => t.id !== tutorialToDelete.id));
        onShowNotice(`Deleted "${tutorialToDelete.title}"`);
        setTutorialToDelete(null);
      } else {
        onShowNotice(data.error || 'Delete failed');
      }
    } catch (e: any) {
      onShowNotice(`Delete error: ${e.message}`);
    }
  };

  // Reorder: Move Up / Move Down
  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= tutorials.length) return;

    const newOrder = [...tutorials];
    const item = newOrder[index];
    newOrder[index] = newOrder[targetIdx];
    newOrder[targetIdx] = item;

    setTutorials(newOrder);

    try {
      const orderedIds = newOrder.map((t) => t.id);
      const res = await adminFetch('/api/admin/tutorials/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds }),
      });
      const data = await res.json();
      if (data.success) {
        onShowNotice('Tutorial order saved');
      }
    } catch (e: any) {
      onShowNotice(`Failed to save order: ${e.message}`);
    }
  };

  // Filtered view
  const filteredTutorials = tutorials.filter((t) => {
    const matchesCategory = categoryFilter === 'all' || t.category.toLowerCase() === categoryFilter.toLowerCase();
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      t.title.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const categories = Array.from(new Set(tutorials.map((t) => t.category)));

  return (
    <div className="space-y-6">
      {/* Header section with Stats & Add Button */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Film className="w-5 h-5 text-blue-400" />
              <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">
                Video Tutorials Management
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800 text-[10px] font-mono font-bold">
                {tutorials.length} Total
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upload, edit, order, and publish video guides explaining STEVELOGS Marketplace features to customers.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={loadTutorials}
              disabled={loading}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Refresh tutorials"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-600/25 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add New Tutorial</span>
            </button>
          </div>
        </div>

        {/* Quick Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80 text-xs">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Published Live</span>
            <span className="text-emerald-400 font-bold text-base font-mono">
              {tutorials.filter((t) => t.isPublished).length}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Unpublished / Drafts</span>
            <span className="text-amber-400 font-bold text-base font-mono">
              {tutorials.filter((t) => !t.isPublished).length}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Total Customer Views</span>
            <span className="text-cyan-400 font-bold text-base font-mono">
              {tutorials.reduce((acc, curr) => acc + (curr.viewsCount || 0), 0).toLocaleString()}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Categories Covered</span>
            <span className="text-indigo-400 font-bold text-base font-mono">
              {categories.length}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-[#0f172a] border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tutorials by title, service or tag..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              categoryFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                categoryFilter.toLowerCase() === cat.toLowerCase()
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Tutorials Table / List */}
      <div className="rounded-2xl bg-[#0f172a] border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-400 mx-auto" />
            <p className="text-xs">Loading video tutorials from database...</p>
          </div>
        ) : filteredTutorials.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <FileVideo className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">No video tutorials found</p>
            <p className="text-xs text-slate-500">
              {searchQuery || categoryFilter !== 'all'
                ? 'No tutorials match your search criteria.'
                : 'No tutorials have been published yet. Click "Add New Tutorial" to upload the first one.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filteredTutorials.map((tut, index) => {
              const embed = getEmbedUrl(tut.videoUrl);
              return (
                <div
                  key={tut.id}
                  className="p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-900/40 transition-colors"
                >
                  {/* Left: Order Buttons & Thumbnail & Details */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Reorder Buttons */}
                    <div className="flex flex-col items-center gap-1 pt-1 shrink-0">
                      <button
                        onClick={() => handleMove(index, 'up')}
                        disabled={index === 0}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:hover:bg-slate-800 cursor-pointer"
                        title="Move Up"
                      >
                        <MoveUp className="w-3 h-3" />
                      </button>
                      <span className="text-[10px] font-mono text-slate-400 font-bold">
                        #{index + 1}
                      </span>
                      <button
                        onClick={() => handleMove(index, 'down')}
                        disabled={index === tutorials.length - 1}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:hover:bg-slate-800 cursor-pointer"
                        title="Move Down"
                      >
                        <MoveDown className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Thumbnail preview */}
                    <div
                      onClick={() => setPreviewTutorial(tut)}
                      className="w-24 sm:w-32 aspect-video rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shrink-0 relative group cursor-pointer shadow-inner"
                    >
                      {tut.thumbnailUrl ? (
                        <img
                          src={tut.thumbnailUrl}
                          alt={tut.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 bg-slate-950">
                          <Film className="w-5 h-5 text-blue-500/70" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-5 h-5 text-white fill-white" />
                      </div>
                      {tut.duration && (
                        <span className="absolute bottom-1 right-1 px-1 rounded bg-black/80 text-[9px] font-mono text-white">
                          {tut.duration}
                        </span>
                      )}
                    </div>

                    {/* Meta info */}
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-blue-900/40 border border-blue-800/60 text-blue-300 text-[10px] font-bold">
                          {tut.category}
                        </span>
                        {tut.serviceId && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-mono">
                            Service: {tut.serviceId}
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                            tut.isPublished
                              ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/50'
                              : 'bg-amber-950/70 text-amber-400 border border-amber-800/50'
                          }`}
                        >
                          {tut.isPublished ? (
                            <>
                              <Eye className="w-2.5 h-2.5" /> Published Live
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-2.5 h-2.5" /> Draft / Hidden
                            </>
                          )}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                          <Eye className="w-3 h-3 text-slate-500" />
                          {(tut.viewsCount || 0).toLocaleString()} views
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white leading-snug line-clamp-1">
                        {tut.title}
                      </h4>

                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {tut.description}
                      </p>

                      <div className="pt-1 flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                        <span className="truncate max-w-xs">{tut.videoUrl}</span>
                        {embed && <span className="text-blue-400">(Embed Link)</span>}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 w-full md:w-auto justify-end shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-slate-800">
                    <button
                      onClick={() => setPreviewTutorial(tut)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      title="Preview Player"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Preview</span>
                    </button>

                    <button
                      onClick={() => handleTogglePublish(tut)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                        tut.isPublished
                          ? 'bg-amber-950/50 hover:bg-amber-900/60 text-amber-300 border border-amber-800/40'
                          : 'bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/40'
                      }`}
                      title={tut.isPublished ? 'Unpublish from customer page' : 'Publish to customer page'}
                    >
                      {tut.isPublished ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{tut.isPublished ? 'Unpublish' : 'Publish'}</span>
                    </button>

                    <button
                      onClick={() => handleOpenEdit(tut)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 border border-slate-700 transition-colors cursor-pointer"
                      title="Edit Tutorial"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setTutorialToDelete(tut)}
                      className="p-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900/70 text-rose-400 hover:text-rose-300 border border-rose-800/40 transition-colors cursor-pointer"
                      title="Delete Tutorial"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Editor Modal (Add / Edit) */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl bg-[#0f172a] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
              <div className="flex items-center gap-2">
                <Film className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">
                  {editingId ? 'Edit Video Tutorial' : 'Add New Video Tutorial'}
                </h3>
              </div>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveTutorial} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Title */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 block">
                  Tutorial Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. How to Buy Virtual Numbers & Receive Instant SMS"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Short Description */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 block">
                  Short Description <span className="text-rose-400">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain what steps the video demonstrates and which services it covers..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Category & Associated Service */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300 block">
                    Product / Service Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Account & Wallet">Account & Wallet Funding</option>
                    <option value="Virtual Numbers">Virtual Numbers</option>
                    <option value="Social & Boosts">Social Logs & Boosting</option>
                    <option value="Marketplace">Marketplace</option>
                    <option value="Telegram">Telegram Services</option>
                    <option value="Connectivity">eSIM & Connectivity</option>
                    <option value="Gift Cards">Gift Cards (Buy & Sell)</option>
                    <option value="Proxies">Proxies & IPs</option>
                    <option value="Deliveries">Worldwide Gifts</option>
                    <option value="Order Tracking">Order Tracking</option>
                    <option value="General">General / Other</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300 block">
                    Direct Marketplace Service Link
                  </label>
                  <select
                    value={serviceId}
                    onChange={(e) => setServiceId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">No Direct Service Action</option>
                    {AVAILABLE_SERVICES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.category})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Video Source: Upload or URL */}
              <div className="space-y-2 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-200 flex items-center gap-1.5">
                    <FileVideo className="w-4 h-4 text-blue-400" />
                    <span>Video Source (Upload File or Paste Link)</span>
                    <span className="text-rose-400">*</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => videoFileInputRef.current?.click()}
                      disabled={uploadingVideo}
                      className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Upload className="w-3 h-3" />
                      <span>{uploadingVideo ? 'Uploading...' : 'Upload Video File'}</span>
                    </button>
                    <input
                      type="file"
                      ref={videoFileInputRef}
                      onChange={handleVideoFileUpload}
                      accept="video/mp4,video/webm,video/ogg,video/quicktime"
                      className="hidden"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <input
                    type="text"
                    required
                    value={videoUrl}
                    onChange={(e) => handleVideoUrlChange(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... or /uploads/videos/... or https://..."
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 font-mono text-[11px] focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-[10px] text-slate-500 block">
                    Supported: MP4 / WebM video files, YouTube watch or share links, Vimeo links, or direct CDN links.
                  </span>
                </div>

                {/* Duration & Type */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400">Duration Tag</label>
                    <input
                      type="text"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="e.g. 3:45 or 5:20"
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400">Player Rendering Mode</label>
                    <select
                      value={videoType}
                      onChange={(e) => setVideoType(e.target.value as 'direct' | 'embed' | 'upload')}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white"
                    >
                      <option value="direct">Direct HTML5 Video (MP4 / WebM)</option>
                      <option value="embed">Embed Frame (YouTube / Vimeo)</option>
                      <option value="upload">Uploaded File</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Video Thumbnail */}
              <div className="space-y-2 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-200 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-emerald-400" />
                    <span>Video Thumbnail Image</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => thumbFileInputRef.current?.click()}
                      disabled={uploadingThumb}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50 border border-slate-700"
                    >
                      <Upload className="w-3 h-3" />
                      <span>{uploadingThumb ? 'Uploading...' : 'Upload Image'}</span>
                    </button>
                    <input
                      type="file"
                      ref={thumbFileInputRef}
                      onChange={handleThumbnailUpload}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                </div>

                <input
                  type="text"
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... or /uploads/thumbnails/..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 font-mono text-[11px] focus:outline-none focus:border-blue-500"
                />

                {thumbnailUrl && (
                  <div className="w-32 aspect-video rounded-lg overflow-hidden border border-slate-700 bg-slate-950 mt-2">
                    <img src={thumbnailUrl} alt="Thumbnail preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {/* Publish Toggle */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">Publish Status</span>
                  <span className="text-[11px] text-slate-400">
                    {isPublished
                      ? 'Visible to all customers immediately on the homepage Video Tutorials page'
                      : 'Saved as draft — hidden from customer browsing'}
                  </span>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Live Preview Button before submit */}
              {videoUrl && (
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewTutorial({
                        id: 'temp-preview',
                        title: title || 'Tutorial Preview',
                        description: description || 'Tutorial Description',
                        category,
                        serviceId: serviceId || undefined,
                        videoUrl,
                        videoType,
                        thumbnailUrl,
                        duration,
                        displayOrder: 999,
                        isPublished,
                        viewsCount: 0,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                      });
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1.5 cursor-pointer underline underline-offset-4"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Preview video player right now</span>
                  </button>
                </div>
              )}

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{editingId ? 'Save Changes' : 'Publish Video Tutorial'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {tutorialToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-[#0f172a] border border-rose-900/60 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-950/80 border border-rose-800/60 flex items-center justify-center text-rose-400 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-base font-bold text-white">Delete Video Tutorial?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Are you sure you want to permanently delete{' '}
                <span className="font-bold text-white">"{tutorialToDelete.title}"</span>?
                This action cannot be undone and will immediately remove the tutorial from customer view.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setTutorialToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                No, Keep Tutorial
              </button>

              <button
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                Yes, Delete Tutorial
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Preview Modal */}
      {previewTutorial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-3xl bg-[#0f172a] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-blue-400 fill-current" />
                <h4 className="text-sm font-bold text-white truncate max-w-md">
                  Preview: {previewTutorial.title}
                </h4>
              </div>
              <button
                onClick={() => setPreviewTutorial(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="aspect-video bg-black relative flex items-center justify-center">
              {getEmbedUrl(previewTutorial.videoUrl) ? (
                <iframe
                  src={getEmbedUrl(previewTutorial.videoUrl) || ''}
                  title={previewTutorial.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  src={previewTutorial.videoUrl}
                  controls
                  autoPlay
                  poster={previewTutorial.thumbnailUrl}
                  className="w-full h-full object-contain"
                >
                  Your browser does not support HTML5 video.
                </video>
              )}
            </div>

            <div className="p-4 bg-slate-900/90 text-xs space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-blue-400">{previewTutorial.category}</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400 font-mono">{previewTutorial.duration}</span>
              </div>
              <p className="text-slate-300 leading-relaxed">{previewTutorial.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
