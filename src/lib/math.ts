import {
  AssetCategory,
  CategorySummary,
  ExtractedAssetItem,
  ExtractedLiabilityItem,
  RawWealthAnalysis,
  WealthPortfolio,
} from "@/types/wealth";

export const CATEGORY_CONFIG: Record<
  AssetCategory,
  {
    label: string;
    icon: string;
    color: string;
    badgeBg: string;
    badgeText: string;
    description: string;
  }
> = {
  PROPERTI: {
    label: "Properti & Tanah",
    icon: "",
    color: "#FF5E48", // Vibrant Salmon/Coral
    badgeBg: "#FFF1F0",
    badgeText: "#E02E1B",
    description: "Tanah, rumah hunian, ruko komersial, dan apartemen",
  },
  SAHAM: {
    label: "Saham (IHSG & US)",
    icon: "",
    color: "#FF8A3D", // Warm Orange
    badgeBg: "#FFF4ED",
    badgeText: "#EA580C",
    description: "Portofolio saham bursa dan indeks ekuitas",
  },
  KAS_DEPOSITO: {
    label: "Kas & Deposito",
    icon: "",
    color: "#FFD13B", // Warm Golden Yellow
    badgeBg: "#FEFCE8",
    badgeText: "#CA8A04",
    description: "Tabungan bank, deposito berjangka, dan kas likuid",
  },
  OBLIGASI_SBN: {
    label: "Obligasi & SBN",
    icon: "",
    color: "#D2EE38", // Lime / Chartreuse
    badgeBg: "#F7FEE7",
    badgeText: "#65A30D",
    description: "Surat Berharga Negara, Sukuk, dan Obligasi korporasi",
  },
  EMAS_LOGAM_MULIA: {
    label: "Emas & Logam Mulia",
    icon: "",
    color: "#86EFAC", // Soft Mint Green
    badgeBg: "#F0FDF4",
    badgeText: "#16A34A",
    description: "Emas batangan Antam, perak, dan logam mulia fisik",
  },
  KENDARAAN: {
    label: "Kendaraan",
    icon: "",
    color: "#5EEAD4", // Sky Teal / Turquoise
    badgeBg: "#F0FDFA",
    badgeText: "#0D9488",
    description: "Mobil mewah, motor koleksi, dan kendaraan pribadi",
  },
  CRYPTO: {
    label: "Kripto (BTC & ETH)",
    icon: "",
    color: "#C084FC", // Lilac / Purple
    badgeBg: "#FAF5FF",
    badgeText: "#9333EA",
    description: "Bitcoin, Ethereum, stablecoin, dan web3 assets",
  },
  PERUSAHAAN_SENDIRI: {
    label: "Perusahaan & Bisnis",
    icon: "",
    color: "#A78BFA", // Lavender Indigo
    badgeBg: "#EEF2FF",
    badgeText: "#4F46E5",
    description: "Kepemilikan saham perseroan tertutup, CV, dan ekuitas bisnis",
  },
  LAINNYA: {
    label: "Aset Lainnya",
    icon: "",
    color: "#F472B6", // Pink
    badgeBg: "#FDF2F8",
    badgeText: "#DB2777",
    description: "Barang seni, jam tangan mewah, dan koleksi berharga",
  },
};

export function calculatePortfolio(
  raw: RawWealthAnalysis,
  sourceFiles: string[] = [],
): WealthPortfolio {
  const assets = raw.assets || [];
  const liabilities = raw.liabilities || [];

  // Sum total assets
  const totalAssetsIdr = assets.reduce(
    (sum, item) => sum + (Number(item.valueIdr) || 0),
    0,
  );

  // Sum total liabilities
  const totalLiabilitiesIdr = liabilities.reduce(
    (sum, item) => sum + (Number(item.amountIdr) || 0),
    0,
  );

  // Net worth
  const totalNetWorthIdr = totalAssetsIdr - totalLiabilitiesIdr;

  // Group by category
  const categoriesOrder: AssetCategory[] = [
    "PROPERTI",
    "SAHAM",
    "KAS_DEPOSITO",
    "OBLIGASI_SBN",
    "EMAS_LOGAM_MULIA",
    "KENDARAAN",
    "CRYPTO",
    "PERUSAHAAN_SENDIRI",
    "LAINNYA",
  ];

  const categoryMap = new Map<
    AssetCategory,
    { total: number; count: number }
  >();
  categoriesOrder.forEach((cat) =>
    categoryMap.set(cat, { total: 0, count: 0 }),
  );

  assets.forEach((item) => {
    const cat = categoriesOrder.includes(item.category)
      ? item.category
      : "LAINNYA";
    const current = categoryMap.get(cat) || { total: 0, count: 0 };
    categoryMap.set(cat, {
      total: current.total + (Number(item.valueIdr) || 0),
      count: current.count + 1,
    });
  });

  const categories: CategorySummary[] = categoriesOrder
    .map((cat) => {
      const data = categoryMap.get(cat) || { total: 0, count: 0 };
      const config = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.LAINNYA;
      const percentage =
        totalAssetsIdr > 0 ? (data.total / totalAssetsIdr) * 100 : 0;

      return {
        category: cat,
        label: config.label,
        icon: config.icon,
        totalIdr: data.total,
        itemCount: data.count,
        percentage: Number(percentage.toFixed(1)),
        color: config.color,
        badgeBg: config.badgeBg,
        badgeText: config.badgeText,
      };
    })
    .filter((c) => c.itemCount > 0 || c.totalIdr > 0)
    .sort((a, b) => b.totalIdr - a.totalIdr); // Sort descending by value like in reference image

  // Liquid assets = KAS_DEPOSITO + SAHAM + CRYPTO + OBLIGASI_SBN
  const liquidAssets =
    (categoryMap.get("KAS_DEPOSITO")?.total || 0) +
    (categoryMap.get("SAHAM")?.total || 0) +
    (categoryMap.get("CRYPTO")?.total || 0) +
    (categoryMap.get("OBLIGASI_SBN")?.total || 0);

  const liquidRatioPercentage =
    totalAssetsIdr > 0
      ? Number(((liquidAssets / totalAssetsIdr) * 100).toFixed(1))
      : 0;

  // Collect unique source files if not passed
  const detectedFiles =
    sourceFiles.length > 0
      ? sourceFiles
      : Array.from(new Set(assets.map((a) => a.sourceFile).filter(Boolean)));

  return {
    totalNetWorthIdr,
    totalAssetsIdr,
    totalLiabilitiesIdr,
    liquidRatioPercentage,
    executiveSummary:
      raw.executiveSummary || "Ringkasan portofolio berhasil diekstraksi.",
    keyHighlights: raw.keyHighlights || [],
    categories,
    assets,
    liabilities,
    analyzedAt: new Date().toISOString(),
    sourceFiles: detectedFiles,
  };
}
