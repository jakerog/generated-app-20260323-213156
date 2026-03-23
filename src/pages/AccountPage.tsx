import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Settings,
  Mail,
  Smartphone,
  Bell,
  KeyRound,
  LogOut,
  User as UserIcon,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  MessageSquare,
  Check
} from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { api } from '@/lib/api-client';
import { useStore } from '@/lib/store';
import type { User, UserPreferences } from '@shared/types';
export function AccountPage() {
  const queryClient = useQueryClient();
  const userId = useStore((state) => state.userId);
  const setUserId = useStore((state) => state.setUserId);
  const setIsAdmin = useStore((state) => state.setIsAdmin);
  // Local Form State
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [preferences, setPreferences] = useState<UserPreferences>({
    emailAlerts: true,
    smsAlerts: false,
    promoEmails: false
  });
  // OTP State
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // 1. Fetch User Data
  const { data: userData, isLoading, isError, error, refetch } = useQuery<User>({
    queryKey: ['user', userId],
    queryFn: () => api<User>(`/api/users/${encodeURIComponent(userId || '')}`),
    enabled: !!userId,
    retry: 1,
  });
  // Logging errors for diagnosis
  useEffect(() => {
    if (isError) {
      console.error('AccountPage: Error fetching user data:', error);
    }
  }, [isError, error]);
  // Sync local state when data is fetched or user changes
  useEffect(() => {
    if (userData) {
      setEmail(userData.email || '');
      setPhone(userData.phone || '');
      if (userData.preferences) {
        setPreferences(userData.preferences);
      }
      setShowOtp(false);
      setOtp('');
    }
  }, [userData]);
  // 2. Update Mutation
  const updateMutation = useMutation({
    mutationFn: (updatedData: Partial<User>) =>
      api<User>(`/api/users/${encodeURIComponent(userId || '')}`, {
        method: 'PATCH',
        body: JSON.stringify(updatedData),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(['user', userId], data);
      toast.success('Account settings updated successfully');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update settings');
    }
  });
  const handleSave = () => {
    // If phone has changed and isn't empty, and we aren't showing OTP yet, trigger OTP
    if (phone && phone !== userData?.phone && !showOtp) {
      setShowOtp(true);
      toast.success('SMS Verification Code Sent to ' + phone);
      return;
    }
    // If showing OTP, mock verify
    if (showOtp) {
      if (otp.length < 4) {
        toast.error('Please enter a valid verification code');
        return;
      }
      toast.success('Phone number verified successfully!');
      setShowOtp(false);
      setOtp('');
    }
    updateMutation.mutate({
      email,
      phone,
      preferences
    });
  };
  const togglePreference = (key: keyof UserPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      setIsLoggingOut(true);
      setUserId(null);
      setIsAdmin(false);
      window.location.href = "/";
    }
  };
  if (isLoading || isLoggingOut) {
    return (
      <div className="min-h-screen pt-28 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-amazon-orange" />
        <p className="text-gray-500 font-medium">
          {isLoggingOut ? 'Signing out...' : 'Loading your profile...'}
        </p>
      </div>
    );
  }
  if (isError || !userId) {
    const isAuthError = !userId || (error as any)?.status === 401 || (error as any)?.message?.includes('401') || (error as any)?.statusCode === 401;
    return (
      <div className="min-h-screen pt-28 px-4 flex flex-col items-center justify-center text-center">
        <div className="skeuo-card p-12 max-w-md w-full flex flex-col items-center shadow-2xl border-t-4 border-red-500">
          <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-6">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-black text-amazon-navy mb-3">
            {isAuthError ? 'Access Denied' : 'System Connection Error'}
          </h2>
          <p className="text-gray-500 font-medium mb-10 leading-relaxed">
            {isAuthError
              ? 'Your security session has expired or is invalid. Please re-authenticate to manage your account safely.'
              : 'Our servers are currently unreachable. Please check your connection or try again in a moment.'}
          </p>
          <div className="w-full space-y-3">
            {isAuthError ? (
              <button
                onClick={() => window.location.href = "/signin"}
                className="skeuo-btn-primary w-full py-4 text-lg font-bold shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Sign In to Your Account
              </button>
            ) : (
              <>
                <button
                  onClick={() => refetch()}
                  className="skeuo-btn-primary w-full py-4 text-lg font-bold"
                >
                  Attempt Reconnection
                </button>
                <button
                  onClick={() => window.location.href = "/"}
                  className="skeuo-btn w-full py-3 text-gray-500 font-bold"
                >
                  Back to Marketplace
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <TopBar />
      <div className="mb-10 text-center">
        <div className="w-20 h-20 mx-auto rounded-full skeuo-card mb-4 flex items-center justify-center bg-white shadow-skeuo-outset relative">
          <Settings className="w-10 h-10 text-amazon-navy" />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-[#F5F5F7] flex items-center justify-center">
            <ShieldCheck className="w-3 h-3 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-extrabold text-amazon-navy">Account Control Panel</h1>
        <p className="text-gray-500 mt-2">Manage your identity and notification triggers</p>
      </div>
      <div className="space-y-8">
        {/* Profile Section */}
        <div className="skeuo-card p-6 sm:p-8 border-t-4 border-t-amazon-orange">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
            <UserIcon className="w-5 h-5 text-amazon-orange" />
            Identity Details
          </h2>
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-amazon-orange transition-colors" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="skeuo-input w-full pl-12 font-medium"
                    placeholder="your@email.com"
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                    Phone Number
                  </label>
                  {userData?.phone && phone === userData.phone && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-green-100 text-green-700">
                      <Check className="w-3 h-3" /> Verified
                    </span>
                  )}
                </div>
                <div className="relative group">
                  <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-amazon-orange transition-colors" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setShowOtp(false); // Reset OTP flow if phone changes
                    }}
                    className="skeuo-input w-full pl-12 font-medium"
                    placeholder="+1 (555) 000-0000"
                    disabled={showOtp}
                  />
                </div>
                {phone && phone !== userData?.phone && !showOtp && (
                  <p className="mt-2 text-[10px] text-amazon-orange font-bold uppercase tracking-tighter ml-1">
                    Verification required to enable SMS alerts
                  </p>
                )}
                {/* OTP Input Section */}
                {showOtp && (
                  <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                      Enter Verification Code
                    </label>
                    <div className="relative group">
                      <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-amazon-orange transition-colors" />
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="skeuo-input w-full pl-12 font-mono text-center tracking-[0.5em] text-lg font-bold"
                        placeholder="000000"
                        maxLength={6}
                      />
                    </div>
                    <p className="mt-2 text-[10px] text-gray-500 font-bold uppercase tracking-tighter text-center">
                      We sent a code to {phone}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="skeuo-btn-primary px-10 py-3 flex items-center gap-2 disabled:opacity-70"
              >
                {updateMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                {showOtp ? 'Verify & Save' : 'Commit Changes'}
              </button>
            </div>
          </div>
        </div>
        {/* Notifications Section */}
        <div className="skeuo-card p-6 sm:p-8">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
            <Bell className="w-5 h-5 text-amazon-orange" />
            Alert Infrastructure
          </h2>
          <div className="grid grid-cols-1 gap-4">
            <button
              onClick={() => togglePreference('emailAlerts')}
              className={`flex items-center justify-between p-5 rounded-2xl transition-all duration-300 ${preferences.emailAlerts ? 'skeuo-inset bg-amazon-orange/[0.03]' : 'skeuo-btn opacity-60'}`}
            >
              <div className="flex items-center gap-4 text-left">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${preferences.emailAlerts ? 'bg-amazon-orange text-white shadow-lg' : 'bg-gray-100 text-gray-400'}`}>
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <span className="font-bold block text-amazon-navy text-lg">Email Dispatch</span>
                  <span className="text-sm text-gray-500 font-medium">Standard price drop notifications</span>
                </div>
              </div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${preferences.emailAlerts ? 'bg-amazon-orange border-amazon-orange shadow-inner' : 'border-gray-200'}`}>
                {preferences.emailAlerts && <CheckCircle2 className="w-5 h-5 text-white" />}
              </div>
            </button>
            <button
              onClick={() => togglePreference('smsAlerts')}
              className={`flex items-center justify-between p-5 rounded-2xl transition-all duration-300 ${preferences.smsAlerts ? 'skeuo-inset bg-amazon-orange/[0.03]' : 'skeuo-btn opacity-60'}`}
            >
              <div className="flex items-center gap-4 text-left">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${preferences.smsAlerts ? 'bg-amazon-orange text-white shadow-lg' : 'bg-gray-100 text-gray-400'}`}>
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <span className="font-bold block text-amazon-navy text-lg">SMS Quick-Alert</span>
                  <span className="text-sm text-gray-500 font-medium">Instant texts for major price shifts</span>
                </div>
              </div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${preferences.smsAlerts ? 'bg-amazon-orange border-amazon-orange shadow-inner' : 'border-gray-200'}`}>
                {preferences.smsAlerts && <CheckCircle2 className="w-5 h-5 text-white" />}
              </div>
            </button>
            <button
              onClick={() => togglePreference('promoEmails')}
              className={`flex items-center justify-between p-5 rounded-2xl transition-all duration-300 ${preferences.promoEmails ? 'skeuo-inset bg-amazon-orange/[0.03]' : 'skeuo-btn opacity-60'}`}
            >
              <div className="flex items-center gap-4 text-left">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${preferences.promoEmails ? 'bg-amazon-orange text-white shadow-lg' : 'bg-gray-100 text-gray-400'}`}>
                  <Bell className="w-6 h-6" />
                </div>
                <div>
                  <span className="font-bold block text-amazon-navy text-lg">Market Updates</span>
                  <span className="text-sm text-gray-500 font-medium">Weekly trends and deal roundups</span>
                </div>
              </div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${preferences.promoEmails ? 'bg-amazon-orange border-amazon-orange shadow-inner' : 'border-gray-200'}`}>
                {preferences.promoEmails && <CheckCircle2 className="w-5 h-5 text-white" />}
              </div>
            </button>
          </div>
        </div>
        {/* Danger Zone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div className="skeuo-card p-8 flex flex-col items-center justify-center text-center group">
            <div className="w-14 h-14 rounded-2xl skeuo-inset flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <KeyRound className="w-7 h-7 text-gray-400" />
            </div>
            <h3 className="font-bold text-lg mb-1">Security Tokens</h3>
            <p className="text-sm text-gray-500 mb-6">Rotate your access credentials</p>
            <button className="skeuo-btn w-full py-3 font-bold">Update Password</button>
          </div>
          <div className="skeuo-card p-8 flex flex-col items-center justify-center text-center group">
            <div className="w-14 h-14 rounded-2xl skeuo-inset flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <LogOut className="w-7 h-7 text-red-400" />
            </div>
            <h3 className="font-bold text-lg mb-1">Session Termination</h3>
            <p className="text-sm text-gray-500 mb-6">Securely exit PriceWatch</p>
            <button
              onClick={handleLogout}
              className="skeuo-btn w-full py-3 text-red-600 font-bold border-red-100 hover:bg-red-50"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}