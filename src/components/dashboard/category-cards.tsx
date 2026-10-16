"use client";

import React from "react";
import { formatIdr, formatCompactIdr } from "@/lib/formatters";
import { AssetCategory, CategorySummary } from "@/types/wealth";
import {
  TrendingUp,
  Building2,
  Coins,
  Home,
  Wallet,
  Gem,
  ChevronRight,
  Layers,
} from "lucide-react";

interface CategoryCardsProps {
  categories: CategorySummary[];
  onSelectCategory: (cat: AssetCategory) => void;
  selectedCategory: AssetCategory | null;
}

export function CategoryCards({
  categories,
  onSelectCategory,
  selectedCategory,
}: CategoryCardsProps) {
  const getCategoryIcon = (category: AssetCategory) => {
    switch (category) {
      case "SAHAM":
        return <TrendingUp className="w-5 h-5 text-emerald-500" />;
      case "PERUSAHAAN_SENDIRI":
        return <Building2 className="w-5 h-5 text-violet-500" />;
      case "CRYPTO":
        return <Coins className="w-5 h-5 text-amber-500" />;
      case "PROPERTI":
        return <Home className="w-5 h-5 text-blue-500" />;
      case "KAS_DEPOSITO":
        return <Wallet className="w-5 h-5 text-cyan-500" />;
      case "LAINNYA":
      default:
        return <Gem className="w-5 h-5 text-rose-500" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base sm:text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
          <Layers className="w-5 h-5 text-emerald-500" />
          Kategori Portofolio Aset
        </h3>
        <span className="text-xs text-muted-foreground">Pilih untuk melihat detail</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.category;
          return (
            <div
              key={cat.category}
              onClick={() => onSelectCategory(cat.category)}
              className={`group p-5 rounded-2xl border transition-all duration-200 cursor-pointer relative overflow-hidden bg-card ${
                isSelected
                  ? "ring-2 ring-emerald-500 border-transparent shadow-lg bg-emerald-500/5"
                  : "hover:border-emerald-500/40 hover:shadow-md"
              }`}
            >
              {/* Top Accent Stripe */}
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: cat.color }}
              />

              <div className="flex items-start justify-between gap-2">
                <div className="p-2.5 rounded-xl bg-muted/60 shrink-0">
                  {getCategoryIcon(cat.category)}
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted border text-muted-foreground font-mono">
                    {cat.percentage}%
                  </span>
                </div>
              </div>

              <div className="mt-4 space-y-1">
                <h4 className="font-semibold text-sm sm:text-base text-foreground group-hover:text-emerald-500 transition-colors">
                  {cat.label}
                </h4>
                <p className="text-lg sm:text-xl font-bold font-mono text-foreground">
                  {formatCompactIdr(cat.totalIdr)}
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                  {formatIdr(cat.totalIdr)}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                <span>{cat.itemCount} Item Tercatat</span>
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium group-hover:translate-x-0.5 transition-transform">
                  Rincian <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
