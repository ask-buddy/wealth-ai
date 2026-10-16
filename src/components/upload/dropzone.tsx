"use client";

import React, { useState, useRef } from "react";
import {
  Upload,
  FileText,
  Image as ImageIcon,
  Trash2,
  ShieldCheck,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { UploadedFileItem, WealthPortfolio } from "@/types/wealth";
import { calculatePortfolio } from "@/lib/math";
import { savePortfolioToStorage } from "@/lib/storage";

interface DropzoneProps {
  onAnalysisSuccess: (portfolio: WealthPortfolio) => void;
}

export function DocumentDropzone({ onAnalysisSuccess }: DropzoneProps) {
  const [files, setFiles] = useState<UploadedFileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    const validExtensions = [".pdf", ".jpg", ".jpeg", ".png"];
    const incomingFiles: File[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const f = fileList[i];
      const ext = f.name.substring(f.name.lastIndexOf(".")).toLowerCase();
      if (
        validExtensions.includes(ext) ||
        f.type.startsWith("image/") ||
        f.type === "application/pdf"
      ) {
        incomingFiles.push(f);
      }
    }

    if (incomingFiles.length === 0) {
      setErrorMessage(
        "Format file tidak didukung. Mohon unggah berkas PDF, JPG, atau PNG.",
      );
      return;
    }

    try {
      const processed = await Promise.all(
        incomingFiles.map((file) => processFile(file)),
      );
      setFiles((prev) => [...prev, ...processed]);
    } catch (err) {
      console.error(err);
      setErrorMessage("Gagal memproses berkas di browser.");
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleStartAnalysis = async () => {
    if (files.length === 0) return;
    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      setAnalysisStep("Mempersiapkan dokumen in-memory...");
      await new Promise((r) => setTimeout(r, 400));

      setAnalysisStep("Mengekstrak aset & auditabilitas...");

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
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal memproses dokumen.");
      }

      setAnalysisStep("Mengkalkulasi alokasi 8 kategori aset...");
      const fileNames = files.map((f) => f.fileName);
      const calculatedPortfolio = calculatePortfolio(json.data, fileNames);

      savePortfolioToStorage(calculatedPortfolio);
      onAnalysisSuccess(calculatedPortfolio);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(
        err.message || "Terjadi kendala saat analisis. Silakan coba kembali.",
      );
    } finally {
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
      {/* Upload Drop Zone in Crisp Flat Style */}
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

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-sm bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
          <div>
            <p className="font-bold">Perhatian</p>
            <p>{errorMessage}</p>
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
            {files.map((file) => {
              const isPdf = file.mimeType.includes("pdf");
              return (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 rounded-sm border border-stone-200 bg-stone-50/50 text-sm gap-2"
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
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFile(file.id)}
                    className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-sm transition-colors cursor-pointer"
                    title="Hapus file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <button
              type="button"
              disabled={isAnalyzing}
              onClick={handleStartAnalysis}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-sm bg-[#80283e] hover:bg-[#6c1e32] text-white font-bold text-sm sm:text-base transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>
                    {analysisStep || "Sedang Menganalisis Dokumen..."}
                  </span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analisis & Hitung Kekayaan Bersih (One-Shot)</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
