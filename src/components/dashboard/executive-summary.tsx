"use client";

import React, { useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  FileText,
  Copy,
  Check,
  Quote,
  Eye,
} from "lucide-react";
import { WealthPortfolio } from "@/types/wealth";

interface ExecutiveSummaryProps {
  portfolio: WealthPortfolio;
  onPreviewFile?: (fileName: string) => void;
}

export function ExecutiveSummary({
  portfolio,
  onPreviewFile,
}: ExecutiveSummaryProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(portfolio.executiveSummary);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="rounded-sm border border-stone-200 bg-white p-6 sm:p-8 space-y-6 luxury-card relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 text-[#80283e]">
          <div className="w-8 h-8 rounded-sm bg-[#faf0f3] border border-[#ecd0d8] flex items-center justify-center text-[#80283e]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-stone-900">
              Ringkasan Eksekutif & Opini AI Auditor
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold transition-all cursor-pointer"
          title="Salin opini auditor"
        >
          {isCopied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700">Tersalin</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-stone-400" />
              <span>Salin Opini</span>
            </>
          )}
        </button>
      </div>

      {/* Main Narrative Card with Editorial Typography */}
      <div className="relative p-5 sm:p-6 rounded-sm bg-stone-50 border border-stone-200 text-xs sm:text-sm leading-relaxed text-stone-800 font-medium">
        <Quote className="w-8 h-8 text-[#ecd0d8] absolute top-4 left-4 -z-0 opacity-40" />
        <p className="relative z-10 font-normal leading-relaxed">
          {portfolio.executiveSummary}
        </p>
      </div>

      {/* Key Highlights */}
      {portfolio.keyHighlights && portfolio.keyHighlights.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold tracking-wider uppercase text-stone-400">
            Sorotan Utama Portofolio & Keamanan Finansial
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {portfolio.keyHighlights.map((highlight, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-4 rounded-sm border border-stone-200 bg-white text-xs sm:text-sm hover:border-stone-300 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-stone-700 font-medium leading-snug">
                  {highlight}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detected Source Documents Badge List */}
      {portfolio.sourceFiles && portfolio.sourceFiles.length > 0 && (
        <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center gap-3 text-xs text-stone-500">
          <span className="font-semibold text-stone-800 flex items-center gap-1.5 shrink-0">
            <FileText className="w-3.5 h-3.5 text-[#80283e]" />
            Dokumen Sumber Terverifikasi ({portfolio.sourceFiles.length}):
          </span>

          <div className="flex items-center gap-1.5 flex-wrap">
            {portfolio.sourceFiles.map((file, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onPreviewFile?.(file)}
                className="px-2.5 py-1 rounded-sm bg-stone-50 hover:bg-[#faf0f3] border border-stone-200 hover:border-[#ecd0d8] text-[11px] font-mono text-stone-700 hover:text-[#80283e] transition-all cursor-pointer inline-flex items-center gap-1.5 group shadow-2xs"
                title="Klik untuk membuka pratinjau dokumen"
              >
                <span>{file}</span>
                <Eye className="w-3 h-3 text-stone-400 group-hover:text-[#80283e] transition-colors" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
