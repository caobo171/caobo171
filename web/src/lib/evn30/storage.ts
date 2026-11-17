import type { Lang } from "./copy";
import { DEFAULT_INPUTS } from "./simulate";
import type { Inputs, SavingMode } from "./types";

/** Versioned, so a later change to Inputs cannot resurrect an incompatible shape. */
export const STORAGE_KEY = "evn30:inputs:v4";

const MODES: SavingMode[] = ["percent", "fixed"];

/** Matches the ranges the controls allow, so a stored value cannot exceed them. */
const BOUNDS = {
  salaryStart: [0, 10_000_000_000],
  initialCapital: [0, 1_000_000_000_000],
  raisePct: [0, 50],
  salaryCeiling: [0, 10_000_000_000],
  savePct: [0, 100],
  fixedAmount: [0, 10_000_000_000],
  monthlyCapVnd: [1_000_000, 100_000_000],
} as const;

function num(raw: unknown, key: keyof typeof BOUNDS): number {
  if (typeof raw !== "number" || !Number.isFinite(raw)) return DEFAULT_INPUTS[key];
  const [lo, hi] = BOUNDS[key];
  return Math.min(hi, Math.max(lo, raw));
}

/**
 * Anything in localStorage was last written by a browser we do not control and
 * may have been hand-edited, so every field is checked rather than trusted.
 * Returns null only when there is nothing usable at all; otherwise each bad
 * field falls back to its default.
 */
export function parseInputs(raw: string | null): Inputs | null {
  if (!raw) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null;

  const o = parsed as Record<string, unknown>;
  return {
    startMonth:
      typeof o.startMonth === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(o.startMonth)
        ? o.startMonth
        : DEFAULT_INPUTS.startMonth,
    // Empty is meaningful here: it means "run to the end of the data".
    endMonth:
      o.endMonth === "" ||
      (typeof o.endMonth === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(o.endMonth))
        ? o.endMonth
        : DEFAULT_INPUTS.endMonth,
    initialCapital: num(o.initialCapital, "initialCapital"),
    mode: MODES.includes(o.mode as SavingMode) ? (o.mode as SavingMode) : DEFAULT_INPUTS.mode,
    salaryStart: num(o.salaryStart, "salaryStart"),
    raisePct: num(o.raisePct, "raisePct"),
    salaryCeiling: num(o.salaryCeiling, "salaryCeiling"),
    savePct: num(o.savePct, "savePct"),
    fixedAmount: num(o.fixedAmount, "fixedAmount"),
    monthlyCapVnd: num(o.monthlyCapVnd, "monthlyCapVnd"),
  };
}

/** Never throws: storage can be blocked, full, or absent during prerender. */
export function loadInputs(): Inputs {
  try {
    return parseInputs(window.localStorage.getItem(STORAGE_KEY)) ?? DEFAULT_INPUTS;
  } catch {
    return DEFAULT_INPUTS;
  }
}

/**
 * The three pieces `useSyncExternalStore` needs. Reading the raw string (rather
 * than a parsed object) keeps the snapshot comparable by value, so React does
 * not re-render forever.
 */
export function readStoredRaw(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Nothing is stored during prerender, so the server snapshot is always empty. */
export function readServerRaw(): null {
  return null;
}

/** Fires when another tab changes the stored inputs. */
export function subscribeToStored(onChange: () => void): () => void {
  try {
    window.addEventListener("storage", onChange);
    return () => window.removeEventListener("storage", onChange);
  } catch {
    return () => {};
  }
}

/** Never throws, for the same reasons. A failed save just means it is not remembered. */
export function saveInputs(inputs: Inputs): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs));
  } catch {
    /* private mode, quota, or no window — not worth bothering the reader about */
  }
}

/** The reader's language is remembered separately from the scenario. */
export const LANG_KEY = "evn30:lang:v1";

export function parseLang(raw: string | null): Lang {
  return raw === "vi" || raw === "en" ? raw : "en";
}

/**
 * The stored choice if there is one, otherwise a guess from the browser —
 * a Vietnamese reader should not have to ask for a Vietnamese page.
 */
export function readStoredLangRaw(): string | null {
  try {
    const stored = window.localStorage.getItem(LANG_KEY);
    if (stored) return stored;
    return window.navigator.language?.toLowerCase().startsWith("vi") ? "vi" : "en";
  } catch {
    return null;
  }
}

/** Prerender has no browser to ask, so the server always says English. */
export function readServerLangRaw(): null {
  return null;
}

export function saveLang(lang: Lang): void {
  try {
    window.localStorage.setItem(LANG_KEY, lang);
  } catch {
    /* nothing worth telling the reader */
  }
}
