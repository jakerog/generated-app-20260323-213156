import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  TrendingDown,
  ArrowRight,
  BellRing,
  Plus,
  ExternalLink,
  Activity,
  History,
  Package,
  ArrowDown,
  Loader2
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { TopBar } from '@/components/layout/TopBar';
import { api } from '@/lib/api-client';
import type { PriceAlert, Product } from '@shared/types';

type EnrichedAlert = PriceAlert & { product: Product | null };

export function HomePage() {
  const navigate = useNavigate();
  const userId = useStore((state) => state.userId);
  const [searchInput, setSearchInput] = useState('');

  const { data: alerts = [], isLoading, error, refetch } = useQuery<EnrichedAlert[]>({
    queryKey: ['alerts', userId],
    queryFn: () => api<EnrichedAlert[]>(`/api/alerts?userId=${encodeURIComponent(userId || '')}`),
    enabled: !!userId,
    retry: 3,
    retryDelay: 2000,
  });

  const calculateSavings = useCallback((alert: EnrichedAlert) => {
    if (!alert.product) return 0;
    const originalPrice = alert.product.currentPrice * 1.2;
    return originalPrice - alert.product.currentPrice;
  }, []);

  const memoizedAlerts = useMemo(() => {
    if (!Array.isArray(alerts)) return [];
    return [...alerts]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 6);
  }, [alerts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigate(`/alert/new?url=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-amazon-navy font-sans antialiased pb-20">
      <TopBar />
      <main className="pt-32 px-4 max-w-7xl mx-auto">
        <section className="mb-16 text-center max-w-4xl mx-auto">
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="p-4 skeuo-card rounded-full inline-flex animate-in fade-in zoom-in duration-700 mb-6">
              <BellRing className="w-10 h-10 text-amazon-orange" />
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full skeuo-inset bg-white/50 border border-green-100/50 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-700 delay-150">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
              </span>
              <span className="text-[10px] font-black text-green-700 uppercase tracking-widest pt-0.5">PRODUCTION SYSTEM ACTIVE</span>
            </div>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black mb-6 tracking-tight">
            Track Prices. <span className="text-amazon-orange">Save Money.</span>
          </h1>
          <p className="text-lg text-gray-500 mb-10 font-medium max-w-2xl mx-auto">
            The ultimate Amazon price tracker. Paste a link to start monitoring for price drops using our real-time scraping engine.
          </p>
          <form onSubmit={handleSearch} className="w-full max-w-2xl mx-auto skeuo-card p-2 rounded-3xl flex flex-col sm:flex-row gap-2 items-center">
            <div className="flex-1 w-full relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Paste Amazon Product Link..."
                className="skeuo-input w-full pl-12 pr-4 py-4 text-base rounded-2xl"
              />
            </div>
            <button
              type="submit"
              disabled={!searchInput.trim()}
              className="skeuo-btn-primary w-full sm:w-auto px-8 py-4 rounded-2xl text-lg whitespace-nowrap group disabled:opacity-50"
            >
              Track Price
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        </section>

        <section>
          {!userId ? (
            <div className="skeuo-card p-12 text-center max-w-2xl mx-auto border-dashed border-2 border-gray-200 shadow-none">
              <div className="w-20 h-20 bg-white rounded-full skeuo-inset mx-auto mb-6 flex items-center justify-center">
                <History className="w-10 h-10 text-gray-300" />
              </div>
              <h2 className="text-2xl font-bold mb-4">Monitor Your Favorites</h2>
              <p className="text-gray-500 mb-8 font-medium">
                Sign in to save products to your watch list and get notified the moment they go on sale.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/signin" className="skeuo-btn px-8 py-3 font-bold min-w-[140px]">Sign In</Link>
                <Link to="/signup" className="skeuo-btn-primary px-8 py-3 min-w-[140px]">Get Started</Link>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-8 px-2">
                <h2 className="text-2xl font-black flex items-center gap-3">
                  <Activity className="w-6 h-6 text-amazon-orange" />
                  Your Price Watches
                </h2>
                <button
                  onClick={() => navigate('/alert/new')}
                  className="skeuo-btn px-4 py-2 text-sm flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add New
                </button>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="skeuo-card h-96 animate-pulse bg-gray-100/50 flex items-center justify-center">
                       <Loader2 className="w-8 h-8 animate-spin text-gray-200" />
                    </div>
                  ))}
                </div>
              ) : (error || memoizedAlerts.length === 0) ? (
                <div className="skeuo-card p-16 text-center border-dashed border-2 border-gray-200 shadow-none">
                  <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">{error ? 'Syncing Alerts...' : 'No active monitors'}</h3>
                  <p className="text-gray-500 max-w-sm mx-auto">
                    {error
                      ? "We're briefly updating your watch list. If this persists, please try refreshing the page."
                      : "You haven't added any products yet. Paste an Amazon link in the search bar above to begin."}
                  </p>
                  {error && (
                    <button
                      onClick={() => refetch()}
                      className="mt-6 skeuo-btn px-6 py-2 text-xs font-bold mx-auto flex items-center gap-2"
                    >
                      <Activity className="w-4 h-4" /> Retry Sync
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {memoizedAlerts.map((alert) => (
                    <div key={alert.id} className="skeuo-card group overflow-hidden flex flex-col hover:scale-[1.01] transition-transform duration-300">
                      <div className="relative p-6 flex-1">
                        <Link
                          to={`/alert/${alert.id}`}
                          className="block aspect-square skeuo-inset bg-white rounded-xl p-6 mb-6 relative overflow-hidden group-hover:shadow-skeuo-outset transition-all"
                        >
                          <img
                            src={alert.product?.image || 'https://via.placeholder.com/300?text=Product'}
                            alt={alert.product?.title || 'Product Image'}
                            className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute top-3 right-3 px-2 py-1 bg-amazon-orange text-white text-[10px] font-black rounded shadow-md">
                            TRACKING
                          </div>
                        </Link>
                        <Link to={`/alert/${alert.id}`} className="block mb-4">
                          <h3 className="font-bold text-sm line-clamp-2 min-h-[40px] group-hover:text-amazon-orange transition-colors">
                            {alert.product?.title || 'Unknown Product'}
                          </h3>
                        </Link>
                        <div className="flex items-end justify-between">
                          <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Current</p>
                            <p className="text-2xl font-black text-amazon-navy">
                              ${(alert.product?.currentPrice || 0).toFixed(2)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-black text-green-600 uppercase tracking-widest flex items-center justify-end gap-1">
                              <ArrowDown className="w-3 h-3" /> Save
                            </p>
                            <p className="text-lg font-bold text-green-600">
                              ${(calculateSavings(alert) || 0).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 bg-gray-50/50 border-t border-white/50 flex gap-3">
                        <Link
                          to={`/alert/${alert.id}`}
                          className="skeuo-btn flex-1 py-3 text-xs font-bold"
                        >
                          Modify Alert
                        </Link>
                        <a
                          href={`${alert.product?.url}${alert.product?.url?.includes('?') ? '&' : '?'}tag=pricewatch-20`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="skeuo-btn-primary flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2"
                        >
                          View Store <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </section>

        <section className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="skeuo-card p-8 group hover:-translate-y-1 transition-transform">
            <div className="w-12 h-12 rounded-xl skeuo-inset flex items-center justify-center mb-6">
              <TrendingDown className="text-green-500 w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg mb-2">Top Price Drops</h3>
            <p className="text-sm text-gray-500 font-medium">Daily curated list of the steepest discounts currently available.</p>
            <div className="mt-4 text-amazon-orange text-sm font-bold flex items-center gap-1 cursor-pointer">
              Explore deals <ArrowRight className="w-4 h-4" />
            </div>
          </div>
          <div className="skeuo-card p-8 group hover:-translate-y-1 transition-transform">
            <div className="w-12 h-12 rounded-xl skeuo-inset flex items-center justify-center mb-6">
              <Activity className="text-blue-500 w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg mb-2">History Charts</h3>
            <p className="text-sm text-gray-500 font-medium">Interactive price history data to help you decide when to buy.</p>
            <div className="mt-4 text-amazon-orange text-sm font-bold flex items-center gap-1 cursor-pointer">
              Analyze trends <ArrowRight className="w-4 h-4" />
            </div>
          </div>
          <div className="skeuo-card p-8 group hover:-translate-y-1 transition-transform">
            <div className="w-12 h-12 rounded-xl skeuo-inset flex items-center justify-center mb-6">
              <BellRing className="text-amazon-orange w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg mb-2">Multi-Channel Alerts</h3>
            <p className="text-sm text-gray-500 font-medium">Get notified via Email and SMS the second a price hits your target.</p>
            <div className="mt-4 text-amazon-orange text-sm font-bold flex items-center gap-1 cursor-pointer">
              Setup alerts <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </section>
      </main>
      <footer className="mt-20 py-8 text-center text-gray-400 text-sm font-medium">
        Built with ❤️ by Aurelia | V1 Implementation Complete
      </footer>
    </div>
  );
}
//