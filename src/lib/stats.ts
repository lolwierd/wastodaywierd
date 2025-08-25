export function mean(values: number[]): number {
  if (!values.length) return NaN;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function std(values: number[]): number | undefined {
  if (values.length < 2) return undefined;
  const m = mean(values);
  const v = mean(values.map((x) => (x - m) ** 2));
  return Math.sqrt(v);
}

// Returns percentile [0..100] of x within sorted or unsorted sample values.
// Uses linear interpolation between ranks.
export function percentileOf(x: number, sample: number[]): number {
  const vals = sample.filter((v) => Number.isFinite(v)).slice().sort((a, b) => a - b);
  const n = vals.length;
  if (n === 0) return NaN as unknown as number;
  if (x <= vals[0]) return 0;
  if (x >= vals[n - 1]) return 100;
  let lo = 0, hi = n - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (vals[mid] <= x) lo = mid; else hi = mid;
  }
  const frac = (x - vals[lo]) / (vals[hi] - vals[lo] || 1);
  const rank = lo + frac; // 0-indexed rank
  return (100 * rank) / (n - 1);
}
