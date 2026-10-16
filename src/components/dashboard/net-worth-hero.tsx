"use client";

import React, { useState } from "react";
import {
  formatIdr,
  formatCompactIdr,
  formatUsdEstimate,
  formatDateIndo,
  formatCompactCurrencyValue,
  formatTerbilang,
} from "@/lib/formatters";
import { WealthPortfolio } from "@/types/wealth";
import {
  FileDown,
  Trash2,
  PlusCircle,
  Layers,
  ArrowDownRight,
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
  activeTab?: "assets" | "liabilities";
  onTabChange?: (tab: "assets" | "liabilities") => void;
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
  activeTab = "assets",
  onTabChange,
}: NetWorthHeroProps) {
  const debtToAssetRatio =
    portfolio.totalAssetsIdr > 0
      ? (portfolio.totalLiabilitiesIdr / portfolio.totalAssetsIdr) * 100
      : 0;

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
          {/* Add Document Button: Icon + Border Only, White Background */}
          <button
            type="button"
            onClick={onAddMore}
            className="inline-flex items-center justify-center w-8 h-8 rounded-sm border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 transition-all cursor-pointer shadow-2xs"
            title="Tambah Dokumen"
            aria-label="Tambah Dokumen"
          >
            <PlusCircle className="w-4 h-4 text-[#80283e]" />
          </button>

          {/* Export PDF Button: Icon + Border Only, White Background */}
          <button
            type="button"
            onClick={onExportPdf}
            className="inline-flex items-center justify-center w-8 h-8 rounded-sm border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 transition-all cursor-pointer shadow-2xs"
            title="Ekspor PDF"
            aria-label="Ekspor PDF"
          >
            <FileDown className="w-4 h-4 text-[#80283e]" />
          </button>

          {/* Delete Button: Border + Soft Lux Burgundy Solid Style */}
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center justify-center w-8 h-8 rounded-sm bg-[#80283e] hover:bg-[#6c1e32] text-white border border-[#80283e] transition-all cursor-pointer shadow-xs"
            title="Hapus data portofolio dari browser ini"
            aria-label="Hapus data portofolio"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Hero Numbers & Sub-metrics */}
      <div className="relative pt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
        {/* Main Net Worth */}
        <div className="lg:col-span-8 space-y-2">
          {/* Title for the Main Value */}
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#80283e]" />
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Total Kekayaan Bersih (Net Worth)
            </span>
          </div>

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

          {/* Text Terbilang di bawah Nilai Utama */}
          <p className="text-xs sm:text-sm italic text-stone-600 tracking-wide pt-0.5">
            &ldquo;{formatTerbilang(portfolio.totalNetWorthIdr, isPrivate)}
            &rdquo;
          </p>
        </div>

        {/* Sub-Metrics Cards as Clickable Tabs */}
        <div className="lg:col-span-4 grid grid-cols-2 sm:grid-cols-2 gap-3">
          {/* Total Assets Tab Card */}
          <button
            type="button"
            onClick={() => onTabChange?.("assets")}
            className={`p-3.5 rounded-sm text-left transition-all cursor-pointer relative ${
              activeTab === "assets"
                ? "bg-white border-2 border-[#80283e] shadow-xs ring-1 ring-[#80283e]/20"
                : "bg-stone-50 border border-stone-200 hover:border-stone-300 opacity-75 hover:opacity-100"
            }`}
            title="Klik untuk beralih ke data Total Aset"
          >
            <div className="flex items-center justify-between text-stone-500 text-[11px] font-semibold">
              <span className="flex items-center gap-1.5">
                <Layers
                  className={`w-3.5 h-3.5 ${
                    activeTab === "assets"
                      ? "text-[#80283e]"
                      : "text-emerald-600"
                  }`}
                />
                <span
                  className={
                    activeTab === "assets" ? "text-stone-900 font-bold" : ""
                  }
                >
                  Total Aset
                </span>
              </span>
              {activeTab === "assets" && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#80283e]" />
              )}
            </div>
            <p className="text-sm sm:text-base font-bold font-mono text-stone-900 mt-1 truncate tabular-nums">
              {formatCompactCurrencyValue(
                portfolio.totalAssetsIdr,
                currencyMode,
                isPrivate,
              )}
            </p>
          </button>

          {/* Total Liabilities Tab Card */}
          <button
            type="button"
            onClick={() => onTabChange?.("liabilities")}
            className={`p-3.5 rounded-sm text-left transition-all cursor-pointer relative ${
              activeTab === "liabilities"
                ? "bg-white border-2 border-[#80283e] shadow-xs ring-1 ring-[#80283e]/20"
                : "bg-stone-50 border border-stone-200 hover:border-stone-300 opacity-75 hover:opacity-100"
            }`}
            title="Klik untuk beralih ke data Liabilitas"
          >
            <div className="flex items-center justify-between text-stone-500 text-[11px] font-semibold">
              <span className="flex items-center gap-1.5">
                <ArrowDownRight
                  className={`w-3.5 h-3.5 ${
                    activeTab === "liabilities"
                      ? "text-[#80283e]"
                      : "text-rose-500"
                  }`}
                />
                <span
                  className={
                    activeTab === "liabilities"
                      ? "text-stone-900 font-bold"
                      : ""
                  }
                >
                  Liabilitas
                </span>
              </span>
              <span className="text-[10px] font-bold font-mono px-1.5 py-0.2 rounded-sm bg-rose-100 text-rose-700">
                {debtToAssetRatio.toFixed(1)}%
              </span>
            </div>
            <p className="text-sm sm:text-base font-bold font-mono text-stone-900 mt-1 truncate tabular-nums">
              {portfolio.totalLiabilitiesIdr > 0
                ? formatCompactCurrencyValue(
                    portfolio.totalLiabilitiesIdr,
                    currencyMode,
                    isPrivate,
                  )
                : currencyMode === "USD"
                  ? "$0"
                  : "Rp 0"}
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
