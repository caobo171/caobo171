import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

import { money, percent, signedMoney } from "./format";
import { DEFAULT_INPUTS, retirement, simulate, WITHDRAWAL_RATE } from "./simulate";
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

    // The bank never touches `latest`, so its figure is pinned exactly.
    expect(channel(r, "bank").value).toBeCloseTo(1_146_327_635.41, 0);
    expect(channel(r, "bank").xirr).toBeCloseTo(0.057623, 5);

    // Gold and the ETF are valued at the latest price, which moves every time
    // the snapshot is refreshed. Pin what the monthly rows determine — the
    // holdings and the idle cash — and check the valuation against them, so a
    // refresh does not break the build but a modelling mistake still does.
    const gold = channel(r, "gold");
    const etf = channel(r, "etf");
    expect(gold.idleCash).toBeCloseTo(174_688.99, 0);
    expect(etf.idleCash).toBeCloseTo(2_231_338.99, 0);
    expect(gold.value).toBeCloseTo(149 * snapshot.latest.goldBuy * 100 + gold.idleCash, 0);
    expect(etf.value).toBeCloseTo(47_400 * snapshot.latest.etf * 1000 + etf.idleCash, 0);

    // Tolerant to 0.05pp — a day's price move is worth about 0.01pp here.
    expect(gold.xirr).toBeCloseTo(0.1617, 3);
    expect(etf.xirr).toBeCloseTo(0.118, 3);
  });

  test("treats the deposit rate as effective, not nominal", () => {
    // A 12-month deposit quoted at 6.5% pays 6.5% over the year. Dividing by 12
    // and compounding would pay 6.70%, flattering the bank by 0.16pp a year.
    const flat = { ...snapshot, deposit: { "2016": 6.5 } };
    const oneYear = simulate(flat, { ...DEFAULT_INPUTS, mode: "fixed", fixedAmount: 0 });
    expect(oneYear.channels.find((c) => c.key === "bank")!.value).toBe(0);

    const r = simulate(snapshot, DEFAULT_INPUTS);
    expect(channel(r, "bank").xirr).toBeLessThan(0.058);
  });

  test("invests capital you already have, at the start", () => {
    const none = simulate(snapshot, DEFAULT_INPUTS);
    const some = simulate(snapshot, { ...DEFAULT_INPUTS, initialCapital: 100_000_000 });

    expect(none.paidIn).toBeCloseTo(some.paidIn - 100_000_000, 0);
    for (const key of ["gold", "etf", "bank"] as const) {
      const before = none.channels.find((c) => c.key === key)!;
      const after = some.channels.find((c) => c.key === key)!;
      expect(after.value).toBeGreaterThan(before.value);
    }
    // It buys units rather than sitting as cash.
    expect(some.channels.find((c) => c.key === "etf")!.units).toBeGreaterThan(
      none.channels.find((c) => c.key === "etf")!.units,
    );
    expect(some.months[0].paidIn).toBeCloseTo(none.months[0].paidIn + 100_000_000, 0);
  });

  test("capital you already have defaults to nothing", () => {
    expect(DEFAULT_INPUTS.initialCapital).toBe(0);
  });

  test("a backtest claims no projection", () => {
    const r = simulate(snapshot, DEFAULT_INPUTS);
    expect(r.projectedFrom).toBeNull();
    expect(r.assumedAnnual).toBeNull();
    expect(r.months.every((m) => !m.projected)).toBe(true);
  });

  test("projects past the data at a fitted growth rate, and flags every assumed month", () => {
    const lastReal = snapshot.months[snapshot.months.length - 1].month;
    const r = simulate(snapshot, { ...DEFAULT_INPUTS, endMonth: "2030-12" });

    expect(r.months[r.months.length - 1].month).toBe("2030-12");
    expect(r.projectedFrom).not.toBeNull();
    expect(r.projectedFrom! > lastReal).toBe(true);
    expect(r.months.filter((m) => !m.projected).every((m) => m.month <= lastReal)).toBe(true);
    expect(r.months.filter((m) => m.projected).every((m) => m.month > lastReal)).toBe(true);

    // The assumption is reported so the page can show it rather than hide it.
    expect(r.assumedAnnual!.etf).toBeGreaterThan(0);
    expect(r.assumedAnnual!.gold).toBeGreaterThan(0);
    for (const c of r.channels) expect(Number.isFinite(c.xirr)).toBe(true);
  });

  test("an end month inside the data simply stops there", () => {
    const r = simulate(snapshot, { ...DEFAULT_INPUTS, endMonth: "2020-06" });
    expect(r.months[r.months.length - 1].month).toBe("2020-06");
    expect(r.projectedFrom).toBeNull();
  });

  test("states profit after inflation in today's money, even when the run ends in the future", () => {
    const r = simulate(snapshot, { ...DEFAULT_INPUTS, endMonth: "2035-12" });
    for (const c of r.channels) {
      // The nominal figure is in 2035 dong; the real one is deflated to today.
      expect(c.realValue).toBeLessThan(c.value);
      expect(c.realProfit).toBeCloseTo(c.realValue - r.paidInToday, 0);
    }
  });

  test("a backtest's real and nominal figures coincide, since it ends today", () => {
    const r = simulate(snapshot, DEFAULT_INPUTS);
    for (const c of r.channels) expect(c.realValue).toBeCloseTo(c.value, 0);
  });

  test("the assumed growth rate does not depend on the window being viewed", () => {
    // A reader looking at the last two years must not get that bull run
    // extrapolated for a decade; the fit is taken from the whole record.
    const long = simulate(snapshot, { ...DEFAULT_INPUTS, endMonth: "2035-12" });
    const short = simulate(snapshot, {
      ...DEFAULT_INPUTS,
      startMonth: "2024-01",
      endMonth: "2035-12",
    });

    expect(short.assumedAnnual!.etf).toBeCloseTo(long.assumedAnnual!.etf, 10);
    expect(short.assumedAnnual!.gold).toBeCloseTo(long.assumedAnnual!.gold, 10);
    expect(short.fittedOver).toEqual(long.fittedOver);
    expect(short.fittedOver!.from).toBe(snapshot.months[0].month);

    // And it lands somewhere a decade of Vietnamese data can justify.
    expect(long.assumedAnnual!.etf).toBeGreaterThan(0.05);
    expect(long.assumedAnnual!.etf).toBeLessThan(0.18);
  });

  test("can start in the future, giving a run that is projected throughout", () => {
    const r = simulate(snapshot, {
      ...DEFAULT_INPUTS,
      startMonth: "2028-01",
      endMonth: "2032-12",
    });

    expect(r.months).toHaveLength(60);
    expect(r.months[0].month).toBe("2028-01");
    expect(r.months.every((m) => m.projected)).toBe(true);
    expect(r.projectedFrom).toBe("2028-01");
    expect(r.paidIn).toBeGreaterThan(0);
    for (const c of r.channels) expect(Number.isFinite(c.value)).toBe(true);
  });

  test("prices keep compounding across the gap to a future start", () => {
    const soon = simulate(snapshot, { ...DEFAULT_INPUTS, startMonth: "2027-01", endMonth: "2027-12" });
    const later = simulate(snapshot, { ...DEFAULT_INPUTS, startMonth: "2032-01", endMonth: "2032-12" });
    // A start five years further out meets prices five years further along.
    expect(later.months[0].etfPrice).toBeGreaterThan(soon.months[0].etfPrice);
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
    expect(gold.units).toBe(149);
    expect(gold.monthsBought).toBe(121);
  });

  test("buys the ETF only in whole lots and holds the rest as cash", () => {
    const r = simulate(snapshot, { ...DEFAULT_INPUTS, mode: "fixed", fixedAmount: 4_000_000 });
    const etf = channel(r, "etf");
    expect(etf.idleCash).toBeCloseTo(774_337, 0);
    expect(etf.idleCash).toBeGreaterThan(0);
    expect(etf.idleCash).toBeLessThan(4_000_000);
    expect(etf.units).toBe(30_600);
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
      startMonth: "2024-01",
    });
    const gold = channel(r, "gold");
    expect(r.paidIn).toBe(3_500_000);
    expect(gold.monthsBought).toBe(0);
    expect(gold.value).toBeCloseTo(3_500_000, 0);
    expect(gold.idleCash).toBeCloseTo(3_500_000, 0);
    expect(gold.profitPct).toBeCloseTo(0, 6);
    expect(gold.xirr).toBeCloseTo(0, 6);
  });

  test("a ceiling at the starting salary keeps it flat", () => {
    const r = simulate(snapshot, {
      ...DEFAULT_INPUTS,
      salaryStart: 30_000_000,
      salaryCeiling: 30_000_000,
    });
    expect(r.salaryStart).toBeCloseTo(30_000_000, 0);
    expect(r.salaryEnd).toBeCloseTo(30_000_000, 0);
    expect(r.firstContribution).toBeCloseTo(7_500_000, 0);
    expect(r.lastContribution).toBeCloseTo(7_500_000, 0);
  });

  test("a short window still produces a finite annual return", () => {
    const r = simulate(snapshot, { ...DEFAULT_INPUTS, startMonth: "2024-01" });
    expect(r.months).toHaveLength(35);
    for (const c of r.channels) {
      expect(Number.isFinite(c.xirr)).toBe(true);
      expect(Math.abs(c.xirr)).toBeLessThan(3);
    }
    // Looser than the long window: over under three years a day's price move
    // has far more leverage on the annualised figure.
    expect(channel(r, "etf").xirr).toBeCloseTo(0.148, 2);
  });

  test("can start at any month, not only January", () => {
    const r = simulate(snapshot, { ...DEFAULT_INPUTS, startMonth: "2020-07" });
    expect(r.months[0].month).toBe("2020-07");
    expect(r.months).toHaveLength(77);
    for (const c of r.channels) expect(Number.isFinite(c.xirr)).toBe(true);
  });

  test("a start month past the data yields an empty, harmless result", () => {
    const r = simulate(snapshot, { ...DEFAULT_INPUTS, startMonth: "2099-01" });
    expect(r.months).toHaveLength(0);
    expect(r.channels).toHaveLength(0);
    expect(r.paidIn).toBe(0);
  });

  test("falls back to the latest known year when a rate table runs short", () => {
    const thin: Snapshot = { ...snapshot, deposit: { "2016": 6.5 }, cpi: { "2016": 148.4073 } };
    const r = simulate(thin, DEFAULT_INPUTS);
    expect(Number.isFinite(channel(r, "bank").value)).toBe(true);
    expect(channel(r, "bank").value).toBeGreaterThan(r.paidIn);
    // Past the last published year, inflation is carried forward at 3.3% rather
    // than silently stopping — ten years from a 2016-only table is 1.033^10.
    expect(r.inflationFactor).toBeCloseTo(1.033 ** 10, 3);
    expect(r.paidInToday).toBeGreaterThan(r.paidIn);
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
  test("money renders each amount in the unit it belongs to", () => {
    expect(money(2_004_224_688)).toBe("2.00B ₫");
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
    expect(signedMoney(1_149_817_000)).toBe("+1.15B ₫");
    expect(signedMoney(-5_000_000)).toBe("-5.0M ₫");
  });
});

describe("retirement", () => {
  test("turns a pot into the monthly income it supports", () => {
    // 3bn at 4% a year is 120M a year, or 10M a month.
    const r = retirement(3_000_000_000, 0);
    expect(r.monthlyIncome).toBeCloseTo(10_000_000, 0);
    expect(WITHDRAWAL_RATE).toBe(0.04);
  });

  test("answers whether that covers the spending asked of it", () => {
    const enough = retirement(3_000_000_000, 8_000_000);
    expect(enough.covers).toBe(true);
    expect(enough.coverage).toBeCloseTo(1.25, 4);
    expect(enough.shortfallMonthly).toBe(0);

    const short = retirement(3_000_000_000, 20_000_000);
    expect(short.covers).toBe(false);
    expect(short.coverage).toBeCloseTo(0.5, 4);
    expect(short.shortfallMonthly).toBeCloseTo(10_000_000, 0);
  });

  test("says how large the pot would have to be", () => {
    // 20M a month is 240M a year, which at 4% needs 6bn.
    expect(retirement(3_000_000_000, 20_000_000).potNeeded).toBeCloseTo(6_000_000_000, 0);
  });

  test("gives no verdict when no spending has been named", () => {
    const r = retirement(3_000_000_000, 0);
    expect(r.coverage).toBeNull();
    expect(r.covers).toBeNull();
  });

  test("survives a pot of nothing", () => {
    const r = retirement(0, 20_000_000);
    expect(r.monthlyIncome).toBe(0);
    expect(r.coverage).toBe(0);
    expect(r.covers).toBe(false);
    expect(r.shortfallMonthly).toBeCloseTo(20_000_000, 0);
  });
});

describe("milestones", () => {
  // A plain run: a flat contribution over five years of real prices, so the
  // only thing moving between cases is the milestone itself.
  const PLAIN = {
    ...DEFAULT_INPUTS,
    startMonth: "2016-01",
    endMonth: "2026-11",
    mode: "fixed" as const,
    fixedAmount: 10_000_000,
    milestones: [],
  };

  // Sized so all three pots can actually afford it — the "cannot afford" case
  // has a test of its own, and this one is about the money moving, not failing.
  const house = {
    id: "h",
    name: "Mua nhà",
    year: 2022,
    upfront: 400_000_000,
    annual: 60_000_000,
    years: 10,
  };

  test("a run with no milestones is untouched", () => {
    const r = simulate(snapshot, PLAIN);
    expect(r.milestoneTotal).toBe(0);
    expect(r.months.every((m) => m.milestoneCost === 0)).toBe(true);
    expect(channel(r, "bank").brokeMonth).toBeNull();
    expect(channel(r, "bank").spent).toBe(0);
  });

  test("the upfront cost lands in January of its year, the annual cost spreads over the months", () => {
    const r = simulate(snapshot, { ...PLAIN, milestones: [house] });
    const at = (month: string) => r.months.find((m) => m.month === month)!;

    expect(at("2021-12").milestoneCost).toBe(0);
    // January carries the down payment plus that month's share of the annual cost.
    expect(at("2022-01").milestoneCost).toBeGreaterThan(at("2022-02").milestoneCost);
    expect(at("2022-01").milestoneCost - at("2022-02").milestoneCost).toBeCloseTo(
      at("2022-02").milestoneCost * 80, // 400M upfront against 60M/12 a month
      -4,
    );
    expect(at("2022-06").milestoneCost).toBeCloseTo(at("2022-02").milestoneCost, 0);
  });

  test("an amount typed today costs exactly that in today's year, and less in a past one", () => {
    // The field says "today's money", so a milestone dated this year must not
    // be inflated at all.
    const now = { ...house, year: 2026, annual: 0, upfront: 100_000_000 };
    const r = simulate(snapshot, { ...PLAIN, milestones: [now] });
    expect(r.months.find((m) => m.month === "2026-01")!.milestoneCost).toBeCloseTo(100_000_000, 0);

    // The same purchase in 2018 took fewer dong, in exactly the CPI ratio the
    // snapshot publishes.
    const then = simulate(snapshot, { ...PLAIN, milestones: [{ ...now, year: 2018 }] });
    const paid2018 = then.months.find((m) => m.month === "2018-01")!.milestoneCost;
    expect(paid2018 / 100_000_000).toBeCloseTo(snapshot.cpi["2018"] / snapshot.cpi["2026"], 4);
  });

  test("the annual cost stops after the years it was given", () => {
    const car = { id: "c", name: "Xe", year: 2017, upfront: 0, annual: 60_000_000, years: 2 };
    const r = simulate(snapshot, { ...PLAIN, milestones: [car] });
    const paidIn = (year: string) =>
      r.months.filter((m) => m.month.startsWith(year)).reduce((a, m) => a + m.milestoneCost, 0);

    expect(paidIn("2017")).toBeGreaterThan(0);
    expect(paidIn("2018")).toBeGreaterThan(0);
    expect(paidIn("2019")).toBe(0);
  });

  test("zero years means the cost runs to the end of the plan", () => {
    const kid = { id: "k", name: "Con", year: 2018, upfront: 0, annual: 60_000_000, years: 0 };
    const r = simulate(snapshot, { ...PLAIN, milestones: [kid] });
    expect(r.months.find((m) => m.month === "2026-05")!.milestoneCost).toBeGreaterThan(0);
  });

  test("a milestone outside the window is ignored", () => {
    const r = simulate(snapshot, { ...PLAIN, milestones: [{ ...house, year: 2045 }] });
    expect(r.milestoneTotal).toBe(0);
  });

  test("the milestone takes real money out: every channel ends smaller", () => {
    const base = simulate(snapshot, PLAIN);
    const withHouse = simulate(snapshot, { ...PLAIN, milestones: [house] });

    expect(withHouse.milestoneTotal).toBeGreaterThan(0);
    for (const key of ["gold", "etf", "bank"]) {
      expect(channel(withHouse, key).value).toBeLessThan(channel(base, key).value);
      expect(channel(withHouse, key).spent).toBeCloseTo(withHouse.milestoneTotal, 0);
      expect(channel(withHouse, key).brokeMonth).toBeNull();
    }
    // Gross saving out of salary is unchanged — the milestone diverts it, it
    // does not stop you earning.
    expect(withHouse.paidIn).toBeCloseTo(base.paidIn, 0);
  });

  test("profit is measured against what actually reached the pot", () => {
    const r = simulate(snapshot, { ...PLAIN, milestones: [house] });
    const bank = channel(r, "bank");
    expect(bank.profit).toBeCloseTo(bank.value - (r.paidIn - bank.spent), 0);
  });

  test("a milestone the plan cannot afford marks the channel broke, and the pot floors at zero", () => {
    const mansion = { id: "m", name: "Biệt thự", year: 2018, upfront: 5_000_000_000, annual: 0, years: 0 };
    const r = simulate(snapshot, { ...PLAIN, fixedAmount: 1_000_000, milestones: [mansion] });
    const bank = channel(r, "bank");

    expect(bank.brokeMonth).toBe("2018-01");
    expect(bank.value).toBeGreaterThanOrEqual(0);
    expect(bank.unpaid).toBeGreaterThan(0);
  });

  test("a plan that spends more than it saved still reports the return it earned", () => {
    // The default scenario saves ~854M and the house takes ~910M of it, so the
    // money that ever sat in the pot nets out below zero. The pot still grew —
    // that is how it paid for the house — and the rate has to say so instead of
    // collapsing to nothing.
    const big = { ...house, year: 2026, upfront: 800_000_000, annual: 120_000_000, years: 20 };
    const r = simulate(snapshot, { ...DEFAULT_INPUTS, milestones: [big] });

    expect(channel(r, "gold").spent).toBeGreaterThan(r.paidIn);
    for (const c of r.channels) {
      expect(c.xirr).not.toBe(0);
      expect(c.xirr).toBeGreaterThan(0.01);
    }
  });

  test("paying for a milestone is not recorded as a market crash", () => {
    // Taking money out drops the pot exactly like a fall would. Measured naively
    // the down payment reads as the worst drawdown in ten years, which would be
    // a lie about the market.
    const base = simulate(snapshot, PLAIN);
    const withHouse = simulate(snapshot, { ...PLAIN, milestones: [house] });

    // Not identical: the withdrawn money is added back at face value, where in
    // truth it would have gone on rising and falling with the market. That
    // leaves the adjusted figure a couple of points shallow — close enough that
    // the column still describes the market, which naive accounting did not.
    for (const key of ["gold", "etf", "bank"]) {
      const gap = Math.abs(channel(withHouse, key).maxDrawdown - channel(base, key).maxDrawdown);
      expect(gap).toBeLessThan(0.05);
    }
  });

  test("a withdrawal still yields a believable rate of return", () => {
    const r = simulate(snapshot, { ...PLAIN, milestones: [house] });
    for (const c of r.channels) {
      expect(c.xirr).toBeGreaterThan(-0.5);
      expect(c.xirr).toBeLessThan(0.5);
    }
  });
});
