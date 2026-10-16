export const DEFAULT_USD_RATE = 16000;
let currentUsdRate = DEFAULT_USD_RATE;

export function setGlobalUsdRate(rate: number): void {
  if (typeof rate === "number" && rate > 0) {
    currentUsdRate = rate;
  }
}

export function getGlobalUsdRate(): number {
  return currentUsdRate;
}

// For backwards compatibility
export const USD_RATE = DEFAULT_USD_RATE;

export function formatIdr(amount: number, isPrivate: boolean = false): string {
  if (isPrivate) return "Rp ••••••••••";
  if (isNaN(amount) || amount === null || amount === undefined) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCompactIdr(amount: number, isPrivate: boolean = false): string {
  if (isPrivate) return "Rp ••••";
  if (isNaN(amount) || amount === null || amount === undefined || amount === 0) return "Rp 0";

  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";

  if (abs >= 1_000_000_000_000) {
    return `${sign}Rp ${(abs / 1_000_000_000_000).toLocaleString("id-ID", { maximumFractionDigits: 2 })} Triliun`;
  }
  if (abs >= 1_000_000_000) {
    return `${sign}Rp ${(abs / 1_000_000_000).toLocaleString("id-ID", { maximumFractionDigits: 2 })} Miliar`;
  }
  if (abs >= 1_000_000) {
    return `${sign}Rp ${(abs / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} Juta`;
  }
  return formatIdr(amount, isPrivate);
}

export function formatUsd(
  amountIdr: number,
  isPrivate: boolean = false,
  rate: number = currentUsdRate
): string {
  if (isPrivate) return "$••••••••";
  if (isNaN(amountIdr) || amountIdr === null || amountIdr === undefined) return "$0";
  const validRate = rate > 0 ? rate : currentUsdRate;
  const usd = amountIdr / validRate;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(usd);
}

export function formatCompactUsd(
  amountIdr: number,
  isPrivate: boolean = false,
  rate: number = currentUsdRate
): string {
  if (isPrivate) return "$••••";
  if (isNaN(amountIdr) || !amountIdr) return "$0";
  const validRate = rate > 0 ? rate : currentUsdRate;
  const usd = amountIdr / validRate;
  if (usd >= 1_000_000_000) {
    return `$${(usd / 1_000_000_000).toFixed(2)}B`;
  }
  if (usd >= 1_000_000) {
    return `$${(usd / 1_000_000).toFixed(2)}M`;
  }
  if (usd >= 1_000) {
    return `$${(usd / 1_000).toFixed(1)}K`;
  }
  return formatUsd(amountIdr, isPrivate, validRate);
}

export function formatUsdEstimate(
  amountIdr: number,
  rate: number = currentUsdRate,
  isPrivate: boolean = false
): string {
  return formatCompactUsd(amountIdr, isPrivate, rate);
}

export function formatCurrencyValue(
  amountIdr: number,
  currencyMode: "IDR" | "USD" = "IDR",
  isPrivate: boolean = false,
  rate: number = currentUsdRate
): string {
  if (currencyMode === "USD") {
    return formatUsd(amountIdr, isPrivate, rate);
  }
  return formatIdr(amountIdr, isPrivate);
}

export function formatCompactCurrencyValue(
  amountIdr: number,
  currencyMode: "IDR" | "USD" = "IDR",
  isPrivate: boolean = false,
  rate: number = currentUsdRate
): string {
  if (currencyMode === "USD") {
    return formatCompactUsd(amountIdr, isPrivate, rate);
  }
  return formatCompactIdr(amountIdr, isPrivate);
}

export function formatDateIndo(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function angkaKeTerbilang(angka: number): string {
  if (isNaN(angka) || angka === null || angka === undefined) return "Nol Rupiah";
  const num = Math.floor(Math.abs(angka));
  if (num === 0) return "Nol Rupiah";

  const bilangan = [
    "",
    "Satu",
    "Dua",
    "Tiga",
    "Empat",
    "Lima",
    "Enam",
    "Tujuh",
    "Delapan",
    "Sembilan",
    "Sepuluh",
    "Sebelas",
  ];

  function konversi(n: number): string {
    if (n < 12) {
      return bilangan[n];
    } else if (n < 20) {
      return konversi(n - 10) + " Belas";
    } else if (n < 100) {
      return konversi(Math.floor(n / 10)) + " Puluh " + konversi(n % 10);
    } else if (n < 200) {
      return "Seratus " + konversi(n - 100);
    } else if (n < 1000) {
      return konversi(Math.floor(n / 100)) + " Ratus " + konversi(n % 100);
    } else if (n < 2000) {
      return "Seribu " + konversi(n - 1000);
    } else if (n < 1_000_000) {
      return konversi(Math.floor(n / 1000)) + " Ribu " + konversi(n % 1000);
    } else if (n < 1_000_000_000) {
      return konversi(Math.floor(n / 1_000_000)) + " Juta " + konversi(n % 1_000_000);
    } else if (n < 1_000_000_000_000) {
      return (
        konversi(Math.floor(n / 1_000_000_000)) +
        " Miliar " +
        konversi(n % 1_000_000_000)
      );
    } else if (n < 1_000_000_000_000_000) {
      return (
        konversi(Math.floor(n / 1_000_000_000_000)) +
        " Triliun " +
        konversi(n % 1_000_000_000_000)
      );
    }
    return "";
  }

  const hasil = konversi(num).replace(/\s+/g, " ").trim();
  return `${hasil} Rupiah`;
}

export function formatTerbilang(amount: number, isPrivate: boolean = false): string {
  if (isPrivate) return "••••••••••••••••••••";
  return angkaKeTerbilang(amount);
}

