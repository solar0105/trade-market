export const fmt = (n) => Number(n).toLocaleString('zh-CN');
export const fmtPct = (p) => (p >= 0 ? '+' : '') + p.toFixed(1) + '%';

const pad2 = (n) => String(n).padStart(2, '0');

/** 秒数 -> "HH:MM:SS" */
export function hms(totalSeconds) {
  const s = ((totalSeconds % 86400) + 86400) % 86400;
  return `${pad2(Math.floor(s / 3600))}:${pad2(Math.floor((s % 3600) / 60))}:${pad2(s % 60)}`;
}