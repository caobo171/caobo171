import type { Lang } from "./copy";

const LOCALE: Record<Lang, string> = { en: "en-US", vi: "vi-VN" };

const cache = new Map<string, Intl.NumberFormat>();
function fmt(lang: Lang, dp: number): Intl.NumberFormat {
  const key = `${lang}:${dp}`;
  let f = cache.get(key);
  if (!f) {
    f = new Intl.NumberFormat(LOCALE[lang], {
      minimumFractionDigits: dp,
      maximumFractionDigits: dp,
    });
    cache.set(key, f);
  }
  return f;
}

/**
 * Picks the unit the amount actually belongs in: thousands, millions, or tỉ.
 * Vietnamese amounts are long, and a plan running twenty years reaches billions,
 * where a single unit stops working — six billion dong rendered in millions is
 * "6.000,0 triệu ₫", which nobody reads at a glance. Each tier keeps three or
 * four significant figures, so tỉ gets two decimals where triệu gets one.
 */
export function money(vnd: number, lang: Lang = "en"): string {
  if (!Number.isFinite(vnd) || vnd === 0) return "0 ₫";
  const size = Math.abs(vnd);
  if (size < 1_000_000) {
    return `${fmt(lang, 0).format(vnd / 1000)}${lang === "vi" ? " nghìn ₫" : "k ₫"}`;
  }
  if (size < 1_000_000_000) {
    return `${fmt(lang, 1).format(vnd / 1_000_000)}${lang === "vi" ? " triệu ₫" : "M ₫"}`;
  }
  if (size < 1_000_000_000_000) {
    return `${fmt(lang, 2).format(vnd / 1_000_000_000)}${lang === "vi" ? " tỷ ₫" : "B ₫"}`;
  }
  return `${fmt(lang, 2).format(vnd / 1_000_000_000_000)}${lang === "vi" ? " nghìn tỷ ₫" : "T ₫"}`;
}

/** Always carries a sign, so a profit and a loss are told apart at a glance. */
export function signedMoney(vnd: number, lang: Lang = "en"): string {
  return vnd > 0 ? `+${money(vnd, lang)}` : money(vnd, lang);
}

/** 0.117977 → "11.80%" / "11,80%" */
export function percent(fraction: number, dp = 2, lang: Lang = "en"): string {
  if (!Number.isFinite(fraction)) return "—";
  return `${fmt(lang, dp).format(fraction * 100)}%`;
}

/** 30_000_000 → "30,000,000" — for the salary field, where the digits matter. */
export function plain(vnd: number, lang: Lang = "en"): string {
  return fmt(lang, 0).format(Math.round(vnd));
}

/** 149 chỉ → "14.9 lượng" / "14,9 lượng" */
export function tael(chi: number, lang: Lang = "en"): string {
  return `${fmt(lang, 1).format(chi / 10)} lượng`;
}

/** "2016-01" → "January 2016" / "tháng 1/2016" */
export function monthName(month: string, lang: Lang = "en"): string {
  const [y, m] = month.split("-");
  if (lang === "vi") return `tháng ${Number(m)}/${y}`;
  const date = new Date(Date.UTC(Number(y), Number(m) - 1, 1));
  return date.toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}

/** "2026-11-17" → "17 Nov 2026" / "17/11/2026" */
export function dayName(iso: string, lang: Lang = "en"): string {
  const [y, m, d] = iso.split("-");
  if (lang === "vi") return `${Number(d)}/${Number(m)}/${y}`;
  const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
  return date.toLocaleString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
