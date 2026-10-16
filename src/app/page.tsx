"use client";

import React, { useState, useEffect, useRef } from "react";
import { DocumentDropzone } from "@/components/upload/dropzone";
import { NetWorthHero } from "@/components/dashboard/net-worth-hero";
import { ExecutiveSummary } from "@/components/dashboard/executive-summary";
import { PieBreakdownSection } from "@/components/dashboard/pie-breakdown-section";
import { AssetDetailModal } from "@/components/dashboard/asset-detail-modal";
import { PrintableReport } from "@/components/export/printable-report";
import { WealthPortfolio, AssetCategory } from "@/types/wealth";
import {
  loadPortfolioFromStorage,
  clearPortfolioStorage,
} from "@/lib/storage";
import {
  ShieldCheck,
  Sparkles,
  Lock,
  Zap,
  TrendingUp,
} from "lucide-react";

export default function Home() {
  const [portfolio, setPortfolio] = useState<WealthPortfolio | null>(null);
  const [isAddingMore, setIsAddingMore] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = loadPortfolioFromStorage();
    if (saved) {
      setPortfolio(saved);
    }
    setIsLoaded(true);
  }, []);

  const handleAnalysisSuccess = (newPortfolio: WealthPortfolio) => {
    setPortfolio(newPortfolio);
    setIsAddingMore(false);
  };

  const handleReset = () => {
    if (confirm("Apakah Anda yakin ingin menghapus seluruh data portofolio dari browser ini?")) {
      clearPortfolioStorage();
      setPortfolio(null);
      setIsAddingMore(false);
      setSelectedCategory(null);
      setIsModalOpen(false);
    }
  };

  const handleSelectCategory = (cat: AssetCategory) => {
    setSelectedCategory(cat);
    setIsModalOpen(true);
  };

  const handleExportPdf = () => {
    window.print();
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbf9f7]">
        <div className="w-7 h-7 border-3 border-[#fe5e37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbf9f7] text-[#191919] flex flex-col font-sans">
      {/* Printable Report Component for PDF export */}
      <div className="print-only">
        {portfolio && <PrintableReport ref={printRef} portfolio={portfolio} />}
      </div>

      {/* Screen View */}
      <div className="no-print flex-1 flex flex-col">
        {/* Navigation Bar in Fluent HQ Clean Style */}
        <header className="sticky top-0 z-40 w-full border-b border-stone-200/80 bg-white/90 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#fe5e37] flex items-center justify-center text-white shadow-sm shadow-[#fe5e37]/30 font-bold text-lg">
                A
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight text-stone-900 flex items-center gap-2">
                  AngelWealth
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-100 text-[#fe5e37] font-bold border border-orange-200">
                    AI AGGREGATOR
                  </span>
                </span>
                <p className="text-[11px] text-stone-500 hidden sm:block font-medium">
                  Private Wealth & Asset Intelligence for High-Net-Worth Individuals
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-100 border border-stone-200 text-xs text-stone-600 font-medium">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Zero-Database • In-Memory Processing</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
          {(!portfolio || isAddingMore) && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Value Proposition Hero */}
              <div className="text-center max-w-3xl mx-auto space-y-4 pt-4">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-[#fe5e37] text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Powered by Gemini 3.8 Flash Multimodal</span>
                </div>

                <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-stone-900">
                  Hitung Total Kekayaan Bersih Anda Secara{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#fe5e37] via-[#f97316] to-[#eab308]">
                    Instan & 100% Privat
                  </span>
                </h1>

                <p className="text-sm sm:text-base text-stone-600 max-w-2xl mx-auto leading-relaxed font-medium">
                  Unggah berbagai dokumen aset Anda yang tercecer—screenshot portofolio saham, sertifikat tanah, akta perusahaan, atau rekening koran PDF. Tanpa database, data aman di peramban Anda.
                </p>

                {isAddingMore && (
                  <button
                    type="button"
                    onClick={() => setIsAddingMore(false)}
                    className="text-xs text-[#fe5e37] hover:underline font-bold cursor-pointer"
                  >
                    ← Kembali ke Tampilan Dashboard
                  </button>
                )}
              </div>

              {/* Upload Dropzone */}
              <DocumentDropzone onAnalysisSuccess={handleAnalysisSuccess} />

              {/* Security & Feature Badges */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 max-w-4xl mx-auto text-left">
                <div className="p-4 rounded-xl border border-stone-200/80 bg-white space-y-1.5 shadow-2xs">
                  <div className="flex items-center gap-2 font-bold text-sm text-stone-900">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Zero-Database Storage</span>
                  </div>
                  <p className="text-xs text-stone-500 leading-relaxed font-medium">
                    Tidak ada data dokumen atau nominal yang tersimpan di server. Hasil ekstraksi hanya hidup di RAM dan browser Anda.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-stone-200/80 bg-white space-y-1.5 shadow-2xs">
                  <div className="flex items-center gap-2 font-bold text-sm text-stone-900">
                    <Zap className="w-4 h-4 text-[#fe5e37]" />
                    <span>Multimodal One-Shot</span>
                  </div>
                  <p className="text-xs text-stone-500 leading-relaxed font-medium">
                    Membaca screenshot JPG/PNG dan dokumen PDF sekaligus tanpa OCR terpisah menggunakan kapabilitas multimodal Gemini.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-stone-200/80 bg-white space-y-1.5 shadow-2xs">
                  <div className="flex items-center gap-2 font-bold text-sm text-stone-900">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    <span>Auditable Source Tracking</span>
                  </div>
                  <p className="text-xs text-stone-500 leading-relaxed font-medium">
                    Setiap angka aset terikat langsung dengan nama file sumber dokumen aslinya untuk verifikasi yang akurat.
                  </p>
                </div>
              </div>
            </div>
          )}

          {portfolio && !isAddingMore && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Hero Net Worth Metric */}
              <NetWorthHero
                portfolio={portfolio}
                onReset={handleReset}
                onAddMore={() => setIsAddingMore(true)}
                onExportPdf={handleExportPdf}
              />

              {/* Exact Layout: Pie Breakdown Section with Tabs, Pie Chart on Left, and Card List on Right */}
              <PieBreakdownSection
                portfolio={portfolio}
                onSelectCategory={handleSelectCategory}
                selectedCategory={selectedCategory}
                onAddMore={() => setIsAddingMore(true)}
              />

              {/* Executive Summary */}
              <ExecutiveSummary portfolio={portfolio} />
            </div>
          )}
        </main>

        {/* Drill-Down Detail Modal */}
        {portfolio && (
          <AssetDetailModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedCategory(null);
            }}
            category={selectedCategory}
            assets={portfolio.assets}
            liabilities={portfolio.liabilities}
          />
        )}

        {/* Footer */}
        <footer className="border-t border-stone-200/80 py-6 text-center text-xs text-stone-500 bg-white mt-12">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>© 2026 AngelWealth. Private Wealth & Asset Aggregator.</span>
            <span className="font-mono text-[11px] text-stone-400">
              Fluent HQ Inspired Design • Zero-Database Local Privacy
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
