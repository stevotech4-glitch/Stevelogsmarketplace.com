import React, { useState, useEffect } from 'react';
import { 
  X, 
  Search, 
  ShoppingBag, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ArrowRight,
  Copy,
  Check,
  History,
  Tag,
  Key,
  ShieldCheck,
  Package,
  Layers,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { UserWallet, MarketplaceCategory, MarketplaceProduct, MarketplaceOrder } from '../types';

interface MarketplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: UserWallet;
  customerId?: string;
  onDeductBalance: (amount: number, service: string, details: string) => void;
  onOpenFundWallet?: () => void;
}

export const MarketplaceModal: React.FC<MarketplaceModalProps> = ({
  isOpen,
  onClose,
  wallet,
  customerId,
  onDeductBalance,
  onOpenFundWallet,
}) => {
  const [activeView, setActiveView] = useState<'catalog' | 'orders'>('catalog');
  const [categories, setCategories] = useState<MarketplaceCategory[]>([]);
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Purchasing state
  const [selectedProduct, setSelectedProduct] = useState<MarketplaceProduct | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [purchasedOrder, setPurchasedOrder] = useState<MarketplaceOrder | null>(null);
  const [copiedKeyIndex, setCopiedKeyIndex] = useState<number | null>(null);

  // Fetch Categories & Products
  const loadCatalog = async () => {
    setLoading(true);
    setError(null);
    try {
      const [catRes, prodRes] = await Promise.all([
        fetch('/api/marketplace/categories'),
        fetch('/api/marketplace/products')
      ]);

      if (!catRes.ok || !prodRes.ok) {
        throw new Error('Unable to connect to Marketplace catalog gateway.');
      }

      const catData: MarketplaceCategory[] = await catRes.json();
      const prodData: MarketplaceProduct[] = await prodRes.json();

      setCategories(catData || []);
      setProducts(prodData || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load Marketplace catalog. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Marketplace Orders
  const loadOrders = async () => {
    setLoadingOrders(true);
    try {
      const url = customerId 
        ? `/api/marketplace/orders?customerId=${encodeURIComponent(customerId)}`
        : '/api/marketplace/orders';
      const res = await fetch(url);
      if (res.ok) {
        const data: MarketplaceOrder[] = await res.json();
        setOrders(data || []);
      }
    } catch (err) {
      console.error('Error fetching marketplace orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadCatalog();
      loadOrders();
      setSelectedProduct(null);
      setPurchasedOrder(null);
      setPurchaseError(null);
      setQuantity(1);
    }
  }, [isOpen, customerId]);

  if (!isOpen) return null;

  // Filter products by selected category and search term
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'all' || String(p.category) === String(selectedCategory);
    const matchesSearch = !searchQuery.trim() || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.categoryName && p.categoryName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleSelectProduct = (product: MarketplaceProduct) => {
    setSelectedProduct(product);
    setQuantity(1);
    setPurchaseError(null);
    setPurchasedOrder(null);
  };

  const handleBuy = async () => {
    if (!selectedProduct) return;
    const totalCost = selectedProduct.sellingPrice * quantity;

    if (wallet.balance < totalCost) {
      setPurchaseError(`Insufficient wallet balance. Total cost is ₦${totalCost.toLocaleString()}, but your current balance is ₦${wallet.balance.toLocaleString()}.`);
      return;
    }

    setPurchasing(true);
    setPurchaseError(null);

    try {
      const res = await fetch('/api/marketplace/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customerId || 'CUST-1001',
          productId: selectedProduct.id,
          quantity: quantity,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to process Marketplace purchase. Please try again.');
      }

      setPurchasedOrder(data.order);
      // Deduct balance in frontend UI state
      onDeductBalance(
        totalCost,
        'Marketplace',
        `${selectedProduct.name} (x${quantity})`
      );

      // Refresh orders
      loadOrders();
    } catch (err: any) {
      setPurchaseError(err.message || 'Purchase failed. Your wallet was not debited.');
    } finally {
      setPurchasing(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyIndex(index);
    setTimeout(() => setCopiedKeyIndex(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div 
        className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/50 via-white to-amber-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1a73e8] text-white flex items-center justify-center shadow-md">
              <ShoppingBag className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Marketplace</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 uppercase tracking-wide">
                  Verified Provider
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Direct verified digital accounts, credentials & license keys
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher: Catalog vs Order History */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => {
                  setActiveView('catalog');
                  setSelectedProduct(null);
                  setPurchasedOrder(null);
                }}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeView === 'catalog'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Catalog
              </button>
              <button
                onClick={() => {
                  setActiveView('orders');
                  loadOrders();
                }}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeView === 'orders'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Orders</span>
                {orders.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                    {orders.length}
                  </span>
                )}
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Wallet Balance Strip */}
        <div className="bg-slate-50 px-5 py-2.5 border-b border-slate-200/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Wallet Balance:</span>
            <span className="font-bold text-slate-900 font-mono text-sm">
              ₦{wallet.balance.toLocaleString()}
            </span>
          </div>
          {onOpenFundWallet && (
            <button
              onClick={() => {
                onClose();
                onOpenFundWallet();
              }}
              className="text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>+ Top-up Wallet</span>
            </button>
          )}
        </div>

        {/* Main Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {activeView === 'catalog' ? (
            <>
              {/* Product Purchase / Key Delivery Modal Overlay */}
              {purchasedOrder ? (
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5 sm:p-6 space-y-4 animate-in fade-in">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md">
                        <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-emerald-950">
                          Purchase Successful & Keys Delivered!
                        </h3>
                        <p className="text-xs text-emerald-700 font-mono">
                          Order ID: {purchasedOrder.id} • Provider Ref: #{purchasedOrder.providerOrderId || 'Confirmed'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setPurchasedOrder(null)}
                      className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 cursor-pointer"
                    >
                      Done
                    </button>
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-emerald-200/80 space-y-3">
                    <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
                      <span className="text-slate-500">Item:</span>
                      <span className="font-bold text-slate-800">{purchasedOrder.productName} (x{purchasedOrder.quantity})</span>
                    </div>
                    <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
                      <span className="text-slate-500">Amount Charged:</span>
                      <span className="font-bold text-emerald-700 font-mono">₦{purchasedOrder.totalCharge.toLocaleString()}</span>
                    </div>

                    <div className="space-y-2 pt-1">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-blue-600" />
                        <span>Purchased Credentials / Access Keys:</span>
                      </label>

                      {purchasedOrder.keys && purchasedOrder.keys.length > 0 ? (
                        <div className="space-y-2">
                          {purchasedOrder.keys.map((keyString, idx) => (
                            <div 
                              key={idx}
                              className="flex items-center justify-between bg-slate-900 text-emerald-400 p-3 rounded-xl font-mono text-xs break-all shadow-inner"
                            >
                              <span>{keyString}</span>
                              <button
                                onClick={() => handleCopy(keyString, idx)}
                                className="ml-2 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center gap-1 text-[11px] shrink-0 transition-colors cursor-pointer"
                              >
                                {copiedKeyIndex === idx ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-400" />
                                    <span>Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 italic">
                          Order recorded. Check orders tab for confirmation.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : selectedProduct ? (
                /* Product Checkout View */
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5 animate-in fade-in">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider font-mono">
                        {selectedProduct.categoryName || 'Marketplace Item'}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                        {selectedProduct.name}
                      </h3>
                      {selectedProduct.description && (
                        <p className="text-xs text-slate-500 mt-1 max-w-xl">
                          {selectedProduct.description}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedProduct(null)}
                      className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 cursor-pointer"
                    >
                      Back to Catalog
                    </button>
                  </div>

                  {/* Quantity & Pricing Calculator */}
                  <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-4 shadow-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Unit Price:
                        </label>
                        <div className="text-lg font-bold font-mono text-slate-900">
                          ₦{selectedProduct.sellingPrice.toLocaleString()}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Select Quantity:
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            disabled={quantity <= 1 || purchasing}
                            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            max={selectedProduct.stock > 0 ? selectedProduct.stock : 99}
                            value={quantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              if (!isNaN(val) && val >= 1) {
                                setQuantity(val);
                              }
                            }}
                            className="w-16 text-center font-mono font-bold border border-slate-300 rounded-lg py-1 text-sm"
                          />
                          <button
                            onClick={() => setQuantity(quantity + 1)}
                            disabled={purchasing || (selectedProduct.stock > 0 && quantity >= selectedProduct.stock)}
                            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
                          >
                            +
                          </button>
                          {selectedProduct.stock > 0 && (
                            <span className="text-[11px] text-slate-500 font-mono ml-2">
                              ({selectedProduct.stock} in stock)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-slate-500">Total Due:</span>
                        <div className="text-xl font-bold font-mono text-blue-600">
                          ₦{(selectedProduct.sellingPrice * quantity).toLocaleString()}
                        </div>
                      </div>

                      <button
                        onClick={handleBuy}
                        disabled={purchasing || !selectedProduct.inStock}
                        className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                      >
                        {purchasing ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Processing Order...</span>
                          </>
                        ) : (
                          <>
                            <span>Pay ₦{(selectedProduct.sellingPrice * quantity).toLocaleString()}</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>

                    {purchaseError && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{purchaseError}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {/* Filters & Search Bar */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search accounts, services, credentials by name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <button
                    onClick={loadCatalog}
                    disabled={loading}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-semibold text-slate-700 transition-all cursor-pointer shadow-2xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${loading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>

                {/* Category Pills (Dynamic from Rakib Socials) */}
                {categories.length > 0 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        selectedCategory === 'all'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      All Categories ({products.length})
                    </button>
                    {categories.map((cat) => {
                      const count = products.filter((p) => String(p.category) === String(cat.id)).length;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategory(String(cat.id))}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                            selectedCategory === String(cat.id)
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {cat.name} {count > 0 && `(${count})`}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Product Grid / Listings */}
              {loading ? (
                <div className="py-16 text-center space-y-3">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                  <p className="text-xs text-slate-500 font-medium">
                    Loading verified Marketplace catalog...
                  </p>
                </div>
              ) : error ? (
                <div className="py-12 px-6 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-3">
                  <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
                  <h4 className="text-sm font-bold text-amber-900">Marketplace Connection Notice</h4>
                  <p className="text-xs text-amber-700 max-w-md mx-auto">{error}</p>
                  <button
                    onClick={loadCatalog}
                    className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer"
                  >
                    Retry Connection
                  </button>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="py-16 text-center space-y-3 border-2 border-dashed border-slate-200 rounded-3xl">
                  <Package className="w-10 h-10 text-slate-300 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-700">No Products Found</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    {searchQuery 
                      ? `No products matched "${searchQuery}". Try a different keyword.` 
                      : 'The provider currently has no available products in this category.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredProducts.map((prod) => (
                    <div
                      key={prod.id}
                      className="bg-white border border-slate-200 hover:border-blue-400 rounded-2xl p-4 flex flex-col justify-between transition-all duration-150 hover:shadow-md space-y-3 group"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                            {prod.categoryName || `Cat #${prod.category}`}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            prod.inStock
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {prod.inStock ? `${prod.stock > 0 ? `${prod.stock} In Stock` : 'Available'}` : 'Out of Stock'}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                          {prod.name}
                        </h4>

                        {prod.description && (
                          <p className="text-[11px] text-slate-500 line-clamp-2">
                            {prod.description}
                          </p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 block leading-tight">Price</span>
                          <span className="text-sm font-bold font-mono text-slate-900">
                            ₦{prod.sellingPrice.toLocaleString()}
                          </span>
                        </div>

                        <button
                          onClick={() => handleSelectProduct(prod)}
                          disabled={!prod.inStock}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-blue-600 disabled:opacity-40 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                        >
                          <span>Buy Now</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* Order History View (Isolated from other sections) */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Marketplace Order History
                  </h3>
                  <p className="text-xs text-slate-500">
                    Your purchased credentials and delivered access keys
                  </p>
                </div>
                <button
                  onClick={loadOrders}
                  disabled={loadingOrders}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingOrders ? 'animate-spin' : ''}`} />
                  <span>Refresh Orders</span>
                </button>
              </div>

              {loadingOrders ? (
                <div className="py-12 text-center">
                  <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto" />
                  <p className="text-xs text-slate-500 mt-2">Loading orders...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-3xl space-y-2">
                  <History className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-500 font-medium">No Marketplace purchases recorded yet.</p>
                  <button
                    onClick={() => setActiveView('catalog')}
                    className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    Browse Catalog
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((ord) => (
                    <div
                      key={ord.id}
                      className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs"
                    >
                      <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-900">
                              {ord.id}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {ord.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {new Date(ord.createdAt).toLocaleString()}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-bold font-mono text-slate-900">
                            ₦{ord.totalCharge.toLocaleString()}
                          </span>
                          <span className="text-[11px] text-slate-500 block">
                            Qty: {ord.quantity}
                          </span>
                        </div>
                      </div>

                      <div className="text-xs">
                        <span className="text-slate-500">Product: </span>
                        <span className="font-bold text-slate-800">{ord.productName}</span>
                      </div>

                      {/* Keys view */}
                      {ord.keys && ord.keys.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[11px] font-bold text-slate-600 block">
                            Delivered Access Keys:
                          </span>
                          <div className="space-y-1.5">
                            {ord.keys.map((k, kIdx) => (
                              <div
                                key={kIdx}
                                className="flex items-center justify-between bg-slate-900 text-emerald-400 p-2.5 rounded-xl font-mono text-xs break-all"
                              >
                                <span>{k}</span>
                                <button
                                  onClick={() => handleCopy(k, kIdx)}
                                  className="ml-2 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-sans flex items-center gap-1 shrink-0 cursor-pointer"
                                >
                                  {copiedKeyIndex === kIdx ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-400" />
                                      <span>Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
