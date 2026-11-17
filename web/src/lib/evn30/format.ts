const millions = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const whole = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/**
 * 2_004_224_688 → "2,004.2M ₫". Vietnamese amounts are long; millions read
 * better. Anything under a million would round to "0.2M", so it goes in
 * thousands instead.
 */
export function money(vnd: number): string {
  if (!Number.isFinite(vnd) || vnd === 0) return "0 ₫";
  if (Math.abs(vnd) < 1_000_000) return `${whole.format(vnd / 1000)}k ₫`;
  return `${millions.format(vnd / 1_000_000)}M ₫`;
}

/** Always carries a sign, so a profit and a loss are told apart at a glance. */
export function signedMoney(vnd: number): string {
  return vnd > 0 ? `+${money(vnd)}` : money(vnd);
}

/** 0.117977 → "11.80%" */
export function percent(fraction: number, dp = 2): string {
  if (!Number.isFinite(fraction)) return "—";
  return `${(fraction * 100).toFixed(dp)}%`;
}

/** 30_000_000 → "30,000,000" — for the salary field, where the digits matter. */
export function plain(vnd: number): string {
  return whole.format(Math.round(vnd));
}
