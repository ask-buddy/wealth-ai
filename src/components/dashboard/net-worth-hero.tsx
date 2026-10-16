"use client";

import React, { useState } from "react";
import {
  formatIdr,
  formatCompactIdr,
  formatUsdEstimate,
  formatDateIndo,
} from "@/lib/formatters";
import { WealthPortfolio } from "@/types/wealth";
import {
  ShieldCheck,
  FileDown,
  Trash2,
  PlusCircle,
  Layers,
  ArrowDownRight,
  Droplet,
  Eye,
  EyeOff,
  Copy,
  Check,
  Scale,
  Sparkles,
} from "lucide-react";

interface NetWorthHeroProps {
  portfolio: WealthPortfolio;
  onReset: () => void;
  onAddMore: () => void;
  onExportPdf: () => void;
  isPrivate?: boolean;
  onTogglePrivacy?: () => void;
  currencyMode?: "IDR" | "USD";
  onToggleCurrency?: () => void;
}

export function NetWorthHero({
  portfolio,
  onReset,
  onAddMore,
  onExportPdf,
  isPrivate = false,
  onTogglePrivacy,
  currencyMode = "IDR",
  onToggleCurrency,
}: NetWorthHeroProps) {
  const [isCopied, setIsCopied] = useState(false);

  const debtToAssetRatio =
    portfolio.totalAssetsIdr > 0
      ? (portfolio.totalLiabilitiesIdr / portfolio.totalAssetsIdr) * 100
      : 0;

  const solvencyRatio = 100 - debtToAssetRatio;

  const handleCopy = () => {
    const text = `AngelWealth Net Worth: ${formatIdr(portfolio.totalNetWorthIdr)} (${portfolio.assets.length} aset terverifikasi)`;
    navigator.clipboard?.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="relative rounded-3xl border border-stone-200/90 bg-gradient-to-b from-white via-white to-stone-50/50 p-6 sm:p-8 shadow-sm overflow-hidden luxury-card">
      {/* Decorative Warm Accent Ambient Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-orange-100/40 via-amber-50/20 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

      {/* Top Header Controls */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-100/90">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-semibold shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Zero-Database • In-Memory AI</span>
          </div>

          <span className="text-xs text-stone-400 font-medium hidden sm:inline">•</span>

          <span className="text-xs text-stone-500 font-medium">
            Audit: {formatDateIndo(portfolio.analyzedAt)}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Privacy Stealth Toggle */}
          {onTogglePrivacy && (
            <button
              type="button"
              onClick={onTogglePrivacy}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer shadow-2xs active:scale-[0.98] ${
                isPrivate
                  ? "bg-stone-900 border-stone-800 text-stone-100"
                  : "bg-white border-stone-200 hover:bg-stone-50 text-stone-700"
              }`}
              title={isPrivate ? "Buka masking nominal" : "Sembunyikan nominal (Mode Privat)"}
            >
              {isPrivate ? (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                  <span>Mode Privat Aktif</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 text-stone-500" />
                  <span>Sembunyikan Angka</span>
                </>
              )}
            </button>
          )}

          {/* Currency Switcher */}
          {onToggleCurrency && (
            <button
              type="button"
              onClick={onToggleCurrency}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 transition-colors cursor-pointer shadow-2xs active:scale-[0.98]"
              title="Ganti mata uang tampilan"
            >
              <span className={currencyMode === "IDR" ? "font-bold text-[#fe5e37]" : "text-stone-400"}>IDR</span>
              <span className="text-stone-300">/</span>
              <span className={currencyMode === "USD" ? "font-bold text-[#fe5e37]" : "text-stone-400"}>USD</span>
            </button>
          )}

          {/* Add Document Button */}
          <button
            type="button"
            onClick={onAddMore}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#fe5e37]" />
            <span>Tambah Dokumen</span>
          </button>

          {/* Export PDF Button */}
          <button
            type="button"
            onClick={onExportPdf}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-xl bg-[#fe5e37] hover:bg-[#ea4e28] text-white transition-all cursor-pointer shadow-sm shadow-[#fe5e37]/25 active:scale-[0.98]"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Ekspor PDF</span>
          </button>

          {/* Reset / Clear Data */}
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center p-2 text-xs font-medium rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-colors cursor-pointer"
            title="Hapus data portofolio dari browser ini"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Hero Numbers & Sub-metrics */}
      <div className="relative pt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
        {/* Main Net Worth */}
        <div className="lg:col-span-7 space-y-2.5">
          <div className="inline-flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-50 border border-orange-200/80 text-[11px] font-bold uppercase tracking-wider text-[#fe5e37]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#fe5e37] animate-pulse" />
              <span>Kekayaan Bersih Terkonsolidasi (Net Worth)</span>
            </span>

            <button
              type="button"
              onClick={handleCopy}
              className="p-1 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              title="Salin nominal Net Worth"
            >
              {isCopied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          <div className="flex items-baseline gap-3 flex-wrap">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-mono text-stone-900 tabular-nums">
              {currencyMode === "USD"
                ? formatUsdEstimate(portfolio.totalNetWorthIdr, 15800, isPrivate)
                : formatIdr(portfolio.totalNetWorthIdr, isPrivate)}
            </h1>

            {currencyMode === "USD" && !isPrivate && (
              <span className="text-xs sm:text-sm text-stone-500 font-mono font-medium">
                (Kurs ~Rp 15.800)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs sm:text-sm text-stone-500 font-medium flex-wrap">
            <span>
              Tercatat setara dengan{" "}
              <strong className="text-stone-800 font-bold font-mono">
                {formatCompactIdr(portfolio.totalNetWorthIdr, isPrivate)}
              </strong>
            </span>
            <span>•</span>
            <span>{portfolio.assets.length} item aset diaudit</span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Solvabilitas Prima ({solvencyRatio.toFixed(1)}%)
            </span>
          </div>
        </div>

        {/* Sub-Metrics Cards in Light Fluent Style */}
        <div className="lg:col-span-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {/* Total Assets */}
          <div className="p-3.5 rounded-2xl bg-stone-50/90 border border-stone-200/70 hover:border-stone-300 transition-all">
            <div className="flex items-center justify-between text-stone-500 text-[11px] font-semibold">
              <span className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                <span>Total Aset</span>
              </span>
            </div>
            <p className="text-sm sm:text-base font-bold font-mono text-stone-900 mt-1 truncate tabular-nums">
              {currencyMode === "USD"
                ? formatUsdEstimate(portfolio.totalAssetsIdr, 15800, isPrivate)
                : formatCompactIdr(portfolio.totalAssetsIdr, isPrivate)}
            </p>
            <p className="text-[10px] text-stone-400 mt-0.5 font-medium">
              100% Bruto
            </p>
          </div>

          {/* Total Liabilities */}
          <div className="p-3.5 rounded-2xl bg-stone-50/90 border border-stone-200/70 hover:border-stone-300 transition-all">
            <div className="flex items-center justify-between text-stone-500 text-[11px] font-semibold">
              <span className="flex items-center gap-1">
                <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
                <span>Liabilitas</span>
              </span>
              <span className="text-[10px] font-bold font-mono px-1.5 py-0.2 rounded-sm bg-rose-100 text-rose-700">
                {debtToAssetRatio.toFixed(1)}%
              </span>
            </div>
            <p className="text-sm sm:text-base font-bold font-mono text-stone-900 mt-1 truncate tabular-nums">
              {portfolio.totalLiabilitiesIdr > 0
                ? currencyMode === "USD"
                  ? formatUsdEstimate(portfolio.totalLiabilitiesIdr, 15800, isPrivate)
                  : formatCompactIdr(portfolio.totalLiabilitiesIdr, isPrivate)
                : "Rp 0"}
            </p>
            <p className="text-[10px] text-stone-400 mt-0.5 font-medium">
              {portfolio.liabilities.length} kewajiban
            </p>
          </div>

          {/* Liquid Ratio */}
          <div className="p-3.5 rounded-2xl bg-stone-50/90 border border-stone-200/70 hover:border-stone-300 transition-all col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-stone-500 text-[11px] font-semibold">
              <span className="flex items-center gap-1">
                <Droplet className="w-3.5 h-3.5 text-blue-500" />
                <span>Likuiditas</span>
              </span>
              <span className="text-[10px] font-bold font-mono px-1.5 py-0.2 rounded-sm bg-blue-100 text-blue-700">
                {portfolio.liquidRatioPercentage >= 30 ? "Optimal" : "Waspada"}
              </span>
            </div>
            <p className="text-sm sm:text-base font-bold font-mono text-stone-900 mt-1 truncate tabular-nums">
              {portfolio.liquidRatioPercentage}%
            </p>
            <p className="text-[10px] text-stone-400 mt-0.5 font-medium">
              Kas, Saham & SBN
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

