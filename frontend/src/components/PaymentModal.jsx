import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  X,
  Smartphone,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  MessageCircle,
  Sparkles,
  QrCode
} from 'lucide-react';

export default function PaymentModal({
  isOpen,
  onClose,
  item
}) {
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen || !item) return null;

  const title = item.title || item.name || 'Local Marketplace Item';
  const price = typeof item.price === 'number' ? item.price : Number(item.price) || 0;
  const sellerUpiId = (item.sellerUpiId || '').trim() || 'localmarket@okhdfcbank';
  const sellerPhone = (item.sellerPhone || '').replace(/\D/g, '').slice(-10);

  // Standard RBI-compliant UPI Intent Link
  const encodedNote = encodeURIComponent(`Payment for ${title}`);
  const upiLink = `upi://pay?pa=${sellerUpiId}&pn=LocalMarketSeller&am=${price}&cu=INR&tn=${encodedNote}`;

  // WhatsApp chat link
  const waText = encodeURIComponent(
    `Hi, I am interested in buying "${title}" listed on LocalMarket for ₹${price}`
  );
  const waLink = sellerPhone ? `https://wa.me/91${sellerPhone}?text=${waText}` : null;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(sellerUpiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(upiLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden my-auto transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal Header ────────────────────────────────────────────── */}
        <div className="px-6 py-4.5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/70 dark:bg-zinc-900/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                Zero-Fee Direct UPI Pay
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                100% Free Peer-to-Peer Transfer
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:text-zinc-400 dark:hover:text-zinc-200 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Modal Body ──────────────────────────────────────────────── */}
        <div className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {/* Item & Price Summary Card */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/80">
            <div className="min-w-0 pr-3">
              <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 truncate">
                Item to Purchase
              </p>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {title}
              </h4>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 block">
                Total Amount
              </span>
              <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center justify-end">
                ₹{price.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Scannable UPI QR Code Card */}
          <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-white dark:bg-zinc-800 border-2 border-dashed border-emerald-500/40 dark:border-emerald-500/30 shadow-xs text-center relative group">
            <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
              <QRCodeSVG
                value={upiLink}
                size={200}
                level="M"
                includeMargin={false}
                className="w-48 h-48 sm:w-52 sm:h-52"
              />
            </div>

            <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Scan with GPay, PhonePe, Paytm, or BHIM
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
              Zero transaction fee • Instant direct bank-to-bank transfer
            </p>
          </div>

          {/* Seller UPI ID with Copy button */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-zinc-300">
              <span className="font-semibold uppercase tracking-wider text-[11px]">
                Seller UPI ID
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
                >
                  {copiedUpi ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Copied ID!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy ID
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex items-center gap-1 text-slate-500 dark:text-zinc-400 hover:underline font-semibold"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied Link!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy Link
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 font-mono text-xs text-slate-800 dark:text-zinc-200 select-all">
              <span>{sellerUpiId}</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded font-sans font-bold">
                Verified UPI
              </span>
            </div>
          </div>

          {/* Mobile Direct UPI Intent Button */}
          <div className="space-y-2 pt-1">
            <a
              href={upiLink}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm shadow-md shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 group text-center"
            >
              <Smartphone className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>Open in UPI App (Mobile)</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>

            {/* Direct WhatsApp Confirmation Link if seller phone exists */}
            {waLink && (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold text-xs border border-emerald-500/30 transition-all flex items-center justify-center gap-2 text-center"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Notify Seller on WhatsApp after Payment
              </a>
            )}
          </div>

          {/* Step-by-Step Instructions */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-800 text-xs text-slate-600 dark:text-zinc-400 space-y-1.5">
            <div className="font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              How Zero-Cost Local Trade Works:
            </div>
            <ol className="list-decimal list-inside space-y-1 pl-1 text-[11px] leading-relaxed">
              <li>Scan the QR code or tap the button above to pay via any UPI app.</li>
              <li>Once completed, send the payment screenshot or UPI Ref ID to the seller.</li>
              <li>Arrange contactless local handover or pickup at the designated area.</li>
            </ol>
          </div>
        </div>

        {/* ── Modal Footer ────────────────────────────────────────────── */}
        <div className="px-6 py-3.5 bg-slate-50/80 dark:bg-zinc-900/80 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
          <span>LocalMarket Peer-to-Peer</span>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:underline"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
