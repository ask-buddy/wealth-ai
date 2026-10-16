"use client";

import React, { forwardRef } from "react";
import { formatIdr, formatCompactIdr, formatDateIndo } from "@/lib/formatters";
import { WealthPortfolio } from "@/types/wealth";
import { ShieldCheck, FileText } from "lucide-react";

interface PrintableReportProps {
  portfolio: WealthPortfolio;
}

export const PrintableReport = forwardRef<HTMLDivElement, PrintableReportProps>(
  ({ portfolio }, ref) => {
    return (
      <div
        ref={ref}
        className="p-8 sm:p-12 bg-white text-slate-900 print:p-0 space-y-8 font-sans"
      >
        {/* Document Header */}
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-6">
          <div>
            <p className="text-md sm:text-md font-bold tracking-tight uppercase text-slate-900">
              ANGELWEALTH INTELLIGENCE
            </p>
            <p className="text-xs sm:text-sm font-semibold tracking-wider text-emerald-700 uppercase mt-1">
              Laporan Aset & Kekayaan Pribadi
            </p>
          </div>
          <div className="text-right text-xs text-slate-500 space-y-1">
            <p className="font-semibold text-slate-800">
              STATUS: SANGAT RAHASIA
            </p>
            <p>{formatDateIndo(portfolio.analyzedAt)}</p>
          </div>
        </div>

        {/* Hero Net Worth Section */}
        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <span className="text-xs uppercase tracking-wider font-bold text-slate-500">
              Total Kekayaan Bersih (Net Worth)
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono mt-1">
              {formatIdr(portfolio.totalNetWorthIdr)}
            </p>
            <p className="text-xs text-emerald-700 font-semibold mt-1">
              Setara {formatCompactIdr(portfolio.totalNetWorthIdr)}
            </p>
          </div>

          <div>
            <span className="text-xs uppercase tracking-wider font-bold text-slate-500">
              Total Nilai Aset
            </span>
            <p className="text-xl sm:text-2xl font-bold text-slate-900 font-mono mt-1">
              {formatIdr(portfolio.totalAssetsIdr)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Dari {portfolio.assets.length} instrumen aset terdaftar
            </p>
          </div>

          <div>
            <span className="text-xs uppercase tracking-wider font-bold text-slate-500">
              Liabilitas & Rasio Likuiditas
            </span>
            <p className="text-xl sm:text-2xl font-bold text-rose-600 font-mono mt-1">
              {portfolio.totalLiabilitiesIdr > 0
                ? formatIdr(portfolio.totalLiabilitiesIdr)
                : "Rp 0"}
            </p>
            <p className="text-xs text-slate-600 mt-1">
              Rasio Likuiditas Kas:{" "}
              <strong>{portfolio.liquidRatioPercentage}%</strong>
            </p>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 border-b pb-1">
            I. Ringkasan Eksekutif & Opini AI
          </h2>
          <p className="text-xs sm:text-sm leading-relaxed text-slate-700 bg-slate-50/80 p-4 rounded-xl border border-slate-200">
            {portfolio.executiveSummary}
          </p>
        </div>

        {/* Key Highlights */}
        {portfolio.keyHighlights && portfolio.keyHighlights.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 border-b pb-1">
              II. Temuan Penting & Alokasi Strategis
            </h2>
            <ul className="list-disc list-inside text-xs sm:text-sm space-y-1.5 text-slate-700 pl-1">
              {portfolio.keyHighlights.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Allocation Table */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 border-b pb-1">
            III. Distribusi Alokasi Sektor Aset
          </h2>
          <table className="w-full text-xs text-left border-collapse border border-slate-200">
            <thead>
              <tr className="bg-slate-100 text-slate-700">
                <th className="p-2.5 border border-slate-200">Kategori Aset</th>
                <th className="p-2.5 border border-slate-200 text-center">
                  Jumlah Item
                </th>
                <th className="p-2.5 border border-slate-200 text-right">
                  Total Nilai (IDR)
                </th>
                <th className="p-2.5 border border-slate-200 text-right">
                  Porsi (%)
                </th>
              </tr>
            </thead>
            <tbody>
              {portfolio.categories.map((cat) => (
                <tr key={cat.category} className="hover:bg-slate-50">
                  <td className="p-2.5 border border-slate-200 font-medium">
                    {cat.label}
                  </td>
                  <td className="p-2.5 border border-slate-200 text-center">
                    {cat.itemCount}
                  </td>
                  <td className="p-2.5 border border-slate-200 text-right font-mono">
                    {formatIdr(cat.totalIdr)}
                  </td>
                  <td className="p-2.5 border border-slate-200 text-right font-semibold">
                    {cat.percentage}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Itemized Table */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 border-b pb-1">
            IV. Daftar Lengkap Aset & Dokumen Sumber (Audit Trail)
          </h2>
          <table className="w-full text-[11px] text-left border-collapse border border-slate-200">
            <thead>
              <tr className="bg-slate-100 text-slate-700">
                <th className="p-2 border border-slate-200">Nama Aset</th>
                <th className="p-2 border border-slate-200">Kategori</th>
                <th className="p-2 border border-slate-200">
                  Institusi / Keterangan
                </th>
                <th className="p-2 border border-slate-200 text-right">
                  Nilai (IDR)
                </th>
                <th className="p-2 border border-slate-200">Sumber Dokumen</th>
              </tr>
            </thead>
            <tbody>
              {portfolio.assets.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="p-2 border border-slate-200 font-semibold">
                    {item.name}
                  </td>
                  <td className="p-2 border border-slate-200">
                    {item.category}
                  </td>
                  <td className="p-2 border border-slate-200 text-slate-600">
                    {item.institution || item.notes || "-"}
                  </td>
                  <td className="p-2 border border-slate-200 text-right font-mono font-medium">
                    {formatIdr(item.valueIdr)}
                  </td>
                  <td className="p-2 border border-slate-200 font-mono text-[10px] text-slate-500">
                    {item.sourceFile}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Disclaimer */}
        <div className="pt-6 border-t text-[11px] text-slate-500 space-y-1">
          <p className="font-semibold text-slate-700 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            Jaminan Privasi & Ketiadaan Database:
          </p>
          <p>
            Laporan ini diproduksi langsung di peramban (client-side) tanpa
            menyimpan data apa pun di basis data server. Dokumen sumber hanya
            numpang lewat di RAM untuk dianalisis oleh AI.
          </p>
        </div>
      </div>
    );
  },
);

PrintableReport.displayName = "PrintableReport";
