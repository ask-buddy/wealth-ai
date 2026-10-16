"use client";

import React, { useState, useRef } from "react";
import { Upload, FileText, Image as ImageIcon, Trash2, ShieldCheck, Sparkles, AlertCircle, Eye } from "lucide-react";
import { UploadedFileItem, WealthPortfolio } from "@/types/wealth";
import { calculatePortfolio } from "@/lib/math";
import { savePortfolioToStorage, SAMPLE_PORTFOLIO } from "@/lib/storage";

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
          mimeType: file.type || (file.name.endsWith(".pdf") ? "application/pdf" : "image/jpeg"),
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
      if (validExtensions.includes(ext) || f.type.startsWith("image/") || f.type === "application/pdf") {
        incomingFiles.push(f);
      }
    }

    if (incomingFiles.length === 0) {
      setErrorMessage("Format file tidak didukung. Mohon unggah berkas PDF, JPG, atau PNG.");
      return;
    }

    try {
      const processed = await Promise.all(incomingFiles.map((file) => processFile(file)));
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

      setAnalysisStep("Gemini 3.8 Flash mengekstrak aset & auditabilitas...");

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
      setErrorMessage(err.message || "Terjadi kendala saat analisis. Silakan coba kembali.");
    } finally {
      setIsAnalyzing(false);
      setAnalysisStep("");
    }
  };

  const loadDemoData = () => {
    savePortfolioToStorage(SAMPLE_PORTFOLIO);
    onAnalysisSuccess(SAMPLE_PORTFOLIO);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Upload Drop Zone in Fluent HQ Light Aesthetic */}
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
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer ${
          isDragging
            ? "border-[#fe5e37] bg-orange-50/50 scale-[1.01]"
            : "border-stone-300 hover:border-[#fe5e37]/70 hover:bg-stone-50/70 bg-white shadow-xs"
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

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center text-[#fe5e37] ring-8 ring-orange-50/60">
            <Upload className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-bold tracking-tight text-stone-900">
              Tarik & Lepas Dokumen Aset Anda ke Sini
            </h3>
            <p className="text-sm text-stone-500 max-w-md mx-auto font-medium">
              Screenshot portofolio saham, crypto, rekening koran PDF, sertifikat tanah, atau akta perusahaan.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-stone-100 border border-stone-200 text-stone-600">
              PDF
            </span>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-stone-100 border border-stone-200 text-stone-600">
              JPG / JPEG
            </span>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-stone-100 border border-stone-200 text-stone-600">
              PNG
            </span>
            <span className="text-xs text-stone-400 font-medium">• Multi-dokumen</span>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
          <div>
            <p className="font-bold">Perhatian</p>
            <p>{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Uploaded Files Queue */}
      {files.length > 0 && (
        <div className="p-6 rounded-2xl border border-stone-200 bg-white shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-stone-900">Dokumen Terpilih</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-100 text-[#fe5e37] font-mono font-bold">
                {files.length} berkas
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFiles([]);
              }}
              className="text-xs text-stone-400 hover:text-red-600 transition-colors cursor-pointer"
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
                  className="flex items-center justify-between p-3 rounded-xl border border-stone-200/80 bg-stone-50/50 text-sm gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-lg bg-white border border-stone-200 text-stone-500 shrink-0">
                      {isPdf ? (
                        <FileText className="w-4 h-4 text-red-500" />
                      ) : (
                        <ImageIcon className="w-4 h-4 text-[#fe5e37]" />
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
                    className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Hapus file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Action Button in Fluent Coral */}
          <div className="pt-2">
            <button
              type="button"
              disabled={isAnalyzing}
              onClick={handleStartAnalysis}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#fe5e37] hover:bg-[#ea4e28] text-white font-bold text-sm transition-all shadow-md shadow-[#fe5e37]/25 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>{analysisStep || "Sedang Menganalisis Dokumen..."}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analisis & Hitung Kekayaan Bersih</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Footer / Privacy & Demo Options */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-stone-200 bg-white text-xs text-stone-600 shadow-2xs">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Zero-Database Privacy:</strong> Tidak ada database server. Semua data diproses in-memory dan disimpan di browser Anda.
          </span>
        </div>

        <button
          type="button"
          onClick={loadDemoData}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 font-bold text-stone-800 transition-colors shrink-0 cursor-pointer shadow-2xs"
        >
          <Eye className="w-3.5 h-3.5 text-[#fe5e37]" />
          <span>Lihat Data Contoh (Demo)</span>
        </button>
      </div>
    </div>
  );
}
