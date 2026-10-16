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

export function formatUsdEstimate(amountIdr: number, rate: number = 15800, isPrivate: boolean = false): string {
  if (isPrivate) return "$••••••";
  if (isNaN(amountIdr) || !amountIdr) return "$0";
  const usd = amountIdr / rate;
  if (usd >= 1_000_000) {
    return `$${(usd / 1_000_000).toFixed(2)}M`;
  }
  if (usd >= 1_000) {
    return `$${(usd / 1_000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(usd);
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

