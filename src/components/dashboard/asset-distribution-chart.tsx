"use client";

import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { formatIdr, formatCompactIdr } from "@/lib/formatters";
import { AssetCategory, CategorySummary } from "@/types/wealth";
import { PieChart as PieIcon } from "lucide-react";

interface AssetDistributionChartProps {
  categories: CategorySummary[];
  onSelectCategory: (category: AssetCategory) => void;
  selectedCategory: AssetCategory | null;
}

export function AssetDistributionChart({
  categories,
  onSelectCategory,
  selectedCategory,
}: AssetDistributionChartProps) {
  const chartData = categories.map((cat) => ({
    name: cat.label,
    value: cat.totalIdr,
    percentage: cat.percentage,
    categoryKey: cat.category,
    color: cat.color,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="p-3 rounded-xl border bg-popover/95 shadow-xl text-xs space-y-1 backdrop-blur-md">
          <p className="font-semibold text-foreground flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: data.color }}
            />
            {data.name}
          </p>
          <p className="text-muted-foreground font-mono font-medium">
            {formatIdr(data.value)} ({data.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-3xl border bg-card p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PieIcon className="w-5 h-5 text-emerald-500" />
          <h3 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
            Distribusi Portofolio Aset
          </h3>
        </div>
        <span className="text-xs text-muted-foreground">Klik irisan untuk rincian</span>
      </div>

      <div className="h-[280px] w-full relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<CustomTooltip />} />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={105}
              paddingAngle={4}
              stroke="transparent"
              cursor="pointer"
              onClick={(entry: any) => {
                const cat = entry?.categoryKey || entry?.payload?.categoryKey;
                if (cat) onSelectCategory(cat);
              }}
            >
              {chartData.map((entry, index) => {
                const isSelected = selectedCategory === entry.categoryKey;
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    className="transition-all duration-300 hover:opacity-80"
                    stroke={isSelected ? "#fff" : "transparent"}
                    strokeWidth={isSelected ? 3 : 0}
                  />
                );
              })}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center Indicator */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Alokasi
          </span>
          <span className="text-sm font-bold text-foreground">
            {categories.length} Sektor
          </span>
        </div>
      </div>

      {/* Legend Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-border/60">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.category;
          return (
            <button
              key={cat.category}
              type="button"
              onClick={() => onSelectCategory(cat.category)}
              className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? "border-emerald-500 bg-emerald-500/10 shadow-sm"
                  : "border-transparent hover:bg-muted/50"
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-medium truncate">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="truncate text-foreground">{cat.label}</span>
              </div>
              <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                {cat.percentage}% ({formatCompactIdr(cat.totalIdr)})
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
