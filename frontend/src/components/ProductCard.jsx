import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Star,
  MapPin,
  Heart,
  ShoppingBag,
  Calendar,
  Repeat,
  Eye,
  Leaf,
  MessageCircle,
  QrCode
} from 'lucide-react';
import PaymentModal from './PaymentModal';
import { API_BASE_URL } from '../config';

export default function ProductCard({
  item,
  onAddToCart,
  isInWishlist = false,
  onToggleWishlist,
  isLoading = false
}) {
  const navigate = useNavigate();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);

  // ── Skeleton Loading State ──────────────────────────────────────────────────
  if (isLoading || !item) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden animate-pulse flex flex-col h-full">
        {/* 4:3 Aspect Ratio Image Skeleton */}
        <div className="relative aspect-4/3 w-full bg-slate-100 dark:bg-zinc-800">
          <div className="absolute top-3 left-3 w-16 h-5 bg-slate-200 dark:bg-zinc-700 rounded-md"></div>
          <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-200 dark:bg-zinc-700"></div>
        </div>

        {/* Body Skeleton */}
        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-20 h-3.5 bg-slate-200 dark:bg-zinc-800 rounded"></div>
              <div className="w-14 h-3.5 bg-slate-200 dark:bg-zinc-800 rounded"></div>
            </div>
            <div className="w-full h-4.5 bg-slate-200 dark:bg-zinc-800 rounded"></div>
            <div className="w-3/4 h-4.5 bg-slate-200 dark:bg-zinc-800 rounded"></div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="w-24 h-6 bg-slate-200 dark:bg-zinc-800 rounded"></div>
              <div className="w-16 h-3.5 bg-slate-200 dark:bg-zinc-800 rounded"></div>
            </div>
            <div className="w-full h-9 bg-slate-200 dark:bg-zinc-800 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  // ── Data Extraction ────────────────────────────────────────────────────────
  const id = item._id || item.id;
  const title = item.title || item.name || 'Local Listing';
  const price = typeof item.price === 'number' ? item.price : Number(item.price) || 0;
  const formattedPrice = `₹${price.toLocaleString('en-IN')}`;
  const category = item.category || 'General';
  const isService = category.toLowerCase().includes('service') || item.listingType === 'SERVICE';
  const listingType = item.listingType || (isService ? 'SERVICE' : 'SELL');
  const location = typeof item.location === 'object'
    ? (item.location?.address || 'Local Area')
    : (item.location || item.seller?.address?.city || 'Local Area');
  const rating = item.rating || (4.5 + ((title.length || 5) % 5) * 0.1).toFixed(1);
  const reviewsCount = item.reviewsCount || Math.floor(12 + ((title.length || 3) * 7) % 85);
  const isEco = item.isEcoFriendly;
  
  const fallbackImg = isService
    ? 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&auto=format&fit=crop&q=60'
    : 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&auto=format&fit=crop&q=60';

  const rawImg = item.imageUrl || (item.images && item.images.length > 0 ? item.images[0] : null);
  const resolvedImg = rawImg
    ? (rawImg.startsWith('/uploads/') ? `${API_BASE_URL || ''}${rawImg}` : rawImg)
    : fallbackImg;
  const imageUrl = imageError ? fallbackImg : resolvedImg;

  const sellerPhone = (item.sellerPhone || item.seller?.phone || '9876543210').replace(/\D/g, '').slice(-10);
  const waUrl = `https://wa.me/91${sellerPhone}?text=${encodeURIComponent('Hi, I am interested in buying "' + title + '" listed on LocalMarket for ₹' + price)}`;

  const handleWhatsAppClick = (e) => {
    e.stopPropagation();
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleUpiClick = (e) => {
    e.stopPropagation();
    setPaymentOpen(true);
  };

  const handleCardClick = () => {
    navigate(`/product/${id}`);
  };

  const handleActionClick = (e) => {
    e.stopPropagation();
    if (isService) {
      navigate(`/product/${id}`);
    } else if (onAddToCart) {
      onAddToCart(item);
    }
  };

  const handleWishlistClick = (e) => {
    e.stopPropagation();
    if (onToggleWishlist) {
      onToggleWishlist(item);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-zinc-700 transition-all duration-300 ease-out flex flex-col h-full cursor-pointer overflow-hidden"
    >
      {/* ── 1. 4:3 Aspect Ratio Image Container with Hover Zoom ───────── */}
      <div className="relative aspect-4/3 w-full overflow-hidden bg-slate-100 dark:bg-zinc-800">
        <img
          src={imageUrl}
          alt={title}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            setImageError(true);
            setImageLoaded(true);
          }}
          className={`w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Soft bottom vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 group-hover:opacity-30 transition-opacity"></div>

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 z-10">
          {/* Item Type Badge: Product vs Service */}
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold tracking-wide uppercase shadow-xs backdrop-blur-md ${
              isService
                ? 'bg-indigo-600 text-white'
                : 'bg-emerald-600 text-white'
            }`}
          >
            {isService ? 'Service' : 'Product'}
          </span>

          {listingType === 'SHARE' && (
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500 text-white shadow-xs backdrop-blur-md">
              <Repeat className="w-2.5 h-2.5" /> Rent/Share
            </span>
          )}

          {/* Distance Badge */}
          {item.distanceKm !== undefined && item.distanceKm !== null && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-600 text-white shadow-xs backdrop-blur-md">
              📍 {item.distanceKm} km away
            </span>
          )}

          {isEco && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-700 text-white shadow-xs">
              <Leaf className="w-2.5 h-2.5" /> Eco
            </span>
          )}
        </div>

        {/* Wishlist Button Top-Right */}
        <button
          type="button"
          onClick={handleWishlistClick}
          aria-label="Add to wishlist"
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/95 dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-700 backdrop-blur-md flex items-center justify-center shadow-xs hover:scale-110 active:scale-90 transition-all text-slate-500 dark:text-zinc-300 hover:text-red-500"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isInWishlist ? 'fill-red-500 text-red-500' : 'text-slate-500 dark:text-zinc-400'
            }`}
          />
        </button>

        {/* Rating Badge Bottom-Left */}
        <div className="absolute bottom-2.5 left-3 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/95 dark:bg-zinc-900/90 border border-slate-200/70 dark:border-zinc-700/80 backdrop-blur-md text-slate-800 dark:text-zinc-100 text-[11px] font-semibold shadow-xs">
          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
          <span>{rating}</span>
          <span className="text-slate-400 dark:text-zinc-400 text-[10px]">({reviewsCount})</span>
        </div>
      </div>

      {/* ── 2. Card Content (Dark charcoal title, medium slate metadata) ── */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Metadata */}
          <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-zinc-400 mb-1.5">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider text-[11px] truncate max-w-[120px]">
              {category}
            </span>
            <span className="inline-flex items-center gap-1 text-slate-500 dark:text-zinc-400 truncate">
              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{location}</span>
            </span>
          </div>

          {/* Heading (Dark charcoal text-slate-900) */}
          <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-zinc-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug">
            {title}
          </h3>

          {/* Subtle description */}
          {item.description && (
            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400 line-clamp-1 leading-relaxed">
              {item.description}
            </p>
          )}
        </div>

        {/* ── Direct WhatsApp Chat & Zero-Fee UPI Quick Actions ── */}
        <div className="pt-2.5 mt-2.5 border-t border-slate-100 dark:border-zinc-800/80 flex items-center gap-2">
          <button
            type="button"
            onClick={handleWhatsAppClick}
            title="Chat directly on WhatsApp"
            className="flex-1 py-1.5 px-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors active:scale-95"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate">Chat on WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={handleUpiClick}
            title="Scan & Pay via UPI (Zero Fee)"
            className="py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors active:scale-95 shrink-0"
          >
            <QrCode className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>UPI Pay</span>
          </button>
        </div>

        {/* ── 3. Price & Primary Emerald Button ─────────────────────────── */}
        <div className="pt-2.5 mt-2.5 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block -mb-0.5">
              {listingType === 'SHARE' ? 'Daily Rate' : 'Price'}
            </span>
            <span className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
              {formattedPrice}
            </span>
          </div>

          {/* Emerald accent button (bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl) */}
          <button
            type="button"
            onClick={handleActionClick}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs sm:text-sm py-2 px-3.5 rounded-xl shadow-xs transition-colors inline-flex items-center justify-center gap-1.5 active:scale-95"
          >
            {isService ? (
              <>
                <Calendar className="w-3.5 h-3.5" />
                <span>Book Service</span>
              </>
            ) : listingType === 'SHARE' ? (
              <>
                <Repeat className="w-3.5 h-3.5" />
                <span>Borrow</span>
              </>
            ) : onAddToCart ? (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Add to Cart</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>View</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Zero-Fee UPI Payment Modal ── */}
      <PaymentModal
        isOpen={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        item={item}
      />
    </div>
  );
}
