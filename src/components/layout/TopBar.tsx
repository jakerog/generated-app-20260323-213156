import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, TrendingDown, User, BellRing, LogIn, UserPlus, Shield } from 'lucide-react';
import { useStore } from '@/lib/store';
export function TopBar() {
  const navigate = useNavigate();
  // Ensure primitive access for Zustand store
  const userId = useStore(s => s.userId);
  const isAdmin = useStore(s => s.isAdmin);
  useEffect(() => {
    let isMounted = true;
    // Background cron trigger every 60 seconds
    const intervalId = setInterval(() => {
      fetch('/api/cron/check')
        .then(() => {
          if (!isMounted) return;
        })
        .catch(() => {
          // Silently catch errors to not disrupt user experience
        });
    }, 60000);
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);
  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-4 pointer-events-none">
      <div className="max-w-7xl mx-auto skeuo-card p-3 rounded-2xl flex items-center justify-between pointer-events-auto bg-opacity-90 backdrop-blur-md">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 px-2 hover:scale-105 transition-transform">
          <div className="w-10 h-10 rounded-full bg-amazon-orange flex items-center justify-center shadow-[inset_2px_2px_4px_rgba(255,255,255,0.4),2px_2px_5px_rgba(0,0,0,0.2)]">
            <BellRing className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight hidden sm:block">
            Price<span className="text-amazon-orange">Watch</span>
          </span>
        </Link>
        {/* Search Bar */}
        <div className="flex-1 max-w-xl mx-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Paste Amazon link here..."
              className="skeuo-input w-full pl-10 pr-4 py-2.5 text-sm sm:text-base"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value) {
                  navigate(`/alert/new?url=${encodeURIComponent(e.currentTarget.value)}`);
                }
              }}
            />
          </div>
        </div>
        {/* Links */}
        <div className="flex items-center gap-2 sm:gap-4">
          {!userId ? (
            <>
              <Link to="/signin" title="Sign In" className="skeuo-btn w-10 h-10 sm:w-auto sm:px-4 sm:h-10 text-amazon-navy">
                <LogIn className="w-5 h-5 sm:mr-2" />
                <span className="hidden sm:inline font-bold">Sign In</span>
              </Link>
              <Link to="/signup" title="Sign Up" className="skeuo-btn-primary w-10 h-10 sm:w-auto sm:px-4 sm:h-10">
                <UserPlus className="w-5 h-5 sm:mr-2" />
                <span className="hidden sm:inline">Sign Up</span>
              </Link>
            </>
          ) : (
            <>
              {isAdmin && (
                <Link to="/admin" title="Dashboard" className="skeuo-btn w-10 h-10 sm:w-auto sm:px-4 sm:h-10">
                  <Shield className="w-5 h-5 sm:mr-2 text-purple-600" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
              )}
              <Link to="/" title="Top Drops" className="skeuo-btn w-10 h-10 sm:w-auto sm:px-4 sm:h-10">
                <TrendingDown className="w-5 h-5 sm:mr-2 text-green-600" />
                <span className="hidden sm:inline">Drops</span>
              </Link>
              <Link to="/account" title="Account" className="skeuo-btn w-10 h-10 sm:w-auto sm:px-4 sm:h-10">
                <User className="w-5 h-5 sm:mr-2 text-amazon-navy" />
                <span className="hidden sm:inline">Account</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}