import { WealthPortfolio } from "@/types/wealth";

const STORAGE_KEY = "angelwealth_portfolio_data_v2";

export function savePortfolioToStorage(portfolio: WealthPortfolio): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolio));
  } catch (e) {
    console.error("Failed to save portfolio to localStorage:", e);
  }
}

export function loadPortfolioFromStorage(): WealthPortfolio | null {
  if (typeof window === "undefined") return null;
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    return JSON.parse(data) as WealthPortfolio;
  } catch (e) {
    console.error("Failed to load portfolio from localStorage:", e);
    return null;
  }
}

export function clearPortfolioStorage(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error("Failed to clear localStorage:", e);
  }
}

export const SAMPLE_PORTFOLIO: WealthPortfolio = {
  totalNetWorthIdr: 901500000,
  totalAssetsIdr: 985000000,
  totalLiabilitiesIdr: 83500000,
  liquidRatioPercentage: 50.2,
  executiveSummary:
    "Distribusi kekayaan terdiversifikasi secara proporsional di 8 kategori aset dengan porsi terbesar pada instrumen Properti & Tanah (32.5%), diikuti portofolio Saham (21.8%) dan likuiditas Kas & Deposito (14.7%). Rasio solvabilitas berada pada tingkat sangat aman dengan total liabilitas hanya 8.5% dari keseluruhan aset.",
  keyHighlights: [
    "Aset likuid (Kas, Saham, Obligasi & Kripto) mencapai Rp 495.000.000, menjamin fleksibilitas finansial optimal.",
    "Properti tanah seluas 240 m2 berstatus SHM bebas sengketa menjadi penopang nilai jangka panjang.",
    "Beban liabilitas cicilan KPR dan kendaraan terkontrol dengan rasio hutang terhadap aset di bawah 10%.",
  ],
  categories: [
    {
      category: "PROPERTI",
      label: "Properti & Tanah",
      icon: "🏠",
      totalIdr: 320000000,
      itemCount: 2,
      percentage: 32.5,
      color: "#FF5E48",
      badgeBg: "#FFF1F0",
      badgeText: "#E02E1B",
    },
    {
      category: "SAHAM",
      label: "Saham (IHSG & US)",
      icon: "📈",
      totalIdr: 215000000,
      itemCount: 3,
      percentage: 21.8,
      color: "#FF8A3D",
      badgeBg: "#FFF4ED",
      badgeText: "#EA580C",
    },
    {
      category: "KAS_DEPOSITO",
      label: "Kas & Deposito",
      icon: "💰",
      totalIdr: 145000000,
      itemCount: 2,
      percentage: 14.7,
      color: "#FFD13B",
      badgeBg: "#FEFCE8",
      badgeText: "#CA8A04",
    },
    {
      category: "OBLIGASI_SBN",
      label: "Obligasi & SBN",
      icon: "🏛️",
      totalIdr: 85000000,
      itemCount: 1,
      percentage: 8.6,
      color: "#D2EE38",
      badgeBg: "#F7FEE7",
      badgeText: "#65A30D",
    },
    {
      category: "EMAS_LOGAM_MULIA",
      label: "Emas & Logam Mulia",
      icon: "🪙",
      totalIdr: 70000000,
      itemCount: 1,
      percentage: 7.1,
      color: "#86EFAC",
      badgeBg: "#F0FDF4",
      badgeText: "#16A34A",
    },
    {
      category: "KENDARAAN",
      label: "Kendaraan",
      icon: "🚗",
      totalIdr: 65000000,
      itemCount: 1,
      percentage: 6.6,
      color: "#5EEAD4",
      badgeBg: "#F0FDFA",
      badgeText: "#0D9488",
    },
    {
      category: "CRYPTO",
      label: "Kripto (BTC & ETH)",
      icon: "⚡",
      totalIdr: 50000000,
      itemCount: 2,
      percentage: 5.1,
      color: "#C084FC",
      badgeBg: "#FAF5FF",
      badgeText: "#9333EA",
    },
    {
      category: "PERUSAHAAN_SENDIRI",
      label: "Reksadana & Bisnis",
      icon: "💼",
      totalIdr: 35000000,
      itemCount: 1,
      percentage: 3.6,
      color: "#A78BFA",
      badgeBg: "#EEF2FF",
      badgeText: "#4F46E5",
    },
  ],
  assets: [
    {
      id: "ast-1",
      name: "Tanah Kavling Residensial",
      category: "PROPERTI",
      institution: "BPN",
      unit: "m2",
      quantity: 240,
      valueIdr: 220000000,
      sourceFile: "SHM_Tanah_Kavling.pdf",
      notes: "Sertifikat Hak Milik atas nama pribadi",
    },
    {
      id: "ast-2",
      name: "Renovasi Rumah & Unit Bangunan",
      category: "PROPERTI",
      institution: "Taksiran KJPP",
      valueIdr: 100000000,
      sourceFile: "Taksiran_Aset_Properti.pdf",
      notes: "Nilai buku taksiran terkini",
    },
    {
      id: "ast-3",
      name: "BBCA - PT Bank Central Asia Tbk",
      category: "SAHAM",
      institution: "Mandiri Sekuritas",
      quantity: 120,
      unit: "lot",
      valueIdr: 122400000,
      sourceFile: "Portofolio_Mandiri_Sekuritas.png",
      notes: "12.000 lembar pada harga pasar",
    },
    {
      id: "ast-4",
      name: "BMRI - PT Bank Mandiri (Persero) Tbk",
      category: "SAHAM",
      institution: "Mandiri Sekuritas",
      quantity: 90,
      unit: "lot",
      valueIdr: 63000000,
      sourceFile: "Portofolio_Mandiri_Sekuritas.png",
      notes: "Dividen yield 5.2%",
    },
    {
      id: "ast-5",
      name: "Apple Inc. (AAPL - US Equity)",
      category: "SAHAM",
      institution: "Gotrade Indonesia",
      quantity: 10,
      unit: "shares",
      valueIdr: 29600000,
      originalCurrency: "USD",
      originalValue: 1850,
      sourceFile: "Gotrade_Portfolio_Summary.jpg",
      notes: "Saham teknologi global",
    },
    {
      id: "ast-6",
      name: "Tabungan BCA Tahapan",
      category: "KAS_DEPOSITO",
      institution: "BCA",
      valueIdr: 95000000,
      sourceFile: "E-Statement_BCA_Tahapan.pdf",
      notes: "Kas likuid operasional bulanan",
    },
    {
      id: "ast-7",
      name: "Deposito Berjangka Rupiah 3 Bulan",
      category: "KAS_DEPOSITO",
      institution: "Bank Mandiri",
      valueIdr: 50000000,
      sourceFile: "Bilyet_Deposito_Mandiri.pdf",
      notes: "Bunga 5.25% p.a.",
    },
    {
      id: "ast-8",
      name: "Surat Berharga Negara (ORI025)",
      category: "OBLIGASI_SBN",
      institution: "Kemenkeu RI / Bareksa",
      valueIdr: 85000000,
      sourceFile: "Bukti_Kepemilikan_SBN_ORI.pdf",
      notes: "Kupon tetap 6.25% p.a. jatuh tempo 2027",
    },
    {
      id: "ast-9",
      name: "Logam Mulia Emas Antam 50 Gram",
      category: "EMAS_LOGAM_MULIA",
      institution: "Butik Emas Antam",
      quantity: 50,
      unit: "gram",
      valueIdr: 70000000,
      sourceFile: "Faktur_Emas_Antam_Certicard.jpg",
      notes: "Fisik tersimpan di brankas pribadi",
    },
    {
      id: "ast-10",
      name: "Mobil Honda HR-V 1.5 SE (2022)",
      category: "KENDARAAN",
      institution: "Samsat",
      valueIdr: 65000000,
      sourceFile: "BPKB_Kendaraan_Pribadi.pdf",
      notes: "Estimasi nilai pasar setelah depresiasi",
    },
    {
      id: "ast-11",
      name: "Bitcoin (BTC)",
      category: "CRYPTO",
      institution: "TokoCrypto / Hardware Ledger",
      quantity: 0.035,
      unit: "BTC",
      valueIdr: 35000000,
      sourceFile: "Screenshot_Crypto_Balance.png",
      notes: "Alokasi lindung nilai digital",
    },
    {
      id: "ast-12",
      name: "Ethereum (ETH)",
      category: "CRYPTO",
      institution: "Indodax",
      quantity: 0.38,
      unit: "ETH",
      valueIdr: 15000000,
      sourceFile: "Indodax_Staking_Report.png",
      notes: "Staking yield aktif",
    },
    {
      id: "ast-13",
      name: "Reksadana Pasar Uang & Saham Startup",
      category: "PERUSAHAAN_SENDIRI",
      institution: "Bibit / Akta PT",
      valueIdr: 35000000,
      sourceFile: "Bibit_Portofolio_Reksadana.pdf",
      notes: "Likuiditas instan pasar uang",
    },
  ],
  liabilities: [
    {
      id: "lia-1",
      name: "Sisa Pokok KPR Tanah/Bangunan",
      lender: "Bank Mandiri",
      amountIdr: 58500000,
      sourceFile: "Tagihan_KPR_Mandiri.pdf",
      notes: "Sisa tenor 18 bulan",
    },
    {
      id: "lia-2",
      name: "Cicilan Kendaraan Mandiri Tunas Finance",
      lender: "MTF",
      amountIdr: 25000000,
      sourceFile: "Billing_Statement_MTF.pdf",
      notes: "Sisa 6 bulan",
    },
  ],
  analyzedAt: new Date().toISOString(),
  sourceFiles: [
    "SHM_Tanah_Kavling.pdf",
    "Taksiran_Aset_Properti.pdf",
    "Portofolio_Mandiri_Sekuritas.png",
    "Gotrade_Portfolio_Summary.jpg",
    "E-Statement_BCA_Tahapan.pdf",
    "Bilyet_Deposito_Mandiri.pdf",
    "Bukti_Kepemilikan_SBN_ORI.pdf",
    "Faktur_Emas_Antam_Certicard.jpg",
    "BPKB_Kendaraan_Pribadi.pdf",
    "Screenshot_Crypto_Balance.png",
    "Indodax_Staking_Report.png",
    "Bibit_Portofolio_Reksadana.pdf",
    "Tagihan_KPR_Mandiri.pdf",
    "Billing_Statement_MTF.pdf",
  ],
};
