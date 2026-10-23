import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  ExternalLink, 
  RefreshCw, 
  ShoppingBag, 
  Key, 
  DollarSign, 
  Layers, 
  Lock, 
  Users,
  Search,
  Check,
  X
} from 'lucide-react';
import { SpecialMarketplaceListing, SpecialMarketplaceOrder } from '../../types';

interface AdminSpecialMarketplaceTabProps {
  adminFetch: (url: string, init?: RequestInit) => Promise<Response>;
}

export const AdminSpecialMarketplaceTab: React.FC<AdminSpecialMarketplaceTabProps> = ({ adminFetch }) => {
  const [activeSubTab, setActiveSubTab] = useState<'listings' | 'orders'>('listings');
  const [listings, setListings] = useState<SpecialMarketplaceListing[]>([]);
  const [orders, setOrders] = useState<SpecialMarketplaceOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Form Modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formLogoUrl, setFormLogoUrl] = useState('');
  const [formRules, setFormRules] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formLoginUrl, setFormLoginUrl] = useState('');
  const [formTwoFactorUrl, setFormTwoFactorUrl] = useState('');
  const [formPrice, setFormPrice] = useState<number>(3000);
  const [formAvailability, setFormAvailability] = useState<'available' | 'unavailable' | 'out_of_stock'>('available');
  const [formAdditionalInstructions, setFormAdditionalInstructions] = useState('');
  const [formStock, setFormStock] = useState<number>(5);
  const [formPublished, setFormPublished] = useState(true);
  const [formCategory, setFormCategory] = useState('Facebook PVA');
  const [showPasswordInTable, setShowPasswordInTable] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchListings();
    fetchOrders();
  }, []);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/api/admin/marketplace/special');
      if (res.ok) {
        const data = await res.json();
        setListings(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await adminFetch('/api/admin/marketplace/special/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormName('');
    setFormLogoUrl('');
    setFormRules('');
    setFormUsername('');
    setFormPassword('');
    setFormLoginUrl('');
    setFormTwoFactorUrl('');
    setFormPrice(3000);
    setFormAvailability('available');
    setFormAdditionalInstructions('');
    setFormStock(5);
    setFormPublished(true);
    setFormCategory('Facebook PVA');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: SpecialMarketplaceListing) => {
    setEditingId(item.id);
    setFormName(item.name);
    setFormLogoUrl(item.logoUrl || '');
    setFormRules(item.rules);
    setFormUsername(item.username);
    setFormPassword(item.password);
    setFormLoginUrl(item.loginUrl || '');
    setFormTwoFactorUrl(item.twoFactorUrl || '');
    setFormPrice(item.price);
    setFormAvailability(item.availability);
    setFormAdditionalInstructions(item.additionalInstructions || '');
    setFormStock(item.stock);
    setFormPublished(item.published);
    setFormCategory(item.category || 'General Log');
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formUsername.trim() || !formPassword.trim()) {
      alert('Product Name, Username, and Password are required fields.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formName.trim(),
        logoUrl: formLogoUrl.trim(),
        rules: formRules.trim(),
        username: formUsername.trim(),
        password: formPassword.trim(),
        loginUrl: formLoginUrl.trim(),
        twoFactorUrl: formTwoFactorUrl.trim(),
        price: Number(formPrice),
        availability: formAvailability,
        additionalInstructions: formAdditionalInstructions.trim(),
        stock: Number(formStock),
        published: formPublished,
        category: formCategory.trim(),
      };

      const url = editingId ? `/api/admin/marketplace/special/${editingId}` : '/api/admin/marketplace/special';
      const method = editingId ? 'PUT' : 'POST';

      const res = await adminFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsFormOpen(false);
        setNotice(editingId ? 'Listing updated successfully.' : 'New listing added to Special Marketplace 2.');
        setTimeout(() => setNotice(null), 4000);
        fetchListings();
      } else {
        const errData = await res.json().catch(() => ({}));
        setNotice(errData.error || 'Failed to save listing.');
        setTimeout(() => setNotice(null), 4000);
      }
    } catch (e: any) {
      setNotice(`Network error: ${e.message || 'Could not save listing'}`);
      setTimeout(() => setNotice(null), 4000);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await adminFetch(`/api/admin/marketplace/special/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setNotice('Listing removed successfully.');
        setTimeout(() => setNotice(null), 3000);
        fetchListings();
      } else {
        setNotice('Failed to remove listing.');
        setTimeout(() => setNotice(null), 3000);
      }
    } catch (e: any) {
      setNotice(`Delete error: ${e.message}`);
      setTimeout(() => setNotice(null), 3000);
    }
  };

  const handleTogglePublish = async (item: SpecialMarketplaceListing) => {
    try {
      const res = await adminFetch(`/api/admin/marketplace/special/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !item.published }),
      });
      if (res.ok) {
        fetchListings();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const togglePasswordVisibility = (id: string) => {
    setShowPasswordInTable((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredListings = listings.filter((l) =>
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.category || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span>Special Marketplace 2 Management</span>
          </h2>
          <p className="text-xs text-slate-400">
            Add and manage direct manual logs, PVA accounts, and verified profiles with secure buyer credential delivery.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
            <button
              onClick={() => setActiveSubTab('listings')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'listings' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Listings ({listings.length})
            </button>
            <button
              onClick={() => {
                setActiveSubTab('orders');
                fetchOrders();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'orders' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Orders ({orders.length})
            </button>
          </div>

          {activeSubTab === 'listings' && (
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          )}
        </div>
      </div>

      {notice && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 font-bold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Subtab 1: Listings Table */}
      {activeSubTab === 'listings' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search listings or username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-400"
              />
            </div>
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">
              Showing {filteredListings.length} product(s)
            </span>
          </div>

          <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden shadow-xs">
            {loading ? (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
                <span className="text-xs">Loading listings...</span>
              </div>
            ) : filteredListings.length === 0 ? (
              <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                <ShoppingBag className="w-10 h-10 text-slate-700 stroke-[1.5]" />
                <span className="text-xs font-semibold">No listings found.</span>
                <button onClick={handleOpenCreate} className="mt-2 text-xs text-amber-400 font-bold hover:underline">
                  Add your first Special Marketplace 2 listing
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/70 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Product</th>
                      <th className="py-3 px-4">Price</th>
                      <th className="py-3 px-4">Stock</th>
                      <th className="py-3 px-4">Access Credentials (Admin Only)</th>
                      <th className="py-3 px-4">Availability</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {filteredListings.map((item) => {
                      const isRevealed = Boolean(showPasswordInTable[item.id]);
                      return (
                        <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-4 max-w-xs">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                                {item.logoUrl ? (
                                  <img src={item.logoUrl} alt={item.name} className="w-full h-full object-cover" />
                                ) : (
                                  <ShoppingBag className="w-4 h-4 text-amber-400" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="font-extrabold text-white text-xs truncate">{item.name}</div>
                                <span className="text-[10px] text-slate-400 font-mono block">{item.category}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-amber-400 text-sm">
                            {item.currency}{item.price.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-xs">
                            <span className={`px-2 py-0.5 rounded font-bold ${
                              item.stock > 0 ? 'bg-slate-800 text-slate-200' : 'bg-rose-500/20 text-rose-300'
                            }`}>
                              {item.stock} left
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-xs max-w-xs">
                            <div className="flex items-center gap-1.5 text-[11px]">
                              <span className="text-slate-400">User:</span>
                              <span className="text-white font-bold truncate max-w-[100px]">{item.username}</span>
                              <span className="text-slate-400 ml-1">Pass:</span>
                              <span className="text-amber-300 truncate max-w-[100px]">
                                {isRevealed ? item.password : '••••••••'}
                              </span>
                              <button
                                onClick={() => togglePasswordVisibility(item.id)}
                                className="text-slate-400 hover:text-white cursor-pointer ml-1"
                              >
                                {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              </button>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[10px] uppercase">
                            <span className={`px-2 py-0.5 rounded font-bold ${
                              item.availability === 'available'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-rose-500/20 text-rose-300'
                            }`}>
                              {item.availability}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <button
                              onClick={() => handleTogglePublish(item)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                                item.published
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}
                            >
                              {item.published ? 'LIVE' : 'UNPUBLISHED'}
                            </button>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEdit(item)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                                title="Edit Listing"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-400 transition-colors cursor-pointer"
                                title="Delete Listing"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Subtab 2: Special Marketplace Orders */}
      {activeSubTab === 'orders' && (
        <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden shadow-xs">
          {orders.length === 0 ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
              <Key className="w-10 h-10 text-slate-700 stroke-[1.5]" />
              <span className="text-xs font-semibold">No Special Marketplace 2 orders placed yet.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/70 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Order Ref</th>
                    <th className="py-3 px-4">Item Name</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Credentials Delivered</th>
                    <th className="py-3 px-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200 font-mono text-xs">
                  {orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-amber-400">{ord.reference}</td>
                      <td className="py-3.5 px-4 font-sans font-bold text-white max-w-xs truncate">{ord.listingName}</td>
                      <td className="py-3.5 px-4 font-sans">
                        <div className="font-bold text-slate-200">{ord.customerName}</div>
                        <div className="text-[11px] text-slate-400">{ord.customerEmail}</div>
                      </td>
                      <td className="py-3.5 px-4 font-bold">{ord.currency}{ord.price.toLocaleString()}</td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="text-[11px] truncate">User: <strong className="text-white">{ord.credentials.username}</strong></div>
                        <div className="text-[11px] truncate text-slate-400">Pass: {ord.credentials.password}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-[10px]">{new Date(ord.purchasedAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Product Form Modal (10 Fields) */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 max-w-2xl w-full text-slate-200 shadow-2xl my-8 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span>{editingId ? 'Edit Special Marketplace Listing' : 'Add New Special Product / Log'}</span>
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="p-1 text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {/* 1. Logo URL & 2. Product Name */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 uppercase tracking-wide text-[10px]">
                    1. Product Logo / Image URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/logo.png"
                    value={formLogoUrl}
                    onChange={(e) => setFormLogoUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-400 text-xs font-mono"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="font-bold text-slate-300 uppercase tracking-wide text-[10px]">
                    2. Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. USA Aged Facebook PVA Profile (2018) + 2FA"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-400 text-xs font-bold"
                  />
                </div>
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="font-bold text-slate-300 uppercase tracking-wide text-[10px]">
                  Category / Platform Tag
                </label>
                <input
                  type="text"
                  placeholder="e.g. Facebook PVA, Gmail, PayPal, Instagram"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-400 text-xs"
                />
              </div>

              {/* 3. Rules & Instructions */}
              <div className="space-y-1">
                <label className="font-bold text-slate-300 uppercase tracking-wide text-[10px]">
                  3. Rules & Usage Instructions *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explain usage restrictions (e.g. use clean residential proxy, do not change recovery email for 48h)..."
                  value={formRules}
                  onChange={(e) => setFormRules(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-400 text-xs"
                />
              </div>

              {/* 4. Username & 5. Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
                <div className="space-y-1">
                  <label className="font-bold text-amber-300 uppercase tracking-wide text-[10px] flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    <span>4. Access Username *</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="username or email"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-amber-300 uppercase tracking-wide text-[10px] flex items-center gap-1">
                    <Key className="w-3 h-3" />
                    <span>5. Access Password / Secret *</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="password or security key"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400 text-xs font-mono"
                  />
                </div>
              </div>

              {/* 6. Product/Login Link & 7. 2FA Link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 uppercase tracking-wide text-[10px]">
                    6. Product / Login URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://facebook.com/login"
                    value={formLoginUrl}
                    onChange={(e) => setFormLoginUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-400 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300 uppercase tracking-wide text-[10px]">
                    7. 2FA Authentication URL / Secret Link
                  </label>
                  <input
                    type="url"
                    placeholder="https://2fa.live/"
                    value={formTwoFactorUrl}
                    onChange={(e) => setFormTwoFactorUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-400 text-xs font-mono"
                  />
                </div>
              </div>

              {/* 8. Price, 9. Availability, Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 uppercase tracking-wide text-[10px]">
                    8. Selling Price (₦) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-400 text-xs font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300 uppercase tracking-wide text-[10px]">
                    9. Availability Status
                  </label>
                  <select
                    value={formAvailability}
                    onChange={(e: any) => setFormAvailability(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-400 text-xs"
                  >
                    <option value="available">Available (In Stock)</option>
                    <option value="out_of_stock">Out of Stock</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300 uppercase tracking-wide text-[10px]">
                    Stock Count
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formStock}
                    onChange={(e) => setFormStock(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-400 text-xs font-mono"
                  />
                </div>
              </div>

              {/* 10. Additional Post-Purchase Instructions */}
              <div className="space-y-1">
                <label className="font-bold text-slate-300 uppercase tracking-wide text-[10px]">
                  10. Additional Instructions (Revealed only to Buyer after purchase)
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional secrets, backup codes, or proxy setup hints revealed upon checkout..."
                  value={formAdditionalInstructions}
                  onChange={(e) => setFormAdditionalInstructions(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-400 text-xs"
                />
              </div>

              {/* Publish Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="publishedListing"
                  checked={formPublished}
                  onChange={(e) => setFormPublished(e.target.checked)}
                  className="rounded border-slate-700 text-amber-500 focus:ring-amber-400 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="publishedListing" className="text-xs font-bold text-white cursor-pointer">
                  Publish to Customer Special Marketplace 2 immediately
                </label>
              </div>

              {/* Form Buttons */}
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
                  {saving ? 'Saving...' : editingId ? 'Update Listing' : 'Publish Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
