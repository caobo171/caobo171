import { DEFAULT_INPUTS } from "./simulate";
import type { Inputs, SavingMode } from "./types";

/** Versioned, so a later change to Inputs cannot resurrect an incompatible shape. */
export const STORAGE_KEY = "evn30:inputs:v1";

const START_YEARS = [2016, 2018, 2020, 2022, 2024];
const MODES: SavingMode[] = ["percent", "fixed"];

/** Matches the ranges the controls allow, so a stored value cannot exceed them. */
const BOUNDS = {
  salaryToday: [0, 10_000_000_000],
  raisePct: [0, 20],
  ceilingPct: [0, 200],
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
    startYear:
      typeof o.startYear === "number" && START_YEARS.includes(o.startYear)
        ? o.startYear
        : DEFAULT_INPUTS.startYear,
    mode: MODES.includes(o.mode as SavingMode) ? (o.mode as SavingMode) : DEFAULT_INPUTS.mode,
    salaryToday: num(o.salaryToday, "salaryToday"),
    raisePct: num(o.raisePct, "raisePct"),
    ceilingPct: num(o.ceilingPct, "ceilingPct"),
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
