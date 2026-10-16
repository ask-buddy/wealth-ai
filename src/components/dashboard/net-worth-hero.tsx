"use client";

import React, { useState } from "react";
import {
  formatIdr,
  formatCompactIdr,
  formatUsdEstimate,
  formatDateIndo,
  formatCompactCurrencyValue,
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

  return (
    <div className="relative rounded-sm border border-stone-200 bg-white p-6 sm:p-8 overflow-hidden luxury-card">
      {/* Top Header Controls */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-100">
        <div className="flex items-center gap-2 flex-wrap text-xs text-stone-500 font-medium">
          <span>{formatDateIndo(portfolio.analyzedAt)}</span>
          <span className="text-stone-300">•</span>
          <span>{portfolio.assets.length} item aset diaudit</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Add Document Button */}
          <button
            type="button"
            onClick={onAddMore}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-sm border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 transition-all cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#fe5e37]" />
            <span>Tambah Dokumen</span>
          </button>

          {/* Export PDF Button */}
          <button
            type="button"
            onClick={onExportPdf}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-sm bg-[#fe5e37] hover:bg-[#ea4e28] text-white transition-all cursor-pointer"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Ekspor PDF</span>
          </button>

          {/* Reset / Clear Data */}
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center p-2 text-xs font-medium rounded-sm text-stone-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-colors cursor-pointer"
            title="Hapus data portofolio dari browser ini"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Hero Numbers & Sub-metrics */}
      <div className="relative pt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
        {/* Main Net Worth */}
        <div className="lg:col-span-8 space-y-2.5">
          <div className="flex items-baseline gap-3 flex-wrap">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-mono text-stone-900 tabular-nums">
              {currencyMode === "USD"
                ? formatUsdEstimate(
                    portfolio.totalNetWorthIdr,
                    15800,
                    isPrivate,
                  )
                : formatIdr(portfolio.totalNetWorthIdr, isPrivate)}
            </h1>

            {currencyMode === "USD" && !isPrivate && (
              <span className="text-xs sm:text-sm text-stone-500 font-mono font-medium">
                (Kurs ~Rp 15.800)
              </span>
            )}
          </div>
        </div>

        {/* Sub-Metrics Cards in Clean Flat Style */}
        <div className="lg:col-span-4 grid grid-cols-2 sm:grid-cols-2 gap-3">
          {/* Total Assets */}
          <div className="p-3.5 rounded-sm bg-stone-50 border border-stone-200 hover:border-stone-300 transition-all">
            <div className="flex items-center justify-between text-stone-500 text-[11px] font-semibold">
              <span className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                <span>Total Aset</span>
              </span>
            </div>
            <p className="text-sm sm:text-base font-bold font-mono text-stone-900 mt-1 truncate tabular-nums">
              {formatCompactCurrencyValue(portfolio.totalAssetsIdr, currencyMode, isPrivate)}
            </p>
          </div>

          {/* Total Liabilities */}
          <div className="p-3.5 rounded-sm bg-stone-50 border border-stone-200 hover:border-stone-300 transition-all">
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
                ? formatCompactCurrencyValue(portfolio.totalLiabilitiesIdr, currencyMode, isPrivate)
                : currencyMode === "USD" ? "$0" : "Rp 0"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
