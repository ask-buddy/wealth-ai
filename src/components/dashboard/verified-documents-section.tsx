"use client";

import React, { useState } from "react";
import {
  FileText,
  Image as ImageIcon,
  Eye,
  X,
  Trash2,
  AlertTriangle,
  FolderOpen,
  ExternalLink,
  ShieldCheck,
  Check,
} from "lucide-react";
import { WealthPortfolio } from "@/types/wealth";
import { formatCurrencyValue } from "@/lib/formatters";
import { useScrollLock } from "@/hooks/use-scroll-lock";

interface VerifiedDocumentsSectionProps {
  portfolio: WealthPortfolio;
  onPreviewFile?: (
    fileName: string,
    assetInfo?: {
      name?: string;
      valueFormatted?: string;
      box_2d?: [number, number, number, number];
      isDocumentSummary?: boolean;
    } | null,
  ) => void;
  onDeleteDocument?: (fileName: string) => void;
  isPrivate?: boolean;
  currencyMode?: "IDR" | "USD";
  usdRate?: number;
}

export function VerifiedDocumentsSection({
  portfolio,
  onPreviewFile,
  onDeleteDocument,
  isPrivate = false,
  currencyMode = "IDR",
  usdRate,
}: VerifiedDocumentsSectionProps) {
  const [docToDelete, setDocToDelete] = useState<string | null>(null);
  const [deletedToast, setDeletedToast] = useState<string | null>(null);

  const sourceFiles = portfolio.sourceFiles || [];

  if (sourceFiles.length === 0) return null;

  // Handle document deletion
  const handleConfirmDelete = () => {
    if (!docToDelete) return;
    const fileName = docToDelete;
    onDeleteDocument?.(fileName);
    setDocToDelete(null);
    setDeletedToast(`Dokumen "${fileName}" dan aset terkait telah dihapus.`);
    setTimeout(() => {
      setDeletedToast(null);
    }, 3500);
  };

  // Calculate impact for the confirmation dialog
  const targetAssets = docToDelete
    ? portfolio.assets.filter((a) => a.sourceFile === docToDelete)
    : [];
  const targetLiabilities = docToDelete
    ? (portfolio.liabilities || []).filter((l) => l.sourceFile === docToDelete)
    : [];
  const targetTotalIdr = targetAssets.reduce(
    (sum, a) => sum + (Number(a.valueIdr) || 0),
    0,
  );

  return (
    <div className="rounded-sm border border-stone-200 bg-white p-6 sm:p-8 space-y-6 luxury-card relative overflow-hidden">
      {/* Toast Notification */}
      {deletedToast && (
        <div className="p-3.5 rounded-sm bg-stone-900 text-white text-xs flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
          <span className="font-medium">{deletedToast}</span>
          <span className="text-[11px] text-emerald-400 font-mono font-bold">
            Total Portofolio Diperbarui ✓
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-[#1A76FF]">
          <div className="w-8 h-8 rounded-sm bg-[#eef5ff] border border-[#d2e3fc] flex items-center justify-center text-[#1A76FF] shrink-0">
            <FolderOpen className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-stone-900 font-play">
              Dokumen Sumber Terverifikasi
            </h2>
            <p className="text-xs text-stone-500 font-medium">
              {sourceFiles.length} berkas bukti audit fisik & digital terdata
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-stone-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Verifikasi langsung dari data biner berkas</span>
        </div>
      </div>

      {/* Gallery Grid (Laptop/Desktop: 4-5 col, Tablet: 3 col, Mobile: 2 col) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4">
        {sourceFiles.map((fileName, idx) => {
          const isPdf = fileName.toLowerCase().endsWith(".pdf");
          const preview = portfolio.documentPreviews?.[fileName];

          // Assets and liabilities associated with this file
          const associatedAssets = portfolio.assets.filter(
            (a) => a.sourceFile === fileName,
          );
          const associatedLiabilities = (portfolio.liabilities || []).filter(
            (l) => l.sourceFile === fileName,
          );
          const fileTotalIdr = associatedAssets.reduce(
            (sum, a) => sum + (Number(a.valueIdr) || 0),
            0,
          );

          const ext = fileName.split(".").pop()?.toUpperCase() || (isPdf ? "PDF" : "IMG");

          return (
            <div
              key={`${fileName}-${idx}`}
              onClick={() =>
                onPreviewFile?.(fileName, {
                  name:
                    associatedAssets.length > 0
                      ? `${associatedAssets.length} aset terdata`
                      : associatedLiabilities.length > 0
                        ? `${associatedLiabilities.length} liabilitas`
                        : "Dokumen Sumber",
                  valueFormatted:
                    fileTotalIdr > 0
                      ? formatCurrencyValue(
                          fileTotalIdr,
                          currencyMode,
                          isPrivate,
                          usdRate,
                        )
                      : undefined,
                  isDocumentSummary: true,
                })
              }
              className="group relative flex flex-col rounded-sm border border-stone-200 bg-white hover:border-[#1A76FF]/50 hover:shadow-md transition-all overflow-hidden cursor-pointer select-none luxury-card"
              title={`Klik untuk membuka pratinjau ${fileName}`}
            >
              {/* Thumbnail Area (Laptop Folder / Gallery Preview Box) */}
              <div className="relative aspect-[4/3] bg-stone-100 flex items-center justify-center overflow-hidden border-b border-stone-100">
                {/* Real Image Preview Thumbnail (if in memory) */}
                {!isPdf && preview?.dataUrl ? (
                  <img
                    src={preview.dataUrl}
                    alt={fileName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : isPdf ? (
                  /* Stylized PDF Document Mockup */
                  <div className="w-full h-full bg-gradient-to-br from-stone-50 to-stone-100 flex flex-col items-center justify-center p-3 relative group-hover:scale-105 transition-transform duration-300">
                    <div className="w-14 h-18 bg-white rounded-xs border border-stone-200 shadow-xs flex flex-col items-center justify-center p-2 space-y-1 relative">
                      <div className="w-3 h-3 rounded-full bg-rose-100 flex items-center justify-center">
                        <FileText className="w-2.5 h-2.5 text-rose-600" />
                      </div>
                      <div className="w-8 h-1 bg-stone-200 rounded-full" />
                      <div className="w-6 h-1 bg-stone-200 rounded-full" />
                      <div className="w-7 h-1 bg-stone-200 rounded-full" />
                      <span className="text-[8px] font-bold font-mono text-rose-600 pt-0.5">
                        PDF
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Stylized Image File Mockup */
                  <div className="w-full h-full bg-gradient-to-br from-stone-50 to-stone-100 flex flex-col items-center justify-center p-3 text-stone-400 group-hover:scale-105 transition-transform duration-300">
                    <div className="w-14 h-18 bg-white rounded-xs border border-stone-200 shadow-xs flex flex-col items-center justify-center p-2 space-y-1.5">
                      <ImageIcon className="w-5 h-5 text-[#1A76FF]" />
                      <div className="w-8 h-1 bg-stone-200 rounded-full" />
                      <span className="text-[8px] font-bold font-mono text-[#1A76FF]">
                        {ext}
                      </span>
                    </div>
                  </div>
                )}

                {/* Format Badge (Top Left) */}
                <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-xs text-[9px] font-mono font-bold tracking-wider bg-stone-900/75 text-white backdrop-blur-xs">
                  {ext}
                </span>

                {/* Remove Icon Button (Top Right) */}
                {onDeleteDocument && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDocToDelete(fileName);
                    }}
                    className="absolute top-2 right-2 w-6 h-6 rounded-sm bg-white/95 hover:bg-rose-50 text-stone-400 hover:text-rose-600 border border-stone-200 hover:border-rose-300 flex items-center justify-center shadow-xs transition-colors z-20 cursor-pointer"
                    title={`Hapus berkas "${fileName}" dari portofolio`}
                    aria-label={`Hapus ${fileName}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Hover Eye Overlay */}
                <div className="absolute inset-0 bg-stone-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-semibold backdrop-blur-2xs">
                  <Eye className="w-4 h-4 text-white" />
                  <span className="text-[11px]">Buka Berkas</span>
                </div>
              </div>

              {/* Bottom Info Area */}
              <div className="p-3 bg-white flex flex-col justify-between flex-1 gap-1.5">
                <div>
                  <h4
                    className="font-bold font-mono text-xs text-stone-900 truncate group-hover:text-[#1A76FF] transition-colors"
                    title={fileName}
                  >
                    {fileName}
                  </h4>
                  <p className="text-[10px] text-stone-500 font-medium truncate mt-0.5">
                    {associatedAssets.length > 0
                      ? `${associatedAssets.length} aset terdata`
                      : associatedLiabilities.length > 0
                        ? `${associatedLiabilities.length} liabilitas`
                        : "Dokumen audit"}
                  </p>
                </div>

                {fileTotalIdr > 0 && (
                  <div className="pt-1.5 border-t border-stone-100 flex items-center justify-between text-[11px]">
                    <span className="text-[10px] text-stone-400 uppercase font-medium">
                      Nilai
                    </span>
                    <span className="font-bold font-mono text-stone-900 tabular-nums">
                      {formatCurrencyValue(
                        fileTotalIdr,
                        currencyMode,
                        isPrivate,
                        usdRate,
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation Modal for Document Deletion */}
      {docToDelete && (
        <DeleteDocumentModal
          isOpen={!!docToDelete}
          onClose={() => setDocToDelete(null)}
          onConfirm={handleConfirmDelete}
          fileName={docToDelete}
          assetCount={targetAssets.length}
          liabilityCount={targetLiabilities.length}
          totalValueIdr={targetTotalIdr}
          currencyMode={currencyMode}
          isPrivate={isPrivate}
          usdRate={usdRate}
        />
      )}
    </div>
  );
}

interface DeleteDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  fileName: string;
  assetCount: number;
  liabilityCount: number;
  totalValueIdr: number;
  currencyMode?: "IDR" | "USD";
  isPrivate?: boolean;
  usdRate?: number;
}

function DeleteDocumentModal({
  isOpen,
  onClose,
  onConfirm,
  fileName,
  assetCount,
  liabilityCount,
  totalValueIdr,
  currencyMode = "IDR",
  isPrivate = false,
  usdRate,
}: DeleteDocumentModalProps) {
  useScrollLock(isOpen);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-stone-900/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-md border border-stone-200 shadow-2xl p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-150 overscroll-contain"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-doc-title"
      >
        <div className="flex items-start justify-between">
          <div className="w-11 h-11 rounded-sm bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
            <Trash2 className="w-5 h-5" />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 transition-colors p-1 rounded-sm cursor-pointer"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          <h3
            id="delete-doc-title"
            className="text-lg font-bold text-stone-900 tracking-tight"
          >
            Hapus Dokumen Sumber?
          </h3>
          <p className="text-xs sm:text-sm text-stone-500 leading-relaxed font-medium">
            Anda akan menghapus berkas{" "}
            <strong className="text-stone-900 font-mono font-semibold">
              {fileName}
            </strong>
            .
          </p>
        </div>

        {/* Impact Warning Box */}
        <div className="p-3.5 rounded-sm bg-rose-50/70 border border-rose-200 space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-rose-900">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Dampak Penghapusan pada Portofolio:</span>
          </div>
          <ul className="text-rose-800 space-y-1 pl-6 list-disc font-medium">
            {assetCount > 0 && (
              <li>
                <strong>{assetCount} aset</strong> terkait akan otomatis dikeluarkan
                dari portofolio (senilai{" "}
                <strong className="font-mono">
                  {formatCurrencyValue(
                    totalValueIdr,
                    currencyMode,
                    isPrivate,
                    usdRate,
                  )}
                </strong>
                ).
              </li>
            )}
            {liabilityCount > 0 && (
              <li>
                <strong>{liabilityCount} liabilitas</strong> terkait akan dihapus.
              </li>
            )}
            <li>
              Total kekayaan bersih dan persentase alokasi akan dihitung ulang secara{" "}
              <strong>real-time</strong> tanpa perlu scan ulang.
            </li>
          </ul>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-sm border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 font-semibold text-xs transition-all cursor-pointer shadow-2xs"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 rounded-sm bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-all cursor-pointer shadow-xs inline-flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Ya, Hapus Dokumen & Aset</span>
          </button>
        </div>
      </div>
    </div>
  );
}
