import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Heart,
  User,
  Package,
  PlusCircle,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  Download
} from 'lucide-react';
import Logo from './Logo';

export default function Navbar({
  token,
  setToken,
  darkMode,
  toggleDarkMode,
  onLoginClick,
  cartCount = 0
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [wishlistCount, setWishlistCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  // ── Listen to PWA beforeinstallprompt Event ──────────────────────────────
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent browser default mini-infobar on mobile
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
      console.log('[PWA] LocalMarket was installed successfully');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] Install prompt outcome: ${outcome}`);
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  useEffect(() => {
    const updateWishlist = () => {
      try {
        const saved = localStorage.getItem('wishlist');
        if (saved) setWishlistCount(JSON.parse(saved).length);
        else setWishlistCount(0);
      } catch (err) {
        console.error(err);
      }
    };
    updateWishlist();

    const handler = () => updateWishlist();
    window.addEventListener('wishlist-updated', handler);
    return () => window.removeEventListener('wishlist-updated', handler);
  }, [location]);

  const handleLogout = () => {
    if (setToken) setToken('');
    localStorage.removeItem('jwt');
    navigate('/');
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { label: 'Marketplace', path: '/' },
    ...(token
      ? [
          { label: 'Profile', path: '/profile', icon: User },
          { label: 'Orders', path: '/orders', icon: Package },
          { label: 'Add Product', path: '/add-product', icon: PlusCircle }
        ]
      : [])
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800 shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* ── Brand Logo ─────────────────────────────────────────────── */}
          <div
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 cursor-pointer group select-none"
          >
            <div className="transform group-hover:scale-105 transition-transform duration-200">
              <Logo size={38} />
            </div>
            <div className="flex items-center">
              <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Local<span className="text-emerald-600">Link</span>
              </span>
              <span className="ml-1.5 hidden md:inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800">
                Community
              </span>
            </div>
          </div>

          {/* ── Desktop Navigation Links ───────────────────────────────── */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                    active
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold'
                      : 'text-slate-700 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-50 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* ── Right Actions (Wishlist, Cart, Auth, Dark Toggle) ───────── */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Wishlist Icon Button */}
            {token && (
              <Link
                to="/wishlist"
                aria-label="Wishlist"
                className={`relative p-2 rounded-xl transition-colors ${
                  isActive('/wishlist')
                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                    : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900'
                }`}
              >
                <Heart className="w-5 h-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-emerald-600 text-white text-[10px] font-bold shadow-xs">
                    {wishlistCount}
                  </span>
                )}
              </Link>
            )}

            {/* Cart Icon Button */}
            {token && (
              <Link
                to="/cart"
                aria-label="Cart"
                className={`relative p-2 rounded-xl transition-colors ${
                  isActive('/cart')
                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                    : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900'
                }`}
              >
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-emerald-600 text-white text-[10px] font-bold shadow-xs">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}

            {/* PWA Install App Button (Desktop) */}
            {isInstallable && (
              <button
                type="button"
                onClick={handleInstallClick}
                title="Install LocalMarket to your home screen"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-xs transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install App</span>
              </button>
            )}

            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={toggleDarkMode}
              aria-label="Toggle dark mode"
              className="p-2 rounded-xl text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Auth Buttons */}
            {!token ? (
              <button
                type="button"
                onClick={onLoginClick}
                className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-medium px-4 py-2 rounded-xl text-sm shadow-xs transition-all flex items-center gap-1.5"
              >
                <span>Login / Register</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleLogout}
                className="hidden sm:inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 dark:text-zinc-300 hover:text-red-600 dark:hover:text-red-400 border border-slate-200 dark:border-zinc-700 px-3 py-1.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            )}

            {/* Mobile Menu Hamburger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Menu Dropdown ─────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 pt-3 pb-5 space-y-2 shadow-lg">
          {navLinks.map((link) => {
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  active
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'text-slate-800 dark:text-zinc-200 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          {/* Mobile PWA Install Button */}
          {isInstallable && (
            <button
              type="button"
              onClick={() => {
                handleInstallClick();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-xs transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Install LocalMarket App</span>
            </button>
          )}

          {token && (
            <div className="pt-2 border-t border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout Account</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
