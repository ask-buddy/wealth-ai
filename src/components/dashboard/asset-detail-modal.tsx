"use client";

import React, { useState } from "react";
import { formatIdr } from "@/lib/formatters";
import { CATEGORY_CONFIG } from "@/lib/math";
import { AssetCategory, ExtractedAssetItem, ExtractedLiabilityItem } from "@/types/wealth";
import { X, FileText, Search, ShieldCheck, Tag, Info, Layers } from "lucide-react";

interface AssetDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: AssetCategory | null;
  assets: ExtractedAssetItem[];
  liabilities: ExtractedLiabilityItem[];
}

export function AssetDetailModal({
  isOpen,
  onClose,
  category,
  assets,
  liabilities,
}: AssetDetailModalProps) {
  const [searchQuery, setSearchQuery] = useState("");

  if (!isOpen) return null;

  const currentCategoryConfig = category ? CATEGORY_CONFIG[category] : null;
  const modalTitle = currentCategoryConfig
    ? `${currentCategoryConfig.icon} ${currentCategoryConfig.label}`
    : "Rincian Semua Aset";

  // Filter assets
  const filteredAssets = assets.filter((item) => {
    const matchesCategory = category ? item.category === category : true;
    const matchesSearch =
      searchQuery.trim() === "" ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.institution && item.institution.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.sourceFile.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categoryTotal = filteredAssets.reduce((sum, item) => sum + (Number(item.valueIdr) || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl border border-stone-200 bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-stone-100 flex items-center justify-between gap-4 bg-stone-50/60">
          <div className="flex items-center gap-3">
            {currentCategoryConfig && (
              <span
                className="w-3.5 h-3.5 rounded-full"
                style={{ backgroundColor: currentCategoryConfig.color }}
              />
            )}
            <div>
              <h3 className="text-lg font-bold tracking-tight text-stone-900">
                {modalTitle}
              </h3>
              <p className="text-xs text-stone-500 font-medium">
                {filteredAssets.length} aset terdata • Subtotal:{" "}
                <span className="font-bold text-stone-900 font-mono">
                  {formatIdr(categoryTotal)}
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3.5 border-b border-stone-100 bg-white flex items-center gap-2">
          <Search className="w-4 h-4 text-stone-400 shrink-0 ml-1" />
          <input
            type="text"
            placeholder="Cari nama aset, institusi, atau berkas sumber..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs sm:text-sm bg-transparent border-0 focus:outline-none text-stone-900 placeholder:text-stone-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs text-stone-400 hover:text-stone-700 font-medium mr-2"
            >
              Reset
            </button>
          )}
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {filteredAssets.length === 0 ? (
            <div className="py-12 text-center text-stone-400 space-y-2">
              <Layers className="w-8 h-8 mx-auto text-stone-300" />
              <p className="text-sm">Tidak ada aset yang sesuai kriteria pencarian.</p>
            </div>
          ) : (
            filteredAssets.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-stone-200/70 bg-stone-50/30 hover:border-stone-300 hover:bg-stone-50/80 transition-all space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-sm sm:text-base text-stone-900">
                      {item.name}
                    </h4>
                    {item.institution && (
                      <p className="text-xs text-stone-500 flex items-center gap-1.5 mt-0.5 font-medium">
                        <Tag className="w-3 h-3 text-[#fe5e37]" />
                        <span>{item.institution}</span>
                      </p>
                    )}
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-base sm:text-lg font-bold font-mono text-stone-900">
                      {formatIdr(item.valueIdr)}
                    </p>
                    {item.originalCurrency && item.originalCurrency !== "IDR" && item.originalValue && (
                      <p className="text-[11px] text-stone-500 font-mono">
                        Nilai Asal: {item.originalValue.toLocaleString()} {item.originalCurrency}
                      </p>
                    )}
                  </div>
                </div>

                {/* Units & Notes */}
                {(item.quantity || item.notes) && (
                  <div className="flex items-center gap-2.5 text-xs text-stone-600 pt-1 flex-wrap">
                    {item.quantity && (
                      <span className="px-2 py-0.5 rounded-md bg-stone-100 border border-stone-200 font-mono text-[11px]">
                        Volume: {item.quantity.toLocaleString()} {item.unit || "unit"}
                      </span>
                    )}
                    {item.notes && (
                      <span className="flex items-center gap-1 text-stone-500 italic text-[11px]">
                        <Info className="w-3 h-3 text-stone-400 shrink-0" />
                        {item.notes}
                      </span>
                    )}
                  </div>
                )}

                {/* Auditability Source Badge */}
                <div className="pt-2 border-t border-stone-200/50 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-stone-500">
                    <FileText className="w-3.5 h-3.5 text-[#fe5e37]" />
                    <span>Sumber Dokumen:</span>
                    <span className="px-2.5 py-0.5 rounded-md bg-orange-50 text-[#fe5e37] font-mono text-[11px] font-semibold border border-orange-200">
                      {item.sourceFile}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-100 bg-stone-50/60 flex items-center justify-between text-xs text-stone-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Verifikasi audit langsung dari berkas asli</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-900 text-white font-semibold hover:bg-stone-800 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
