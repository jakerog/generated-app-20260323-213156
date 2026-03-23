import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Smartphone, ArrowRight, Facebook, Chrome, BellRing } from 'lucide-react';
import { useStore } from '@/lib/store';
export function SignUpPage() {
  const navigate = useNavigate();
  const setUserId = useStore(s => s.setUserId);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Use email as deterministic ID for local storage partitioning
    const id = email.toLowerCase().trim();
    
    // Minimal mock auth: just set the ID and navigate. 
    // Backend/Store handles initialization on first access.
    setTimeout(() => {
      setUserId(id);
      setIsLoading(false);
      navigate('/');
    }, 500);
  };
  const handleSocialLogin = (provider: string) => {
    setIsLoading(true);
    // Mock social login generating unique IDs based on provider
    setTimeout(() => {
      const socialId = `${provider}_user@example.com`;
      setUserId(socialId);
      setIsLoading(false);
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
      <div className="skeuo-card w-full max-w-md p-8 sm:p-10">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-amazon-navy mb-2">Create Account</h1>
          <p className="text-gray-500 font-medium text-sm">Start tracking Amazon prices instantly</p>
        </div>
        <form onSubmit={handleSignUp} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                Email Address *
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-amazon-orange transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="skeuo-input w-full pl-12 py-3.5 font-medium"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                Phone Number <span className="text-gray-400 lowercase font-normal">(optional)</span>
              </label>
              <div className="relative group">
                <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-amazon-orange transition-colors" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="skeuo-input w-full pl-12 py-3.5 font-medium"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <p className="mt-1.5 text-[10px] text-gray-500 font-bold ml-1">For instant SMS price drop alerts</p>
            </div>
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                Create Password *
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-amazon-orange transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="skeuo-input w-full pl-12 py-3.5 font-medium tracking-widest"
                  placeholder="••••••••"
                  required
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
              <span className="animate-pulse">Creating Account...</span>
            ) : (
              <>
                Sign Up <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>
        <div className="my-8 flex items-center">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Or sign up with</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-8">
          <button
            type="button"
            onClick={() => handleSocialLogin('google')}
            disabled={isLoading}
            className="skeuo-btn py-3 flex items-center justify-center gap-2 font-bold"
          >
            <Chrome className="w-5 h-5 text-red-500" /> Google
          </button>
          <button
            type="button"
            onClick={() => handleSocialLogin('facebook')}
            disabled={isLoading}
            className="skeuo-btn py-3 flex items-center justify-center gap-2 font-bold"
          >
            <Facebook className="w-5 h-5 text-blue-600" /> Facebook
          </button>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500 font-medium">
            Already have an account?{' '}
            <Link to="/signin" className="text-amazon-orange font-bold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}