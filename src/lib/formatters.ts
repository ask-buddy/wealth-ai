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

export function numberToEnglishWords(num: number): string {
  if (isNaN(num) || num === null || num === undefined) return "Zero US Dollars";
  const n = Math.floor(Math.abs(num));
  if (n === 0) return "Zero US Dollars";

  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  function convertChunk(val: number): string {
    let s = "";
    if (val >= 100) {
      s += ones[Math.floor(val / 100)] + " Hundred ";
      val %= 100;
    }
    if (val >= 20) {
      s += tens[Math.floor(val / 10)] + (val % 10 !== 0 ? "-" + ones[val % 10] : "") + " ";
    } else if (val > 0) {
      s += ones[val] + " ";
    }
    return s.trim();
  }

  function convert(val: number): string {
    if (val === 0) return "";
    let result = "";
    const trillions = Math.floor(val / 1_000_000_000_000);
    val %= 1_000_000_000_000;
    const billions = Math.floor(val / 1_000_000_000);
    val %= 1_000_000_000;
    const millions = Math.floor(val / 1_000_000);
    val %= 1_000_000;
    const thousands = Math.floor(val / 1000);
    const remainder = val % 1000;

    if (trillions > 0) result += convertChunk(trillions) + " Trillion ";
    if (billions > 0) result += convertChunk(billions) + " Billion ";
    if (millions > 0) result += convertChunk(millions) + " Million ";
    if (thousands > 0) result += convertChunk(thousands) + " Thousand ";
    if (remainder > 0) result += convertChunk(remainder) + " ";

    return result.trim();
  }

  const words = convert(n);
  const suffix = n === 1 ? "US Dollar" : "US Dollars";
  return `${words} ${suffix}`;
}

export function formatTerbilang(
  amountIdr: number,
  isPrivate: boolean = false,
  currencyMode: "IDR" | "USD" = "IDR",
  rate: number = currentUsdRate
): string {
  if (isPrivate) return "••••••••••••••••••••";
  if (currencyMode === "USD") {
    const validRate = rate > 0 ? rate : currentUsdRate;
    const usd = Math.round(amountIdr / validRate);
    return numberToEnglishWords(usd);
  }
  return angkaKeTerbilang(amountIdr);
}

