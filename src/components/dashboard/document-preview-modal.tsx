"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ShieldCheck,
  AlertCircle,
  Download,
} from "lucide-react";

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string | null;
  preview?: {
    fileName: string;
    mimeType: string;
    dataUrl: string;
  } | null;
}

export function DocumentPreviewModal({
  isOpen,
  onClose,
  fileName,
  preview,
}: DocumentPreviewModalProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  useEffect(() => {
    if (!isOpen) {
      setZoomLevel(100);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !fileName) return null;

  const isPdf =
    preview?.mimeType?.toLowerCase().includes("pdf") ||
    preview?.dataUrl?.startsWith("data:application/pdf") ||
    fileName.toLowerCase().endsWith(".pdf");

  const isImage =
    preview?.mimeType?.toLowerCase().includes("image") ||
    preview?.dataUrl?.startsWith("data:image/") ||
    /\.(png|jpg|jpeg|webp|heic)$/i.test(fileName);

  const handleOpenExternal = () => {
    if (!preview?.dataUrl) return;
    const win = window.open();
    if (win) {
      win.document.write(
        `<title>${fileName}</title><iframe src="${preview.dataUrl}" frameborder="0" style="border:0; top:0; left:0; bottom:0; right:0; width:100%; height:100%;" allowfullscreen></iframe>`
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/70 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl max-h-[92vh] bg-white rounded-md border border-stone-200 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="preview-modal-title"
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-stone-200 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-sm bg-[#faf0f3] border border-[#ecd0d8] flex items-center justify-center text-[#80283e] shrink-0">
              {isPdf ? (
                <FileText className="w-4 h-4" />
              ) : (
                <ImageIcon className="w-4 h-4" />
              )}
            </div>
            <div className="min-w-0">
              <h3
                id="preview-modal-title"
                className="font-bold text-sm text-stone-900 truncate font-mono"
              >
                {fileName}
              </h3>
              <p className="text-[11px] text-stone-500 font-medium flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Dokumen Bukti Aset Terverifikasi</span>
                <span className="text-stone-300">•</span>
                <span className="uppercase text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded-xs bg-stone-100 text-stone-600">
                  {isPdf ? "PDF Document" : "Screenshot / Image"}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Zoom Controls for Images */}
            {isImage && preview?.dataUrl && (
              <div className="hidden sm:flex items-center gap-1 mr-2 px-1 py-0.5 rounded-sm bg-stone-100 border border-stone-200">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(50, z - 25))}
                  className="p-1 hover:bg-white rounded-xs text-stone-600 transition-colors cursor-pointer"
                  title="Perkecil"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-mono font-bold text-stone-600 px-1 min-w-[38px] text-center">
                  {zoomLevel}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(200, z + 25))}
                  className="p-1 hover:bg-white rounded-xs text-stone-600 transition-colors cursor-pointer"
                  title="Perbesar"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel(100)}
                  className="p-1 hover:bg-white rounded-xs text-stone-600 transition-colors cursor-pointer"
                  title="Reset Zoom"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {preview?.dataUrl && (
              <button
                type="button"
                onClick={handleOpenExternal}
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-sm border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold transition-all cursor-pointer shadow-2xs mr-1"
                title="Buka di tab baru"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#80283e]" />
                <span>Buka Penuh</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-sm hover:bg-stone-100 text-stone-400 hover:text-stone-700 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Tutup pratinjau"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-stone-900/90 flex items-center justify-center min-h-[380px]">
          {preview?.dataUrl ? (
            isPdf ? (
              <div className="w-full h-[70vh] bg-white rounded-sm overflow-hidden shadow-xl border border-stone-800">
                <iframe
                  src={preview.dataUrl}
                  title={fileName}
                  className="w-full h-full border-0"
                />
              </div>
            ) : (
              <div className="overflow-auto max-h-[72vh] flex items-center justify-center p-2">
                <img
                  src={preview.dataUrl}
                  alt={fileName}
                  style={{ transform: `scale(${zoomLevel / 100})` }}
                  className="max-h-[68vh] w-auto max-w-full object-contain rounded-xs shadow-2xl transition-transform duration-200 select-none border border-stone-800"
                />
              </div>
            )
          ) : (
            <div className="text-center p-8 max-w-md bg-white rounded-sm border border-stone-200 shadow-xl space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 mx-auto flex items-center justify-center text-amber-600">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-stone-900 text-base">
                Pratinjau Tidak Tersedia di Memori
              </h4>
              <p className="text-xs text-stone-500 leading-relaxed font-medium">
                Berkas <strong>{fileName}</strong> berhasil diaudit dan
                angkanya telah terekam di portofolio Anda. Namun file visualnya
                telah dibersihkan dari RAM browser demi efisiensi memori dan
                privasi.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-stone-200 bg-white flex items-center justify-between text-xs text-stone-500 shrink-0">
          <span className="font-medium text-stone-400 hidden sm:inline">
            Audit Visual: Periksa kecocokan angka faktual langsung dari dokumen
            aslinya.
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-sm bg-[#80283e] hover:bg-[#6c1e32] text-white text-xs font-semibold cursor-pointer transition-all shadow-xs"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
