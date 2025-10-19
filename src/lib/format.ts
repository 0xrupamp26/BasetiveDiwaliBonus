export function shortAddress(addr?: string) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function formatDateTime(ts?: number | bigint) {
  if (!ts) return "";
  const millis = typeof ts === "bigint" ? Number(ts) * 1000 : (ts > 1e12 ? ts : ts * 1000);
  try {
    const d = new Date(millis);
    return d.toLocaleString();
  } catch {
    return "";
  }
}
