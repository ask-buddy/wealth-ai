"use client";

import React, { useState, useEffect } from "react";
import { formatIdr } from "@/lib/formatters";
import { CATEGORY_CONFIG } from "@/lib/math";
import {
  AssetCategory,
  ExtractedAssetItem,
  ExtractedLiabilityItem,
} from "@/types/wealth";
import {
  X,
  FileText,
  Search,
  ShieldCheck,
  Tag,
  Info,
  Layers,
  Copy,
  Check,
  FileCode,
  Image as ImageIcon,
  ExternalLink,
} from "lucide-react";

interface AssetDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: AssetCategory | null;
  assets: ExtractedAssetItem[];
  liabilities: ExtractedLiabilityItem[];
  isPrivate?: boolean;
  selectedLiability?: ExtractedLiabilityItem | null;
}

export function AssetDetailModal({
  isOpen,
  onClose,
  category,
  assets,
  liabilities,
  isPrivate = false,
  selectedLiability,
}: AssetDetailModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isLiabilityMode = Boolean(selectedLiability);

  const currentCategoryConfig = category ? CATEGORY_CONFIG[category] : null;
  const modalTitle = isLiabilityMode
    ? "Rincian Liabilitas & Kewajiban"
    : currentCategoryConfig
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

  const categoryTotal = filteredAssets.reduce(
    (sum, item) => sum + (Number(item.valueIdr) || 0),
    0
  );

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getFileIcon = (fileName: string) => {
    const lower = fileName.toLowerCase();
    if (lower.endsWith(".pdf")) return <FileText className="w-3.5 h-3.5 text-rose-500" />;
    return <ImageIcon className="w-3.5 h-3.5 text-blue-500" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl border border-stone-200/90 bg-white shadow-2xl overflow-hidden z-10 luxury-card">
        {/* Header */}
        <div className="p-6 border-b border-stone-100 flex items-center justify-between gap-4 bg-stone-50/70">
          <div className="flex items-center gap-3">
            {currentCategoryConfig && (
              <span
                className="w-4 h-4 rounded-full shadow-2xs"
                style={{ backgroundColor: currentCategoryConfig.color }}
              />
            )}
            {isLiabilityMode && (
              <span className="w-4 h-4 rounded-full bg-rose-500 shadow-2xs" />
            )}
            <div>
              <h3 className="text-lg sm:text-xl font-bold tracking-tight text-stone-900">
                {modalTitle}
              </h3>
              <p className="text-xs text-stone-500 font-medium">
                {isLiabilityMode ? (
                  <span>
                    Audit Hutang • Nominal:{" "}
                    <strong className="font-bold text-rose-600 font-mono tabular-nums">
                      {formatIdr(selectedLiability?.amountIdr || 0, isPrivate)}
                    </strong>
                  </span>
                ) : (
                  <span>
                    {filteredAssets.length} aset terdata • Subtotal:{" "}
                    <strong className="font-bold text-stone-900 font-mono tabular-nums">
                      {formatIdr(categoryTotal, isPrivate)}
                    </strong>
                  </span>
                )}
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

        {/* Search Bar (Only in Asset Mode) */}
        {!isLiabilityMode && (
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
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-xs text-stone-400 hover:text-stone-700 font-medium mr-2 cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3.5">
          {/* LIABILITY DETAIL VIEW */}
          {isLiabilityMode && selectedLiability && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl border border-rose-200/80 bg-rose-50/30 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">
                      Nama Liabilitas
                    </span>
                    <h4 className="text-lg font-bold text-stone-900 mt-0.5">
                      {selectedLiability.name}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-stone-400 uppercase tracking-wider">
                      Sisa Pokok
                    </span>
                    <p className="text-xl font-bold font-mono text-rose-600 tabular-nums">
                      {formatIdr(selectedLiability.amountIdr, isPrivate)}
                    </p>
                  </div>
                </div>

                {selectedLiability.lender && (
                  <div className="flex items-center gap-2 text-xs text-stone-700 pt-2 border-t border-rose-100">
                    <Tag className="w-3.5 h-3.5 text-rose-500" />
                    <span>Lembaga / Bank: <strong>{selectedLiability.lender}</strong></span>
                  </div>
                )}

                {selectedLiability.notes && (
                  <div className="flex items-center gap-2 text-xs text-stone-600">
                    <Info className="w-3.5 h-3.5 text-stone-400" />
                    <span>Catatan: <em>{selectedLiability.notes}</em></span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-stone-600 pt-2 border-t border-rose-100">
                  <FileText className="w-3.5 h-3.5 text-rose-500" />
                  <span>Berkas Audit:</span>
                  <span className="px-2.5 py-1 rounded-md bg-white border border-rose-200 font-mono text-[11px] text-stone-800">
                    {selectedLiability.sourceFile}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ASSET ITEMS LIST */}
          {!isLiabilityMode && filteredAssets.length === 0 ? (
            <div className="py-12 text-center text-stone-400 space-y-2">
              <Layers className="w-8 h-8 mx-auto text-stone-300" />
              <p className="text-sm">Tidak ada aset yang sesuai kriteria pencarian.</p>
            </div>
          ) : (
            !isLiabilityMode &&
            filteredAssets.map((item) => (
              <div
                key={item.id}
                className="p-4 sm:p-4.5 rounded-2xl border border-stone-200/70 bg-stone-50/30 hover:border-stone-300 hover:bg-stone-50/80 transition-all space-y-3 luxury-card"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm sm:text-base text-stone-900">
                        {item.name}
                      </h4>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            item.id,
                            `${item.name} - ${formatIdr(item.valueIdr)} (${item.sourceFile})`
                          )
                        }
                        className="p-1 rounded text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
                        title="Salin rincian item"
                      >
                        {copiedId === item.id ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>

                    {item.institution && (
                      <p className="text-xs text-stone-500 flex items-center gap-1.5 font-medium">
                        <Tag className="w-3 h-3 text-[#fe5e37]" />
                        <span>Institusi: {item.institution}</span>
                      </p>
                    )}
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-base sm:text-lg font-bold font-mono text-stone-900 tabular-nums">
                      {formatIdr(item.valueIdr, isPrivate)}
                    </p>
                    {item.originalCurrency &&
                      item.originalCurrency !== "IDR" &&
                      item.originalValue && (
                        <p className="text-[11px] text-stone-500 font-mono">
                          Nilai Asal: {item.originalValue.toLocaleString()}{" "}
                          {item.originalCurrency}
                        </p>
                      )}
                  </div>
                </div>

                {/* Units & Notes */}
                {(item.quantity || item.notes) && (
                  <div className="flex items-center gap-2.5 text-xs text-stone-600 pt-1 flex-wrap">
                    {item.quantity && (
                      <span className="px-2 py-0.5 rounded-md bg-stone-100 border border-stone-200 font-mono text-[11px] text-stone-800">
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

                {/* Audit Source Badge */}
                <div className="pt-2 border-t border-stone-200/50 flex items-center justify-between text-[11px] text-stone-500 flex-wrap gap-2">
                  <div className="flex items-center gap-1.5">
                    {getFileIcon(item.sourceFile)}
                    <span className="text-stone-400">Berkas Sumber:</span>
                    <span className="font-mono font-semibold text-stone-800 px-2 py-0.5 rounded-md bg-orange-50/80 border border-orange-200/60 text-[10px]">
                      {item.sourceFile}
                    </span>
                  </div>

                  <span className="text-[10px] text-emerald-700 font-medium inline-flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    Terverifikasi In-Memory
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-100 bg-stone-50/60 flex items-center justify-between text-xs text-stone-500">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Verifikasi audit langsung dari data biner dokumen</span>
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
