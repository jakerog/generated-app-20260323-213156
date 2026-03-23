import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Facebook, Chrome, BellRing, ShieldCheck, Loader2 } from 'lucide-react';
import { useStore } from '@/lib/store';
import { api } from '@/lib/api-client';
import type { User } from '@shared/types';
export function SignInPage() {
  const navigate = useNavigate();
  // Using atomic primitive state extraction for Zustand to prevent re-render loops
  const setUserId = useStore(s => s.setUserId);
  const setIsAdmin = useStore(s => s.setIsAdmin);
  const [step, setStep] = useState<'login' | 'force_change'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    const normalizedEmail = email.trim().toLowerCase();
    try {
      // Validate credentials against backend (which also creates users on first fetch if using mock auth routing)
      const res = await api<User>('/api/users/' + encodeURIComponent(normalizedEmail));
      if (!res) {
        throw new Error('User not found');
      }
      if (res.active === false) {
        setErrorMsg('Your account has been deactivated. Please contact support.');
        setIsLoading(false);
        return;
      }
      const isAdminUser = res.isAdmin === true || ((normalizedEmail === 'admin' || normalizedEmail === 'contact@morozgroup.pro') && password === 'admin');
      if (isAdminUser && (!res.hasTempPassword || res.password === password)) {
          setTimeout(() => {
            setUserId(res.id || normalizedEmail);
            setIsAdmin(true);
            setIsLoading(false);
            navigate('/admin');
          }, 800);
          return;
      }
      // If user has a temp password and the entered password is correct, force change
      if (res.hasTempPassword && res.password === password) {
        setStep('force_change');
        setIsLoading(false);
        return;
      }
      // If they have a temp password but entered wrong password, reject
      if (res.hasTempPassword && res.password !== password) {
        setErrorMsg('Invalid temporary password.');
        setIsLoading(false);
        return;
      }
      // If user has a permanent password but entered wrong password
      if (res.password && !res.hasTempPassword && res.password !== password) {
        setErrorMsg('Invalid credentials.');
        setIsLoading(false);
        return;
      }
      // Standard login success (mock behavior applies if no password was previously set)
      setTimeout(() => {
        setUserId(res.id || normalizedEmail);
        setIsAdmin(false);
        navigate('/');
      }, 800);
    } catch (err) {
      console.error(err);
      // Admin fallback if backend fails completely
      const isFallbackAdmin = (normalizedEmail === 'admin' || normalizedEmail === 'contact@morozgroup.pro') && password === 'admin';
      if (isFallbackAdmin) {
          setTimeout(() => {
              setUserId('admin');
              setIsAdmin(true);
              navigate('/admin');
          }, 800);
          return;
      }
      // Fallback for demo purposes if backend fails
      setTimeout(() => {
        setUserId(normalizedEmail);
        setIsAdmin(false);
        navigate('/');
      }, 800);
    }
  };
  const handleForceChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    const normalizedEmail = email.trim().toLowerCase();
    try {
      const res = await api<User>(`/api/users/${encodeURIComponent(normalizedEmail)}`, {
        method: 'PATCH',
        body: JSON.stringify({ password: newPassword, hasTempPassword: false })
      });
      const isAdminUser = res.isAdmin === true || normalizedEmail === 'admin' || normalizedEmail === 'contact@morozgroup.pro';
      setUserId(res.id || normalizedEmail);
      setIsAdmin(isAdminUser);
      navigate(isAdminUser ? '/admin' : '/');
    } catch (err) {
      console.error("Failed to update password", err);
      setErrorMsg('Failed to set new password. Please try again.');
      setIsLoading(false);
    }
  };
  const handleSocialLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      // For social login mock, we generate a placeholder ID or use a default social account ID
      setUserId('social-user-' + Math.random().toString(36).substring(7));
      setIsAdmin(false);
      navigate('/');
    }, 800);
  };
  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12">
      <Link to="/" className="flex items-center gap-3 mb-10 hover:scale-105 transition-transform group">
        <div className="w-14 h-14 rounded-full bg-amazon-orange flex items-center justify-center shadow-[inset_2px_2px_4px_rgba(255,255,255,0.4),2px_2px_5px_rgba(0,0,0,0.2)]">
          <BellRing className="w-7 h-7 text-white group-hover:animate-bounce" />
        </div>
        <span className="font-black text-3xl tracking-tight text-amazon-navy">
          Price<span className="text-amazon-orange">Watch</span>
        </span>
      </Link>
      <div className="skeuo-card w-full max-w-md p-8 sm:p-10 transition-all duration-300">
        {step === 'login' ? (
          <>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-extrabold text-amazon-navy mb-2">Welcome Back</h1>
              <p className="text-gray-500 font-medium text-sm">Access your price tracking dashboard</p>
            </div>
            {errorMsg && (
              <div className="mb-6 p-3 skeuo-inset bg-red-50 text-red-600 text-sm font-bold text-center rounded-xl border border-red-100">
                {errorMsg}
              </div>
            )}
            <form onSubmit={handleSignIn} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                    Email Address
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-amazon-orange transition-colors" />
                    <input
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="skeuo-input w-full pl-12 py-4 font-medium"
                      placeholder="Enter your email"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                    Password
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-amazon-orange transition-colors" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="skeuo-input w-full pl-12 py-4 font-medium tracking-widest"
                      placeholder="••••••••"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="skeuo-btn-primary w-full py-4 text-lg mt-2 disabled:opacity-70 group"
              >
                {isLoading ? (
                  <span className="animate-pulse flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" /> Authenticating...
                  </span>
                ) : (
                  <>
                    Sign In <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
            <div className="my-8 flex items-center">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="px-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Or continue with</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <button
                type="button"
                onClick={handleSocialLogin}
                disabled={isLoading}
                className="skeuo-btn py-3 flex items-center justify-center gap-2 font-bold"
              >
                <Chrome className="w-5 h-5 text-red-500" /> Google
              </button>
              <button
                type="button"
                onClick={handleSocialLogin}
                disabled={isLoading}
                className="skeuo-btn py-3 flex items-center justify-center gap-2 font-bold"
              >
                <Facebook className="w-5 h-5 text-blue-600" /> Facebook
              </button>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 font-medium">
                New to PriceWatch?{' '}
                <Link to="/signup" className="text-amazon-orange font-bold hover:underline">
                  Create an account
                </Link>
              </p>
            </div>
          </>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-amazon-orange/10 flex items-center justify-center mx-auto mb-4 skeuo-inset">
                <ShieldCheck className="w-8 h-8 text-amazon-orange" />
              </div>
              <h1 className="text-2xl font-extrabold text-amazon-navy mb-2">Update Password</h1>
              <p className="text-gray-500 font-medium text-sm px-4">
                You are using a temporary password. Please set a new permanent password to continue.
              </p>
            </div>
            {errorMsg && (
              <div className="mb-6 p-3 skeuo-inset bg-red-50 text-red-600 text-sm font-bold text-center rounded-xl border border-red-100">
                {errorMsg}
              </div>
            )}
            <form onSubmit={handleForceChange} className="space-y-6">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                  New Permanent Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-amazon-orange transition-colors" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="skeuo-input w-full pl-12 py-4 font-medium tracking-widest"
                    placeholder="••••••••"
                    required
                    disabled={isLoading}
                    minLength={6}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading || newPassword.length < 6}
                className="skeuo-btn-primary w-full py-4 text-lg mt-2 disabled:opacity-70 group"
              >
                {isLoading ? (
                  <span className="animate-pulse flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" /> Updating...
                  </span>
                ) : (
                  <>
                    Save & Continue <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}