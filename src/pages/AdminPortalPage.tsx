import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TopBar } from '@/components/layout/TopBar';
import { api } from '@/lib/api-client';
import { useStore } from '@/lib/store';
import {
  Shield, Users, Settings, Package, CheckCircle2, Loader2, AlertCircle,
  TrendingDown, Clock, Edit2, X, Mail, Smartphone, Bell, Activity,
  ChevronLeft, Trash2, Power, UserMinus, Eye, ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import type { User, SystemSettings, Product, PriceAlert } from '@shared/types';
type EnrichedAlert = PriceAlert & { product: Product | null };
export function AdminPortalPage() {
    const navigate = useNavigate();
    const isAdmin = useStore(s => s.isAdmin);
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'products'>('overview');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    // Settings inputs
    const [tagInput, setTagInput] = useState('');
    const [intervalInput, setIntervalInput] = useState<number>(15);
    // Guard unauthorized access
    useEffect(() => {
        if (!isAdmin) navigate('/signin', { replace: true });
    }, [isAdmin, navigate]);
    const { data: settings, isLoading: isLoadingSettings } = useQuery<SystemSettings>({
        queryKey: ['admin', 'settings'],
        queryFn: () => api<SystemSettings>('/api/admin/settings'),
        enabled: isAdmin,
    });
    const { data: usersPage, isLoading: isLoadingUsers } = useQuery<{ items: User[], next: string | null }>({
        queryKey: ['admin', 'users'],
        queryFn: () => api<{ items: User[], next: string | null }>('/api/users'),
        enabled: isAdmin && activeTab === 'users' && !selectedUser,
    });
    const { data: productsPage, isLoading: isLoadingProducts } = useQuery<{ items: Product[], next: string | null }>({
        queryKey: ['admin', 'products'],
        queryFn: () => api<{ items: Product[], next: string | null }>('/api/products'),
        enabled: isAdmin && activeTab === 'products',
    });
    const { data: userAlerts, isLoading: isLoadingUserAlerts } = useQuery<EnrichedAlert[]>({
        queryKey: ['admin', 'userAlerts', selectedUser?.id],
        queryFn: () => api<EnrichedAlert[]>(`/api/alerts?userId=${encodeURIComponent(selectedUser!.id)}`),
        enabled: isAdmin && !!selectedUser,
    });
    useEffect(() => {
        if (settings) {
            setTagInput(settings.affiliateTag);
            setIntervalInput(settings.scrapingIntervalMinutes || 15);
        }
    }, [settings]);
    const updateSettingsMutation = useMutation({
        mutationFn: (data: Partial<SystemSettings>) => api<SystemSettings>('/api/admin/settings', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
            toast.success('Settings updated');
        }
    });
    const forceScrapeMutation = useMutation({
        mutationFn: () => api('/api/cron/check?force=true'),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
            toast.success('Manual scrape completed');
        }
    });
    const deleteUserMutation = useMutation({
        mutationFn: (userId: string) => api(`/api/users/${encodeURIComponent(userId)}`, {
            method: 'DELETE'
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
            toast.success('User deleted successfully');
        },
        onError: (err: any) => {
            toast.error(err.message || 'Failed to delete user');
        }
    });
    if (!isAdmin) return null;
    return (
        <div className="min-h-screen pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <TopBar />
            {/* Header & Tabs */}
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-200/50 pb-6">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl skeuo-inset flex items-center justify-center bg-white">
                        <Shield className="w-8 h-8 text-amazon-orange" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold text-amazon-navy">Admin Portal</h1>
                        <p className="text-sm font-medium text-gray-500">System metrics and configuration</p>
                    </div>
                </div>
                <div className="flex bg-white/50 p-1 skeuo-inset rounded-xl">
                    {(['overview', 'users', 'products'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => { setActiveTab(tab); setSelectedUser(null); }}
                            className={`px-6 py-2 text-sm font-bold rounded-lg capitalize transition-all ${activeTab === tab ? 'bg-white shadow-sm text-amazon-orange' : 'text-gray-500'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>
            {/* TAB CONTENT: Overview */}
            {activeTab === 'overview' && (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard icon={<Users className="text-blue-500" />} label="Users" value={settings?.totalUsers ?? 0} />
                        <StatCard icon={<Package className="text-purple-500" />} label="Products" value={settings?.totalProducts ?? 0} />
                        <StatCard icon={<Activity className="text-green-500" />} label="Total Scrapes" value={settings?.totalScrapes ?? 0} />
                        {/* Health Status with Hoverable Error */}
                        <div className="skeuo-card p-6 flex items-center gap-4 group relative overflow-visible">
                            <div className="w-12 h-12 rounded-full skeuo-inset flex items-center justify-center bg-white">
                                <AlertCircle className={`w-5 h-5 ${(settings?.failedScrapes || 0) > 0 ? 'text-red-500' : 'text-gray-300'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Failures</p>
                                <p className={`text-2xl font-black ${(settings?.failedScrapes || 0) > 0 ? 'text-red-600' : 'text-amazon-navy'}`}>
                                    {settings?.failedScrapes || 0}
                                </p>
                                {settings?.lastScrapeError && (
                                    <div className="mt-1">
                                        <p className="text-[10px] text-red-400 line-clamp-1 italic cursor-help">
                                            {settings.lastScrapeError}
                                        </p>
                                        <div className="absolute z-50 left-0 bottom-full mb-2 hidden group-hover:block w-64 p-3 bg-red-50 border border-red-200 rounded-xl shadow-2xl text-[10px] text-red-700 leading-relaxed font-medium">
                                            <p className="font-black uppercase mb-1 border-b border-red-200 pb-1">Last Error Log</p>
                                            {settings.lastScrapeError}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="skeuo-card p-8">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <Settings className="w-5 h-5 text-amazon-orange" /> System Settings
                            </h2>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Affiliate Tag</label>
                                    <input
                                        type="text"
                                        value={tagInput}
                                        onChange={e => setTagInput(e.target.value)}
                                        className="skeuo-input w-full font-mono text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Scrape Interval (Minutes)</label>
                                    <input
                                        type="number"
                                        min="5"
                                        max="10080"
                                        step="5"
                                        value={intervalInput}
                                        onChange={e => setIntervalInput(parseInt(e.target.value) || 15)}
                                        className="skeuo-input w-full font-mono text-sm"
                                    />
                                </div>
                                <button
                                    onClick={() => updateSettingsMutation.mutate({
                                        affiliateTag: tagInput,
                                        scrapingIntervalMinutes: intervalInput
                                    })}
                                    className="skeuo-btn-primary w-full py-4 font-bold"
                                >
                                    Update Global Config
                                </button>
                            </div>
                        </div>
                        <div className="skeuo-card p-8">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-amazon-orange" /> Scraper Control
                            </h2>
                            <div className="p-4 skeuo-inset rounded-xl bg-white/50 mb-6 flex justify-between items-center">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase">Last Run</p>
                                    <p className="font-bold text-amazon-navy">
                                        {settings?.lastScrapeTime ? format(new Date(settings.lastScrapeTime), 'HH:mm:ss') : 'Never'}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-gray-400 uppercase">Status</p>
                                    <p className={`font-bold capitalize ${settings?.lastCronStatus === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                                        {settings?.lastCronStatus || 'Idle'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => forceScrapeMutation.mutate()}
                                className="skeuo-btn w-full py-4 font-bold flex items-center justify-center gap-2 border-green-100 text-green-700 hover:bg-green-50"
                            >
                                <Activity className="w-5 h-5" /> Force System Scrape
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* TAB CONTENT: Products */}
            {activeTab === 'products' && (
                isLoadingProducts ? (
                    <div className="skeuo-card p-12 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-amazon-orange" />
                    </div>
                ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {(productsPage?.items || []).map(product => (
                        <div key={product.id} className="skeuo-card p-4 flex flex-col group hover:scale-[1.02] transition-all cursor-default">
                            <div className="flex gap-4 mb-4">
                                <div className="w-20 h-20 rounded-xl skeuo-inset bg-white p-2 shrink-0 flex items-center justify-center overflow-hidden">
                                    <img
                                        src={product.image}
                                        alt="Product"
                                        referrerPolicy="no-referrer"
                                        className="w-full h-full object-contain mix-blend-multiply"
                                        onError={(e) => {
                                            e.currentTarget.onerror = null;
                                            e.currentTarget.src = 'https://placehold.co/100x100?text=No+Image';
                                        }}
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-sm line-clamp-2 leading-tight mb-1">{product.title}</h3>
                                    <p className="text-[10px] font-mono text-amazon-orange font-bold uppercase">{product.id}</p>
                                </div>
                            </div>
                            <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100">
                                <p className="text-xl font-black text-amazon-navy">${product.currentPrice?.toFixed(2) ?? '0.00'}</p>
                                <a
                                    href={product.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-2 skeuo-btn rounded-lg text-gray-400 hover:text-amazon-orange"
                                >
                                    <Clock className="w-4 h-4" />
                                </a>
                            </div>
                        </div>
                    ))}
                    {(productsPage?.items || []).length === 0 && (
                        <div className="col-span-full py-20 text-center skeuo-card border-dashed bg-transparent shadow-none">
                            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="font-bold text-gray-400">No products currently being tracked.</p>
                        </div>
                    )}
                </div>
                )
            )}
            {/* TAB CONTENT: Users */}
            {activeTab === 'users' && (
                isLoadingUsers && !selectedUser ? (
                    <div className="skeuo-card p-12 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-amazon-orange" />
                    </div>
                ) : selectedUser ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="flex items-center gap-4 mb-6">
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="skeuo-btn p-3 flex items-center justify-center rounded-xl"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <h2 className="text-2xl font-black text-amazon-navy">User Profile</h2>
                        </div>
                        <div className="skeuo-card p-6 flex flex-col sm:flex-row gap-6 items-center sm:items-start bg-white/50">
                            <div className="w-16 h-16 rounded-full skeuo-inset flex items-center justify-center bg-gray-100 shrink-0">
                                <Users className="w-8 h-8 text-gray-400" />
                            </div>
                            <div className="flex-1 text-center sm:text-left">
                                <h3 className="text-xl font-bold">{selectedUser.email}</h3>
                                <p className="text-xs font-mono text-gray-500 mb-4">{selectedUser.id}</p>
                                <div className="flex justify-center sm:justify-start gap-3">
                                    <span className={`px-3 py-1 rounded text-xs font-black uppercase tracking-tighter ${selectedUser.isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
                                        {selectedUser.isAdmin ? 'Admin' : 'User'}
                                    </span>
                                    <span className={`px-3 py-1 rounded text-xs font-black uppercase tracking-tighter ${selectedUser.active !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {selectedUser.active !== false ? 'Active' : 'Banned'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <h3 className="text-lg font-bold flex items-center gap-2 mt-8 mb-4">
                            <Bell className="w-5 h-5 text-amazon-orange" /> Active Price Watches
                        </h3>
                        {isLoadingUserAlerts ? (
                            <div className="skeuo-card p-12 flex items-center justify-center">
                                <Loader2 className="w-8 h-8 animate-spin text-amazon-orange" />
                            </div>
                        ) : !userAlerts || userAlerts.length === 0 ? (
                            <div className="skeuo-card p-12 text-center border-dashed bg-transparent shadow-none">
                                <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <p className="font-bold text-gray-400">No active price watches found for this user.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {userAlerts.map(alert => (
                                    <div key={alert.id} className="skeuo-card p-4 flex gap-4 group hover:scale-[1.02] transition-all">
                                        <div className="w-24 h-24 rounded-xl skeuo-inset bg-white p-2 shrink-0 flex items-center justify-center overflow-hidden">
                                            <img
                                                src={alert.product?.image || 'https://placehold.co/100x100?text=No+Image'}
                                                alt="Product"
                                                className="w-full h-full object-contain mix-blend-multiply"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0 flex flex-col">
                                            <h4 className="font-bold text-sm line-clamp-2 leading-tight mb-2">
                                                {alert.product?.title || 'Unknown Product'}
                                            </h4>
                                            <div className="mt-auto flex justify-between items-end">
                                                <div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase">Target</p>
                                                    <p className="text-lg font-black text-amazon-orange">${alert.targetPrice.toFixed(2)}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-black text-gray-400 uppercase">Current</p>
                                                    <p className="text-sm font-bold text-amazon-navy">${alert.product?.currentPrice?.toFixed(2) || '---'}</p>
                                                </div>
                                            </div>
                                            <div className="mt-3 flex gap-1 flex-wrap">
                                                {alert.conditions.amazon && <span className="px-1.5 py-0.5 bg-gray-100 text-[9px] font-bold rounded text-gray-600">AMZN</span>}
                                                {alert.conditions.new && <span className="px-1.5 py-0.5 bg-gray-100 text-[9px] font-bold rounded text-gray-600">NEW</span>}
                                                {alert.conditions.used && <span className="px-1.5 py-0.5 bg-gray-100 text-[9px] font-bold rounded text-gray-600">USED</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="skeuo-card overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50/50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Identity</th>
                                        <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Role</th>
                                        <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                        <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {(usersPage?.items || []).map(user => (
                                        <tr key={user.id} className="hover:bg-white/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-amazon-navy">{user.email}</span>
                                                    <span className="text-[10px] font-mono text-gray-400">{user.id}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${user.isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
                                                    {user.isAdmin ? 'Admin' : 'User'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${user.active !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {user.active !== false ? 'Active' : 'Banned'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right flex justify-end gap-2">
                                                <button
                                                    onClick={() => setSelectedUser(user)}
                                                    className="p-2 skeuo-btn rounded-lg text-blue-500 hover:bg-blue-50"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button className="p-2 skeuo-btn rounded-lg text-amazon-navy hover:text-amazon-orange" title="Edit User">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
                                                            deleteUserMutation.mutate(user.id);
                                                        }
                                                    }}
                                                    disabled={deleteUserMutation.isPending}
                                                    className="p-2 skeuo-btn rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-50"
                                                    title="Delete User"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {(usersPage?.items || []).length === 0 && (
                                <div className="py-12 text-center text-gray-500">
                                    No users found.
                                </div>
                            )}
                        </div>
                    </div>
                )
            )}
        </div>
    );
}
function StatCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: number | string }) {
    return (
        <div className="skeuo-card p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full skeuo-inset flex items-center justify-center bg-white shadow-inner">
                {icon}
            </div>
            <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
                <p className="text-2xl font-black text-amazon-navy">{value}</p>
            </div>
        </div>
    );
}