"use client";

import React, { useState, useEffect, useRef } from "react";
import { DocumentDropzone } from "@/components/upload/dropzone";
import { NetWorthHero } from "@/components/dashboard/net-worth-hero";
import { ExecutiveSummary } from "@/components/dashboard/executive-summary";
import { PieBreakdownSection } from "@/components/dashboard/pie-breakdown-section";
import { AssetDetailModal } from "@/components/dashboard/asset-detail-modal";
import { ConfirmDeleteModal } from "@/components/dashboard/confirm-delete-modal";
import { DocumentPreviewModal } from "@/components/dashboard/document-preview-modal";
import { PrintableReport } from "@/components/export/printable-report";
import {
  WealthPortfolio,
  AssetCategory,
  ExtractedLiabilityItem,
} from "@/types/wealth";
import {
  loadPortfolioFromStorage,
  savePortfolioToStorage,
  clearPortfolioStorage,
} from "@/lib/storage";
import {
  removeAssetFromPortfolio,
  removeLiabilityFromPortfolio,
} from "@/lib/math";
import {
  ShieldCheck,
  Sparkles,
  Lock,
  Zap,
  TrendingUp,
  Eye,
  EyeOff,
  Coins,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { getGlobalUsdRate, setGlobalUsdRate } from "@/lib/formatters";

export default function Home() {
  const [portfolio, setPortfolio] = useState<WealthPortfolio | null>(null);
  const [isAddingMore, setIsAddingMore] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<AssetCategory | null>(null);
  const [selectedLiability, setSelectedLiability] =
    useState<ExtractedLiabilityItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPreviewTarget, setSelectedPreviewTarget] = useState<{
    fileName: string;
    assetInfo?: {
      name: string;
      valueFormatted?: string;
      box_2d?: [number, number, number, number];
    } | null;
  } | null>(null);

  const handlePreviewFile = (
    fileName: string,
    assetInfo?: {
      name: string;
      valueFormatted?: string;
      box_2d?: [number, number, number, number];
    } | null,
  ) => {
    setSelectedPreviewTarget({ fileName, assetInfo });
  };
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [currencyMode, setCurrencyMode] = useState<"IDR" | "USD">("IDR");
  const [dashboardTab, setDashboardTab] = useState<"assets" | "liabilities">(
    "assets",
  );
  const [usdRate, setUsdRate] = useState<number>(() => getGlobalUsdRate());
  const [rateLoading, setRateLoading] = useState(false);
  const [rateInfo, setRateInfo] = useState<{
    lastUpdated?: string;
    provider?: string;
    isFallback?: boolean;
  } | null>(null);

  const printRef = useRef<HTMLDivElement>(null);

  const fetchExchangeRate = async () => {
    try {
      setRateLoading(true);
      const res = await fetch("/api/exchange-rate");
      if (res.ok) {
        const data = await res.json();
        if (typeof data.rate === "number" && data.rate > 0) {
          setUsdRate(data.rate);
          setGlobalUsdRate(data.rate);
          setRateInfo({
            lastUpdated: data.lastUpdated,
            provider: data.provider,
            isFallback: data.isFallback,
          });
        }
      }
    } catch (err) {
      console.warn("Failed to fetch live exchange rate:", err);
    } finally {
      setRateLoading(false);
    }
  };

  useEffect(() => {
    const saved = loadPortfolioFromStorage();
    if (saved) {
      setPortfolio(saved);
    }
    setIsLoaded(true);
    fetchExchangeRate();

    // Keyboard shortcut 'P' for privacy mode
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === "p" || e.key === "P") &&
        !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)
      ) {
        setIsPrivate((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleAnalysisSuccess = (newPortfolio: WealthPortfolio) => {
    setPortfolio(newPortfolio);
    setIsAddingMore(false);
  };

  const handleReset = () => {
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    clearPortfolioStorage();
    setPortfolio(null);
    setIsAddingMore(false);
    setSelectedCategory(null);
    setSelectedLiability(null);
    setIsModalOpen(false);
  };

  const handleDeleteAssetItem = (assetId: string) => {
    if (!portfolio) return;
    const updated = removeAssetFromPortfolio(portfolio, assetId);
    setPortfolio(updated);
    savePortfolioToStorage(updated);
  };

  const handleDeleteLiabilityItem = (liabilityId: string) => {
    if (!portfolio) return;
    const updated = removeLiabilityFromPortfolio(portfolio, liabilityId);
    setPortfolio(updated);
    savePortfolioToStorage(updated);
  };

  const handleSelectCategory = (cat: AssetCategory) => {
    setSelectedCategory(cat);
    setSelectedLiability(null);
    setIsModalOpen(true);
  };

  const handleSelectLiability = (lia: ExtractedLiabilityItem) => {
    setSelectedLiability(lia);
    setSelectedCategory(null);
    setIsModalOpen(true);
  };

  const handleExportPdf = () => {
    window.print();
  };

  const togglePrivacy = () => {
    setIsPrivate((prev) => !prev);
  };

  const toggleCurrency = () => {
    setCurrencyMode((prev) => (prev === "IDR" ? "USD" : "IDR"));
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbf9f7]">
        <div className="w-8 h-8 border-3 border-[#1A76FF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbf9f7] text-[#191919] flex flex-col font-sans selection:bg-[#dbeafe] selection:text-[#0b4eb8]">
      {/* Printable Report Component for PDF export */}
      <div className="print-only">
        {portfolio && <PrintableReport ref={printRef} portfolio={portfolio} />}
      </div>

      {/* Screen View */}
      <div className="no-print flex-1 flex flex-col">
        {/* Navigation Bar in Clean Minimal Luxury Style */}
        <header className="sticky top-0 z-40 w-full border-b border-stone-200 bg-white/95 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-sm bg-[#1A76FF] flex items-center justify-center text-white font-bold text-lg">
                A
              </div>
              <div>
                <span className="font-bold text-base tracking-tight text-stone-900 flex items-center gap-2 font-play">
                  AngelWealth
                </span>
                <p className="text-[11px] text-stone-500 hidden sm:block font-medium">
                  Private Wealth & Asset Intelligence for High-Net-Worth
                  Individuals
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Privacy Quick Toggle in Header */}
              {portfolio && (
                <button
                  type="button"
                  onClick={togglePrivacy}
                  className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-semibold border transition-all cursor-pointer ${
                    isPrivate
                      ? "bg-stone-900 border-stone-800 text-stone-100"
                      : "bg-stone-100 border-stone-200 hover:bg-stone-200 text-stone-700"
                  }`}
                  title="Tekan 'P' di keyboard untuk toggle privasi cepat"
                >
                  {isPrivate ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                      <span>Privat Aktif</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5 text-stone-500" />
                      <span>Mode Privat</span>
                    </>
                  )}
                </button>
              )}

              {/* Currency Switcher & Live Rate Badge in Header */}
              {portfolio && (
                <div className="flex items-center gap-2">
                  {currencyMode === "USD" && (
                    <div
                      className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono text-stone-600 bg-stone-50 border border-stone-200 rounded-sm shadow-2xs"
                      title={
                        rateInfo?.lastUpdated
                          ? `Kurs real-time diperbarui: ${new Date(rateInfo.lastUpdated).toLocaleTimeString("id-ID")}`
                          : "Kurs Real-time"
                      }
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>1 USD ≈ Rp {usdRate.toLocaleString("id-ID")}</span>
                      <button
                        type="button"
                        onClick={fetchExchangeRate}
                        disabled={rateLoading}
                        className="text-stone-400 hover:text-[#1A76FF] ml-0.5 cursor-pointer disabled:opacity-50 transition-colors"
                        title="Segarkan Nilai Kurs"
                      >
                        <RefreshCw
                          className={`w-3 h-3 ${rateLoading ? "animate-spin text-[#1A76FF]" : ""}`}
                        />
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={toggleCurrency}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-sm border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 transition-colors cursor-pointer"
                    title="Ganti mata uang tampilan (IDR / USD)"
                  >
                    <span
                      className={
                        currencyMode === "IDR"
                          ? "font-bold text-[#1A76FF]"
                          : "text-stone-400"
                      }
                    >
                      IDR
                    </span>
                    <span className="text-stone-300">/</span>
                    <span
                      className={
                        currencyMode === "USD"
                          ? "font-bold text-[#1A76FF]"
                          : "text-stone-400"
                      }
                    >
                      USD
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
          {(!portfolio || isAddingMore) && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Value Proposition Hero */}
              <div className="text-center max-w-3xl mx-auto space-y-4 pt-4">
                <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-stone-900 leading-tight font-play">
                  Hitung Total Kekayaan Bersih Anda Secara{" "}
                  <span className="text-[#1A76FF]">Instan & 100% Privat</span>
                </h1>

                {isAddingMore && (
                  <button
                    type="button"
                    onClick={() => setIsAddingMore(false)}
                    className="inline-flex items-center gap-1.5 text-xs text-[#1A76FF] hover:underline font-bold cursor-pointer pt-2"
                  >
                    <span>← Kembali ke Tampilan Dashboard Portofolio</span>
                  </button>
                )}
              </div>

              {/* Upload Dropzone */}
              <DocumentDropzone
                onAnalysisSuccess={handleAnalysisSuccess}
                existingPortfolio={portfolio}
                isAddingMore={isAddingMore}
                onCancel={() => setIsAddingMore(false)}
              />

              {/* Security & Feature Badges */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 max-w-4xl mx-auto text-left">
                <div className="p-4 rounded-sm border border-stone-200 bg-white space-y-1.5 luxury-card">
                  <div className="flex items-center gap-2 font-bold text-sm text-stone-900">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Zero-Database Storage</span>
                  </div>
                  <p className="text-xs text-stone-500 leading-relaxed font-medium">
                    Tidak ada data dokumen atau nominal yang tersimpan di
                    server. Hasil ekstraksi hanya hidup di RAM dan browser Anda.
                  </p>
                </div>

                <div className="p-4 rounded-sm border border-stone-200 bg-white space-y-1.5 luxury-card">
                  <div className="flex items-center gap-2 font-bold text-sm text-stone-900">
                    <Zap className="w-4 h-4 text-[#1A76FF]" />
                    <span>Multimodal One-Shot</span>
                  </div>
                  <p className="text-xs text-stone-500 leading-relaxed font-medium">
                    Membaca screenshot JPG/PNG dan dokumen PDF sekaligus tanpa
                    OCR terpisah menggunakan kapabilitas multimodal.
                  </p>
                </div>

                <div className="p-4 rounded-sm border border-stone-200 bg-white space-y-1.5 luxury-card">
                  <div className="flex items-center gap-2 font-bold text-sm text-stone-900">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    <span>Auditable Source Tracking</span>
                  </div>
                  <p className="text-xs text-stone-500 leading-relaxed font-medium">
                    Setiap angka aset terikat langsung dengan nama file sumber
                    dokumen aslinya untuk verifikasi yang akurat.
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
                isPrivate={isPrivate}
                onTogglePrivacy={togglePrivacy}
                currencyMode={currencyMode}
                onToggleCurrency={toggleCurrency}
                activeTab={dashboardTab}
                onTabChange={setDashboardTab}
                usdRate={usdRate}
              />

              {/* Exact Layout: Pie Breakdown Section with Tabs, Pie Chart on Left, and Card List on Right */}
              <PieBreakdownSection
                portfolio={portfolio}
                onSelectCategory={handleSelectCategory}
                selectedCategory={selectedCategory}
                onAddMore={() => setIsAddingMore(true)}
                isPrivate={isPrivate}
                onSelectLiability={handleSelectLiability}
                currencyMode={currencyMode}
                activeTab={dashboardTab}
                onTabChange={setDashboardTab}
                onPreviewFile={handlePreviewFile}
                usdRate={usdRate}
              />

              {/* Executive Summary */}
              <ExecutiveSummary
                portfolio={portfolio}
                onPreviewFile={handlePreviewFile}
              />
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
              setSelectedLiability(null);
            }}
            category={selectedCategory}
            assets={portfolio.assets}
            liabilities={portfolio.liabilities}
            isPrivate={isPrivate}
            selectedLiability={selectedLiability}
            currencyMode={currencyMode}
            onPreviewFile={handlePreviewFile}
            usdRate={usdRate}
            onDeleteAsset={handleDeleteAssetItem}
            onDeleteLiability={handleDeleteLiabilityItem}
          />
        )}

        {/* Document Preview Modal */}
        <DocumentPreviewModal
          isOpen={!!selectedPreviewTarget}
          onClose={() => setSelectedPreviewTarget(null)}
          fileName={selectedPreviewTarget?.fileName || null}
          assetInfo={selectedPreviewTarget?.assetInfo}
          preview={
            selectedPreviewTarget?.fileName && portfolio?.documentPreviews
              ? portfolio.documentPreviews[selectedPreviewTarget.fileName]
              : null
          }
        />

        {/* Custom Confirmation Modal for Deletion */}
        <ConfirmDeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
        />

        {/* Footer */}
        <footer className="border-t border-stone-200/80 py-6 text-center text-xs text-stone-500 bg-white mt-12">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>© 2026 AngelWealth. Private Wealth & Asset.</span>
            <span className="font-mono text-[11px] text-stone-400">
              Zero-Database Local Privacy
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
