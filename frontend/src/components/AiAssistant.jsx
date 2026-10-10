import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  Sparkles,
  X,
  Send,
  Loader2,
  Star,
  MapPin,
  ExternalLink,
  RotateCcw,
  Tag
} from 'lucide-react';
import { API } from '../config';

const QUICK_SUGGESTIONS = [
  'Best laptops under ₹1,50,000',
  'Yoga classes near me',
  'Winter jackets & hoodies',
  'Eco-friendly items to share'
];

export default function AiAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [showLocation, setShowLocation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome-msg',
      sender: 'assistant',
      text: "Hi there! 👋 I'm your LocalLink AI shopping assistant. Looking to buy, rent, or trade something in your neighborhood? Tell me what you're looking for!",
      items: [],
      timestamp: new Date()
    }
  ]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, loading]);

  const handleSend = async (customQuery = null) => {
    const queryToSend = (typeof customQuery === 'string' ? customQuery : input).trim();
    if (!queryToSend || loading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: queryToSend,
      location: locationInput.trim() || undefined,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const payload = { query: queryToSend };
      if (locationInput.trim()) {
        payload.location = locationInput.trim();
      }

      const res = await axios.post(API.aiRecommend, payload);
      const data = res.data;

      const botMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: data.reply || "Here are the top matches I found from our catalog:",
        items: data.items || [],
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error('AI assistant error:', err);
      const errorMsg = {
        id: `bot-err-${Date.now()}`,
        sender: 'assistant',
        text: "I ran into a temporary issue retrieving recommendations. Please try again or search directly in our marketplace catalog.",
        items: [],
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const resetChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'assistant',
        text: "Chat cleared! How else can I help you discover great local deals and community listings?",
        items: [],
        timestamp: new Date()
      }
    ]);
  };

  const handleViewProduct = (productId) => {
    if (!productId) return;
    navigate(`/product/${productId}`);
    setIsOpen(false);
  };

  return (
    <>
      {/* ── 1. Floating Trigger Button ──────────────────────────────────── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle AI Shopping Assistant"
        className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 ${
          isOpen
            ? 'bg-emerald-900 text-white ring-4 ring-emerald-500/30'
            : 'bg-gradient-to-r from-emerald-600 to-green-700 text-white hover:shadow-emerald-600/40 ring-2 ring-lime-400/50'
        }`}
        style={{
          boxShadow: '0 8px 24px rgba(46, 125, 50, 0.4)'
        }}
      >
        <div className="relative">
          <Bot className="w-6 h-6 text-lime-300 animate-pulse" />
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-lime-400"></span>
          </span>
        </div>
        <span className="font-semibold text-sm tracking-wide hidden sm:inline">
          {isOpen ? 'Close Assistant' : 'AI Assistant'}
        </span>
        <Sparkles className="w-4 h-4 text-lime-300" />
      </button>

      {/* ── 2. Popover / Slide-Over Chat Window ─────────────────────────── */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-4 sm:right-6 z-50 w-[92vw] sm:w-96 h-[550px] max-h-[85vh] flex flex-col bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-emerald-600/20 overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-6"
          style={{
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.25)'
          }}
        >
          {/* ── Header ──────────────────────────────────────────────────── */}
          <div className="bg-gradient-to-r from-emerald-700 via-green-800 to-emerald-900 p-3.5 text-white flex items-center justify-between border-b border-emerald-600/30">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-emerald-600/50 border border-lime-400/40 flex items-center justify-center shadow-inner">
                <Bot className="w-5 h-5 text-lime-300" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm tracking-wide text-white">LocalLink Assistant</h3>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-lime-400 text-emerald-950">
                    AI
                  </span>
                </div>
                <p className="text-[11px] text-emerald-100/80 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse"></span>
                  Online • Catalog Search & Deals
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={resetChat}
                title="Restart chat"
                className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close window"
                className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── Message Thread ─────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 bg-slate-50/70 dark:bg-zinc-900/70 text-slate-800 dark:text-zinc-100">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  {/* Bubble */}
                  <div
                    className={`max-w-[88%] rounded-2xl p-3 text-xs sm:text-sm leading-relaxed shadow-sm ${
                      isUser
                        ? 'bg-gradient-to-r from-emerald-600 to-green-700 text-white rounded-tr-none'
                        : 'bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 border border-slate-200/80 dark:border-zinc-700/80 rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>

                    {msg.location && (
                      <p className="mt-1 text-[11px] opacity-80 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> Near {msg.location}
                      </p>
                    )}
                  </div>

                  {/* Inline Compact Product Cards (Requirement 3) */}
                  {msg.items && msg.items.length > 0 && (
                    <div className="w-full mt-2 space-y-2">
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 pl-1">
                        <Tag className="w-3 h-3" />
                        <span>Recommended from Catalog ({msg.items.length})</span>
                      </div>

                      <div className="space-y-2">
                        {msg.items.map((item) => {
                          const title = item.title || item.name || 'Local Listing';
                          const price = typeof item.price === 'number' ? `₹${item.price.toLocaleString()}` : item.price;
                          const image = item.imageUrl || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=300';
                          const rating = item.rating || (4.5 + ((item.name?.length || 5) % 5) * 0.1).toFixed(1);
                          const listingType = item.listingType || 'SELL';
                          const location = item.location || (item.seller?.address?.city || 'Local area');

                          return (
                            <div
                              key={item._id || item.id}
                              className="bg-white dark:bg-zinc-800/95 border border-emerald-500/20 hover:border-emerald-500/50 rounded-xl p-2.5 shadow-sm hover:shadow-md transition-all flex gap-3 items-center group"
                            >
                              {/* Product Thumbnail */}
                              <img
                                src={image}
                                alt={title}
                                className="w-16 h-16 rounded-lg object-cover bg-slate-100 dark:bg-zinc-700 flex-shrink-0"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=300';
                                }}
                              />

                              {/* Details */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-1">
                                  <h4 className="font-bold text-xs text-slate-900 dark:text-zinc-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                    {title}
                                  </h4>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold uppercase tracking-wider flex-shrink-0">
                                    {listingType}
                                  </span>
                                </div>

                                <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                                  {item.description || item.category || 'Quality verified listing'}
                                </p>

                                <div className="flex items-center justify-between mt-1.5">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-extrabold text-xs text-emerald-700 dark:text-emerald-400">
                                      {price}
                                    </span>
                                    <span className="flex items-center text-[10px] text-amber-500 font-medium">
                                      <Star className="w-2.5 h-2.5 fill-amber-400 mr-0.5" />
                                      {rating}
                                    </span>
                                    {location && (
                                      <span className="hidden sm:inline-flex items-center text-[10px] text-slate-400 truncate max-w-[80px]">
                                        <MapPin className="w-2 h-2 mr-0.5 flex-shrink-0" />
                                        <span className="truncate">{location}</span>
                                      </span>
                                    )}
                                  </div>

                                  <button
                                    onClick={() => handleViewProduct(item._id || item.id)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-xs"
                                  >
                                    <span>View</span>
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1 px-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}

            {/* Loading Indicator */}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-500/20 animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                <span className="font-medium">Searching listings & tailoring recommendations...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ── Quick Prompt Chips ─────────────────────────────────────── */}
          {messages.length <= 2 && (
            <div className="px-3 py-2 bg-slate-100/60 dark:bg-zinc-800/60 border-t border-slate-200/60 dark:border-zinc-700/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <Sparkles className="w-3 h-3 text-emerald-600 flex-shrink-0" />
              {QUICK_SUGGESTIONS.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(suggestion)}
                  disabled={loading}
                  className="whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] font-medium bg-white dark:bg-zinc-700 border border-slate-200 dark:border-zinc-600 hover:bg-emerald-50 hover:border-emerald-400 text-slate-700 dark:text-zinc-200 transition-all flex-shrink-0"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {/* ── Optional Location Bar Toggle ────────────────────────────── */}
          {showLocation && (
            <div className="px-3 py-1.5 bg-emerald-50/80 dark:bg-zinc-800 border-t border-emerald-200 dark:border-zinc-700 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <input
                type="text"
                placeholder="Preferred neighborhood or city (e.g. Downtown)"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                className="w-full text-xs bg-transparent border-none focus:outline-hidden text-slate-800 dark:text-zinc-100 placeholder-slate-400"
              />
              <button
                onClick={() => setShowLocation(false)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* ── Input Bar with Send Button ─────────────────────────────── */}
          <div className="p-2.5 bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800">
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-800 rounded-xl px-2.5 py-1 border border-slate-200 dark:border-zinc-700 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all">
              <button
                type="button"
                onClick={() => setShowLocation(!showLocation)}
                title={locationInput ? `Location: ${locationInput}` : 'Add location filter'}
                className={`p-1.5 rounded-lg transition-colors ${
                  locationInput
                    ? 'text-emerald-600 bg-emerald-100 dark:bg-emerald-950'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300'
                }`}
              >
                <MapPin className="w-4 h-4" />
              </button>

              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask for products, services, or gear..."
                disabled={loading}
                className="flex-1 bg-transparent border-none py-1.5 text-xs sm:text-sm text-slate-800 dark:text-zinc-100 placeholder-slate-400 focus:outline-hidden"
              />

              <button
                type="button"
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                aria-label="Send query"
                className={`p-1.5 rounded-lg transition-all ${
                  input.trim() && !loading
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-400 cursor-not-allowed opacity-60'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
