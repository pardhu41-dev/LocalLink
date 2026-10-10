import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  Search,
  X
} from 'lucide-react';
import FilterSidebar from './components/FilterSidebar';
import ProductCard from './components/ProductCard';
import SearchBar from './components/SearchBar';
import { API } from './config';

export default function ProductList({
  products = [],
  addToCart,
  token,
  onLoginRequired,
  isLoading = false
}) {
  // ── Search & Filter State ──────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryDropdown, setSelectedCategoryDropdown] = useState('ALL');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedItemType, setSelectedItemType] = useState('ALL'); // 'ALL' | 'PRODUCT' | 'SERVICE'
  const [selectedListingTypes, setSelectedListingTypes] = useState([]); // ['SELL', 'SHARE', 'BUY']
  const [priceRange, setPriceRange] = useState([0, 200000]);
  const [minRating, setMinRating] = useState(0);
  const [ecoOnly, setEcoOnly] = useState(false);
  const [localPickupOnly, setLocalPickupOnly] = useState(false);
  const [locationFilter, setLocationFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'priceLow' | 'priceHigh' | 'rating' | 'distance'
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [wishlist, setWishlist] = useState([]);

  // ── Location-based state ──────────────────────────────────────────────────
  const [nearbyProducts, setNearbyProducts] = useState(null);
  const [userLocation, setUserLocation] = useState(null); // { lat, lng }
  const [maxDistKm, setMaxDistKm] = useState(15);
  const [isGeoLoading, setIsGeoLoading] = useState(false);

  const handleLocationSearch = async ({ lat, lng, maxDistKm: radius }) => {
    setUserLocation({ lat, lng });
    setMaxDistKm(radius);
    setIsGeoLoading(true);
    try {
      const res = await axios.get(`${API.products}?lat=${lat}&lng=${lng}&maxDistKm=${radius}`);
      setNearbyProducts(res.data);
      setSortBy('distance');
    } catch (err) {
      console.error('Failed to fetch nearby listings:', err);
    } finally {
      setIsGeoLoading(false);
    }
  };

  const handleResetLocation = () => {
    setUserLocation(null);
    setNearbyProducts(null);
    setSortBy('newest');
  };

  const handleMaxDistKmChange = (newRadius) => {
    setMaxDistKm(newRadius);
    if (userLocation) {
      handleLocationSearch({ lat: userLocation.lat, lng: userLocation.lng, maxDistKm: newRadius });
    }
  };

  // ── Wishlist synchronization ──────────────────────────────────────────────
  useEffect(() => {
    const loadWishlist = () => {
      try {
        const saved = localStorage.getItem('wishlist');
        if (saved) setWishlist(JSON.parse(saved));
      } catch (err) {
        console.error('Error loading wishlist:', err);
      }
    };
    loadWishlist();

    const handleWishlistEvent = () => loadWishlist();
    window.addEventListener('wishlist-updated', handleWishlistEvent);
    return () => window.removeEventListener('wishlist-updated', handleWishlistEvent);
  }, []);

  const toggleWishlist = (product) => {
    if (!token) {
      if (onLoginRequired) onLoginRequired();
      return;
    }
    const isIn = wishlist.some((p) => p._id === product._id);
    const updated = isIn
      ? wishlist.filter((p) => p._id !== product._id)
      : [...wishlist, product];

    setWishlist(updated);
    localStorage.setItem('wishlist', JSON.stringify(updated));
    window.dispatchEvent(new Event('wishlist-updated'));
  };

  const isInWishlist = (productId) => wishlist.some((p) => p._id === productId);

  // ── Catalog Metadata & Category Counts ────────────────────────────────────
  const categoriesWithCounts = useMemo(() => {
    const map = {};
    products.forEach((p) => {
      const cat = p.category || 'General';
      map[cat] = (map[cat] || 0) + 1;
    });
    return Object.entries(map).map(([name, count]) => ({ name, count }));
  }, [products]);

  const allCategoryNames = useMemo(
    () => categoriesWithCounts.map((c) => c.name),
    [categoriesWithCounts]
  );

  // ── Filter & Sort Logic ───────────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    const activeProducts = nearbyProducts || products;
    return activeProducts
      .filter((p) => {
        const title = (p.title || p.name || '').toLowerCase();
        const desc = (p.description || '').toLowerCase();
        const category = p.category || 'General';
        const isService =
          category.toLowerCase().includes('service') || p.listingType === 'SERVICE';
        const price = typeof p.price === 'number' ? p.price : Number(p.price) || 0;
        const rating = Number(p.rating) || 4.5;
        const loc = typeof p.location === 'object'
          ? (p.location?.address || '').toLowerCase()
          : (p.location || p.seller?.address?.city || '').toLowerCase();

        // 1. Text Search
        const search = searchTerm.trim().toLowerCase();
        if (search && !title.includes(search) && !desc.includes(search) && !category.toLowerCase().includes(search)) {
          return false;
        }

        // 2. Top Category Selector Dropdown
        if (selectedCategoryDropdown !== 'ALL' && category !== selectedCategoryDropdown) {
          return false;
        }

        // 3. Sidebar Categories Checklist
        if (selectedCategories.length > 0 && !selectedCategories.includes(category)) {
          return false;
        }

        // 4. Type: Product vs. Service
        if (selectedItemType === 'PRODUCT' && isService) return false;
        if (selectedItemType === 'SERVICE' && !isService) return false;

        // 5. Listing Type (SELL, SHARE, BUY)
        if (selectedListingTypes.length > 0 && !selectedListingTypes.includes(p.listingType)) {
          return false;
        }

        // 6. Price Range
        if (price < priceRange[0] || price > priceRange[1]) {
          return false;
        }

        // 7. Rating Filter
        if (minRating > 0 && rating < minRating) {
          return false;
        }

        // 8. Sustainable / Pickup filters
        if (ecoOnly && !p.isEcoFriendly) return false;
        if (localPickupOnly && !p.localPickupAvailable) return false;

        // 9. Location filter
        if (locationFilter.trim() && !loc.includes(locationFilter.trim().toLowerCase())) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'distance') {
          return (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999);
        }
        const priceA = a.price || 0;
        const priceB = b.price || 0;
        if (sortBy === 'priceLow') return priceA - priceB;
        if (sortBy === 'priceHigh') return priceB - priceA;
        if (sortBy === 'rating') return (b.rating || 4.5) - (a.rating || 4.5);
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });
  }, [
    products,
    nearbyProducts,
    searchTerm,
    selectedCategoryDropdown,
    selectedCategories,
    selectedItemType,
    selectedListingTypes,
    priceRange,
    minRating,
    ecoOnly,
    localPickupOnly,
    locationFilter,
    sortBy
  ]);

  // Active filters count for reset badge
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (selectedCategoryDropdown !== 'ALL') count++;
    if (selectedCategories.length > 0) count += selectedCategories.length;
    if (selectedItemType !== 'ALL') count++;
    if (selectedListingTypes.length > 0) count += selectedListingTypes.length;
    if (priceRange[0] > 0 || priceRange[1] < 200000) count++;
    if (minRating > 0) count++;
    if (ecoOnly) count++;
    if (localPickupOnly) count++;
    if (locationFilter) count++;
    return count;
  }, [
    searchTerm,
    selectedCategoryDropdown,
    selectedCategories,
    selectedItemType,
    selectedListingTypes,
    priceRange,
    minRating,
    ecoOnly,
    localPickupOnly,
    locationFilter
  ]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategoryDropdown('ALL');
    setSelectedCategories([]);
    setSelectedItemType('ALL');
    setSelectedListingTypes([]);
    setPriceRange([0, 200000]);
    setMinRating(0);
    setEcoOnly(false);
    setLocalPickupOnly(false);
    setLocationFilter('');
  };

  const handleCategoryToggle = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const handleListingTypeToggle = (type) => {
    setSelectedListingTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
      {/* ── 1. Top Search & Location Bar (with free navigator.geolocation) ─ */}
      <SearchBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCategory={selectedCategoryDropdown}
        onCategoryChange={setSelectedCategoryDropdown}
        categories={allCategoryNames}
        locationFilter={locationFilter}
        onLocationChange={setLocationFilter}
        maxDistKm={maxDistKm}
        onMaxDistKmChange={handleMaxDistKmChange}
        onLocationSearch={handleLocationSearch}
        onResetLocation={handleResetLocation}
        isLocationActive={Boolean(userLocation)}
        sortBy={sortBy}
        onSortChange={setSortBy}
        activeFiltersCount={activeFiltersCount}
        onToggleMobileFilter={() => setMobileFilterOpen(!mobileFilterOpen)}
      />

      {/* ── 2. Two-Column Desktop Layout ─────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* FilterSidebar Component */}
        <FilterSidebar
          categoriesWithCounts={categoriesWithCounts}
          selectedCategories={selectedCategories}
          onCategoryToggle={handleCategoryToggle}
          onClearCategories={() => setSelectedCategories([])}
          selectedItemType={selectedItemType}
          onItemTypeChange={setSelectedItemType}
          selectedListingTypes={selectedListingTypes}
          onListingTypeToggle={handleListingTypeToggle}
          priceRange={priceRange}
          onPriceRangeChange={setPriceRange}
          minRating={minRating}
          onMinRatingChange={setMinRating}
          ecoOnly={ecoOnly}
          onEcoToggle={setEcoOnly}
          localPickupOnly={localPickupOnly}
          onLocalPickupToggle={setLocalPickupOnly}
          activeFiltersCount={activeFiltersCount}
          onResetFilters={handleResetFilters}
          isOpenOnMobile={mobileFilterOpen}
        />

        {/* ── Right Main Grid ────────────────────────────────────────────── */}
        <main className="flex-1 min-w-0 w-full">
          {/* Results Summary Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-200 dark:border-zinc-800">
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>Marketplace Catalog</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                  {filteredProducts.length} listings
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Verified neighbor-to-neighbor listings and local services in your community
              </p>
            </div>

            {/* Active Filter Dismiss Chips */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {searchTerm && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    "{searchTerm}"
                    <button type="button" onClick={() => setSearchTerm('')}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {selectedCategoryDropdown !== 'ALL' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {selectedCategoryDropdown}
                    <button type="button" onClick={() => setSelectedCategoryDropdown('ALL')}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {selectedItemType !== 'ALL' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                    {selectedItemType}
                    <button type="button" onClick={() => setSelectedItemType('ALL')}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {selectedCategories.map((cat) => (
                  <span
                    key={cat}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200"
                  >
                    {cat}
                    <button type="button" onClick={() => handleCategoryToggle(cat)}><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ── Product Grid ──────────────────────────────────────────────── */}
          {isLoading || isGeoLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCard key={i} isLoading={true} />
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product._id}
                  item={product}
                  onAddToCart={addToCart}
                  isInWishlist={isInWishlist(product._id)}
                  onToggleWishlist={toggleWishlist}
                />
              ))}
            </div>
          ) : (
            /* ── Empty State ─────────────────────────────────────────────── */
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-12 text-center my-6 shadow-sm max-w-xl mx-auto">
              <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-400 flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1.5">
                No matching listings found
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mb-6 max-w-md mx-auto leading-relaxed">
                We couldn't find any products or services matching your current filters and location criteria. Try expanding your search or resetting filters.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs"
                >
                  Reset All Filters
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
