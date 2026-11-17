import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

import { money, percent, signedMoney } from "./format";
import { DEFAULT_INPUTS, simulate } from "./simulate";
import type { Snapshot } from "./types";

const snapshot = JSON.parse(
  readFileSync(
    path.join(path.dirname(fileURLToPath(import.meta.url)), "../../data/evn30-snapshot.json"),
    "utf8",
  ),
) as Snapshot;

const channel = (r: ReturnType<typeof simulate>, key: string) =>
  r.channels.find((c) => c.key === key)!;

describe("simulate", () => {
  test("reproduces the published default scenario", () => {
    const r = simulate(snapshot, DEFAULT_INPUTS);

    expect(r.months).toHaveLength(131);
    expect(r.salaryStart).toBeCloseTo(18_750_000, 0);
    expect(r.salaryEnd).toBeCloseTo(30_000_000, 0);
    expect(r.ceilingYear).toBe(2023);
    expect(r.firstContribution).toBeCloseTo(4_687_500, 0);
    expect(r.lastContribution).toBeCloseTo(7_500_000, 0);
    expect(r.paidIn).toBeCloseTo(854_407_688.99, 0);
    expect(r.paidInToday).toBeCloseTo(990_121_907.09, 0);
    expect(r.inflationFactor).toBeCloseTo(1.36415, 4);

    expect(channel(r, "gold").value).toBeCloseTo(2_004_224_688.99, 0);
    expect(channel(r, "etf").value).toBeCloseTo(1_579_229_338.99, 0);
    expect(channel(r, "bank").value).toBeCloseTo(1_155_942_825.34, 0);

    expect(channel(r, "gold").xirr).toBeCloseTo(0.161715, 5);
    expect(channel(r, "etf").xirr).toBeCloseTo(0.117977, 5);
    expect(channel(r, "bank").xirr).toBeCloseTo(0.059225, 5);
  });

  test("orders channels by return, best first", () => {
    const r = simulate(snapshot, DEFAULT_INPUTS);
    expect(r.channels.map((c) => c.key)).toEqual(["gold", "etf", "bank"]);
  });

  test("reports the deepest fall from peak for each channel", () => {
    const r = simulate(snapshot, DEFAULT_INPUTS);
    // The final point is restated at today's prices, so gold's fall includes the
    // pullback since the start of this month.
    expect(channel(r, "gold").maxDrawdown).toBeCloseTo(-0.24815, 4);
    expect(channel(r, "etf").maxDrawdown).toBeCloseTo(-0.2665, 3);
    expect(channel(r, "bank").maxDrawdown).toBe(0);
  });

  test("charges gold the buy/sell spread", () => {
    // 149 chi bought at goldSell, valued at goldBuy, plus the cash that never bought.
    const r = simulate(snapshot, DEFAULT_INPUTS);
    const gold = channel(r, "gold");
    expect(gold.idleCash).toBeCloseTo(174_688.99, 0);
    expect(gold.unitsLabel).toBe("14.9 lượng");
    expect(gold.monthsBought).toBe(121);
  });

  test("buys the ETF only in whole lots and holds the rest as cash", () => {
    const r = simulate(snapshot, { ...DEFAULT_INPUTS, mode: "fixed", fixedAmount: 4_000_000 });
    const etf = channel(r, "etf");
    expect(etf.idleCash).toBeCloseTo(774_337, 0);
    expect(etf.idleCash).toBeGreaterThan(0);
    expect(etf.idleCash).toBeLessThan(4_000_000);
    expect(etf.unitsLabel).toBe("30,600 units");
  });

  test("zero saving yields zeroes, not NaN", () => {
    const r = simulate(snapshot, { ...DEFAULT_INPUTS, savePct: 0 });
    expect(r.paidIn).toBe(0);
    expect(r.paidInToday).toBe(0);
    for (const c of r.channels) {
      expect(c.value).toBe(0);
      expect(c.profit).toBe(0);
      expect(c.profitPct).toBe(0);
      expect(c.xirr).toBe(0);
      expect(c.maxDrawdown).toBe(0);
    }
  });

  test("a contribution too small to ever buy stays honest cash", () => {
    const r = simulate(snapshot, {
      ...DEFAULT_INPUTS,
      mode: "fixed",
      fixedAmount: 100_000,
      startYear: 2024,
    });
    const gold = channel(r, "gold");
    expect(r.paidIn).toBe(3_500_000);
    expect(gold.monthsBought).toBe(0);
    expect(gold.value).toBeCloseTo(3_500_000, 0);
    expect(gold.idleCash).toBeCloseTo(3_500_000, 0);
    expect(gold.profitPct).toBeCloseTo(0, 6);
    expect(gold.xirr).toBeCloseTo(0, 6);
  });

  test("a +0% ceiling keeps the salary flat at today's figure", () => {
    const r = simulate(snapshot, { ...DEFAULT_INPUTS, ceilingPct: 0 });
    expect(r.salaryStart).toBeCloseTo(30_000_000, 0);
    expect(r.salaryEnd).toBeCloseTo(30_000_000, 0);
    expect(r.firstContribution).toBeCloseTo(7_500_000, 0);
  });

  test("a short window still produces a finite annual return", () => {
    const r = simulate(snapshot, { ...DEFAULT_INPUTS, startYear: 2024 });
    expect(r.months).toHaveLength(35);
    for (const c of r.channels) {
      expect(Number.isFinite(c.xirr)).toBe(true);
      expect(Math.abs(c.xirr)).toBeLessThan(3);
    }
    expect(channel(r, "etf").xirr).toBeCloseTo(0.148446, 5);
  });

  test("falls back to the latest known year when a rate table runs short", () => {
    const thin: Snapshot = { ...snapshot, deposit: { "2016": 6.5 }, cpi: { "2016": 148.4073 } };
    const r = simulate(thin, DEFAULT_INPUTS);
    expect(Number.isFinite(channel(r, "bank").value)).toBe(true);
    expect(channel(r, "bank").value).toBeGreaterThan(r.paidIn);
    expect(r.inflationFactor).toBe(1);
    expect(r.paidInToday).toBeCloseTo(r.paidIn, 0);
  });

  test("every month point carries a cumulative paid-in and three values", () => {
    const r = simulate(snapshot, DEFAULT_INPUTS);
    const first = r.months[0];
    const last = r.months[r.months.length - 1];
    expect(first.month).toBe("2016-01");
    expect(first.contribution).toBeCloseTo(4_687_500, 0);
    expect(last.paidIn).toBeCloseTo(r.paidIn, 0);
    for (const m of r.months) {
      for (const v of [m.gold, m.etf, m.bank]) expect(Number.isFinite(v)).toBe(true);
    }
  });
});

describe("format", () => {
  test("money renders millions and billions in the Vietnamese shorthand", () => {
    expect(money(2_004_224_688)).toBe("2,004.2M ₫");
    expect(money(854_407_688)).toBe("854.4M ₫");
    expect(money(4_687_500)).toBe("4.7M ₫");
    expect(money(0)).toBe("0 ₫");
  });

  test("money keeps sub-million amounts readable in thousands", () => {
    expect(money(174_689)).toBe("175k ₫");
    expect(money(999_999)).toBe("1,000k ₫");
    expect(money(-5_000)).toBe("-5k ₫");
  });

  test("percent renders two decimals by default", () => {
    expect(percent(0.117977)).toBe("11.80%");
    expect(percent(0.161715)).toBe("16.17%");
    expect(percent(-0.2423, 1)).toBe("-24.2%");
  });

  test("signedMoney always carries a sign", () => {
    expect(signedMoney(1_149_817_000)).toBe("+1,149.8M ₫");
    expect(signedMoney(-5_000_000)).toBe("-5.0M ₫");
  });
});
