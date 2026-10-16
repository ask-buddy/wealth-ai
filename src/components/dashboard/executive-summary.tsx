"use client";

import React from "react";
import { Sparkles, CheckCircle2, FileText } from "lucide-react";
import { WealthPortfolio } from "@/types/wealth";

interface ExecutiveSummaryProps {
  portfolio: WealthPortfolio;
}

export function ExecutiveSummary({ portfolio }: ExecutiveSummaryProps) {
  return (
    <div className="rounded-2xl border border-stone-200/80 bg-white p-6 sm:p-7 shadow-xs space-y-6">
      <div className="flex items-center gap-2 text-[#fe5e37]">
        <Sparkles className="w-5 h-5 text-[#fe5e37]" />
        <h2 className="text-base sm:text-lg font-bold tracking-tight text-stone-900">
          Ringkasan Eksekutif & Opini AI Auditor
        </h2>
      </div>

      {/* Main Narrative */}
      <div className="p-4 sm:p-5 rounded-xl bg-stone-50 border border-stone-200/60 text-sm sm:text-base leading-relaxed text-stone-700 font-medium">
        {portfolio.executiveSummary}
      </div>

      {/* Key Highlights */}
      {portfolio.keyHighlights && portfolio.keyHighlights.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold tracking-wider uppercase text-stone-500">
            Sorotan Portofolio
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {portfolio.keyHighlights.map((highlight, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-3.5 rounded-xl border border-stone-200/60 bg-white text-xs sm:text-sm shadow-2xs"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-stone-700 font-medium">{highlight}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detected Source Documents */}
      {portfolio.sourceFiles && portfolio.sourceFiles.length > 0 && (
        <div className="pt-2 border-t border-stone-100 flex items-center gap-2 flex-wrap text-xs text-stone-500">
          <span className="font-semibold text-stone-800 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-[#fe5e37]" />
            Dokumen Sumber Terverifikasi ({portfolio.sourceFiles.length}):
          </span>
          {portfolio.sourceFiles.map((file, idx) => (
            <span
              key={idx}
              className="px-2.5 py-1 rounded-md bg-stone-100 border border-stone-200 text-[11px] font-mono text-stone-700"
            >
              {file}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
