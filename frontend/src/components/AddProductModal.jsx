import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import {
  UploadCloud,
  X,
  Image as ImageIcon,
  Plus,
  MapPin,
  Leaf,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Sparkles
} from 'lucide-react';
import { API, API_BASE_URL } from '../config';

const LISTINGS_URL = API?.listings || `${API_BASE_URL || 'http://localhost:5001'}/api/listings`;

const CATEGORIES = [
  'General',
  'Electronics',
  'Furniture',
  'Home & Kitchen',
  'Books & Study',
  'Clothing & Apparel',
  'Vehicles & Cycles',
  'Tools & Equipment',
  'Sports & Fitness',
  'Services & Repairs',
  'Other'
];

const LISTING_TYPES = [
  { value: 'SELL', label: 'Sell', badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400' },
  { value: 'SHARE', label: 'Borrow / Share', badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400' },
  { value: 'SERVICE', label: 'Service / Skill', badge: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-400' },
  { value: 'BUY', label: 'Wanted / Buy', badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400' }
];

export default function AddProductModal({
  isOpen = true,
  onClose,
  token,
  onSuccess
}) {
  const fileInputRef = useRef(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'General',
    listingType: 'SELL',
    availableQty: 1,
    address: '',
    lat: '',
    lng: '',
    sellerPhone: '',
    sellerUpiId: '',
    isEcoFriendly: false
  });

  // Uploaded files with preview URLs: [{ id, file, previewUrl }]
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      selectedFiles.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, [selectedFiles]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Process incoming File objects (up to 4 max)
  const handleAddFiles = (newFilesList) => {
    setError('');
    const newFiles = Array.from(newFilesList).filter((file) =>
      file.type.startsWith('image/')
    );

    if (newFiles.length === 0) {
      setError('Please select valid image files (JPG, PNG, WebP).');
      return;
    }

    const availableSlots = 4 - selectedFiles.length;
    if (availableSlots <= 0) {
      setError('Maximum 4 images allowed per listing.');
      return;
    }

    if (newFiles.length > availableSlots) {
      setError(`Only ${availableSlots} more image(s) could be added (max 4 images total).`);
    }

    const filesToAdd = newFiles.slice(0, availableSlots).map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      file,
      previewUrl: URL.createObjectURL(file)
    }));

    setSelectedFiles((prev) => [...prev, ...filesToAdd]);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleAddFiles(e.target.files);
      // Reset input value so same file can be selected again if removed
      e.target.value = '';
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleAddFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveFile = (indexToRemove) => {
    setSelectedFiles((prev) => {
      const removed = prev[indexToRemove];
      if (removed && removed.previewUrl) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      return prev.filter((_, idx) => idx !== indexToRemove);
    });
    setError('');
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setFormData((prev) => ({
          ...prev,
          lat: latitude.toFixed(6),
          lng: longitude.toFixed(6),
          address: prev.address || `Near ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
        }));
        setDetectingLocation(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setError('Could not detect location automatically. Please enter your neighborhood or address.');
        setDetectingLocation(false);
      },
      { timeout: 8000 }
    );
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!formData.name.trim()) {
      setError('Product title / name is required.');
      return;
    }

    if (!formData.price && formData.price !== 0) {
      setError('Please provide a valid price.');
      return;
    }

    const authToken = token || localStorage.getItem('jwt');
    if (!authToken) {
      setError('You must be logged in to create a listing.');
      return;
    }

    setLoading(true);

    try {
      // Build multipart FormData
      const data = new FormData();
      data.append('name', formData.name.trim());
      data.append('title', formData.name.trim());
      data.append('description', formData.description.trim());
      data.append('price', Number(formData.price));
      data.append('category', formData.category);
      data.append('listingType', formData.listingType);
      data.append('availableQty', Number(formData.availableQty) || 1);
      data.append('address', formData.address.trim() || 'Local Area');
      data.append('sellerPhone', formData.sellerPhone.trim());
      data.append('sellerUpiId', formData.sellerUpiId.trim());
      data.append('isEcoFriendly', formData.isEcoFriendly);

      if (formData.lat && formData.lng) {
        data.append('lat', formData.lat);
        data.append('lng', formData.lng);
      }

      // Append up to 4 images
      selectedFiles.forEach((item) => {
        data.append('images', item.file);
      });

      const response = await axios.post(LISTINGS_URL, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${authToken}`
        }
      });

      setSuccessMsg('Product listed successfully!');

      // Clean up object URLs
      selectedFiles.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });

      if (onSuccess) {
        onSuccess(response.data);
      }

      setTimeout(() => {
        if (onClose) onClose();
      }, 1200);
    } catch (err) {
      console.error('Failed to create listing:', err);
      const serverMsg =
        err.response?.data?.msg ||
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to upload listing. Please check your network and try again.';
      setError(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden my-auto transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal Header ────────────────────────────────────────────── */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/70 dark:bg-zinc-900/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Add New Product / Listing
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Upload up to 4 photos & publish to your local community
              </p>
            </div>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:text-zinc-400 dark:hover:text-zinc-200 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* ── Modal Body / Form ─────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[82vh] overflow-y-auto">
          {/* Alerts */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <div>{successMsg}</div>
            </div>
          )}

          {/* ── 1. Multi-Image Dropzone & Previews ───────────────────────── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-900 dark:text-zinc-200 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Product Photos
                <span className="text-xs font-normal text-slate-500 dark:text-zinc-400">
                  (Up to 4 images, converted to WebP)
                </span>
              </label>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  selectedFiles.length === 4
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400'
                    : 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300'
                }`}
              >
                {selectedFiles.length} / 4
              </span>
            </div>

            {/* Hidden Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              multiple
              className="hidden"
            />

            {/* Dropzone Box */}
            {selectedFiles.length < 4 && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/20 scale-[0.99]'
                    : 'border-slate-300 dark:border-zinc-700 hover:border-emerald-500/70 hover:bg-slate-50/60 dark:hover:bg-zinc-800/40'
                }`}
              >
                <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
                  <span className="text-emerald-600 dark:text-emerald-400 underline decoration-2 underline-offset-2">
                    Click to browse
                  </span>{' '}
                  or drag and drop images here
                </p>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                  JPG, PNG, WebP up to 8MB each • Resized to 800×600 in WebP
                </p>
              </div>
            )}

            {/* Thumbnail Previews Grid */}
            {selectedFiles.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {selectedFiles.map((item, index) => (
                  <div
                    key={item.id}
                    className="relative group rounded-2xl overflow-hidden aspect-4/3 bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 shadow-sm"
                  >
                    <img
                      src={item.previewUrl}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />

                    {/* Primary Badge for first image */}
                    {index === 0 && (
                      <span className="absolute top-2 left-2 bg-emerald-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                        Cover
                      </span>
                    )}

                    {/* Delete 'x' Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile(index);
                      }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 hover:bg-rose-600 text-white flex items-center justify-center transition-all opacity-90 hover:opacity-100 shadow-md"
                      title="Remove image"
                      aria-label="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    {/* File Size / Index Tooltip */}
                    <div className="absolute bottom-1 right-2 text-[10px] text-white/90 bg-black/60 px-1.5 py-0.5 rounded font-mono">
                      {Math.round(item.file.size / 1024)} KB
                    </div>
                  </div>
                ))}

                {/* Add More Slot if less than 4 */}
                {selectedFiles.length < 4 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center aspect-4/3 rounded-2xl border-2 border-dashed border-slate-300 dark:border-zinc-700 hover:border-emerald-500 text-slate-500 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400 transition-colors bg-slate-50/40 dark:bg-zinc-800/30"
                  >
                    <Plus className="w-6 h-6 mb-1" />
                    <span className="text-xs font-semibold">Add image</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ── 2. Title & Price ─────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                Title / Item Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="e.g. Ergonomic Wooden Desk, Bosch Drill"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                Price (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">
                  ₹
                </span>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="1"
                  placeholder="0"
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all text-sm"
                />
              </div>
            </div>
          </div>

          {/* ── 3. Category & Listing Type ────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all text-sm"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                Listing Type
              </label>
              <select
                name="listingType"
                value={formData.listingType}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all text-sm"
              >
                {LISTING_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ── 4. Description ───────────────────────────────────────────── */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
              Description
            </label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe condition, specifications, pickup instructions..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all text-sm"
            />
          </div>

          {/* ── 5. Location with Geo-Detect ────────────────────────────────── */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                Location & Neighborhood
              </label>
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={detectingLocation}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 transition-colors"
              >
                {detectingLocation ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Detecting...
                  </>
                ) : (
                  <>
                    <MapPin className="w-3.5 h-3.5" />
                    Use My GPS Location
                  </>
                )}
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="e.g. Indiranagar, 100ft Road, Bangalore"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all text-sm"
              />
            </div>
            {formData.lat && formData.lng && (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
                ✓ Geo Coordinates: {formData.lat}, {formData.lng}
              </p>
            )}
          </div>

          {/* ── 6. Direct WhatsApp & UPI Payment Details (Zero-Cost Flow) ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/50">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Seller WhatsApp (10 digits)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">
                  +91
                </span>
                <input
                  type="tel"
                  name="sellerPhone"
                  maxLength="10"
                  value={formData.sellerPhone}
                  onChange={handleInputChange}
                  placeholder="9876543210"
                  className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all text-sm"
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Buyers can click & chat directly on WhatsApp
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Seller UPI ID (Zero-fee QR)
              </label>
              <input
                type="text"
                name="sellerUpiId"
                value={formData.sellerUpiId}
                onChange={handleInputChange}
                placeholder="e.g. name@okhdfcbank or 9876543210@paytm"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all text-sm font-mono"
              />
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Generates instant zero-fee QR code & UPI intent
              </p>
            </div>
          </div>

          {/* ── 7. Additional Options (Eco-friendly, Quantity) ─────────────── */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 dark:border-zinc-800">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                name="isEcoFriendly"
                checked={formData.isEcoFriendly}
                onChange={handleInputChange}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-zinc-700 dark:bg-zinc-800"
              />
              <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Leaf className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Mark as Eco-Friendly / Sustainable
              </span>
            </label>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-zinc-400">
                Quantity:
              </span>
              <input
                type="number"
                name="availableQty"
                value={formData.availableQty}
                onChange={handleInputChange}
                min="1"
                className="w-16 px-2.5 py-1 text-center text-sm rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* ── Modal Footer / Actions ──────────────────────────────────── */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-zinc-800">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 text-sm font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-md shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading to Cloudinary...
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  Publish Listing
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
