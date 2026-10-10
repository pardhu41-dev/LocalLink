import React, { useState } from 'react';
import {
  Search,
  MapPin,
  Navigation,
  Layers,
  ChevronDown,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowUpDown,
  SlidersHorizontal
} from 'lucide-react';

export default function SearchBar({
  searchTerm = '',
  onSearchChange,
  selectedCategory = 'ALL',
  onCategoryChange,
  categories = [],
  locationFilter = '',
  onLocationChange,
  maxDistKm = 15,
  onMaxDistKmChange,
  onLocationSearch,
  onResetLocation,
  isLocationActive = false,
  sortBy = 'newest',
  onSortChange,
  activeFiltersCount = 0,
  onToggleMobileFilter
}) {
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [geoSuccess, setGeoSuccess] = useState('');

  // 100% Free browser Geolocation API (navigator.geolocation)
  const handleFindNearMe = () => {
    setGeoError('');
    setGeoSuccess('');

    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocating(false);
        setGeoSuccess(`GPS locked! Showing listings within ${maxDistKm} km`);
        setTimeout(() => setGeoSuccess(''), 5000);

        if (onLocationSearch) {
          onLocationSearch({
            lat: latitude,
            lng: longitude,
            maxDistKm: maxDistKm || 15
          });
        }
      },
      (error) => {
        setLocating(false);
        let msg = 'Unable to retrieve your location.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Location access was denied. Please enable location permissions in your browser.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'Location information is currently unavailable.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'Location request timed out. Please try again.';
        }
        setGeoError(msg);
        setTimeout(() => setGeoError(''), 6000);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const handleClearLocation = () => {
    setGeoError('');
    setGeoSuccess('');
    if (onResetLocation) onResetLocation();
  };

  return (
    <section className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm p-3 sm:p-3.5 mb-6 transition-all">
      <div className="flex flex-col lg:flex-row items-stretch gap-3">
        {/* 1. Category Selector Dropdown */}
        <div className="relative min-w-[175px] shrink-0">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-emerald-600 dark:text-emerald-400">
            <Layers className="w-4 h-4" />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange && onCategoryChange(e.target.value)}
            aria-label="Category selector"
            className="w-full h-11 pl-9 pr-8 bg-slate-50 hover:bg-slate-100/80 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 appearance-none cursor-pointer transition-all"
          >
            <option value="ALL">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>

        {/* 2. Text Search Input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            placeholder="Search products, services, electronics, gear in your neighborhood..."
            className="w-full h-11 pl-10 pr-9 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange && onSearchChange('')}
              className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 3. Distance Radius Selector */}
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 rounded-xl px-3.5 py-1 shrink-0 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-600/20 transition-all">
          <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div className="text-left">
            <span className="text-[10px] uppercase font-bold text-slate-400 block -mb-0.5">
              Radius
            </span>
            <div className="flex items-center gap-1.5">
              <select
                value={maxDistKm}
                onChange={(e) => onMaxDistKmChange && onMaxDistKmChange(Number(e.target.value))}
                aria-label="Distance radius"
                className="bg-transparent text-slate-700 dark:text-zinc-200 text-xs font-bold rounded-lg border-none focus:outline-none cursor-pointer"
              >
                <option value={5}>5 km</option>
                <option value={10}>10 km</option>
                <option value={15}>15 km</option>
                <option value={25}>25 km</option>
                <option value={50}>50 km</option>
              </select>
            </div>
          </div>
        </div>

        {/* 4. 100% Free "Find Near Me" Button */}
        <div className="shrink-0 flex items-center gap-2">
          {isLocationActive ? (
            <div className="flex items-center gap-1.5 h-11 px-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700/80 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs font-semibold shadow-xs">
              <Navigation className="w-4 h-4 fill-emerald-600 text-emerald-600 animate-pulse" />
              <span>Near Me ({maxDistKm}km)</span>
              <button
                type="button"
                onClick={handleClearLocation}
                title="Reset location sorting"
                className="p-1 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg text-emerald-800 dark:text-emerald-200 transition cursor-pointer ml-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleFindNearMe}
              disabled={locating}
              className="h-11 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-sm shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-60 disabled:pointer-events-none"
            >
              {locating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Locating...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4" />
                  <span>Find Near Me</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* 5. Sort Dropdown */}
        {onSortChange && (
          <div className="relative min-w-[155px] shrink-0">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
              <ArrowUpDown className="w-3.5 h-3.5" />
            </div>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              aria-label="Sort listings"
              className="w-full h-11 pl-8 pr-7 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 appearance-none cursor-pointer transition-all"
            >
              {isLocationActive && <option value="distance">📍 Nearest First</option>}
              <option value="newest">Newest Arrivals</option>
              <option value="priceLow">Price: Low to High</option>
              <option value="priceHigh">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
          </div>
        )}

        {/* 6. Mobile Filter Toggle Button */}
        {onToggleMobileFilter && (
          <button
            type="button"
            onClick={onToggleMobileFilter}
            className="lg:hidden flex items-center justify-center gap-2 h-11 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters ({activeFiltersCount})</span>
          </button>
        )}
      </div>

      {/* Geolocation feedback messages */}
      {geoSuccess && (
        <div className="mt-2.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300 animate-in fade-in">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>{geoSuccess}</span>
        </div>
      )}
      {geoError && (
        <div className="mt-2.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300 animate-in fade-in">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{geoError}</span>
        </div>
      )}
    </section>
  );
}
