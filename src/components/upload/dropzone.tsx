"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Upload,
  FileText,
  Image as ImageIcon,
  Trash2,
  Sparkles,
  AlertCircle,
  XCircle,
  Scan,
  RefreshCw,
  X,
  Loader2,
} from "lucide-react";
import { UploadedFileItem, WealthPortfolio } from "@/types/wealth";
import { calculatePortfolio } from "@/lib/math";
import { savePortfolioToStorage } from "@/lib/storage";

interface DropzoneProps {
  onAnalysisSuccess: (portfolio: WealthPortfolio) => void;
  existingPortfolio?: WealthPortfolio | null;
  isAddingMore?: boolean;
  onCancel?: () => void;
}

export function DocumentDropzone({
  onAnalysisSuccess,
  existingPortfolio,
  isAddingMore = false,
  onCancel,
}: DropzoneProps) {
  const [files, setFiles] = useState<UploadedFileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeScanFileIndex, setActiveScanFileIndex] = useState(0);
  const [scanProgress, setScanProgress] = useState(15);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cycling animation when scanning is active
  useEffect(() => {
    if (!isAnalyzing) {
      setScanProgress(0);
      setActiveScanFileIndex(0);
      return;
    }

    setScanProgress(12);

    const progressInterval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 92) return 92; // hold at 92 until completed
        return prev + 3;
      });
    }, 600);

    const fileCycleInterval = setInterval(() => {
      setActiveScanFileIndex((prev) =>
        files.length > 0 ? (prev + 1) % files.length : 0
      );
    }, 2000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(fileCycleInterval);
    };
  }, [isAnalyzing, files.length]);

  const processFile = async (file: File): Promise<UploadedFileItem> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          fileName: file.name,
          mimeType:
            file.type ||
            (file.name.endsWith(".pdf") ? "application/pdf" : "image/jpeg"),
          size: file.size,
          base64Data: reader.result as string,
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setErrorMessage(null);

    const newFiles: UploadedFileItem[] = [];
    const validTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
    ];

    try {
      for (let i = 0; i < fileList.length; i++) {
        const f = fileList[i];
        const isPdf = f.name.toLowerCase().endsWith(".pdf");
        const isImage = f.type.startsWith("image/");

        if (!isPdf && !isImage && !validTypes.includes(f.type)) {
          setErrorMessage(
            `Berkas "${f.name}" tidak didukung. Harap unggah dokumen PDF atau gambar (PNG/JPG).`
          );
          continue;
        }

        // Limit size per file: 20MB
        if (f.size > 20 * 1024 * 1024) {
          setErrorMessage(
            `Berkas "${f.name}" melebihi batas 20MB. Harap perkecil ukuran berkas.`
          );
          continue;
        }

        const processed = await processFile(f);
        newFiles.push(processed);
      }

      setFiles((prev) => [...prev, ...newFiles]);
    } catch (err) {
      console.error(err);
      setErrorMessage("Gagal memproses berkas di browser.");
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleCancelAnalysis = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsAnalyzing(false);
    setAnalysisStep("");
    setErrorMessage("Pemindaian dokumen telah dibatalkan.");
  };

  const handleStartAnalysis = async () => {
    if (files.length === 0) return;
    setIsAnalyzing(true);
    setErrorMessage(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Extended client timeout (180 seconds / 3 minutes)
    const timeoutId = setTimeout(() => {
      controller.abort("TIMEOUT");
    }, 180000);

    try {
      setAnalysisStep("Mempersiapkan dokumen in-memory...");
      await new Promise((r) => setTimeout(r, 400));

      setAnalysisStep("Memindai dokumen & mengekstrak data aset...");

      const payload = {
        files: files.map((f) => ({
          fileName: f.fileName,
          mimeType: f.mimeType,
          base64Data: f.base64Data,
        })),
      };

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      let json: any = null;
      try {
        json = await res.json();
      } catch {
        const text = await res.text().catch(() => "");
        if (
          res.status === 530 ||
          text.includes("530") ||
          text.toLowerCase().includes("cloudflare") ||
          text.toLowerCase().includes("tunnel error")
        ) {
          throw new Error("Servernya lagi mati bang, besok lagi gwa nyalain wkwkwkw");
        }
        throw new Error("Gagal memproses dokumen dari server.");
      }

      if (!res.ok || !json.success) {
        const errorMsg = json.error || "Gagal memproses dokumen.";
        if (
          errorMsg.includes("530") ||
          errorMsg.toLowerCase().includes("cloudflare") ||
          errorMsg.toLowerCase().includes("tunnel error")
        ) {
          throw new Error("Servernya lagi mati bang, besok lagi gwa nyalain wkwkwkw");
        }
        throw new Error(errorMsg);
      }

      setAnalysisStep(
        existingPortfolio && isAddingMore
          ? "Menggabungkan dokumen baru & mengkalkulasi ulang alokasi aset..."
          : "Mengkalkulasi alokasi 8 kategori aset..."
      );
      setScanProgress(100);
      const fileNames = files.map((f) => f.fileName);

      let finalPortfolio: WealthPortfolio;
      if (existingPortfolio && isAddingMore) {
        // Extract all existing assets
        const existingAssets = existingPortfolio.assets || [];
        const newAssets = json.data.assets || [];

        // Merge assets avoiding identical duplicates
        const mergedAssets = [...existingAssets];
        for (const n of newAssets) {
          const isDup = mergedAssets.some(
            (e) =>
              e.sourceFile.trim().toLowerCase() ===
                n.sourceFile.trim().toLowerCase() &&
              e.name.trim().toLowerCase() === n.name.trim().toLowerCase() &&
              e.valueIdr === n.valueIdr
          );
          if (!isDup) {
            mergedAssets.push(n);
          }
        }

        // Merge liabilities avoiding duplicates
        const existingLiabilities = existingPortfolio.liabilities || [];
        const newLiabilities = json.data.liabilities || [];
        const mergedLiabilities = [...existingLiabilities];
        for (const n of newLiabilities) {
          const isDup = mergedLiabilities.some(
            (e) =>
              e.sourceFile.trim().toLowerCase() ===
                n.sourceFile.trim().toLowerCase() &&
              e.name.trim().toLowerCase() === n.name.trim().toLowerCase() &&
              e.amountIdr === n.amountIdr
          );
          if (!isDup) {
            mergedLiabilities.push(n);
          }
        }

        const combinedFiles = Array.from(
          new Set([
            ...(existingPortfolio.sourceFiles || []),
            ...fileNames,
          ])
        );

        const mergedRawData: any = {
          currency: "IDR",
          assets: mergedAssets,
          liabilities: mergedLiabilities,
          keyHighlights: json.data.keyHighlights || existingPortfolio.keyHighlights || [],
          executiveSummary:
            json.data.executiveSummary || existingPortfolio.executiveSummary,
        };

        finalPortfolio = calculatePortfolio(mergedRawData, combinedFiles);
      } else {
        finalPortfolio = calculatePortfolio(json.data, fileNames);
      }

      // Attach document previews for interactive visual auditing modal
      const newPreviews: Record<
        string,
        { fileName: string; mimeType: string; dataUrl: string }
      > = {};
      files.forEach((f) => {
        newPreviews[f.fileName] = {
          fileName: f.fileName,
          mimeType: f.mimeType,
          dataUrl: f.base64Data,
        };
      });

      const combinedPreviews = {
        ...(existingPortfolio?.documentPreviews || {}),
        ...newPreviews,
      };

      finalPortfolio.documentPreviews = combinedPreviews;

      savePortfolioToStorage(finalPortfolio);
      onAnalysisSuccess(finalPortfolio);
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error("Analysis process error:", err);

      const msg = err.message || "";
      if (err.name === "AbortError") {
        setErrorMessage("Pemindaian dokumen telah dibatalkan.");
      } else if (
        msg.includes("530") ||
        msg.toLowerCase().includes("cloudflare") ||
        msg.toLowerCase().includes("tunnel error") ||
        msg.includes("Servernya lagi mati bang")
      ) {
        setErrorMessage("Servernya lagi mati bang, besok lagi gwa nyalain wkwkwkw");
      } else if (
        msg.includes("Failed to fetch") ||
        msg.includes("NetworkError") ||
        (typeof navigator !== "undefined" && !navigator.onLine)
      ) {
        setErrorMessage(
          "Koneksi internet terputus atau tidak stabil saat mengirim dokumen. Silakan periksa jaringan internet Anda dan coba lagi."
        );
      } else {
        setErrorMessage(
          msg ||
            "Terjadi kendala saat analisis. Silakan periksa koneksi dan coba kembali."
        );
      }
    } finally {
      abortControllerRef.current = null;
      setIsAnalyzing(false);
      setAnalysisStep("");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Mode Tambah Aset Informative Alert */}
      {isAddingMore && (
        <div className="p-3.5 sm:p-4 rounded-sm bg-[#faf0f3] border border-[#ecd0d8] flex items-center justify-between gap-3 text-xs text-[#80283e] animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5 font-medium">
            <Sparkles className="w-4 h-4 shrink-0 text-[#80283e]" />
            <span>
              <strong>Mode Tambah Aset:</strong> Dokumen yang Anda unggah akan otomatis digabungkan dengan{" "}
              {existingPortfolio?.assets?.length || 0}{" "}
              aset yang sudah ada tanpa menghapus data sebelumnya.
            </span>
          </div>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 rounded-sm bg-white hover:bg-stone-50 border border-[#ecd0d8] text-stone-700 text-xs font-semibold cursor-pointer shrink-0 transition-all shadow-2xs"
            >
              Batal
            </button>
          )}
        </div>
      )}

      {/* Upload Drop Zone / Active Document Scanner View */}
      {isAnalyzing ? (
        <div className="relative border-2 border-[#80283e]/30 rounded-sm p-6 sm:p-10 text-center bg-gradient-to-b from-[#faf0f3]/70 via-white to-[#faf0f3]/40 luxury-card overflow-hidden animate-in fade-in duration-300">
          {/* Top Status & Cancel Action Bar */}
          <div className="flex items-center justify-between pb-5 border-b border-[#ecd0d8]/80 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#80283e] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#80283e]"></span>
              </span>
              <span className="font-bold text-[#80283e] tracking-wide uppercase text-[11px]">
                Pemindaian In-Memory Berjalan ({files.length} Berkas)
              </span>
            </div>

            <button
              type="button"
              onClick={handleCancelAnalysis}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-stone-200 bg-white hover:bg-rose-50 hover:border-rose-300 text-stone-600 hover:text-rose-700 text-xs font-semibold transition-all cursor-pointer shadow-xs"
              title="Batalkan proses analisis dokumen"
            >
              <XCircle className="w-3.5 h-3.5 text-rose-500" />
              <span>Batalkan</span>
            </button>
          </div>

          {/* Scanner Central Stage Animation */}
          <div className="py-6 flex flex-col items-center justify-center">
            {/* Visual Folder & Document with Horizontal Laser Scan Beam */}
            <div className="relative w-56 h-40 sm:w-64 sm:h-48 mx-auto flex items-center justify-center">
              {/* Pulsing Aura */}
              <div className="absolute inset-0 bg-[#80283e]/10 rounded-2xl filter blur-xl animate-pulse-glow" />

              {/* Background Folder Tab Shape */}
              <div className="absolute bottom-2 w-48 sm:w-56 h-32 sm:h-36 bg-[#faf0f3] border border-[#ecd0d8] rounded-lg transform -rotate-1 shadow-xs" />

              {/* Foreground Document Under Laser Scanner */}
              <div className="relative w-44 sm:w-52 h-36 sm:h-40 bg-white border border-stone-200 rounded-md shadow-md p-3.5 space-y-2 overflow-hidden animate-float-gentle">
                {/* Header Skeleton */}
                <div className="flex items-center justify-between border-b border-stone-100 pb-1.5">
                  <div className="w-16 h-2 bg-stone-200 rounded-xs" />
                  <div className="w-8 h-2 bg-[#80283e]/30 rounded-xs" />
                </div>
                {/* Body Lines */}
                <div className="space-y-1.5 pt-0.5">
                  <div className="w-full h-1.5 bg-stone-100 rounded-xs" />
                  <div className="w-11/12 h-1.5 bg-stone-100 rounded-xs" />
                  <div className="w-4/5 h-1.5 bg-stone-100 rounded-xs" />
                </div>
                {/* Asset Line Skeleton */}
                <div className="pt-2 flex items-center justify-between">
                  <div className="w-12 h-2.5 bg-stone-200 rounded-xs" />
                  <div className="w-14 h-2.5 bg-[#80283e]/20 rounded-xs" />
                </div>

                {/* Laser Scan Beam */}
                <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#80283e] to-transparent shadow-[0_0_12px_#80283e] animate-scan-beam pointer-events-none" />
              </div>

              {/* Front Label Pocket */}
              <div className="absolute -bottom-1 w-48 sm:w-56 h-12 bg-white/90 backdrop-blur-xs border-t-2 border-[#80283e]/40 rounded-b-lg flex items-center justify-center px-3 shadow-xs">
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#80283e] truncate">
                  <Scan className="w-3.5 h-3.5 animate-spin text-[#80283e] shrink-0" />
                  <span className="truncate max-w-[170px]">
                    {files[activeScanFileIndex]?.fileName || "Memindai dokumen..."}
                  </span>
                </div>
              </div>
            </div>

            {/* Step & Progress Indicators */}
            <div className="mt-5 space-y-2 max-w-md mx-auto text-center">
              <h4 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
                {analysisStep || "Memindai Dokumen Finansial..."}
              </h4>
              <p className="text-xs text-stone-500 font-medium">
                Membaca angka nominal, jenis aset (saham, properti, kas, kripto), serta melacak bukti berkas sumber secara privat di RAM.
              </p>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-stone-200/60 rounded-full overflow-hidden mt-3">
                <div
                  className="h-full bg-gradient-to-r from-[#80283e] to-[#a5435c] rounded-full transition-all duration-300"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-[11px] font-mono text-stone-400 pt-1">
                <span>Audit in-memory</span>
                <span className="font-bold text-[#80283e]">{scanProgress}%</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Normal Drop Zone */
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            handleFiles(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-sm p-8 sm:p-12 text-center transition-all cursor-pointer luxury-card overflow-hidden ${
            isDragging
              ? "border-[#80283e] bg-[#faf0f3]/70"
              : "border-stone-300 hover:border-[#80283e]/70 hover:bg-stone-50/60 bg-white"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg,image/*,application/pdf"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />

          <div className="relative flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-sm bg-[#faf0f3] border border-[#ecd0d8] flex items-center justify-center text-[#80283e]">
              <Upload className="w-7 h-7" />
            </div>

            <div className="space-y-1.5 max-w-md">
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900">
                Tarik & Lepas Dokumen Portofolio Anda ke Sini
              </h3>
              <p className="text-xs sm:text-sm text-stone-500 font-medium leading-relaxed">
                Screenshot portofolio saham, crypto, rekening koran PDF,
                sertifikat tanah, atau bilyet deposito.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2 flex-wrap justify-center">
              <span className="px-3 py-1 text-[11px] font-bold rounded-sm bg-stone-100 border border-stone-200 text-stone-700 font-mono">
                PDF
              </span>
              <span className="px-3 py-1 text-[11px] font-bold rounded-sm bg-stone-100 border border-stone-200 text-stone-700 font-mono">
                JPG / JPEG
              </span>
              <span className="px-3 py-1 text-[11px] font-bold rounded-sm bg-stone-100 border border-stone-200 text-stone-700 font-mono">
                PNG
              </span>
              <span className="text-xs text-stone-400 font-medium">
                • Multi-berkas sekaligus
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Friendly Error Alert */}
      {errorMessage && (
        <div className="p-4 sm:p-5 rounded-sm bg-rose-50/90 border border-rose-200 text-rose-800 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
            <div className="space-y-0.5">
              <p className="font-bold text-stone-900">Kendala Analisis Dokumen</p>
              <p className="text-stone-600 leading-relaxed font-medium">{errorMessage}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            {files.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  handleStartAnalysis();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-white border border-rose-200 hover:bg-rose-100/50 text-rose-700 font-semibold text-xs transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Coba Lagi</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="p-1.5 rounded-sm text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
              title="Tutup pesan"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Uploaded Files Queue */}
      {files.length > 0 && (
        <div className="p-6 rounded-sm border border-stone-200 bg-white space-y-4 luxury-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-stone-900">
                Dokumen Siap Diekstrak
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-sm bg-[#f5dfe6] text-[#80283e] font-mono font-bold">
                {files.length} berkas
              </span>
            </div>
            {!isAnalyzing && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFiles([]);
                }}
                className="text-xs text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
              >
                Hapus Semua
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
            {files.map((file, idx) => {
              const isPdf = file.mimeType.includes("pdf");
              const isCurrentScanTarget = isAnalyzing && idx === activeScanFileIndex;

              return (
                <div
                  key={file.id}
                  className={`flex items-center justify-between p-3 rounded-sm border text-sm gap-2 transition-all ${
                    isCurrentScanTarget
                      ? "border-[#80283e] bg-[#faf0f3]/70 ring-1 ring-[#80283e]/30"
                      : "border-stone-200 bg-stone-50/50"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-sm bg-white border border-stone-200 text-stone-500 shrink-0">
                      {isPdf ? (
                        <FileText className="w-4 h-4 text-rose-500" />
                      ) : (
                        <ImageIcon className="w-4 h-4 text-[#80283e]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-xs sm:text-sm text-stone-900">
                        {file.fileName}
                      </p>
                      <p className="text-[11px] text-stone-400 font-mono">
                        {formatFileSize(file.size)}
                        {isCurrentScanTarget && (
                          <span className="ml-1.5 text-[#80283e] font-bold">
                            • Sedang dipindai
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {!isAnalyzing && (
                    <button
                      type="button"
                      onClick={() => removeFile(file.id)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-sm transition-colors cursor-pointer"
                      title="Hapus file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action Button */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              disabled={isAnalyzing}
              onClick={handleStartAnalysis}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 rounded-sm bg-[#80283e] hover:bg-[#6c1e32] text-white font-bold text-sm sm:text-base transition-all disabled:opacity-80 disabled:cursor-not-allowed cursor-pointer"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>
                    {analysisStep || "Sedang Memindai Dokumen..."}
                  </span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analisis & Hitung Kekayaan Bersih (One-Shot)</span>
                </>
              )}
            </button>

            {isAnalyzing && (
              <button
                type="button"
                onClick={handleCancelAnalysis}
                className="px-5 py-4 rounded-sm border border-stone-200 bg-white hover:bg-rose-50 hover:border-rose-300 text-stone-700 hover:text-rose-700 font-bold text-sm transition-all cursor-pointer shadow-xs shrink-0"
              >
                Batalkan
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
