export type AssetCategory =
  | "PROPERTI"
  | "SAHAM"
  | "KAS_DEPOSITO"
  | "OBLIGASI_SBN"
  | "EMAS_LOGAM_MULIA"
  | "KENDARAAN"
  | "CRYPTO"
  | "PERUSAHAAN_SENDIRI"
  | "LAINNYA";

export interface ExtractedAssetItem {
  id: string;
  name: string;
  category: AssetCategory;
  institution?: string;
  quantity?: number;
  unit?: string;
  valueIdr: number;
  originalCurrency?: string;
  originalValue?: number;
  sourceFile: string;
  notes?: string;
}

export interface ExtractedLiabilityItem {
  id: string;
  name: string;
  lender?: string;
  amountIdr: number;
  sourceFile: string;
  notes?: string;
}

export interface RawWealthAnalysis {
  executiveSummary: string;
  currency: "IDR";
  assets: ExtractedAssetItem[];
  liabilities: ExtractedLiabilityItem[];
  keyHighlights: string[];
}

export interface CategorySummary {
  category: AssetCategory;
  label: string;
  icon: string;
  totalIdr: number;
  itemCount: number;
  percentage: number;
  color: string;
  badgeBg: string;
  badgeText: string;
}

export interface WealthPortfolio {
  totalNetWorthIdr: number;
  totalAssetsIdr: number;
  totalLiabilitiesIdr: number;
  liquidRatioPercentage: number;
  executiveSummary: string;
  keyHighlights: string[];
  categories: CategorySummary[];
  assets: ExtractedAssetItem[];
  liabilities: ExtractedLiabilityItem[];
  analyzedAt: string;
  sourceFiles: string[];
  documentPreviews?: Record<
    string,
    { fileName: string; mimeType: string; dataUrl: string }
  >;
}

export interface UploadedFileItem {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  base64Data: string;
  previewUrl?: string;
}
