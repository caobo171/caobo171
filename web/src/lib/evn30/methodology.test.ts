import { describe, expect, test } from "vitest";

import { LANGS } from "./copy";
import { METHODOLOGY } from "./methodology";

describe("METHODOLOGY", () => {
  test("every language has the same sections, in the same order", () => {
    const shape = LANGS.map((l) => METHODOLOGY[l].map((s) => s.id));
    for (const ids of shape) expect(ids).toEqual(shape[0]);
    expect(shape[0].length).toBeGreaterThan(5);
  });

  test("no section is left empty", () => {
    for (const lang of LANGS) {
      for (const s of METHODOLOGY[lang]) {
        expect(s.heading.trim()).not.toBe("");
        expect(s.body.length).toBeGreaterThan(0);
        for (const p of s.body) expect(p.trim()).not.toBe("");
      }
    }
  });

  test("the Vietnamese is actually translated, not the English copied over", () => {
    for (const [i, en] of METHODOLOGY.en.entries()) {
      expect(METHODOLOGY.vi[i].heading).not.toBe(en.heading);
      expect(METHODOLOGY.vi[i].body.join(" ")).not.toBe(en.body.join(" "));
    }
  });

  test("each section id appears once", () => {
    const ids = METHODOLOGY.en.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("states the constants the engine actually uses", () => {
    // If a number here drifts from the code, the page is lying about itself.
    const vi = METHODOLOGY.vi.flatMap((s) => [...s.body, s.heading]).join(" ");
    for (const needed of ["100", "0,15%", "4%", "3,3%"]) {
      expect(vi).toContain(needed);
    }
  });
});
