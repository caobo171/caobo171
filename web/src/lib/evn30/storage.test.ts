import { afterEach, describe, expect, test, vi } from "vitest";

import { DEFAULT_INPUTS } from "./simulate";
import { loadInputs, parseInputs, parseLang, saveInputs, STORAGE_KEY } from "./storage";
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
