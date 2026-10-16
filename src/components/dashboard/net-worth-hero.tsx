"use client";

import React from "react";
import { formatIdr, formatCompactIdr, formatDateIndo } from "@/lib/formatters";
import { WealthPortfolio } from "@/types/wealth";
import {
  ShieldCheck,
  FileDown,
  Trash2,
  PlusCircle,
  Layers,
  ArrowDownRight,
  Droplet,
} from "lucide-react";

interface NetWorthHeroProps {
  portfolio: WealthPortfolio;
  onReset: () => void;
  onAddMore: () => void;
  onExportPdf: () => void;
}

export function NetWorthHero({
  portfolio,
  onReset,
  onAddMore,
  onExportPdf,
}: NetWorthHeroProps) {
  return (
    <div className="relative rounded-2xl border border-stone-200/90 bg-white p-6 sm:p-8 shadow-xs overflow-hidden">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-100">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Zero-Database • In-Memory AI</span>
          </div>
          <span className="text-xs text-stone-500 font-medium">
            Diperbarui: {formatDateIndo(portfolio.analyzedAt)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onAddMore}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 transition-colors cursor-pointer shadow-2xs"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#fe5e37]" />
            <span>Tambah Dokumen</span>
          </button>

          <button
            type="button"
            onClick={onExportPdf}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-[#fe5e37] hover:bg-[#ea4e28] text-white transition-colors cursor-pointer shadow-sm shadow-[#fe5e37]/20"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Ekspor PDF</span>
          </button>

          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 p-2 text-xs font-medium rounded-xl text-stone-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors cursor-pointer"
            title="Hapus data lokal dari browser"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Hero Numbers */}
      <div className="pt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
        {/* Main Net Worth */}
        <div className="lg:col-span-7 space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#fe5e37]">
            <span className="w-2 h-2 rounded-full bg-[#fe5e37]" />
            <span>Kekayaan Bersih Terkonsolidasi (Net Worth)</span>
          </div>

          <div className="flex items-baseline gap-3 flex-wrap">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-mono text-stone-900">
              {formatIdr(portfolio.totalNetWorthIdr)}
            </h1>
          </div>

          <p className="text-xs sm:text-sm text-stone-500 font-medium">
            Tercatat setara dengan{" "}
            <span className="font-bold text-stone-800">
              {formatCompactIdr(portfolio.totalNetWorthIdr)}
            </span>{" "}
            dari {portfolio.assets.length} item aset yang diaudit.
          </p>
        </div>

        {/* Sub-Metrics Cards in Light Style */}
        <div className="lg:col-span-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {/* Total Assets */}
          <div className="p-3.5 rounded-xl bg-stone-50/80 border border-stone-200/60">
            <div className="flex items-center gap-1.5 text-stone-500 text-[11px] font-semibold">
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span>Total Aset</span>
            </div>
            <p className="text-sm sm:text-base font-bold font-mono text-stone-900 mt-1 truncate">
              {formatCompactIdr(portfolio.totalAssetsIdr)}
            </p>
          </div>

          {/* Total Liabilities */}
          <div className="p-3.5 rounded-xl bg-stone-50/80 border border-stone-200/60">
            <div className="flex items-center gap-1.5 text-stone-500 text-[11px] font-semibold">
              <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
              <span>Liabilitas</span>
            </div>
            <p className="text-sm sm:text-base font-bold font-mono text-stone-900 mt-1 truncate">
              {portfolio.totalLiabilitiesIdr > 0
                ? formatCompactIdr(portfolio.totalLiabilitiesIdr)
                : "Rp 0"}
            </p>
          </div>

          {/* Liquid Ratio */}
          <div className="p-3.5 rounded-xl bg-stone-50/80 border border-stone-200/60 col-span-2 sm:col-span-1">
            <div className="flex items-center gap-1.5 text-stone-500 text-[11px] font-semibold">
              <Droplet className="w-3.5 h-3.5 text-blue-500" />
              <span>Likuiditas</span>
            </div>
            <p className="text-sm sm:text-base font-bold font-mono text-stone-900 mt-1 truncate">
              {portfolio.liquidRatioPercentage}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
