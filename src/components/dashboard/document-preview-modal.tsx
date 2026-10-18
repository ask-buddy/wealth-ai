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
  Highlighter,
  Loader2,
} from "lucide-react";
import { useScrollLock } from "@/hooks/use-scroll-lock";

export interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string | null;
  preview?: {
    fileName: string;
    mimeType: string;
    dataUrl: string;
  } | null;
  assetInfo?: {
    name: string;
    valueFormatted?: string;
    box_2d?: [number, number, number, number];
  } | null;
}

// In-memory cache to prevent re-querying Gemini for the same asset & file during the session
const boxCache = new Map<string, [number, number, number, number] | null>();

export function DocumentPreviewModal({
  isOpen,
  onClose,
  fileName,
  preview,
  assetInfo,
}: DocumentPreviewModalProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [box2d, setBox2d] = useState<[number, number, number, number] | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [showHighlight, setShowHighlight] = useState<boolean>(true);

  useScrollLock(isOpen);

  const isPdf =
    Boolean(preview?.mimeType?.toLowerCase().includes("pdf")) ||
    Boolean(preview?.dataUrl?.startsWith("data:application/pdf")) ||
    Boolean(fileName?.toLowerCase().endsWith(".pdf"));

  const isImage =
    Boolean(preview?.mimeType?.toLowerCase().includes("image")) ||
    Boolean(preview?.dataUrl?.startsWith("data:image/")) ||
    Boolean(fileName && /\.(png|jpg|jpeg|webp|heic)$/i.test(fileName));

  useEffect(() => {
    if (!isOpen) {
      setZoomLevel(100);
      setBox2d(null);
      setIsLocating(false);
      return;
    }

    setShowHighlight(true);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Handle locating the asset's bounding box on the image
  useEffect(() => {
    if (!isOpen || !isImage || !assetInfo?.name || !preview?.dataUrl) {
      setBox2d(null);
      setIsLocating(false);
      return;
    }

    // 1. If box_2d was already pre-extracted during portfolio analysis
    if (assetInfo.box_2d && Array.isArray(assetInfo.box_2d) && assetInfo.box_2d.length === 4) {
      setBox2d(assetInfo.box_2d);
      setIsLocating(false);
      return;
    }

    // 2. Check in-memory cache
    const cacheKey = `${fileName || preview.fileName}_${assetInfo.name}_${assetInfo.valueFormatted || ""}`;
    if (boxCache.has(cacheKey)) {
      setBox2d(boxCache.get(cacheKey) || null);
      setIsLocating(false);
      return;
    }

    // 3. Otherwise, query Gemini Vision on-demand to locate the row and nominal value
    let cancelled = false;
    setIsLocating(true);
    setBox2d(null);

    fetch("/api/locate-asset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageData: preview.dataUrl,
        mimeType: preview.mimeType,
        assetName: assetInfo.name,
        assetValue: assetInfo.valueFormatted,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Gagal melacak posisi aset");
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        if (data?.box_2d && Array.isArray(data.box_2d) && data.box_2d.length === 4) {
          boxCache.set(cacheKey, data.box_2d);
          setBox2d(data.box_2d);
        } else {
          boxCache.set(cacheKey, null);
          setBox2d(null);
        }
      })
      .catch((err) => {
        console.warn("[DocumentPreviewModal] locate-asset error:", err);
        if (!cancelled) setBox2d(null);
      })
      .finally(() => {
        if (!cancelled) setIsLocating(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, isImage, assetInfo?.name, assetInfo?.valueFormatted, assetInfo?.box_2d, preview?.dataUrl, preview?.mimeType, fileName, preview?.fileName]);

  if (!isOpen || !fileName) return null;

  const handleOpenExternal = () => {
    if (!preview?.dataUrl) return;
    const win = window.open();
    if (win) {
      win.document.write(
        `<title>${fileName}</title><iframe src="${preview.dataUrl}" frameborder="0" style="border:0; top:0; left:0; bottom:0; right:0; width:100%; height:100%;" allowfullscreen></iframe>`,
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/70 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl max-h-[92vh] bg-white rounded-md border border-stone-200 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 overscroll-contain"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="preview-modal-title"
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-stone-200 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-sm bg-[#eef5ff] border border-[#d2e3fc] flex items-center justify-center text-[#1A76FF] shrink-0">
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
              {assetInfo ? (
                <p className="text-[11px] font-medium flex items-center gap-1.5 truncate">
                  {assetInfo.valueFormatted && (
                    <span className="font-bold font-mono text-stone-900 shrink-0">
                      {assetInfo.valueFormatted}
                    </span>
                  )}
                  <span className="truncate text-stone-600">
                    {assetInfo.name}
                  </span>
                </p>
              ) : (
                <p className="text-[11px] text-stone-500 font-medium flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Dokumen Bukti Aset Terverifikasi</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Stabilo Highlighter Toggle Button */}
            {isImage && preview?.dataUrl && assetInfo && (
              <button
                type="button"
                onClick={() => setShowHighlight((prev) => !prev)}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-sm border text-xs font-semibold transition-all cursor-pointer shadow-2xs mr-1 ${
                  showHighlight && box2d
                    ? "bg-[#1A76FF] text-white border-[#1A76FF] shadow-blue-200"
                    : isLocating
                      ? "bg-blue-50 text-[#1A76FF] border-blue-200 animate-pulse"
                      : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
                }`}
                title={
                  showHighlight
                    ? "Klik untuk mematikan stabilo sorotan aset"
                    : "Klik untuk menyalakan stabilo sorotan aset"
                }
              >
                {isLocating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span className="hidden sm:inline">Mendeteksi...</span>
                  </>
                ) : (
                  <>
                    <Highlighter className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">
                      {showHighlight && box2d ? "Stabilo Aktif" : "Stabilo Aset"}
                    </span>
                  </>
                )}
              </button>
            )}

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
                <ExternalLink className="w-3.5 h-3.5 text-[#1A76FF]" />
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
        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-stone-900/90 flex items-center justify-center min-h-[380px] overscroll-contain">
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
                <div
                  className="relative inline-block transition-transform duration-200 origin-center max-w-full"
                  style={{ transform: `scale(${zoomLevel / 100})` }}
                >
                  <img
                    src={preview.dataUrl}
                    alt={fileName}
                    className="max-h-[68vh] w-auto max-w-full object-contain rounded-xs shadow-2xl select-none border border-stone-800 block"
                  />

                  {/* Stabilo Highlighter Transparent Primary Color Overlay */}
                  {showHighlight && box2d && (
                    <div
                      className="absolute pointer-events-none transition-all duration-300 z-10 animate-in fade-in"
                      style={{
                        top: `${Math.max(0, box2d[0] / 10)}%`,
                        left: `${Math.max(0, box2d[1] / 10)}%`,
                        height: `${Math.max(1.5, (box2d[2] - box2d[0]) / 10)}%`,
                        width: `${Math.max(2, (box2d[3] - box2d[1]) / 10)}%`,
                      }}
                    >
                      {/* Paper Stabilo effect: translucent primary blue wash with top/bottom marker edge lines */}
                      <div className="w-full h-full bg-[#1A76FF]/25 border-y-2 border-[#1A76FF] rounded-xs shadow-[0_0_16px_rgba(26,118,255,0.5)] backdrop-contrast-105" />

                      {/* Small badge floating above the highlighter marker */}
                      <div className="absolute -top-5.5 left-0 flex items-center gap-1 px-1.5 py-0.5 rounded-xs bg-[#1A76FF] text-white text-[9px] font-bold font-mono tracking-tight shadow-md whitespace-nowrap">
                        <Highlighter className="w-2.5 h-2.5" />
                        <span>{assetInfo?.name || "Aset Disorot"}</span>
                      </div>
                    </div>
                  )}
                </div>
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
                Berkas <strong>{fileName}</strong> berhasil diaudit dan angkanya
                telah terekam di portofolio Anda. Namun file visualnya telah
                dibersihkan dari RAM browser demi efisiensi memori dan privasi.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-stone-200 bg-white flex items-center justify-between text-xs text-stone-500 shrink-0">
          <div className="font-medium truncate mr-4">
            {isLocating ? (
              <span className="text-[#1A76FF] flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                <span>
                  Mencari dan menstabilo baris nilai untuk{" "}
                  <strong className="text-stone-800">{assetInfo?.name}</strong>...
                </span>
              </span>
            ) : showHighlight && box2d ? (
              <span className="text-stone-700 flex items-center gap-1.5">
                <Highlighter className="w-3.5 h-3.5 text-[#1A76FF] shrink-0" />
                <span>
                  Baris nilai untuk{" "}
                  <strong className="text-[#1A76FF]">{assetInfo?.name}</strong> distabilo
                  transparan (klik tombol Stabilo untuk matikan).
                </span>
              </span>
            ) : (
              <span className="text-stone-400 hidden sm:inline">
                Audit Visual: Periksa kecocokan angka faktual langsung dari dokumen
                aslinya.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-sm bg-[#1A76FF] hover:bg-[#0d5fd9] text-white text-xs font-semibold cursor-pointer transition-all shadow-xs"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
