export function formatINR(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return "—";
  return "₹" + value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatMarketCap(value: number | null | undefined): string {
  if (!value) return "—";
  const crore = value / 1e7;
  if (crore >= 1_00_000) {
    return "₹" + (crore / 1_00_000).toLocaleString("en-IN", { maximumFractionDigits: 2 }) + " L.Cr";
  }
  return "₹" + Math.round(crore).toLocaleString("en-IN") + " Cr";
}

export function formatVolume(value: number | null | undefined): string {
  if (!value) return "—";
  if (value >= 1_00_00_000) return (value / 1_00_00_000).toFixed(2) + " Cr";
  if (value >= 1_00_000) return (value / 1_00_000).toFixed(2) + " L";
  if (value >= 1_000) return (value / 1_000).toFixed(1) + "K";
  return value.toString();
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function formatCompact(value: number): string {
  return formatMarketCap(value);
}

export function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
