"use client";

import React, { useState, useEffect } from "react";
import { formatIdr, formatCurrencyValue } from "@/lib/formatters";
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
  Trash2,
} from "lucide-react";
import { useScrollLock } from "@/hooks/use-scroll-lock";

interface AssetDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: AssetCategory | null;
  assets: ExtractedAssetItem[];
  liabilities: ExtractedLiabilityItem[];
  isPrivate?: boolean;
  selectedLiability?: ExtractedLiabilityItem | null;
  currencyMode?: "IDR" | "USD";
  onPreviewFile?: (fileName: string) => void;
  usdRate?: number;
  onDeleteAsset?: (assetId: string) => void;
  onDeleteLiability?: (liabilityId: string) => void;
}

export function AssetDetailModal({
  isOpen,
  onClose,
  category,
  assets,
  liabilities,
  isPrivate = false,
  selectedLiability,
  currencyMode = "IDR",
  onPreviewFile,
  usdRate,
  onDeleteAsset,
  onDeleteLiability,
}: AssetDetailModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletedToast, setDeletedToast] = useState<string | null>(null);

  const handleDeleteItem = (id: string, name: string) => {
    onDeleteAsset?.(id);
    setConfirmDeleteId(null);
    setDeletedToast(`"${name}" telah dihapus dari portofolio`);
    setTimeout(() => {
      setDeletedToast(null);
    }, 3000);
  };

  const handleDeleteLiability = (id: string) => {
    onDeleteLiability?.(id);
    setConfirmDeleteId(null);
    onClose();
  };

  useScrollLock(isOpen);

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
      ? currentCategoryConfig.label
      : "Rincian Semua Aset";

  // Filter assets
  const filteredAssets = assets.filter((item) => {
    const matchesCategory = category ? item.category === category : true;
    const matchesSearch =
      searchQuery.trim() === "" ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.institution &&
        item.institution.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.sourceFile.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categoryTotal = filteredAssets.reduce(
    (sum, item) => sum + (Number(item.valueIdr) || 0),
    0,
  );

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getFileIcon = (fileName: string) => {
    const lower = fileName.toLowerCase();
    if (lower.endsWith(".pdf"))
      return <FileText className="w-3.5 h-3.5 text-stone-400" />;
    return <ImageIcon className="w-3.5 h-3.5 text-stone-400" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-sm border border-stone-200 bg-white overflow-hidden z-10 luxury-card">
        {/* Header */}
        <div className="p-6 border-b border-stone-100 flex items-start justify-between gap-4 bg-stone-50/70">
          <div className="space-y-1">
            <h3 className="text-lg sm:text-xl font-bold tracking-tight text-stone-900 leading-snug">
              {modalTitle}
            </h3>
            <p className="text-xs text-stone-500 font-medium">
              {isLiabilityMode ? (
                <span>
                  Audit Hutang • Nominal:{" "}
                  <strong className="font-bold text-rose-600 font-mono tabular-nums">
                    {formatCurrencyValue(
                      selectedLiability?.amountIdr || 0,
                      currencyMode,
                      isPrivate,
                      usdRate,
                    )}
                  </strong>
                </span>
              ) : (
                <span>
                  {filteredAssets.length} aset terdata • Subtotal:{" "}
                  <strong className="font-bold text-stone-900 font-mono tabular-nums">
                    {formatCurrencyValue(
                      categoryTotal,
                      currencyMode,
                      isPrivate,
                      usdRate,
                    )}
                  </strong>
                </span>
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 -mr-1 -mt-1 rounded-sm text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer shrink-0"
            title="Tutup dialog"
            aria-label="Tutup dialog"
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
        <div className="flex-1 overflow-y-auto p-6 space-y-3.5 overscroll-contain">
          {deletedToast && (
            <div className="p-3 rounded-sm bg-stone-900 text-white text-xs flex items-center justify-between shadow-md animate-in fade-in slide-in-from-top-2 duration-200">
              <span className="font-medium">{deletedToast}</span>
              <span className="text-[11px] text-emerald-400 font-mono">
                Portofolio diperbarui ✓
              </span>
            </div>
          )}
          {/* LIABILITY DETAIL VIEW */}
          {isLiabilityMode && selectedLiability && (
            <div className="space-y-4">
              <div className="p-5 rounded-sm border border-rose-200 bg-rose-50/30 space-y-3">
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
                      {formatCurrencyValue(
                        selectedLiability.amountIdr,
                        currencyMode,
                        isPrivate,
                        usdRate,
                      )}
                    </p>
                  </div>
                </div>

                {selectedLiability.lender && (
                  <div className="flex items-center gap-2 text-xs text-stone-700 pt-2 border-t border-rose-100">
                    <Tag className="w-3.5 h-3.5 text-rose-500" />
                    <span>
                      Lembaga / Bank:{" "}
                      <strong>{selectedLiability.lender}</strong>
                    </span>
                  </div>
                )}

                {selectedLiability.notes && (
                  <div className="flex items-center gap-2 text-xs text-stone-600">
                    <Info className="w-3.5 h-3.5 text-stone-400" />
                    <span>
                      Catatan: <em>{selectedLiability.notes}</em>
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-stone-600 pt-2 border-t border-rose-100">
                  <FileText className="w-3.5 h-3.5 text-stone-400" />
                  <span>Berkas Audit:</span>
                  <button
                    type="button"
                    onClick={() =>
                      onPreviewFile?.(selectedLiability.sourceFile)
                    }
                    className="px-2 py-0.5 rounded-sm bg-white hover:bg-rose-50 border border-rose-200 hover:border-rose-300 font-mono text-[11px] text-stone-800 hover:text-[#80283e] cursor-pointer inline-flex items-center gap-1.5 transition-all shadow-2xs"
                    title="Klik untuk membuka pratinjau dokumen"
                  >
                    <span>{selectedLiability.sourceFile}</span>
                    <ExternalLink className="w-3 h-3 text-stone-400" />
                  </button>
                </div>

                {onDeleteLiability && (
                  <div className="pt-2 border-t border-rose-100">
                    {confirmDeleteId === selectedLiability.id ? (
                      <div className="p-3 rounded-sm bg-white border border-rose-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
                        <span className="text-xs text-rose-800 font-medium">
                          Yakin ingin menghapus kewajiban ini dari portofolio?
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteLiability(selectedLiability.id)
                            }
                            className="px-3 py-1 text-xs font-bold text-white bg-[#80283e] hover:bg-[#6c1e32] rounded-sm transition-colors cursor-pointer"
                          >
                            Ya, Hapus
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-3 py-1 text-xs font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-sm transition-colors cursor-pointer"
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(selectedLiability.id)}
                        className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 hover:underline cursor-pointer pt-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus Kewajiban Ini dari Portofolio</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ASSET ITEMS LIST */}
          {!isLiabilityMode && filteredAssets.length === 0 ? (
            <div className="py-12 text-center text-stone-400 space-y-2">
              <Layers className="w-8 h-8 mx-auto text-stone-300" />
              <p className="text-sm">
                Tidak ada aset yang sesuai kriteria pencarian.
              </p>
            </div>
          ) : (
            !isLiabilityMode &&
            filteredAssets.map((item) => (
              <div
                key={item.id}
                className="p-4 sm:p-4.5 rounded-sm border border-stone-200 bg-stone-50/30 hover:border-stone-300 hover:bg-stone-50/80 transition-all space-y-3 luxury-card"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1 flex-1 min-w-0">
                    <h4 className="font-bold text-sm sm:text-base text-stone-900 leading-snug">
                      {item.name}
                    </h4>

                    {item.institution && (
                      <p className="text-xs text-stone-500 flex items-center gap-1.5 font-medium">
                        <Tag className="w-3 h-3 text-[#80283e]" />
                        <span>Institusi: {item.institution}</span>
                      </p>
                    )}
                  </div>

                  <div className="text-left sm:text-right shrink-0 sm:pt-0.5">
                    <p className="text-base sm:text-lg font-bold font-mono text-stone-900 tabular-nums leading-snug">
                      {formatCurrencyValue(
                        item.valueIdr,
                        currencyMode,
                        isPrivate,
                        usdRate,
                      )}
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

                {/* Inline Confirmation for Deleting This Item */}
                {confirmDeleteId === item.id && (
                  <div className="p-3 rounded-sm bg-rose-50/90 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="text-xs text-rose-900">
                      <span className="font-bold">Hapus aset ini?</span>
                      <p className="text-[11px] text-rose-700">
                        Item ini akan dikeluarkan dari perhitungan total
                        kekayaan portofolio.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id, item.name)}
                        className="px-3 py-1 text-xs font-bold text-white bg-[#80283e] hover:bg-[#6c1e32] rounded-sm transition-colors cursor-pointer shadow-2xs"
                      >
                        Ya, Hapus
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2.5 py-1 text-xs font-medium text-stone-600 bg-white hover:bg-stone-100 border border-stone-200 rounded-sm transition-colors cursor-pointer"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}

                {/* Units & Notes */}
                {(item.quantity || item.notes) && (
                  <div className="flex items-center gap-2.5 text-xs text-stone-600 pt-1 flex-wrap">
                    {item.quantity && (
                      <span className="px-2 py-0.5 rounded-sm bg-stone-100 border border-stone-200 font-mono text-[11px] text-stone-800">
                        Volume: {item.quantity.toLocaleString()}{" "}
                        {item.unit || "unit"}
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

                {/* Card Footer: Berkas Sumber (Left) & Actions [Copy, X] (Right) */}
                <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-[11px] text-stone-500 flex-wrap gap-2">
                  <div className="flex items-center gap-1.5">
                    {getFileIcon(item.sourceFile)}
                    <span className="text-stone-400">Berkas Sumber:</span>
                    <button
                      type="button"
                      onClick={() => onPreviewFile?.(item.sourceFile)}
                      className="font-mono font-semibold text-stone-800 hover:text-[#80283e] px-2 py-0.5 rounded-sm bg-[#faf0f3] hover:bg-white border border-[#ecd0d8] hover:border-[#80283e]/50 text-[10px] cursor-pointer inline-flex items-center gap-1 transition-all shadow-2xs"
                      title="Klik untuk membuka pratinjau dokumen"
                    >
                      <span>{item.sourceFile}</span>
                      <ExternalLink className="w-2.5 h-2.5 text-stone-400" />
                    </button>
                  </div>

                  {/* Actions: Copy & Delete Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(
                          item.id,
                          `${item.name} - ${formatCurrencyValue(item.valueIdr, currencyMode, false, usdRate)} (${item.sourceFile})`,
                        )
                      }
                      className="p-1 rounded-sm text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                      title="Salin rincian item"
                      aria-label="Salin rincian item"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {onDeleteAsset && (
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmDeleteId(
                            confirmDeleteId === item.id ? null : item.id,
                          )
                        }
                        className="p-1 rounded-sm text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Hapus aset ini dari perhitungan portofolio"
                        aria-label={`Hapus ${item.name}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
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
            className="px-4 py-2 rounded-sm bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
