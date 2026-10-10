import React from 'react';
import {
  Filter,
  RotateCcw,
  ShoppingBag,
  Briefcase,
  Star,
  Leaf,
  PackageCheck
} from 'lucide-react';

const PRICE_PRESETS = [
  { label: 'All', min: 0, max: 200000 },
  { label: '< ₹1k', min: 0, max: 1000 },
  { label: '₹1k - ₹10k', min: 1000, max: 10000 },
  { label: '₹10k - ₹50k', min: 10000, max: 50000 },
  { label: '₹50k+', min: 50000, max: 200000 }
];

const RATING_OPTIONS = [
  { label: 'All Ratings', value: 0 },
  { label: '4.5 & up', value: 4.5 },
  { label: '4.0 & up', value: 4.0 },
  { label: '3.5 & up', value: 3.5 }
];

export default function FilterSidebar({
  categoriesWithCounts = [],
  selectedCategories = [],
  onCategoryToggle,
  onClearCategories,
  selectedItemType = 'ALL',
  onItemTypeChange,
  selectedListingTypes = [],
  onListingTypeToggle,
  priceRange = [0, 200000],
  onPriceRangeChange,
  minRating = 0,
  onMinRatingChange,
  ecoOnly = false,
  onEcoToggle,
  localPickupOnly = false,
  onLocalPickupToggle,
  activeFiltersCount = 0,
  onResetFilters,
  isOpenOnMobile = false
}) {
  return (
    <aside
      className={`w-full lg:w-72 xl:w-80 shrink-0 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs lg:sticky lg:top-24 z-20 max-h-[calc(100vh-110px)] overflow-y-auto custom-scrollbar ${
        isOpenOnMobile ? 'block' : 'hidden lg:block'
      }`}
    >
      {/* ── Sidebar Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h2 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
            Filters
          </h2>
          {activeFiltersCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800">
              {activeFiltersCount}
            </span>
          )}
        </div>

        {activeFiltersCount > 0 && (
          <button
            type="button"
            onClick={onResetFilters}
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        )}
      </div>

      {/* ── 1. Item Type (Product vs. Service) ─────────────────────────── */}
      <div className="py-4 border-b border-slate-100 dark:border-zinc-800">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-2.5 block">
          Item Type
        </label>
        <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => onItemTypeChange('ALL')}
            className={`py-1.5 px-2 rounded-lg transition-all ${
              selectedItemType === 'ALL'
                ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => onItemTypeChange('PRODUCT')}
            className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-all ${
              selectedItemType === 'PRODUCT'
                ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
            }`}
          >
            <ShoppingBag className="w-3 h-3" /> Products
          </button>
          <button
            type="button"
            onClick={() => onItemTypeChange('SERVICE')}
            className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-all ${
              selectedItemType === 'SERVICE'
                ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-3 h-3" /> Services
          </button>
        </div>
      </div>

      {/* ── 2. Listing Mode (Buy/Sell, Share, Wanted) ──────────────────── */}
      <div className="py-4 border-b border-slate-100 dark:border-zinc-800">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-2.5 block">
          Listing Mode
        </label>
        <div className="space-y-2.5">
          {[
            { type: 'SELL', label: 'Buy / Buy Now' },
            { type: 'SHARE', label: 'Borrow / Share Equipment' },
            { type: 'BUY', label: 'Wanted / Community Requests' }
          ].map(({ type, label }) => (
            <label
              key={type}
              className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer select-none"
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedListingTypes.includes(type)}
                  onChange={() => onListingTypeToggle(type)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer accent-emerald-600"
                />
                <span>{label}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* ── 3. Categories Checklist ────────────────────────────────────── */}
      <div className="py-4 border-b border-slate-100 dark:border-zinc-800">
        <div className="flex items-center justify-between mb-2.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block">
            Categories
          </label>
          {selectedCategories.length > 0 && (
            <button
              type="button"
              onClick={onClearCategories}
              className="text-[11px] font-semibold text-emerald-600 hover:underline"
            >
              Clear ({selectedCategories.length})
            </button>
          )}
        </div>

        <div className="custom-scrollbar max-h-52 overflow-y-auto space-y-2 pr-1.5">
          {categoriesWithCounts.map(({ name, count }) => (
            <label
              key={name}
              className="flex items-center justify-between text-xs text-slate-700 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer select-none"
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(name)}
                  onChange={() => onCategoryToggle(name)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer accent-emerald-600"
                />
                <span className="font-medium text-slate-800 dark:text-zinc-200">{name}</span>
              </div>
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                {count}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* ── 4. Price Range Slider ──────────────────────────────────────── */}
      <div className="py-4 border-b border-slate-100 dark:border-zinc-800">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block">
            Price Range
          </label>
          <span className="text-xs font-extrabold text-slate-900 dark:text-white">
            ₹{priceRange[0].toLocaleString('en-IN')} - ₹{priceRange[1].toLocaleString('en-IN')}
          </span>
        </div>

        <input
          type="range"
          min="0"
          max="200000"
          step="1000"
          value={priceRange[1]}
          onChange={(e) => onPriceRangeChange([priceRange[0], Number(e.target.value)])}
          className="w-full accent-emerald-600 cursor-pointer"
        />

        {/* Preset Budget Pills */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {PRICE_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => onPriceRangeChange([preset.min, preset.max])}
              className={`text-[11px] px-2.5 py-1 rounded-full font-semibold transition-all ${
                priceRange[0] === preset.min && priceRange[1] === preset.max
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 5. Customer Rating Filter ──────────────────────────────────── */}
      <div className="py-4 border-b border-slate-100 dark:border-zinc-800">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-2.5 block">
          Customer Rating
        </label>
        <div className="space-y-2">
          {RATING_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2 text-xs text-slate-700 dark:text-zinc-300 cursor-pointer hover:text-emerald-600"
            >
              <input
                type="radio"
                name="rating-filter-group"
                checked={minRating === opt.value}
                onChange={() => onMinRatingChange(opt.value)}
                className="text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer accent-emerald-600"
              />
              <div className="flex items-center gap-1.5">
                {opt.value > 0 ? (
                  <>
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-semibold text-slate-800 dark:text-zinc-200">{opt.label}</span>
                  </>
                ) : (
                  <span className="font-medium text-slate-700 dark:text-zinc-300">{opt.label}</span>
                )}
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* ── 6. Perks & Sustainability ──────────────────────────────────── */}
      <div className="pt-4 space-y-2.5">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1 block">
          Community Perks
        </label>
        <label className="flex items-center justify-between text-xs text-slate-700 dark:text-zinc-300 cursor-pointer">
          <span className="flex items-center gap-1.5 font-medium">
            <Leaf className="w-3.5 h-3.5 text-emerald-600" />
            <span>Eco-Friendly Only</span>
          </span>
          <input
            type="checkbox"
            checked={ecoOnly}
            onChange={(e) => onEcoToggle(e.target.checked)}
            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer accent-emerald-600"
          />
        </label>

        <label className="flex items-center justify-between text-xs text-slate-700 dark:text-zinc-300 cursor-pointer">
          <span className="flex items-center gap-1.5 font-medium">
            <PackageCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Instant Local Pickup</span>
          </span>
          <input
            type="checkbox"
            checked={localPickupOnly}
            onChange={(e) => onLocalPickupToggle(e.target.checked)}
            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer accent-emerald-600"
          />
        </label>
      </div>
    </aside>
  );
}
