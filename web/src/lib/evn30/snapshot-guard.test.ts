import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

import { checkPlausible } from "../../../scripts/refresh-evn30.mjs";
import type { Snapshot, SnapshotMonth } from "./types";

const here = path.dirname(fileURLToPath(import.meta.url));
const snapshot = JSON.parse(
  readFileSync(path.join(here, "../../data/evn30-snapshot.json"), "utf8"),
) as Snapshot;

const rows = (): SnapshotMonth[] => JSON.parse(JSON.stringify(snapshot.months));

describe("checkPlausible", () => {
  test("accepts the snapshot that is actually committed", () => {
    expect(() => checkPlausible(rows())).not.toThrow();
  });

  test("rejects a row where the gold columns have been swapped", () => {
    // The failure that matters most: it parses cleanly, and silently turns
    // gold's 2.2% spread from a cost into a gain.
    const months = rows();
    const victim = months[60];
    [victim.goldBuy, victim.goldSell] = [victim.goldSell, victim.goldBuy];
    expect(() => checkPlausible(months)).toThrow(/goldSell .* is not above goldBuy/);
  });

  test("rejects gold priced in the wrong unit", () => {
    const months = rows();
    // Per chi rather than per luong — a tenth of the real figure.
    months.forEach((m) => {
      m.goldBuy /= 10;
      m.goldSell /= 10;
    });
    expect(() => checkPlausible(months)).toThrow(/goldSell .* out of range/);
  });

  test("rejects an ETF price in dong rather than thousands", () => {
    const months = rows();
    months.forEach((m) => (m.etf *= 1000));
    expect(() => checkPlausible(months)).toThrow(/etf .* out of range/);
  });

  test("rejects an impossible jump between two months", () => {
    const months = rows();
    months[80].etf = months[79].etf * 3;
    expect(() => checkPlausible(months)).toThrow(/etf moved/);
  });

  test("names the month that failed, so the error is actionable", () => {
    const months = rows();
    months[12].goldSell = months[12].goldBuy;
    expect(() => checkPlausible(months)).toThrow(new RegExp(months[12].month));
  });
});
