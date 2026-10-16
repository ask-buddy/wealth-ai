"use client";

import React, { useState } from "react";
import { Sparkles, CheckCircle2, FileText, Copy, Check, Quote } from "lucide-react";
import { WealthPortfolio } from "@/types/wealth";

interface ExecutiveSummaryProps {
  portfolio: WealthPortfolio;
}

export function ExecutiveSummary({ portfolio }: ExecutiveSummaryProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(portfolio.executiveSummary);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="rounded-3xl border border-stone-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-6 luxury-card relative overflow-hidden">
      {/* Subtle Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-orange-100/30 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 text-[#fe5e37]">
          <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200/80 flex items-center justify-center text-[#fe5e37]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-stone-900">
              Ringkasan Eksekutif & Opini AI Auditor
            </h2>
            <p className="text-[11px] text-stone-400 font-medium">
              Sintesis audit portofolio otomatis oleh Gemini 3.8 Flash
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
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
      <div className="relative p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-stone-50 to-orange-50/20 border border-stone-200/70 text-sm sm:text-base leading-relaxed text-stone-800 font-medium">
        <Quote className="w-8 h-8 text-orange-200 absolute top-4 left-4 -z-0 opacity-40" />
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
                className="flex items-start gap-2.5 p-4 rounded-2xl border border-stone-200/70 bg-white text-xs sm:text-sm shadow-2xs hover:border-stone-300 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-stone-700 font-medium leading-snug">{highlight}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detected Source Documents Badge List */}
      {portfolio.sourceFiles && portfolio.sourceFiles.length > 0 && (
        <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center gap-3 text-xs text-stone-500">
          <span className="font-semibold text-stone-800 flex items-center gap-1.5 shrink-0">
            <FileText className="w-3.5 h-3.5 text-[#fe5e37]" />
            Dokumen Sumber Terverifikasi ({portfolio.sourceFiles.length}):
          </span>

          <div className="flex items-center gap-1.5 flex-wrap">
            {portfolio.sourceFiles.map((file, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-lg bg-stone-100/80 border border-stone-200 text-[11px] font-mono text-stone-700 shadow-2xs"
              >
                {file}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
