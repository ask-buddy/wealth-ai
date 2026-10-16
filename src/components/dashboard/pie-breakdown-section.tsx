"use client";

import React, { useState, useMemo } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import {
  formatIdr,
  formatCompactIdr,
  formatCurrencyValue,
  formatCompactCurrencyValue,
} from "@/lib/formatters";
import {
  AssetCategory,
  CategorySummary,
  WealthPortfolio,
  ExtractedLiabilityItem,
} from "@/types/wealth";
import {
  ChevronRight,
  Lightbulb,
  Plus,
  PieChart as PieIcon,
  BarChart2,
  ArrowDownRight,
  ShieldCheck,
  Tag,
  FileText,
  SlidersHorizontal,
  CheckCircle2,
} from "lucide-react";

interface PieBreakdownSectionProps {
  portfolio: WealthPortfolio;
  onSelectCategory: (category: AssetCategory) => void;
  selectedCategory: AssetCategory | null;
  onAddMore: () => void;
  isPrivate?: boolean;
  onSelectLiability?: (liability: ExtractedLiabilityItem) => void;
  currencyMode?: "IDR" | "USD";
}

type FilterGroup = "ALL" | "LIQUID" | "CAPITAL_MARKETS" | "REAL_ASSETS";

export function PieBreakdownSection({
  portfolio,
  onSelectCategory,
  selectedCategory,
  onAddMore,
  isPrivate = false,
  onSelectLiability,
  currencyMode = "IDR",
}: PieBreakdownSectionProps) {
  const [activeTab, setActiveTab] = useState<"assets" | "liabilities">(
    "assets",
  );
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [filterGroup, setFilterGroup] = useState<FilterGroup>("ALL");
  const [sortOrder, setSortOrder] = useState<"desc" | "alpha">("desc");
  const [chartViewMode, setChartViewMode] = useState<"donut" | "bar">("donut");

  const categories = portfolio.categories;
  const liabilities = portfolio.liabilities || [];

  // Group definitions for assets
  const liquidCategories: AssetCategory[] = [
    "KAS_DEPOSITO",
    "CRYPTO",
    "OBLIGASI_SBN",
  ];
  const capitalMarketCategories: AssetCategory[] = [
    "SAHAM",
    "OBLIGASI_SBN",
    "PERUSAHAAN_SENDIRI",
  ];
  const realAssetCategories: AssetCategory[] = [
    "PROPERTI",
    "EMAS_LOGAM_MULIA",
    "KENDARAAN",
    "LAINNYA",
  ];

  // Filtered and sorted asset categories
  const filteredCategories = useMemo(() => {
    let result = categories.filter((cat) => {
      if (filterGroup === "LIQUID")
        return liquidCategories.includes(cat.category);
      if (filterGroup === "CAPITAL_MARKETS")
        return capitalMarketCategories.includes(cat.category);
      if (filterGroup === "REAL_ASSETS")
        return realAssetCategories.includes(cat.category);
      return true;
    });

    if (sortOrder === "desc") {
      result = [...result].sort((a, b) => b.totalIdr - a.totalIdr);
    } else {
      result = [...result].sort((a, b) => a.label.localeCompare(b.label));
    }
    return result;
  }, [categories, filterGroup, sortOrder]);

  // Asset Chart Data
  const assetChartData = useMemo(() => {
    return categories.map((cat) => ({
      key: cat.category,
      name: cat.label,
      icon: cat.icon,
      value: cat.totalIdr,
      percentage: cat.percentage,
      color: cat.color,
    }));
  }, [categories]);

  // Liability Chart Data
  const liabilityChartData = useMemo(() => {
    const total = portfolio.totalLiabilitiesIdr || 1;
    const colors = ["#9E4B5E", "#B86B7E", "#83384A", "#C98596", "#6E2B3B"];
    return liabilities.map((lia, idx) => {
      const pct = Number(((lia.amountIdr / total) * 100).toFixed(1));
      return {
        key: lia.id,
        name: lia.name,
        icon: "💳",
        lender: lia.lender || "Lembaga Pembiayaan",
        value: lia.amountIdr,
        percentage: pct,
        color: colors[idx % colors.length],
        sourceFile: lia.sourceFile,
        notes: lia.notes,
      };
    });
  }, [liabilities, portfolio.totalLiabilitiesIdr]);

  const activeChartData =
    activeTab === "assets" ? assetChartData : liabilityChartData;

  // Active hovered or selected item
  const activeHoveredItem = useMemo(() => {
    if (!hoveredKey) return null;
    return activeChartData.find((d) => d.key === hoveredKey) || null;
  }, [hoveredKey, activeChartData]);

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="p-3 rounded-sm border border-stone-200 bg-white text-xs space-y-1.5">
          <p className="font-bold text-stone-900">{data.name}</p>
          <p className="text-stone-900 font-mono font-bold text-sm tabular-nums">
            {formatCurrencyValue(data.value, currencyMode, isPrivate)}
          </p>
          <div className="flex items-center gap-2 text-stone-500 font-medium">
            <span>Porsi:</span>
            <span className="font-bold text-[#80283e] font-mono">
              {data.percentage}%
            </span>
          </div>
          {data.lender && (
            <p className="text-[11px] text-stone-400 font-medium">
              Kreditor: {data.lender}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Segmented Tabs: Liabilitas vs Total Aset */}
      <div className="rounded-sm border border-stone-200 bg-white overflow-hidden luxury-card">
        <div className="grid grid-cols-2 text-center border-b border-stone-200">
          {/* Total Aset Tab */}
          <button
            type="button"
            onClick={() => {
              setActiveTab("assets");
              setHoveredKey(null);
            }}
            className={`py-4 px-6 text-sm sm:text-base font-semibold transition-all relative cursor-pointer ${
              activeTab === "assets"
                ? "text-stone-900 bg-stone-50/60 font-bold"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <span>Total Aset</span>
              <span className="font-mono font-bold text-stone-900 tabular-nums">
                {formatCurrencyValue(portfolio.totalAssetsIdr, currencyMode, isPrivate)}
              </span>
            </div>
            {activeTab === "assets" && (
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#80283e]" />
            )}
          </button>

          {/* Liabilitas Tab */}
          <button
            type="button"
            onClick={() => {
              setActiveTab("liabilities");
              setHoveredKey(null);
            }}
            className={`py-4 px-6 text-sm sm:text-base font-semibold transition-all relative cursor-pointer ${
              activeTab === "liabilities"
                ? "text-stone-900 bg-[#faf0f3]/60 font-bold"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <span>Liabilitas</span>
              <span className="font-mono font-bold text-stone-800 tabular-nums">
                {formatCurrencyValue(portfolio.totalLiabilitiesIdr, currencyMode, isPrivate)}
              </span>
            </div>
            {activeTab === "liabilities" && (
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#80283e]" />
            )}
          </button>
        </div>

        {/* Sub-bar: Status Banner */}
        <div className="px-6 py-3 bg-stone-50/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full inline-block ${
                activeTab === "assets"
                  ? "bg-emerald-500 animate-pulse"
                  : "bg-[#80283e]"
              }`}
            />
            <span className="text-stone-600 font-medium">
              {activeTab === "assets"
                ? "Kekayaan Bersih (Net Worth):"
                : "Rasio Beban Hutang:"}
            </span>
            <span
              className={`font-mono font-bold text-sm sm:text-base tabular-nums ${
                activeTab === "assets" ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {activeTab === "assets"
                ? formatCurrencyValue(portfolio.totalNetWorthIdr, currencyMode, isPrivate)
                : `${(portfolio.totalAssetsIdr > 0
                    ? (portfolio.totalLiabilitiesIdr /
                        portfolio.totalAssetsIdr) *
                      100
                    : 0
                  ).toFixed(1)}% dari Total Aset`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-sm bg-stone-200 text-stone-700 font-semibold text-xs">
              {activeTab === "assets"
                ? `${categories.length} Sektor Portofolio`
                : `${liabilities.length} Item Liabilitas Aktif`}
            </span>
          </div>
        </div>
      </div>

      {/* Main Split Section: Chart on Left, Detail List on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* LEFT COLUMN: Clean Chart Card */}
        <div className="lg:col-span-5 rounded-sm border border-stone-200 bg-white p-6 sm:p-7 flex flex-col justify-between luxury-card">
          <div>
            {/* Header with View Toggle (Donut vs Bar) */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-stone-900 text-base">
                  {activeTab === "assets"
                    ? "Distribusi Alokasi Kekayaan"
                    : "Porsi Pembagian Liabilitas"}
                </h3>
                <p className="text-[11px] text-stone-400 font-medium mt-0.5">
                  Visualisasi proporsi interaktif
                </p>
              </div>

              {/* View Mode Switcher */}
              <div className="flex items-center p-0.5 rounded-sm bg-stone-100 border border-stone-200">
                <button
                  type="button"
                  onClick={() => setChartViewMode("donut")}
                  className={`p-1.5 rounded-sm transition-all cursor-pointer ${
                    chartViewMode === "donut"
                      ? "bg-white text-[#80283e] font-bold"
                      : "text-stone-400 hover:text-stone-700"
                  }`}
                  title="Tampilan Donut Chart"
                >
                  <PieIcon className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setChartViewMode("bar")}
                  className={`p-1.5 rounded-sm transition-all cursor-pointer ${
                    chartViewMode === "bar"
                      ? "bg-white text-[#80283e] font-bold"
                      : "text-stone-400 hover:text-stone-700"
                  }`}
                  title="Tampilan Bar Distribusi"
                >
                  <BarChart2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* CHART DISPLAY AREA */}
            {chartViewMode === "donut" ? (
              <div className="h-[340px] w-full relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip content={<CustomTooltip />} />
                    <Pie
                      data={activeChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={135}
                      innerRadius={68}
                      paddingAngle={2.5}
                      cursor="pointer"
                      onMouseEnter={(entry: any) => {
                        const k = entry?.key || entry?.payload?.key;
                        setHoveredKey(k);
                      }}
                      onMouseLeave={() => setHoveredKey(null)}
                      onClick={(entry: any) => {
                        const k = entry?.key || entry?.payload?.key;
                        if (activeTab === "assets" && k) {
                          onSelectCategory(k as AssetCategory);
                        }
                      }}
                    >
                      {activeChartData.map((entry, index) => {
                        const isHighlighted =
                          hoveredKey === entry.key ||
                          (activeTab === "assets" &&
                            selectedCategory === entry.key);
                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                            stroke="#ffffff"
                            strokeWidth={isHighlighted ? 3 : 1.5}
                            className="transition-all duration-200"
                            style={{
                              transform: isHighlighted
                                ? "scale(1.02)"
                                : "scale(1)",
                              transformOrigin: "center center",
                            }}
                          />
                        );
                      })}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                {/* DYNAMIC CENTER DISPLAY */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4 max-w-[130px] mx-auto">
                  {activeHoveredItem ? (
                    <div className="animate-in fade-in zoom-in-95 duration-150 space-y-0.5">
                      <p className="text-[11px] font-bold text-stone-800 line-clamp-1 leading-tight">
                        {activeHoveredItem.name}
                      </p>
                      <p className="text-xs font-extrabold font-mono text-[#80283e]">
                        {activeHoveredItem.percentage}%
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                        {activeTab === "assets" ? "Konsolidasi" : "Total Beban"}
                      </span>
                      <p className="text-xs font-extrabold text-stone-900 font-mono">
                        {activeTab === "assets"
                          ? `${categories.length} Sektor`
                          : `${liabilities.length} Hutang`}
                      </p>
                      <p className="text-[10px] text-stone-400 font-mono">
                        {formatCompactCurrencyValue(
                          activeTab === "assets"
                            ? portfolio.totalAssetsIdr
                            : portfolio.totalLiabilitiesIdr,
                          currencyMode,
                          isPrivate,
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* HORIZONTAL DISTRIBUTION BAR VIEW (UI/UX Pro Max A11y Recommendation) */
              <div className="py-6 space-y-4">
                <div className="h-6 w-full rounded-sm overflow-hidden flex bg-stone-100">
                  {activeChartData.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: item.color,
                      }}
                      className="h-full transition-all hover:opacity-85 cursor-pointer relative group"
                      onMouseEnter={() => setHoveredKey(item.key)}
                      onMouseLeave={() => setHoveredKey(null)}
                      onClick={() => {
                        if (activeTab === "assets")
                          onSelectCategory(item.key as AssetCategory);
                      }}
                    />
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {activeChartData.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 rounded-sm bg-stone-50 border border-stone-200"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="truncate font-medium text-stone-700">
                        {item.name}
                      </span>
                      <span className="ml-auto font-mono font-bold text-stone-900">
                        {item.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Helpful Tip */}
          <div className="mt-4 p-3 rounded-sm bg-stone-50 border border-stone-200 text-xs text-stone-600 flex items-center gap-2.5">
            <Lightbulb className="w-4 h-4 text-[#80283e] shrink-0" />
            <span>
              <strong>Audit Tip:</strong> Klik irisan grafik atau baris aset
              untuk melihat dokumen sumber dan audit biner.
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN: Rincian Items List Cards */}
        <div className="lg:col-span-7 rounded-sm border border-stone-200 bg-white p-6 sm:p-7 flex flex-col justify-between luxury-card">
          <div className="space-y-4">
            {/* Header with Title & Filter Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-stone-500">
                  {activeTab === "assets"
                    ? "RINCIAN TOTAL ASET (KEKAYAAN)"
                    : "DAFTAR LIABILITAS & KEWAJIBAN"}
                </h3>
              </div>

              {/* Asset Filter Chips */}
              {activeTab === "assets" && (
                <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                  <button
                    type="button"
                    onClick={() => setFilterGroup("ALL")}
                    className={`px-2.5 py-1 rounded-sm text-[11px] font-semibold transition-all cursor-pointer ${
                      filterGroup === "ALL"
                        ? "bg-stone-900 text-white"
                        : "bg-stone-100 hover:bg-stone-200 text-stone-600"
                    }`}
                  >
                    Semua ({categories.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterGroup("LIQUID")}
                    className={`px-2.5 py-1 rounded-sm text-[11px] font-semibold transition-all cursor-pointer ${
                      filterGroup === "LIQUID"
                        ? "bg-stone-900 text-white"
                        : "bg-stone-100 hover:bg-stone-200 text-stone-600"
                    }`}
                  >
                    Likuid
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterGroup("CAPITAL_MARKETS")}
                    className={`px-2.5 py-1 rounded-sm text-[11px] font-semibold transition-all cursor-pointer ${
                      filterGroup === "CAPITAL_MARKETS"
                        ? "bg-stone-900 text-white"
                        : "bg-stone-100 hover:bg-stone-200 text-stone-600"
                    }`}
                  >
                    Investasi
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterGroup("REAL_ASSETS")}
                    className={`px-2.5 py-1 rounded-sm text-[11px] font-semibold transition-all cursor-pointer ${
                      filterGroup === "REAL_ASSETS"
                        ? "bg-stone-900 text-white"
                        : "bg-stone-100 hover:bg-stone-200 text-stone-600"
                    }`}
                  >
                    Fisik/Riil
                  </button>
                </div>
              )}
            </div>

            {/* List Cards: Assets View */}
            {activeTab === "assets" && (
              <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                {filteredCategories.map((cat) => {
                  const isSelected = selectedCategory === cat.category;
                  const isHovered = hoveredKey === cat.category;

                  return (
                    <div
                      key={cat.category}
                      onClick={() => onSelectCategory(cat.category)}
                      onMouseEnter={() => setHoveredKey(cat.category)}
                      onMouseLeave={() => setHoveredKey(null)}
                      className={`group flex flex-col p-3 sm:p-3.5 rounded-sm border transition-all duration-200 cursor-pointer ${
                        isSelected || isHovered
                          ? "border-[#80283e] bg-[#faf0f3]/60"
                          : "border-stone-200 hover:border-stone-300 hover:bg-stone-50/60 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        {/* Left: Percentage Badge + Name */}
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Percentage Badge */}
                          <span
                            className="px-2.5 py-1 rounded-sm text-xs font-bold font-mono shrink-0 tabular-nums"
                            style={{
                              backgroundColor: cat.badgeBg,
                              color: cat.badgeText,
                              border: `1px solid ${cat.color}35`,
                            }}
                          >
                            {cat.percentage}%
                          </span>

                          {/* Label (Clean text without icon) */}
                          <div className="truncate">
                            <span className="text-sm font-semibold text-stone-800 group-hover:text-stone-900 block truncate">
                              {cat.label}
                            </span>
                            <span className="text-[10px] text-stone-400 font-medium">
                              {cat.itemCount} aset terdaftar
                            </span>
                          </div>
                        </div>

                        {/* Right: IDR / USD Amount + Chevron */}
                        <div className="flex items-center gap-3 shrink-0 ml-2">
                          <span className="text-sm sm:text-base font-bold font-mono text-stone-900 tabular-nums">
                            {formatCurrencyValue(cat.totalIdr, currencyMode, isPrivate)}
                          </span>
                          <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-[#80283e] transition-all" />
                        </div>
                      </div>

                      {/* Visual Allocation Progress Mini-bar */}
                      <div className="mt-2.5 h-1.5 w-full bg-stone-100 rounded-sm overflow-hidden">
                        <div
                          className="h-full rounded-sm transition-all duration-300"
                          style={{
                            width: `${cat.percentage}%`,
                            backgroundColor: cat.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* List Cards: Liabilities View (Dedicated Implementation) */}
            {activeTab === "liabilities" && (
              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {liabilities.length === 0 ? (
                  <div className="py-12 text-center text-stone-400 space-y-2">
                    <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500" />
                    <p className="text-sm font-semibold text-stone-700">
                      Bebas Liabilitas
                    </p>
                    <p className="text-xs text-stone-400">
                      Tidak ada catatan kewajiban atau hutang dari dokumen yang
                      dianalisis.
                    </p>
                  </div>
                ) : (
                  liabilities.map((lia, idx) => {
                    const isHovered = hoveredKey === lia.id;
                    const pct = (
                      (lia.amountIdr / (portfolio.totalLiabilitiesIdr || 1)) *
                      100
                    ).toFixed(1);

                    return (
                      <div
                        key={lia.id}
                        onMouseEnter={() => setHoveredKey(lia.id)}
                        onMouseLeave={() => setHoveredKey(null)}
                        onClick={() => onSelectLiability?.(lia)}
                        className={`group p-4 rounded-sm border transition-all duration-200 cursor-pointer ${
                          isHovered
                            ? "border-[#9E4B5E]/50 bg-[#faf0f3]/40"
                            : "border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50/50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-sm bg-[#f7edf0] text-[#7a2d3e] border border-[#7a2d3e]/20 text-[11px] font-bold font-mono">
                                {pct}%
                              </span>
                              <h4 className="font-bold text-sm text-stone-900 group-hover:text-[#80283e] transition-colors">
                                {lia.name}
                              </h4>
                            </div>

                            {lia.lender && (
                              <p className="text-xs text-stone-500 flex items-center gap-1.5 font-medium">
                                <Tag className="w-3 h-3 text-[#9E4B5E]" />
                                <span>Pemberi Pinjaman: {lia.lender}</span>
                              </p>
                            )}

                            {lia.notes && (
                              <p className="text-[11px] text-stone-400 italic">
                                {lia.notes}
                              </p>
                            )}
                          </div>

                          <div className="text-right shrink-0">
                            <p className="text-sm sm:text-base font-bold font-mono text-stone-900 tabular-nums">
                              {formatCurrencyValue(lia.amountIdr, currencyMode, isPrivate)}
                            </p>
                            <span className="inline-flex items-center gap-1 text-[10px] text-stone-500 px-2 py-0.5 rounded-sm bg-stone-100 font-mono mt-1">
                              <FileText className="w-3 h-3 text-stone-400" />
                              {lia.sourceFile}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="mt-5 pt-4 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Data terverifikasi in-memory dari berkas audit</span>
            </span>

            <button
              type="button"
              onClick={onAddMore}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-sm bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#80283e]" />
              <span>Tambah Dokumen / Aset</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
