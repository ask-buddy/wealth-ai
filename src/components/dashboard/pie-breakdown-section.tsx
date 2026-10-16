"use client";

import React, { useState } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { formatIdr } from "@/lib/formatters";
import { AssetCategory, CategorySummary, WealthPortfolio } from "@/types/wealth";
import { ChevronRight, Lightbulb, Plus, ShieldCheck } from "lucide-react";

interface PieBreakdownSectionProps {
  portfolio: WealthPortfolio;
  onSelectCategory: (category: AssetCategory) => void;
  selectedCategory: AssetCategory | null;
  onAddMore: () => void;
}

export function PieBreakdownSection({
  portfolio,
  onSelectCategory,
  selectedCategory,
  onAddMore,
}: PieBreakdownSectionProps) {
  const [activeTab, setActiveTab] = useState<"assets" | "liabilities">("assets");
  const [hoveredCategory, setHoveredCategory] = useState<AssetCategory | null>(null);

  const categories = portfolio.categories;

  const chartData = categories.map((cat) => ({
    name: cat.label,
    icon: cat.icon,
    value: cat.totalIdr,
    percentage: cat.percentage,
    categoryKey: cat.category,
    color: cat.color,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="p-3.5 rounded-xl border border-stone-200 bg-white/95 shadow-xl text-xs space-y-1 backdrop-blur-md">
          <p className="font-semibold text-stone-900 flex items-center gap-1.5">
            <span>{data.icon}</span>
            <span>{data.name}</span>
          </p>
          <p className="text-stone-600 font-mono font-bold text-sm">
            {formatIdr(data.value)}
          </p>
          <p className="text-stone-500 font-medium">
            Porsi: <span className="font-bold text-[#fe5e37]">{data.percentage}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Header Card (Matching Reference Layout in Fluent HQ Light Style) */}
      <div className="rounded-2xl border border-stone-200/80 bg-white shadow-sm overflow-hidden">
        {/* Top Two Tabs: Liabilitas vs Total Aset */}
        <div className="grid grid-cols-2 text-center border-b border-stone-200/80">
          {/* Liabilitas Tab */}
          <button
            type="button"
            onClick={() => setActiveTab("liabilities")}
            className={`py-4 px-6 text-sm sm:text-base font-semibold transition-all relative cursor-pointer ${
              activeTab === "liabilities"
                ? "text-stone-900 bg-stone-50/50"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            <span>Liabilitas </span>
            <span className="font-mono font-bold text-stone-800">
              {formatIdr(portfolio.totalLiabilitiesIdr)}
            </span>
            {activeTab === "liabilities" && (
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#fe5e37]" />
            )}
          </button>

          {/* Total Aset Tab */}
          <button
            type="button"
            onClick={() => setActiveTab("assets")}
            className={`py-4 px-6 text-sm sm:text-base font-semibold transition-all relative cursor-pointer ${
              activeTab === "assets"
                ? "text-stone-900 bg-stone-50/50"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            <span>Total Aset </span>
            <span className="font-mono font-bold text-stone-900">
              {formatIdr(portfolio.totalAssetsIdr)}
            </span>
            {activeTab === "assets" && (
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#fe5e37]" />
            )}
          </button>
        </div>

        {/* Sub-bar: Net Worth Banner & Category Count */}
        <div className="px-6 py-3.5 bg-stone-50/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span className="text-stone-600 font-medium">Kekayaan Bersih (Net Worth):</span>
            <span className="font-mono font-bold text-emerald-600 text-sm sm:text-base">
              {formatIdr(portfolio.totalNetWorthIdr)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-stone-200/80 text-stone-700 font-semibold text-xs">
              {categories.length} Kategori Aset
            </span>
          </div>
        </div>
      </div>

      {/* Main Split Section: Pie Chart on Left, List Card on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* LEFT COLUMN: Clean Pie Chart & Helper Tip */}
        <div className="lg:col-span-5 rounded-2xl border border-stone-200/80 bg-white p-6 sm:p-7 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-stone-900 text-base">
                Distribusi Alokasi Kekayaan
              </h3>
              <span className="text-xs text-stone-400 font-medium">
                Interaktif
              </span>
            </div>

            {/* Recharts Pie Chart (Clean, Smooth Slices matching palette) */}
            <div className="h-[340px] w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomTooltip />} />
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={135}
                    innerRadius={55}
                    paddingAngle={2}
                    cursor="pointer"
                    onMouseEnter={(entry: any) => {
                      const cat = entry?.categoryKey || entry?.payload?.categoryKey;
                      setHoveredCategory(cat);
                    }}
                    onMouseLeave={() => setHoveredCategory(null)}
                    onClick={(entry: any) => {
                      const cat = entry?.categoryKey || entry?.payload?.categoryKey;
                      if (cat) onSelectCategory(cat);
                    }}
                  >
                    {chartData.map((entry, index) => {
                      const isHighlighted =
                        selectedCategory === entry.categoryKey ||
                        hoveredCategory === entry.categoryKey;
                      return (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke={isHighlighted ? "#ffffff" : "#ffffff"}
                          strokeWidth={isHighlighted ? 3 : 1.5}
                          className="transition-all duration-200 hover:opacity-90"
                          style={{
                            filter: isHighlighted
                              ? "drop-shadow(0 4px 10px rgba(0,0,0,0.12))"
                              : "none",
                          }}
                        />
                      );
                    })}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Center Net Worth Indicator */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Total
                </span>
                <span className="text-xs font-bold text-stone-800 font-mono">
                  {categories.length} Sektor
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Pill Tip (matching screenshot: 💡 Klik irisan grafik atau daftar aset...) */}
          <div className="mt-4 p-3 rounded-xl bg-stone-50 border border-stone-200/60 text-xs text-stone-600 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-[#fe5e37] shrink-0" />
            <span>
              <strong>Tip:</strong> Klik irisan grafik atau baris aset untuk melihat rincian & audit dokumen sumber.
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN: Rincian Total Aset List Cards (Exact Layout as Reference Image) */}
        <div className="lg:col-span-7 rounded-2xl border border-stone-200/80 bg-white p-6 sm:p-7 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="font-bold text-xs uppercase tracking-wider text-stone-500">
                RINCIAN TOTAL ASET (KEKAYAAN)
              </h3>
              <span className="text-xs text-stone-400 hover:text-stone-600 transition-colors">
                Klik baris untuk lihat rincian →
              </span>
            </div>

            {/* List Cards */}
            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.category;
                const isHovered = hoveredCategory === cat.category;

                return (
                  <div
                    key={cat.category}
                    onClick={() => onSelectCategory(cat.category)}
                    onMouseEnter={() => setHoveredCategory(cat.category)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    className={`group flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                      isSelected || isHovered
                        ? "border-[#fe5e37] bg-orange-50/30 shadow-sm translate-x-0.5"
                        : "border-stone-200/70 hover:border-stone-300 hover:bg-stone-50/60 bg-white"
                    }`}
                  >
                    {/* Left: Percentage Badge + Emoji & Name */}
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Percentage Badge */}
                      <span
                        className="px-2.5 py-1 rounded-lg text-xs font-bold font-mono shrink-0 shadow-xs"
                        style={{
                          backgroundColor: cat.badgeBg,
                          color: cat.badgeText,
                          border: `1px solid ${cat.color}30`,
                        }}
                      >
                        {cat.percentage}%
                      </span>

                      {/* Icon + Label */}
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-base shrink-0">{cat.icon}</span>
                        <span className="text-sm font-semibold text-stone-800 group-hover:text-stone-900 truncate">
                          {cat.label}
                        </span>
                      </div>
                    </div>

                    {/* Right: IDR Amount + Chevron */}
                    <div className="flex items-center gap-3 shrink-0 ml-2">
                      <span className="text-sm font-bold font-mono text-stone-900">
                        {formatIdr(cat.totalIdr)}
                      </span>
                      <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-[#fe5e37] group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Controls matching reference image */}
          <div className="mt-5 pt-4 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500">
            <span>Klik aset untuk melihat rincian dokumen & audit</span>

            <button
              type="button"
              onClick={onAddMore}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#fe5e37]" />
              <span>Tambah Dokumen / Aset</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
