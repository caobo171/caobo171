import { afterEach, describe, expect, test, vi } from "vitest";

import { DEFAULT_INPUTS } from "./simulate";
import {
  LANG_KEY,
  loadInputs,
  parseInputs,
  parseLang,
  parseTheme,
  readStoredLangRaw,
  saveInputs,
  STORAGE_KEY,
} from "./storage";
import type { Inputs } from "./types";

/** Minimal stand-in; the node test environment has no localStorage. */
function stubStorage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  const storage = {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
  };
  vi.stubGlobal("window", { localStorage: storage });
  return map;
}

/** A browser with a URL and a language, for the things that read both. */
function stubBrowser({
  search = "",
  stored,
  language = "en-US",
}: { search?: string; stored?: string; language?: string } = {}) {
  const map = new Map<string, string>();
  if (stored !== undefined) map.set(LANG_KEY, stored);
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (k: string) => map.get(k) ?? null,
      setItem: (k: string, v: string) => void map.set(k, v),
    },
    location: { search },
    navigator: { language },
  });
}

afterEach(() => vi.unstubAllGlobals());

describe("parseInputs", () => {
  test("returns null when there is nothing stored", () => {
    expect(parseInputs(null)).toBeNull();
  });

  test("returns null for anything that is not a JSON object", () => {
    expect(parseInputs("not json at all")).toBeNull();
    expect(parseInputs("[1,2,3]")).toBeNull();
    expect(parseInputs("42")).toBeNull();
    expect(parseInputs("null")).toBeNull();
  });

  test("fills missing fields from the defaults", () => {
    expect(parseInputs("{}")).toEqual(DEFAULT_INPUTS);
    expect(parseInputs(JSON.stringify({ savePct: 40 }))).toEqual({
      ...DEFAULT_INPUTS,
      savePct: 40,
    });
  });

  test("replaces values of the wrong type with the default", () => {
    const got = parseInputs(
      JSON.stringify({ savePct: "forty", raisePct: null, salaryStart: "30000000" }),
    );
    expect(got?.savePct).toBe(DEFAULT_INPUTS.savePct);
    expect(got?.raisePct).toBe(DEFAULT_INPUTS.raisePct);
    expect(got?.salaryStart).toBe(DEFAULT_INPUTS.salaryStart);
  });

  test("replaces NaN and Infinity with the default", () => {
    // JSON cannot carry them, but a hand-edited value can arrive as a string.
    const got = parseInputs('{"savePct": 1e999, "raisePct": "NaN"}');
    expect(Number.isFinite(got!.savePct)).toBe(true);
    expect(got!.savePct).toBe(DEFAULT_INPUTS.savePct);
    expect(got!.raisePct).toBe(DEFAULT_INPUTS.raisePct);
  });

  test("accepts a raise up to the slider's maximum", () => {
    expect(parseInputs(JSON.stringify({ raisePct: 50 }))!.raisePct).toBe(50);
    expect(parseInputs(JSON.stringify({ raisePct: 80 }))!.raisePct).toBe(50);
  });

  test("clamps numbers to the range the controls allow", () => {
    const got = parseInputs(
      JSON.stringify({
        savePct: 250,
        raisePct: -5,
        salaryCeiling: 99_999_999_999,
        monthlyCapVnd: 1,
        salaryStart: -100,
        fixedAmount: -1,
      }),
    )!;
    expect(got.savePct).toBe(100);
    expect(got.raisePct).toBe(0);
    expect(got.salaryCeiling).toBe(10_000_000_000);
    expect(got.monthlyCapVnd).toBe(1_000_000);
    expect(got.salaryStart).toBe(0);
    expect(got.fixedAmount).toBe(0);
  });

  test("only accepts a well-formed start month", () => {
    expect(parseInputs(JSON.stringify({ startMonth: "2020-07" }))!.startMonth).toBe("2020-07");
    for (const bad of ["2020-13", "2020-00", "2020-7", "July 2020", "2020", 202007]) {
      expect(parseInputs(JSON.stringify({ startMonth: bad }))!.startMonth).toBe(
        DEFAULT_INPUTS.startMonth,
      );
    }
  });

  test("only accepts a known saving mode", () => {
    expect(parseInputs(JSON.stringify({ mode: "fixed" }))!.mode).toBe("fixed");
    expect(parseInputs(JSON.stringify({ mode: "sideways" }))!.mode).toBe(DEFAULT_INPUTS.mode);
  });
});

describe("loadInputs / saveInputs", () => {
  test("round-trips through localStorage", () => {
    stubStorage();
    const mine: Inputs = { ...DEFAULT_INPUTS, mode: "fixed", fixedAmount: 3_000_000 };
    saveInputs(mine);
    expect(loadInputs()).toEqual(mine);
  });

  test("falls back to the defaults when nothing is stored", () => {
    stubStorage();
    expect(loadInputs()).toEqual(DEFAULT_INPUTS);
  });

  test("falls back to the defaults when the stored value is corrupt", () => {
    stubStorage({ [STORAGE_KEY]: "{oh no" });
    expect(loadInputs()).toEqual(DEFAULT_INPUTS);
  });

  test("survives storage being unavailable", () => {
    vi.stubGlobal("window", {
      get localStorage(): never {
        throw new Error("blocked in private mode");
      },
    });
    expect(() => saveInputs(DEFAULT_INPUTS)).not.toThrow();
    expect(loadInputs()).toEqual(DEFAULT_INPUTS);
  });

  test("returns the defaults when there is no window at all", () => {
    vi.stubGlobal("window", undefined);
    expect(loadInputs()).toEqual(DEFAULT_INPUTS);
    expect(() => saveInputs(DEFAULT_INPUTS)).not.toThrow();
  });
});

describe("parseLang", () => {
  test("accepts the two languages the page has", () => {
    expect(parseLang("vi")).toBe("vi");
    expect(parseLang("en")).toBe("en");
  });

  test("falls back to English for anything else", () => {
    for (const bad of [null, "", "fr", "VI", "vi-VN", "{}"]) expect(parseLang(bad)).toBe("en");
  });
});

describe("parseInputs — milestones", () => {
  const withMilestones = (milestones: unknown) =>
    parseInputs(JSON.stringify({ ...DEFAULT_INPUTS, milestones }));

  const ok = { id: "a", name: "Mua nhà", year: 2030, upfront: 1_000_000_000, annual: 80_000_000, years: 20 };

  test("keeps a well-formed milestone", () => {
    expect(withMilestones([ok])!.milestones).toEqual([ok]);
  });

  test("anything that is not an array becomes no milestones", () => {
    expect(withMilestones("nhà")!.milestones).toEqual([]);
    expect(withMilestones({ year: 2030 })!.milestones).toEqual([]);
    expect(withMilestones(null)!.milestones).toEqual([]);
  });

  test("drops entries that are not objects", () => {
    expect(withMilestones([ok, "xe", 7, null])!.milestones).toEqual([ok]);
  });

  test("clamps numbers into their ranges instead of trusting them", () => {
    const wild = { ...ok, year: 9999, upfront: -5, annual: 1e30, years: 5000 };
    const [m] = withMilestones([wild])!.milestones;
    expect(m.year).toBeLessThanOrEqual(2200);
    expect(m.upfront).toBe(0);
    expect(m.annual).toBeLessThanOrEqual(100_000_000_000);
    expect(m.years).toBeLessThanOrEqual(100);
  });

  test("replaces a non-numeric field with zero rather than NaN", () => {
    const [m] = withMilestones([{ ...ok, upfront: "nhiều", years: null }])!.milestones;
    expect(m.upfront).toBe(0);
    expect(m.years).toBe(0);
  });

  test("gives every milestone an id, so the engine cannot confuse two of them", () => {
    const ids = withMilestones([{ ...ok, id: "" }, { ...ok, id: undefined }])!.milestones.map(
      (m) => m.id,
    );
    expect(ids.filter(Boolean)).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
  });

  test("truncates a name that would wreck the layout", () => {
    const [m] = withMilestones([{ ...ok, name: "x".repeat(500) }])!.milestones;
    expect(m.name.length).toBeLessThanOrEqual(60);
  });

  test("caps how many milestones a hand-edited blob can define", () => {
    const many = Array.from({ length: 50 }, (_, i) => ({ ...ok, id: `m${i}` }));
    expect(withMilestones(many)!.milestones.length).toBeLessThanOrEqual(12);
  });
});

describe("parseTheme", () => {
  test("keeps a choice the reader actually made", () => {
    expect(parseTheme("dark")).toBe("dark");
    expect(parseTheme("light")).toBe("light");
    expect(parseTheme("system")).toBe("system");
  });

  test("falls back to following the system for anything else", () => {
    // Includes the case that matters: nothing stored, because nobody has
    // touched the control yet.
    expect(parseTheme(null)).toBe("system");
    expect(parseTheme("")).toBe("system");
    expect(parseTheme("DARK")).toBe("system");
    expect(parseTheme('{"theme":"dark"}')).toBe("system");
  });
});


describe("readStoredLangRaw", () => {
  test("a lang in the URL wins, so a shared link reads as the sender saw it", () => {
    stubBrowser({ search: "?lang=vi", stored: "en", language: "en-US" });
    expect(readStoredLangRaw()).toBe("vi");

    stubBrowser({ search: "?lang=en", stored: "vi", language: "vi-VN" });
    expect(readStoredLangRaw()).toBe("en");
  });

  test("the param survives other query string entries", () => {
    stubBrowser({ search: "?utm_source=x&lang=vi&ref=y", stored: "en" });
    expect(readStoredLangRaw()).toBe("vi");
  });

  test("a language the page does not have is ignored rather than obeyed", () => {
    stubBrowser({ search: "?lang=fr", stored: "vi" });
    expect(readStoredLangRaw()).toBe("vi");
  });

  test("with no param it still remembers, then still guesses", () => {
    stubBrowser({ stored: "vi", language: "en-US" });
    expect(readStoredLangRaw()).toBe("vi");

    stubBrowser({ language: "vi-VN" });
    expect(readStoredLangRaw()).toBe("vi");

    stubBrowser({ language: "en-GB" });
    expect(readStoredLangRaw()).toBe("en");
  });
});
