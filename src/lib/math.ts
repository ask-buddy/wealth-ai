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
    color: "#D9826C", // Soft Terracotta / Warm Brick (identik dengan bata & tanah liat)
    badgeBg: "#FDF3F0",
    badgeText: "#9E4732",
    description: "Tanah, rumah hunian, ruko komersial, dan apartemen",
  },
  SAHAM: {
    label: "Saham (IHSG & US)",
    icon: "",
    color: "#5B9BD5", // Lively Cornflower Blue (identik dengan grafik bursa & korporat modern)
    badgeBg: "#EFF6FC",
    badgeText: "#2B6296",
    description: "Portofolio saham bursa dan indeks ekuitas",
  },
  KAS_DEPOSITO: {
    label: "Kas & Deposito",
    icon: "",
    color: "#52B788", // Fresh Mint Emerald (identik dengan uang tunai, likuiditas & pertumbuhan)
    badgeBg: "#EEF8F3",
    badgeText: "#287A54",
    description: "Tabungan bank, deposito berjangka, dan kas likuid",
  },
  OBLIGASI_SBN: {
    label: "Obligasi & SBN",
    icon: "",
    color: "#48A9A6", // Soft Seafoam Teal (memberi kesan stabil, aman, & institusional)
    badgeBg: "#EDF7F7",
    badgeText: "#256E6C",
    description: "Surat Berharga Negara, Sukuk, dan Obligasi korporasi",
  },
  EMAS_LOGAM_MULIA: {
    label: "Emas & Logam Mulia",
    icon: "",
    color: "#E0A952", // Warm Honey Gold (kuning keemasan yang hidup, tidak kusam/cokelat)
    badgeBg: "#FCF7EE",
    badgeText: "#94661B",
    description: "Emas batangan Antam, perak, dan logam mulia fisik",
  },
  KENDARAAN: {
    label: "Kendaraan",
    icon: "",
    color: "#6C8EAD", // Soft Steel Blue / Automotive Silver-Blue (dipisah dari warna tanah properti)
    badgeBg: "#F1F5F9",
    badgeText: "#3D5A75",
    description: "Mobil mewah, motor koleksi, dan kendaraan pribadi",
  },
  CRYPTO: {
    label: "Kripto (BTC & ETH)",
    icon: "",
    color: "#9B7EDE", // Lively Soft Lavender / Web3 Purple (modern, digital, & hidup)
    badgeBg: "#F5F2FC",
    badgeText: "#5E41A1",
    description: "Bitcoin, Ethereum, stablecoin, dan web3 assets",
  },
  PERUSAHAAN_SENDIRI: {
    label: "Perusahaan & Bisnis",
    icon: "",
    color: "#6E78B8", // Soft Periwinkle Indigo (kesan eksekutif, profesional, namun tetap cerah)
    badgeBg: "#F1F2FA",
    badgeText: "#414A87",
    description: "Kepemilikan saham perseroan tertutup, CV, dan ekuitas bisnis",
  },
  LAINNYA: {
    label: "Aset Lainnya",
    icon: "",
    color: "#B5927B", // Soft Warm Camel / Sand (kesan barang koleksi, kulit, & jam tangan mewah)
    badgeBg: "#F9F5F2",
    badgeText: "#785843",
    description: "Barang seni, jam tangan mewah, dan koleksi berharga",
  },
};

export function parseFlexibleNumber(val: any): number {
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  if (!val) return 0;
  if (typeof val === "string") {
    let s = val.trim();
    // Strip currency symbols and whitespace
    s = s.replace(/^(Rp\.?|IDR|\$|USD)\s*/i, "").trim();

    // Check if format has both dots and commas (e.g. "56,498.48" or "1.234.567,89")
    if (s.includes(",") && s.includes(".")) {
      const lastComma = s.lastIndexOf(",");
      const lastDot = s.lastIndexOf(".");
      if (lastDot > lastComma) {
        // Format: 56,498.48 (US/English style: comma thousands, dot decimal)
        s = s.replace(/,/g, "");
        const parsed = parseFloat(s);
        return isNaN(parsed) ? 0 : Math.round(parsed);
      } else {
        // Format: 56.498,48 (ID/European style: dot thousands, comma decimal)
        s = s.replace(/\./g, "").replace(",", ".");
        const parsed = parseFloat(s);
        return isNaN(parsed) ? 0 : Math.round(parsed);
      }
    }

    // Only commas (e.g. "56,498" or "12,5")
    if (s.includes(",") && !s.includes(".")) {
      const parts = s.split(",");
      if (
        parts.length > 1 &&
        parts.every((p, i) => i === 0 || p.length === 3)
      ) {
        s = s.replace(/,/g, "");
      } else {
        s = s.replace(",", ".");
      }
      const parsed = parseFloat(s);
      return isNaN(parsed) ? 0 : Math.round(parsed);
    }

    // Only dots (e.g. "136.248" or "10.000" or "4.000.000.000" or "0.011")
    if (s.includes(".") && !s.includes(",")) {
      const parts = s.split(".");
      // Multiple dots (e.g. "4.000.000.000") -> definitely thousands separator
      if (parts.length > 2) {
        s = s.replace(/\./g, "");
        const parsed = parseFloat(s);
        return isNaN(parsed) ? 0 : parsed;
      }
      // Single dot: e.g. "136.248" or "10.000" vs "0.011"
      if (parts.length === 2) {
        const [intPart, fracPart] = parts;
        // In Indonesian currency, if fracPart is 3 digits and intPart is not "0" (e.g. "136.248", "10.000", "21.782")
        if (fracPart.length === 3 && intPart !== "0") {
          s = s.replace(".", "");
          const parsed = parseFloat(s);
          return isNaN(parsed) ? 0 : parsed;
        } else {
          // Fractional decimal like 0.011
          const parsed = parseFloat(s);
          return isNaN(parsed) ? 0 : parsed;
        }
      }
    }

    // Plain digits or fallback
    const cleanStr = s.replace(/[^0-9.-]+/g, "");
    const parsed = parseFloat(cleanStr);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

export function normalizeCategory(cat: string | undefined): AssetCategory {
  if (!cat) return "LAINNYA";
  const upper = String(cat)
    .toUpperCase()
    .trim()
    .replace(/[\s-_]+/g, "_");

  // Direct exact match
  const validCategories: AssetCategory[] = [
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
  if (validCategories.includes(upper as AssetCategory)) {
    return upper as AssetCategory;
  }

  if (
    upper.includes("SAHAM") ||
    upper.includes("STOCK") ||
    upper.includes("EQUITY") ||
    upper.includes("REKSA") ||
    upper.includes("MUTUAL")
  ) {
    return "SAHAM";
  }
  if (
    upper.includes("KAS") ||
    upper.includes("DEPOSITO") ||
    upper.includes("BANK") ||
    upper.includes("CASH") ||
    upper.includes("SAVING") ||
    upper.includes("GIRO") ||
    upper.includes("DOMPET") ||
    upper.includes("WALLET")
  ) {
    return "KAS_DEPOSITO";
  }
  if (
    upper.includes("CRYPTO") ||
    upper.includes("KRIPTO") ||
    upper.includes("BTC") ||
    upper.includes("ETH") ||
    upper.includes("USDT")
  ) {
    return "CRYPTO";
  }
  if (
    upper.includes("PROPERTI") ||
    upper.includes("PROPERTY") ||
    upper.includes("TANAH") ||
    upper.includes("RUMAH") ||
    upper.includes("APARTEMEN") ||
    upper.includes("RUKO") ||
    upper.includes("REAL_ESTATE")
  ) {
    return "PROPERTI";
  }
  if (
    upper.includes("OBLIGASI") ||
    upper.includes("SBN") ||
    upper.includes("SUKUK") ||
    upper.includes("BOND")
  ) {
    return "OBLIGASI_SBN";
  }
  if (
    upper.includes("EMAS") ||
    upper.includes("GOLD") ||
    upper.includes("LOGAM") ||
    upper.includes("PERAK") ||
    upper.includes("SILVER")
  ) {
    return "EMAS_LOGAM_MULIA";
  }
  if (
    upper.includes("KENDARAAN") ||
    upper.includes("VEHICLE") ||
    upper.includes("MOBIL") ||
    upper.includes("MOTOR") ||
    upper.includes("CAR")
  ) {
    return "KENDARAAN";
  }
  if (
    upper.includes("PERUSAHAAN") ||
    upper.includes("BISNIS") ||
    upper.includes("BUSINESS") ||
    upper.includes("STARTUP") ||
    upper.includes("CV") ||
    upper.includes("PT")
  ) {
    return "PERUSAHAAN_SENDIRI";
  }

  // Fallback to LAINNYA if not recognized
  return "LAINNYA";
}

export function calculatePortfolio(
  raw: RawWealthAnalysis,
  sourceFiles: string[] = [],
): WealthPortfolio {
  const rawAssets =
    raw.assets || (raw as any).assetList || (raw as any).Assets || [];
  const rawLiabilities =
    raw.liabilities ||
    (raw as any).liabilityList ||
    (raw as any).Liabilities ||
    [];

  // Robust asset normalization supporting valueIdr, valueIDR, description, etc.
  const assets: ExtractedAssetItem[] = rawAssets.map(
    (item: any, idx: number) => {
      const value = parseFlexibleNumber(
        item.valueIdr ??
          item.valueIDR ??
          item.value_idr ??
          item.value ??
          item.amountIdr ??
          item.amountIDR ??
          item.amount ??
          item.nominal ??
          item.totalValue ??
          item.totalValueIDR ??
          item.total,
      );

      return {
        id: String(
          item.id ||
            item.ID ||
            `ast-${idx + 1}-${Math.random().toString(36).substring(2, 7)}`,
        ),
        name: item.name || item.assetName || item.nama || `Aset #${idx + 1}`,
        category: normalizeCategory(item.category),
        institution:
          item.institution || item.platform || item.broker || item.bank || "",
        quantity:
          parseFlexibleNumber(
            item.quantity ?? item.volume ?? item.lot ?? item.shares,
          ) || undefined,
        unit: item.unit || item.satuan || undefined,
        valueIdr: value,
        originalCurrency: item.originalCurrency || item.currency || "IDR",
        originalValue:
          parseFlexibleNumber(item.originalValue ?? item.original_value) ||
          value,
        sourceFile:
          item.sourceFile ||
          item.source_file ||
          item.fileName ||
          sourceFiles[0] ||
          "Dokumen Sumber",
        notes:
          item.notes ||
          item.description ||
          item.keterangan ||
          item.deskripsi ||
          undefined,
      };
    },
  );

  // Robust liability normalization supporting amountIdr, amountIDR, etc.
  const liabilities: ExtractedLiabilityItem[] = rawLiabilities.map(
    (item: any, idx: number) => {
      const amount = parseFlexibleNumber(
        item.amountIdr ??
          item.amountIDR ??
          item.amount_idr ??
          item.amount ??
          item.valueIdr ??
          item.valueIDR ??
          item.value ??
          item.nominal ??
          item.total,
      );

      return {
        id: String(
          item.id ||
            item.ID ||
            `lia-${idx + 1}-${Math.random().toString(36).substring(2, 7)}`,
        ),
        name:
          item.name ||
          item.liabilityName ||
          item.nama ||
          `Liabilitas #${idx + 1}`,
        lender:
          item.lender || item.creditor || item.kreditor || item.bank || "",
        amountIdr: amount,
        sourceFile:
          item.sourceFile ||
          item.source_file ||
          item.fileName ||
          sourceFiles[0] ||
          "Dokumen Sumber",
        notes: item.notes || item.description || item.keterangan || undefined,
      };
    },
  );

  // Sum total assets
  const calculatedAssetsTotal = assets.reduce(
    (sum, item) => sum + (Number(item.valueIdr) || 0),
    0,
  );
  const rawFallbackAssetsTotal = parseFlexibleNumber(
    (raw as any).totalAssetsIdr ??
      (raw as any).totalAssetsIDR ??
      (raw as any).total_assets_idr,
  );
  const totalAssetsIdr =
    calculatedAssetsTotal > 0 ? calculatedAssetsTotal : rawFallbackAssetsTotal;

  // Sum total liabilities
  const calculatedLiabilitiesTotal = liabilities.reduce(
    (sum, item) => sum + (Number(item.amountIdr) || 0),
    0,
  );
  const rawFallbackLiabilitiesTotal = parseFlexibleNumber(
    (raw as any).totalLiabilitiesIdr ??
      (raw as any).totalLiabilitiesIDR ??
      (raw as any).total_liabilities_idr,
  );
  const totalLiabilitiesIdr =
    calculatedLiabilitiesTotal > 0
      ? calculatedLiabilitiesTotal
      : rawFallbackLiabilitiesTotal;

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
    .sort((a, b) => b.totalIdr - a.totalIdr);

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

  // Executive summary with fallback
  let executiveSummary =
    raw.executiveSummary ||
    (raw as any).summary ||
    (raw as any).ringkasan ||
    "";

  if (!executiveSummary || executiveSummary.trim().length === 0) {
    if (assets.length > 0) {
      const topCategory = categories[0]?.label || "Aset Terdaftar";
      executiveSummary = `Audit portofolio berhasil mengidentifikasi ${assets.length} instrumen aset dengan total akumulasi ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(totalNetWorthIdr)}. Konsentrasi alokasi terbesar berada pada sektor ${topCategory}.`;
    } else {
      executiveSummary =
        "Dokumen berhasil diproses in-memory tanpa liabilitas berlebih.";
    }
  }

  // Key highlights with fallback
  let keyHighlights = raw.keyHighlights || (raw as any).highlights || [];
  if (!keyHighlights || keyHighlights.length === 0) {
    keyHighlights = [
      `Total ${assets.length} instrumen aset terverifikasi dari dokumen sumber.`,
      `Rasio likuiditas kas & instrumen bursa tercatat sebesar ${liquidRatioPercentage}%.`,
      totalLiabilitiesIdr === 0
        ? "Bebas dari liabilitas atau beban hutang tercatat."
        : `Total liabilitas tercatat sebesar ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(totalLiabilitiesIdr)}.`,
    ];
  }

  return {
    totalNetWorthIdr,
    totalAssetsIdr,
    totalLiabilitiesIdr,
    liquidRatioPercentage,
    executiveSummary,
    keyHighlights,
    categories,
    assets,
    liabilities,
    analyzedAt: new Date().toISOString(),
    sourceFiles: detectedFiles,
  };
}

export function removeAssetFromPortfolio(
  portfolio: WealthPortfolio,
  assetId: string
): WealthPortfolio {
  const updatedAssets = portfolio.assets.filter((a) => a.id !== assetId);
  const recalculated = calculatePortfolio(
    {
      ...portfolio,
      currency: "IDR",
      assets: updatedAssets,
      liabilities: portfolio.liabilities,
    },
    portfolio.sourceFiles || []
  );

  return {
    ...recalculated,
    analyzedAt: portfolio.analyzedAt,
    documentPreviews: portfolio.documentPreviews,
  };
}

export function removeLiabilityFromPortfolio(
  portfolio: WealthPortfolio,
  liabilityId: string
): WealthPortfolio {
  const updatedLiabilities = (portfolio.liabilities || []).filter(
    (l) => l.id !== liabilityId
  );
  const recalculated = calculatePortfolio(
    {
      ...portfolio,
      currency: "IDR",
      assets: portfolio.assets,
      liabilities: updatedLiabilities,
    },
    portfolio.sourceFiles || []
  );

  return {
    ...recalculated,
    analyzedAt: portfolio.analyzedAt,
    documentPreviews: portfolio.documentPreviews,
  };
}
