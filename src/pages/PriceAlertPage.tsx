import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TopBar } from '@/components/layout/TopBar';
import { api } from '@/lib/api-client';
import { useStore } from '@/lib/store';
import {
  Bell,
  ShieldCheck,
  CheckCircle2,
  Activity,
  Loader2,
  AlertCircle,
  Share2,
  BarChart3,
  Trash2,
  ChevronLeft,
  DollarSign
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { Product, PriceAlert, AlertConditions } from '@shared/types';
type EnrichedAlert = PriceAlert & { product: Product | null };
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="skeuo-card p-3 !bg-white/90 backdrop-blur shadow-skeuo-outset border border-white/50 rounded-xl">
        <p className="text-xs font-bold text-gray-500 mb-1">{format(new Date(label), 'MMM dd, yyyy HH:mm')}</p>
        <p className="text-lg font-black text-amazon-orange">${payload[0].value.toFixed(2)}</p>
      </div>
    );
  }
  return null;
};
export function PriceAlertPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userId = useStore((state) => state.userId);
  const productIdParam = searchParams.get('productId');
  const urlParam = searchParams.get('url');
  const [targetPrice, setTargetPrice] = useState<string>('');
  const { data: settings } = useQuery<{ affiliateTag: string }>({
    queryKey: ['system-settings'],
    queryFn: () => api<{ affiliateTag: string }>('/api/admin/settings'),
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const [conditions, setConditions] = useState<AlertConditions>({
    amazon: true,
    new: true,
    used: false
  });
  const { data: alertData, isLoading: isLoadingAlert } = useQuery<EnrichedAlert>({
    queryKey: ['alert', id],
    queryFn: () => api<EnrichedAlert>(`/api/alerts/${encodeURIComponent(id!)}`),
    enabled: !!id,
  });
  const { data: scrapedProduct, isLoading: isLoadingScrape, error: scrapeError } = useQuery<Product>({
    queryKey: ['scrape', urlParam],
    queryFn: () => api<Product>('/api/scrape', {
      method: 'POST',
      body: JSON.stringify({ url: urlParam }),
    }),
    enabled: !!urlParam && !productIdParam && !id,
  });
  const productId = alertData?.productId || productIdParam || scrapedProduct?.id;
  const { data: productData, isLoading: isLoadingProduct, error: productError } = useQuery<Product>({
    queryKey: ['product', productId],
    queryFn: () => api<Product>(`/api/products/${encodeURIComponent(productId!)}`),
    enabled: !!productId,
  });
  useEffect(() => {
    if (isInitialized) return;
    if (id) {
      // Edit mode: Wait for specific alert data
      if (alertData) {
        setTargetPrice(alertData.targetPrice.toString());
        setConditions(alertData.conditions);
        setIsInitialized(true);
      }
    } else if (productData) {
      // Create mode: Use product defaults
      setTargetPrice((productData.currentPrice * 0.9).toFixed(2));
      setIsInitialized(true);
    }
  }, [id, alertData, productData, isInitialized]);
  const saveMutation = useMutation({
    mutationFn: (data: Partial<PriceAlert>) => {
      if (id) {
        return api<PriceAlert>(`/api/alerts/${encodeURIComponent(id)}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        });
      } else {
        return api<PriceAlert>('/api/alerts', {
          method: 'POST',
          body: JSON.stringify({ ...data, userId, productId }),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts', userId] });
      toast.success(id ? 'Price watch updated' : 'Price watch created');
      navigate('/');
    },
    onError: () => {
      toast.error('Failed to save price watch');
    }
  });
  const deleteMutation = useMutation({
    mutationFn: () => api<{ success: boolean }>(`/api/alerts/${encodeURIComponent(id!)}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts', userId] });
      toast.success('Price watch deleted');
      navigate('/');
    },
    onError: () => {
      toast.error('Failed to delete price watch');
    }
  });
  const handleSave = () => {
    if (!userId) {
      toast.error('Please sign in to save this alert');
      navigate('/signin');
      return;
    }
    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) {
      toast.error("Please enter a valid target price");
      return;
    }
    saveMutation.mutate({
      targetPrice: price,
      conditions,
    });
  };
  const handleShare = () => {
    if (!productData?.url) return;
    const tag = settings?.affiliateTag || 'pricewatch-20';
    const separator = productData.url.includes('?') ? '&' : '?';
    const affiliateUrl = `${productData.url}${separator}tag=${tag}`;
    navigator.clipboard.writeText(affiliateUrl);
    toast.success('Affiliate link copied to clipboard!');
  };
  if (isLoadingAlert || isLoadingProduct || isLoadingScrape) {
    return (
      <div className="min-h-screen pt-28 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-amazon-orange" />
        <p className="text-gray-500 font-medium">
          {isLoadingScrape ? 'Scraping Amazon product details...' : 'Loading product details...'}
        </p>
      </div>
    );
  }
  if (productError || scrapeError || (!id && !productIdParam && !urlParam)) {
    return (
      <div className="min-h-screen pt-28 px-4 flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
        <TopBar />
        <div className="skeuo-card p-12 w-full flex flex-col items-center">
          {scrapeError || productError ? (
            <>
              <AlertCircle className="w-16 h-16 text-red-500 mb-6" />
              <h2 className="text-2xl font-bold mb-2">Product Not Found</h2>
              <p className="text-gray-600 mb-8">
                {scrapeError ? "We couldn't scrape this Amazon link. Please ensure it is a valid Amazon.com product URL." : "We couldn't retrieve information for this product. It might have been removed or the link is invalid."}
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-amazon-orange/10 rounded-full flex items-center justify-center mb-6">
                <Activity className="w-8 h-8 text-amazon-orange" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Add New Price Watch</h2>
              <p className="text-gray-600 mb-8">
                Paste an Amazon.com product link below to start tracking its price history and set up alerts.
              </p>
            </>
          )}
          <form
            className="w-full flex flex-col sm:flex-row gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              const url = (e.currentTarget.elements.namedItem('url') as HTMLInputElement).value;
              if (url) navigate(`/alert/new?url=${encodeURIComponent(url)}`);
            }}
          >
            <input
              name="url"
              type="url"
              placeholder="Paste Product Link from Amazon.com"
              className="skeuo-input flex-1 py-4 px-6 text-lg"
              required
            />
            <button type="submit" className="skeuo-btn-primary px-8 py-4 text-lg whitespace-nowrap">
              Track Product
            </button>
          </form>
          <button onClick={() => navigate('/')} className="mt-8 text-sm font-bold text-gray-400 hover:text-amazon-orange transition-colors">
            Return Home
          </button>
        </div>
      </div>
    );
  }
  const p = productData!;
  return (
    <div className="min-h-screen pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <TopBar />
      <div className="mb-8 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="skeuo-btn px-4 py-2 flex items-center gap-2 text-sm"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-2xl font-bold hidden sm:block">
          {id ? 'Modify Price Watch' : 'Create New Alert'}
        </h1>
        <div className="w-20" /> {/* Spacer */}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Main Product Card */}
          <div className="skeuo-card p-6 sm:p-8">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="w-full md:w-1/3 aspect-square skeuo-inset rounded-2xl bg-white p-6 flex items-center justify-center relative group">
                <img
                  src={p.image}
                  alt={p.title}
                  className="w-full h-full object-contain mix-blend-multiply"
                  onError={(e) => e.currentTarget.src = 'https://placehold.co/300x300?text=No+Image'}
                />
                <button
                  onClick={handleShare}
                  className="absolute top-4 right-4 p-2.5 skeuo-btn rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur shadow-lg"
                  title="Copy Affiliate Link"
                >
                  <Share2 className="w-5 h-5 text-amazon-orange" />
                </button>
              </div>
              <div className="flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 skeuo-inset rounded-full text-xs font-bold text-green-600 bg-green-50/50">
                    <CheckCircle2 className="w-3.5 h-3.5" /> In Stock
                  </span>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Amazon.com</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold mb-4 leading-tight">
                  {p.title}
                </h2>
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-400 uppercase">Current Price</span>
                    <span className="text-4xl font-black text-amazon-navy">${p.currentPrice.toFixed(2)}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-auto">
                  <div className="skeuo-inset p-3 rounded-xl bg-white/30">
                    <p className="text-[10px] text-gray-500 uppercase font-black mb-1">Lowest Ever</p>
                    <p className="text-lg font-bold text-green-600">${(p.currentPrice * 0.85).toFixed(2)}</p>
                  </div>
                  <div className="skeuo-inset p-3 rounded-xl bg-white/30">
                    <p className="text-[10px] text-gray-500 uppercase font-black mb-1">Average</p>
                    <p className="text-lg font-bold text-amazon-navy">${(p.currentPrice * 0.95).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Statistics/Details Table */}
          <div className="skeuo-card p-6 sm:p-8">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amazon-orange" />
              Product Specification
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-gray-100">
                    <tr className="group"><td className="py-3 text-gray-500 font-medium">Product Group</td><td className="py-3 text-right font-bold">Electronics</td></tr>
                    <tr className="group"><td className="py-3 text-gray-500 font-medium">Manufacturer</td><td className="py-3 text-right font-bold">Amazon Brand</td></tr>
                    <tr className="group"><td className="py-3 text-gray-500 font-medium">ASIN</td><td className="py-3 text-right font-bold text-amazon-orange font-mono">{p.id}</td></tr>
                    <tr className="group"><td className="py-3 text-gray-500 font-medium">Locale</td><td className="py-3 text-right font-bold">US</td></tr>
                  </tbody>
                </table>
              </div>
              <div className="space-y-4">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-gray-100">
                    <tr className="group"><td className="py-3 text-gray-500 font-medium">Last Scanned</td><td className="py-3 text-right font-bold">Just now</td></tr>
                    <tr className="group"><td className="py-3 text-gray-500 font-medium">Price History</td><td className="py-3 text-right font-bold">{p.priceHistory?.length || 0} Points</td></tr>
                    <tr className="group"><td className="py-3 text-gray-500 font-medium">Condition</td><td className="py-3 text-right font-bold text-green-600">New</td></tr>
                    <tr className="group"><td className="py-3 text-gray-500 font-medium">Category</td><td className="py-3 text-right font-bold">Tracked Deal</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          {/* History Chart */}
          <div className="skeuo-card p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Activity className="w-5 h-5 text-amazon-orange" />
                Price History
              </h3>
              <div className="flex gap-2">
                {['1M', '3M', '6M', '1Y'].map(t => (
                  <button key={t} className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${t === '1M' ? 'skeuo-inset text-amazon-orange' : 'skeuo-btn'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="w-full h-72 skeuo-inset rounded-2xl bg-white relative overflow-hidden group p-4 pt-8">
              {Array.isArray(p.priceHistory) && p.priceHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={
                      [...p.priceHistory]
                        .sort((a, b) => a.timestamp - b.timestamp)
                        .reduce((acc, curr, idx, arr) => {
                          if (arr.length === 1) {
                            // If only one point, show a flat line starting 24h ago
                            return [{ ...curr, timestamp: curr.timestamp - 86400000 }, curr];
                          }
                          return [...acc, curr];
                        }, [] as any[])
                    }
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF9900" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#FF9900" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(unixTime) => {
                        try {
                          return format(new Date(Number(unixTime)), 'MMM dd, HH:mm');
                        } catch (e) {
                          return '';
                        }
                      }}
                      type="number"
                      domain={['dataMin', 'dataMax']}
                      axisLine={false}
                      tickLine={false}
                      minTickGap={50}
                    />
                    <YAxis
                      dataKey="price"
                      axisLine={false}
                      tickLine={false}
                      width={45}
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }}
                      tickFormatter={(val) => `$${Number(val).toFixed(2)}`}
                      domain={[
                        (dataMin: number) => Math.floor(dataMin * 0.95),
                        (dataMax: number) => Math.ceil(dataMax * 1.05)
                      ]}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke="#FF9900"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorPrice)"
                      activeDot={{ r: 6, strokeWidth: 0, fill: '#FF9900' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                  <div className="px-6 py-2 bg-white/90 backdrop-blur rounded-full shadow-skeuo-sm border border-white flex items-center gap-3 mb-3">
                    <Loader2 className="w-4 h-4 animate-spin text-amazon-orange" />
                    <span className="text-sm font-bold text-gray-600">Initializing Price Tracking...</span>
                  </div>
                  <p className="text-xs text-gray-400 max-w-xs font-medium">
                    Historical data collection begins the moment you start tracking. Check back soon for price movement insights.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Sidebar: Control Panel */}
        <div className="space-y-8">
          <div className="skeuo-card p-8 sticky top-28 border-t-4 border-t-amazon-orange">
            <h3 className="text-xl font-black mb-8 flex items-center gap-3">
              <Bell className="w-6 h-6 text-amazon-orange" />
              Alert Controls
            </h3>
            <div className="space-y-8">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                  Target Price
                </label>
                <div className="relative group">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl font-black text-gray-300 group-focus-within:text-amazon-orange transition-colors">
                    <DollarSign className="w-6 h-6" />
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    className="skeuo-input w-full pl-14 py-5 text-3xl font-black text-amazon-navy"
                    placeholder="0.00"
                  />
                </div>
                <p className="mt-3 text-xs text-gray-500 font-medium px-1">
                  Alert triggers when price drops below this amount.
                </p>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-4">
                  Track Sources
                </label>
                <div className="space-y-3">
                  <button
                    onClick={() => setConditions(c => ({ ...c, amazon: !c.amazon }))}
                    className={`w-full p-4 rounded-xl flex items-center justify-between transition-all ${conditions.amazon ? 'skeuo-inset bg-amazon-orange/5' : 'skeuo-btn opacity-60'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border-2 ${conditions.amazon ? 'bg-amazon-orange border-amazon-orange' : 'border-gray-300'}`}>
                        {conditions.amazon && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>
                      <span className="font-bold">Amazon Direct</span>
                    </div>
                    <span className="text-sm font-black text-gray-400">${p.currentPrice.toFixed(2)}</span>
                  </button>
                  <button
                    onClick={() => setConditions(c => ({ ...c, new: !c.new }))}
                    className={`w-full p-4 rounded-xl flex items-center justify-between transition-all ${conditions.new ? 'skeuo-inset bg-amazon-orange/5' : 'skeuo-btn opacity-60'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border-2 ${conditions.new ? 'bg-amazon-orange border-amazon-orange' : 'border-gray-300'}`}>
                        {conditions.new && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>
                      <span className="font-bold">3rd Party New</span>
                    </div>
                    <span className="text-sm font-black text-gray-400">---</span>
                  </button>
                  <button
                    onClick={() => setConditions(c => ({ ...c, used: !c.used }))}
                    className={`w-full p-4 rounded-xl flex items-center justify-between transition-all ${conditions.used ? 'skeuo-inset bg-amazon-orange/5' : 'skeuo-btn opacity-60'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border-2 ${conditions.used ? 'bg-amazon-orange border-amazon-orange' : 'border-gray-300'}`}>
                        {conditions.used && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>
                      <span className="font-bold">3rd Party Used</span>
                    </div>
                    <span className="text-sm font-black text-gray-400">---</span>
                  </button>
                </div>
              </div>
              <div className="pt-6 space-y-4">
                <button
                  onClick={handleSave}
                  disabled={saveMutation.isPending}
                  className="skeuo-btn-primary w-full py-5 text-xl flex items-center justify-center gap-3 group disabled:opacity-70"
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      {id ? 'Update Monitor' : 'Start Monitoring'}
                    </>
                  )}
                </button>
                {id && (
                  <button
                    onClick={() => {
                      if (confirm("Stop monitoring this product?")) {
                        deleteMutation.mutate();
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    className="skeuo-btn w-full py-4 text-red-600 flex items-center justify-center gap-2 font-bold"
                  >
                    {deleteMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                    Delete Price Watch
                  </button>
                )}
                <div className="flex items-center justify-center gap-2 text-[11px] font-black text-gray-400 uppercase tracking-widest mt-4">
                  <ShieldCheck className="w-4 h-4 text-green-500" />
                  Email & SMS Enabled
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}