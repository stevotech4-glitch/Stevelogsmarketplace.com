import React, { useState, useEffect } from 'react';
import { 
  Megaphone, 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  CheckCircle2, 
  Calendar, 
  Sparkles, 
  AlertTriangle, 
  RefreshCw, 
  Layers, 
  Image as ImageIcon,
  Check,
  X
} from 'lucide-react';
import { AnnouncementItem } from '../../types';

interface AdminAnnouncementsTabProps {
  adminFetch: (url: string, init?: RequestInit) => Promise<Response>;
}

export const AdminAnnouncementsTab: React.FC<AdminAnnouncementsTabProps> = ({ adminFetch }) => {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Form Modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formAudience, setFormAudience] = useState<'all' | 'vip' | 'reseller'>('all');
  const [formIsImportant, setFormIsImportant] = useState(false);
  const [formDisplayOrder, setFormDisplayOrder] = useState<number>(1);
  const [formPublished, setFormPublished] = useState(true);
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [formExpiryDate, setFormExpiryDate] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/api/admin/announcements');
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormTitle('');
    setFormContent('');
    setFormImageUrl('');
    setFormAudience('all');
    setFormIsImportant(false);
    setFormDisplayOrder(announcements.length + 1);
    setFormPublished(true);
    setFormStartDate(new Date().toISOString().slice(0, 10));
    setFormExpiryDate('');
    setShowPreview(false);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (ann: AnnouncementItem) => {
    setEditingId(ann.id);
    setFormTitle(ann.title);
    setFormContent(ann.content);
    setFormImageUrl(ann.imageUrl || '');
    setFormAudience(ann.targetAudience || 'all');
    setFormIsImportant(Boolean(ann.isImportant));
    setFormDisplayOrder(ann.displayOrder || 1);
    setFormPublished(ann.published);
    setFormStartDate(ann.startDate ? ann.startDate.slice(0, 10) : new Date().toISOString().slice(0, 10));
    setFormExpiryDate(ann.expiryDate ? ann.expiryDate.slice(0, 10) : '');
    setShowPreview(false);
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) {
      alert('Please provide an announcement title and message content.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: formTitle.trim(),
        content: formContent.trim(),
        imageUrl: formImageUrl.trim(),
        targetAudience: formAudience,
        isImportant: formIsImportant,
        displayOrder: Number(formDisplayOrder),
        published: formPublished,
        startDate: formStartDate ? new Date(formStartDate).toISOString() : new Date().toISOString(),
        expiryDate: formExpiryDate ? new Date(formExpiryDate).toISOString() : undefined,
      };

      const url = editingId ? `/api/admin/announcements/${editingId}` : '/api/admin/announcements';
      const method = editingId ? 'PUT' : 'POST';

      const res = await adminFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsFormOpen(false);
        setNotice(editingId ? 'Announcement updated successfully.' : 'New announcement published successfully.');
        setTimeout(() => setNotice(null), 4000);
        fetchAnnouncements();
      } else {
        alert('Failed to save announcement.');
      }
    } catch (e) {
      alert('Network error while saving announcement.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    try {
      const res = await adminFetch(`/api/admin/announcements/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchAnnouncements();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTogglePublished = async (ann: AnnouncementItem) => {
    try {
      const res = await adminFetch(`/api/admin/announcements/${ann.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !ann.published }),
      });
      if (res.ok) {
        fetchAnnouncements();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-amber-400" />
            <span>Announcements Management System</span>
          </h2>
          <p className="text-xs text-slate-400">
            Publish unlimited customer notices, promotions, and updates with live popup delivery.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Announcement</span>
        </button>
      </div>

      {notice && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 font-bold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Announcements Table */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
            <span className="text-xs">Loading announcements...</span>
          </div>
        ) : announcements.length === 0 ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
            <Megaphone className="w-10 h-10 text-slate-700 stroke-[1.5]" />
            <span className="text-xs font-semibold">No announcements published yet.</span>
            <button
              onClick={handleOpenCreate}
              className="mt-2 text-xs text-amber-400 font-bold hover:underline"
            >
              Click here to create the first announcement
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Order</th>
                  <th className="py-3 px-4">Title & Content Preview</th>
                  <th className="py-3 px-4">Target Audience</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {announcements.map((ann) => (
                  <tr key={ann.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-400">
                      #{ann.displayOrder}
                    </td>
                    <td className="py-3.5 px-4 max-w-sm">
                      <div className="font-extrabold text-white text-xs truncate">{ann.title}</div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">{ann.content}</div>
                      {ann.imageUrl && (
                        <span className="text-[10px] text-blue-400 font-mono flex items-center gap-1 mt-0.5">
                          <ImageIcon className="w-3 h-3" />
                          <span>Has Banner Image</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono uppercase text-[11px]">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {ann.targetAudience}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {ann.isImportant ? (
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                          IMPORTANT
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Standard</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleTogglePublished(ann)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                          ann.published
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {ann.published ? 'LIVE / PUBLISHED' : 'DRAFT / HIDDEN'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[10px] text-slate-400">
                      {new Date(ann.startDate || ann.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(ann)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          title="Edit Announcement"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(ann.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-400 transition-colors cursor-pointer"
                          title="Delete Announcement"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 max-w-2xl w-full text-slate-200 shadow-2xl my-8 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-amber-400" />
                <span>{editingId ? 'Edit Announcement' : 'Create New Announcement'}</span>
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {/* Title */}
              <div className="space-y-1">
                <label className="font-bold text-slate-300 uppercase tracking-wide text-[10px]">
                  Announcement Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 🚀 Instant 0-Minute High Speed Numbers Active!"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-400 text-xs"
                />
              </div>

              {/* Message Content */}
              <div className="space-y-1">
                <label className="font-bold text-slate-300 uppercase tracking-wide text-[10px]">
                  Announcement Message / Description *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Write full message details here..."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-400 text-xs"
                />
              </div>

              {/* Image / Banner URL */}
              <div className="space-y-1">
                <label className="font-bold text-slate-300 uppercase tracking-wide text-[10px]">
                  Optional Image or Banner URL
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/banner.jpg"
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-400 text-xs font-mono"
                />
              </div>

              {/* Grid: Audience, Display Order, Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 uppercase tracking-wide text-[10px]">
                    Target Audience
                  </label>
                  <select
                    value={formAudience}
                    onChange={(e: any) => setFormAudience(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-400 text-xs"
                  >
                    <option value="all">All Customers</option>
                    <option value="vip">VIP Resellers Only</option>
                    <option value="reseller">Wholesale Only</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300 uppercase tracking-wide text-[10px]">
                    Display Order (Rank)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formDisplayOrder}
                    onChange={(e) => setFormDisplayOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-400 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300 uppercase tracking-wide text-[10px]">
                    Publish Status
                  </label>
                  <select
                    value={formPublished ? 'true' : 'false'}
                    onChange={(e) => setFormPublished(e.target.value === 'true')}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-400 text-xs"
                  >
                    <option value="true">Published (Live in Popup)</option>
                    <option value="false">Draft (Hidden)</option>
                  </select>
                </div>
              </div>

              {/* Start Date & Expiry Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 uppercase tracking-wide text-[10px]">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-400 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300 uppercase tracking-wide text-[10px]">
                    Optional Expiry Date
                  </label>
                  <input
                    type="date"
                    value={formExpiryDate}
                    onChange={(e) => setFormExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-400 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Important Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isImportant"
                  checked={formIsImportant}
                  onChange={(e) => setFormIsImportant(e.target.checked)}
                  className="rounded border-slate-700 text-amber-500 focus:ring-amber-400 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="isImportant" className="text-xs font-bold text-amber-300 cursor-pointer">
                  Mark as High Priority / Important Notice
                </label>
              </div>

              {/* Live Preview Toggle */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{showPreview ? 'Hide Customer Popup Preview' : 'Show Customer Popup Preview'}</span>
                </button>

                {showPreview && (
                  <div className="mt-3 p-4 rounded-2xl bg-white text-slate-900 border border-slate-300 space-y-2">
                    {formImageUrl && (
                      <img src={formImageUrl} alt="Preview" className="w-full h-32 object-cover rounded-xl" />
                    )}
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-bold uppercase">
                      {formIsImportant ? 'Important Notice' : 'Official Announcement'}
                    </span>
                    <h4 className="font-extrabold text-sm">{formTitle || 'Sample Title'}</h4>
                    <p className="text-xs text-slate-600 whitespace-pre-line">
                      {formContent || 'Sample announcement content will appear here...'}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold text-xs shadow-md cursor-pointer disabled:opacity-40"
                >
                  {saving ? 'Saving...' : editingId ? 'Update Announcement' : 'Publish Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
