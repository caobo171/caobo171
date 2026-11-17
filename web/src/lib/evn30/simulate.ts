import type {
  ChannelKey,
  ChannelResult,
  Inputs,
  MonthPoint,
  SimulationResult,
  Snapshot,
  SnapshotMonth,
} from "./types";

/** HOSE trades E1VFVN30 in lots of 100 units; an odd amount cannot be bought. */
export const ETF_LOT = 100;
/** Brokerage charged on each ETF purchase. */
export const ETF_FEE = 0.0015;
/** 1 lượng = 10 chỉ. Gold is bought in chỉ. */
export const CHI_PER_TAEL = 10;

/**
 * The conventional planning withdrawal rate. A rule of thumb for how much a
 * pot can pay out indefinitely, not a promise about any particular decade.
 */
export const WITHDRAWAL_RATE = 0.04;

export interface Retirement {
  /** What the pot pays each month at the withdrawal rate, in today's money. */
  monthlyIncome: number;
  /** Income as a fraction of the spending asked of it; null if none was named. */
  coverage: number | null;
  covers: boolean | null;
  shortfallMonthly: number;
  /** The pot that would cover the spending outright. */
  potNeeded: number;
}

/**
 * Answers the question the rest of the page only implies: would this be enough
 * to live on? Both figures are in today's money, so they are comparable.
 */
export function retirement(realValue: number, monthlySpend: number): Retirement {
  const monthlyIncome = (Math.max(0, realValue) * WITHDRAWAL_RATE) / 12;
  const spend = Math.max(0, monthlySpend);
  if (spend === 0) {
    return { monthlyIncome, coverage: null, covers: null, shortfallMonthly: 0, potNeeded: 0 };
  }
  return {
    monthlyIncome,
    coverage: monthlyIncome / spend,
    covers: monthlyIncome >= spend,
    shortfallMonthly: Math.max(0, spend - monthlyIncome),
    potNeeded: (spend * 12) / WITHDRAWAL_RATE,
  };
}

export const DEFAULT_INPUTS: Inputs = {
  startMonth: "2016-01",
  endMonth: "",
  initialCapital: 0,
  mode: "percent",
  salaryStart: 18_750_000,
  raisePct: 8,
  salaryCeiling: 30_000_000,
  savePct: 25,
  fixedAmount: 2_000_000,
  monthlyCapVnd: 50_000_000,
  monthlySpend: 20_000_000,
  milestones: [],
};

/**
 * Annual tables stop at the last year anyone published. Carry the nearest
 * earlier year forward rather than returning undefined and poisoning every
 * number downstream.
 */
function rateFor(table: Record<string, number>, year: number): number {
  const years = Object.keys(table)
    .map(Number)
    .filter((y) => Number.isFinite(y))
    .sort((a, b) => a - b);
  if (!years.length) return 0;
  let pick = years[0];
  for (const y of years) if (y <= year) pick = y;
  return table[String(pick)];
}

/** Money-weighted annual return. Bisection is ample for a monthly series. */
function xirr(flows: Array<{ day: number; amount: number }>, final: number, endDay: number): number {
  if (!flows.length) return 0;
  const start = flows[0].day;
  const npv = (rate: number) => {
    let total = final / (1 + rate) ** ((endDay - start) / 365.25);
    for (const f of flows) total -= f.amount / (1 + rate) ** ((f.day - start) / 365.25);
    return total;
  };
  let lo = -0.9;
  let hi = 2;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (npv(mid) > 0) lo = mid;
    else hi = mid;
  }
  return lo;
}

function deepestFall(values: number[]): number {
  let peak = 0;
  let worst = 0;
  for (const v of values) {
    if (v > peak) peak = v;
    if (peak > 0) worst = Math.min(worst, v / peak - 1);
  }
  return worst;
}

const dayNumber = (isoDate: string) => Date.parse(`${isoDate}T00:00:00Z`) / 86_400_000;


/**
 * Least-squares fit of ln(price) against time, which is the growth rate that
 * best explains every month rather than just the first and last. Returns the
 * monthly growth factor.
 */
function logLinearMonthlyGrowth(values: number[]): number {
  const points = values.map((v, i) => [i, Math.log(v)]).filter(([, y]) => Number.isFinite(y));
  const n = points.length;
  if (n < 2) return 1;
  const meanX = points.reduce((a, [x]) => a + x, 0) / n;
  const meanY = points.reduce((a, [, y]) => a + y, 0) / n;
  let num = 0;
  let den = 0;
  for (const [x, y] of points) {
    num += (x - meanX) * (y - meanY);
    den += (x - meanX) ** 2;
  }
  if (den === 0) return 1;
  return Math.exp(num / den);
}

/** Whole months from `a` to `b`; negative when b precedes a. */
const monthDiff = (a: string, b: string): number => {
  const [ay, am] = a.split("-").map(Number);
  const [by, bm] = b.split("-").map(Number);
  return (by - ay) * 12 + (bm - am);
};

const nextMonth = (month: string): string => {
  let [y, m] = month.split("-").map(Number);
  if (++m === 13) {
    m = 1;
    y += 1;
  }
  return `${y}-${String(m).padStart(2, "0")}`;
};

type Row = SnapshotMonth & { projected: boolean };

/**
 * The months the plan runs over. Anything past the data is synthesised by
 * continuing each price at its fitted growth rate — an assumption, flagged as
 * one, never presented as history.
 */
function buildRows(snapshot: Snapshot, startMonth: string, endMonth: string): Row[] {
  const history: Row[] = snapshot.months
    .filter((m) => m.month >= startMonth && (!endMonth || m.month <= endMonth))
    .map((m) => ({ ...m, projected: false }));

  const lastReal = snapshot.months[snapshot.months.length - 1];
  if (!endMonth || endMonth <= lastReal.month) return history;

  // Fit on the WHOLE history, never the chosen window. A reader looking at the
  // last two years would otherwise have a bull run extrapolated for a decade —
  // the fit would learn the window rather than the asset.
  const etfGrowth = logLinearMonthlyGrowth(snapshot.months.map((m) => m.etf));
  const goldGrowth = logLinearMonthlyGrowth(snapshot.months.map((m) => m.goldBuy));
  const spread = lastReal.goldSell / lastReal.goldBuy;

  // A start past the data is legitimate — "what if I begin next year?" — so the
  // synthesis starts wherever the plan does, not merely where the data stops.
  const rows = [...history];
  let month = startMonth > lastReal.month ? startMonth : nextMonth(lastReal.month);
  while (month <= endMonth) {
    const step = monthDiff(lastReal.month, month);
    const goldBuy = lastReal.goldBuy * goldGrowth ** step;
    rows.push({
      month,
      date: `${month}-01`,
      etf: lastReal.etf * etfGrowth ** step,
      goldBuy,
      goldSell: goldBuy * spread,
      projected: true,
    });
    month = nextMonth(month);
  }
  return rows;
}

/** Prices keep rising after the last published CPI, so carry inflation forward. */
function cpiFor(cpi: Record<string, number>, year: number): number {
  const years = Object.keys(cpi)
    .map(Number)
    .sort((a, b) => a - b);
  if (!years.length) return 1;
  const last = years[years.length - 1];
  if (year <= last) return rateFor(cpi, year);
  return cpi[String(last)] * 1.033 ** (year - last);
}

export function simulate(snapshot: Snapshot, inputs: Inputs): SimulationResult {
  const rows = buildRows(snapshot, inputs.startMonth, inputs.endMonth);

  const empty: SimulationResult = {
    months: [],
    paidIn: 0,
    paidInToday: 0,
    inflationFactor: 1,
    salaryStart: inputs.salaryStart,
    salaryEnd: inputs.salaryStart,
    ceilingYear: null,
    firstContribution: 0,
    lastContribution: 0,
    etfFees: 0,
    projectedFrom: null,
    assumedAnnual: null,
    fittedOver: null,
    milestoneTotal: 0,
    milestoneTotalToday: 0,
    channels: [],
  };
  if (!rows.length) return empty;

  const raiseFactor = 1 + inputs.raisePct / 100;
  const lastYearIndex = Math.floor((rows.length - 1) / 12);
  // The salary is stated outright now, so nothing is back-solved: it simply
  // grows each year until it meets the ceiling and then stops.
  const salaryStart = inputs.salaryStart;
  const salaryAt = (yearIndex: number) =>
    Math.min(salaryStart * raiseFactor ** yearIndex, inputs.salaryCeiling);

  let etfCash = 0;
  let etfUnits = 0;
  let etfFees = 0;
  let bank = 0;
  let goldCash = 0;
  let goldChi = 0;
  let paidIn = 0;
  let milestoneTotal = 0;
  let milestoneTotalToday = 0;
  let ceilingYear: number | null = null;

  const months: MonthPoint[] = [];

  /**
   * One channel's cash position. A milestone does three things to a pot — it
   * diverts money before it ever arrives, it forces a sale when that is not
   * enough, and it can empty the pot outright. All three are recorded as they
   * happen rather than reconstructed afterwards, because only the loop knows
   * what each pot could actually afford that month.
   */
  interface Pot {
    /** Milestone money this pot funded. */
    spent: number;
    /** Milestone money it could not fund. */
    unpaid: number;
    brokeMonth: string | null;
    /** Money that truly reached the pot: contributions less what was taken
     *  back out. Profit is measured against this, not against gross saving. */
    netIn: number;
    netInToday: number;
    flows: Array<{ day: number; amount: number }>;
    monthsBought: number;
    /** Cumulative money actually taken back out of the pot — as opposed to
     *  diverted before it arrived. */
    fromPot: number;
    /** The pot's value each month with withdrawals added back, so a deliberate
     *  withdrawal is not mistaken for the market falling. */
    curve: number[];
  }
  const newPot = (): Pot => ({
    spent: 0,
    unpaid: 0,
    brokeMonth: null,
    netIn: 0,
    netInToday: 0,
    flows: [],
    monthsBought: 0,
    fromPot: 0,
    curve: [],
  });
  const pots: Record<ChannelKey, Pot> = { gold: newPot(), etf: newPot(), bank: newPot() };
  const CHANNELS: ChannelKey[] = ["gold", "etf", "bank"];

  // Today is the reference for every "in today's money" figure on the page, so
  // it is needed inside the loop as well as after it.
  const cpiRef = cpiFor(snapshot.cpi, Number(snapshot.latest.date.slice(0, 4)));
  const firstYear = Number(rows[0].month.slice(0, 4));
  const milestones = inputs.milestones ?? [];
  const upfrontSeen = new Set<string>();

  const record = (
    pot: Pot,
    row: Row,
    cost: number,
    short: number,
    contribution: number,
    deflate: number,
  ) => {
    const funded = cost - short;
    // Anything the month's saving could not cover had to be sold out of the pot.
    pot.fromPot += Math.max(0, funded - contribution);
    pot.spent += funded;
    pot.unpaid += short;
    if (short > 0 && pot.brokeMonth === null) pot.brokeMonth = row.month;
    const net = contribution - funded;
    pot.netIn += net;
    pot.netInToday += net * deflate;
    if (net !== 0) pot.flows.push({ day: dayNumber(row.date), amount: net });
  };

  // Money already saved before the plan starts, put to work in the first month
  // under the same lot and spread rules as everything else.
  const seed = Math.max(0, inputs.initialCapital);
  if (seed > 0) {
    etfCash += seed;
    goldCash += seed;
    bank += seed;
    paidIn += seed;
    const day = dayNumber(rows[0].date);
    const deflate = cpiRef / cpiFor(snapshot.cpi, firstYear);
    for (const key of CHANNELS) {
      pots[key].netIn += seed;
      pots[key].netInToday += seed * deflate;
      pots[key].flows.push({ day, amount: seed });
    }
  }

  rows.forEach((row, i) => {
    const year = Number(row.month.slice(0, 4));
    const yearIndex = Math.floor(i / 12);
    const salary = salaryAt(yearIndex);

    const contribution =
      inputs.mode === "fixed"
        ? inputs.fixedAmount
        : Math.min((salary * inputs.savePct) / 100, inputs.monthlyCapVnd);

    if (
      inputs.mode === "percent" &&
      ceilingYear === null &&
      salaryStart * raiseFactor ** yearIndex >= inputs.salaryCeiling
    ) {
      ceilingYear = year;
    }

    paidIn += contribution;
    if (contribution > 0) pots.bank.monthsBought += 1;

    // What the milestones take this month. The reader types prices they know —
    // today's — so each one is inflated to the year the cost actually falls.
    const inflate = cpiFor(snapshot.cpi, year) / cpiRef;
    const deflate = 1 / inflate;
    let milestoneCost = 0;
    for (const m of milestones) {
      if (year < m.year) continue;
      if (!upfrontSeen.has(m.id)) {
        upfrontSeen.add(m.id);
        // A purchase dated before the plan begins already happened; only its
        // running cost still falls on these years.
        if (m.year >= firstYear) milestoneCost += Math.max(0, m.upfront) * inflate;
      }
      const span = m.years > 0 ? m.years : Infinity;
      if (year < m.year + span) milestoneCost += (Math.max(0, m.annual) * inflate) / 12;
    }
    milestoneTotal += milestoneCost;
    milestoneTotalToday += milestoneCost * deflate;

    // The month's net cash. Negative means the milestones cost more than was
    // saved, and the difference has to come out of the pot.
    const net = contribution - milestoneCost;

    // VN30 ETF — whole lots only, buying or selling; the remainder waits as cash.
    etfCash += net;
    let etfShort = 0;
    if (etfCash < 0) {
      const lotValue = row.etf * 1000 * ETF_LOT;
      const lots = Math.min(
        Math.ceil(-etfCash / (lotValue * (1 - ETF_FEE))),
        Math.floor(etfUnits / ETF_LOT),
      );
      if (lots > 0) {
        etfUnits -= lots * ETF_LOT;
        etfCash += lots * lotValue * (1 - ETF_FEE);
        etfFees += lots * lotValue * ETF_FEE;
      }
      if (etfCash < 0) {
        etfShort = -etfCash;
        etfCash = 0;
      }
    } else {
      const lotCost = row.etf * 1000 * ETF_LOT * (1 + ETF_FEE);
      const lots = Math.floor(etfCash / lotCost);
      if (lots > 0) {
        etfCash -= lots * lotCost;
        etfUnits += lots * ETF_LOT;
        etfFees += lots * row.etf * 1000 * ETF_LOT * ETF_FEE;
        pots.etf.monthsBought += 1;
      }
    }
    record(pots.etf, row, milestoneCost, etfShort, contribution, deflate);

    // Bank — compounds on what was already there, then the month's net cash
    // lands. The table quotes 12-month rates, which are effective: a deposit
    // advertised at 6.5% pays 6.5% over the year, so the monthly factor is the
    // twelfth root, not r/12 (which would quietly pay 6.70%).
    bank = bank * (1 + rateFor(snapshot.deposit, year) / 100) ** (1 / 12);
    let bankShort = 0;
    if (net >= 0) {
      bank += net;
    } else {
      const taken = Math.min(bank, -net);
      bank -= taken;
      bankShort = -net - taken;
    }
    record(pots.bank, row, milestoneCost, bankShort, contribution, deflate);

    // Gold — bought at the shop's selling price and sold back at its buying
    // price, in whole chỉ. Paying for a milestone out of gold therefore crosses
    // the spread, which is exactly what it costs in a shop.
    goldCash += net;
    let goldShort = 0;
    if (goldCash < 0) {
      const chiValue = (row.goldBuy * 1000) / CHI_PER_TAEL;
      const sold = Math.min(Math.ceil(-goldCash / chiValue), goldChi);
      if (sold > 0) {
        goldChi -= sold;
        goldCash += sold * chiValue;
      }
      if (goldCash < 0) {
        goldShort = -goldCash;
        goldCash = 0;
      }
    } else {
      const chiCost = (row.goldSell * 1000) / CHI_PER_TAEL;
      const chi = Math.floor(goldCash / chiCost);
      if (chi > 0) {
        goldCash -= chi * chiCost;
        goldChi += chi;
        pots.gold.monthsBought += 1;
      }
    }
    record(pots.gold, row, milestoneCost, goldShort, contribution, deflate);

    const goldValue = (goldChi * row.goldBuy * 1000) / CHI_PER_TAEL + goldCash;
    const etfValue = etfUnits * row.etf * 1000 + etfCash;
    pots.gold.curve.push(goldValue + pots.gold.fromPot);
    pots.etf.curve.push(etfValue + pots.etf.fromPot);
    pots.bank.curve.push(bank + pots.bank.fromPot);

    months.push({
      month: row.month,
      projected: row.projected,
      etfPrice: row.etf * 1000,
      goldPrice: row.goldSell * 1000,
      contribution,
      milestoneCost,
      paidIn,
      gold: goldValue,
      etf: etfValue,
      bank,
    });
  });

  const lastRow = rows[rows.length - 1];
  const isProjection = lastRow.projected;

  // A run that ends in the future is valued at its own last (assumed) prices;
  // one that ends today is valued at the latest real quote.
  const endPrices = isProjection
    ? { date: lastRow.date, etf: lastRow.etf, goldBuy: lastRow.goldBuy, goldSell: lastRow.goldSell }
    : snapshot.latest;
  const endDay = dayNumber(endPrices.date);
  const endYear = Number(endPrices.date.slice(0, 4));
  const cpiEnd = cpiFor(snapshot.cpi, endYear);
  const cpiStart = cpiFor(snapshot.cpi, Number(rows[0].month.slice(0, 4)));

  // Everything "real" is quoted in TODAY's money, never the end date's. For a
  // backtest the two are the same; for a run ending in 2035, saying "worth 227
  // million after inflation" has to mean 227 million now, not 227 million then.
  const toTodaysMoney = cpiRef / cpiEnd;

  let paidInToday = seed * (cpiRef / cpiStart);
  rows.forEach((row, i) => {
    paidInToday +=
      months[i].contribution * (cpiRef / cpiFor(snapshot.cpi, Number(row.month.slice(0, 4))));
  });

  const finals: Record<ChannelKey, number> = {
    gold: (goldChi * endPrices.goldBuy * 1000) / CHI_PER_TAEL + goldCash,
    etf: etfUnits * endPrices.etf * 1000 + etfCash,
    bank,
  };

  // The final month row was priced at that month's first trading day. Restate it
  // at the closing prices so the chart ends exactly where the headline does.
  const lastPoint = months[months.length - 1];
  for (const key of CHANNELS) {
    pots[key].curve[pots[key].curve.length - 1] = finals[key] + pots[key].fromPot;
  }
  lastPoint.gold = finals.gold;
  lastPoint.etf = finals.etf;
  lastPoint.bank = finals.bank;
  lastPoint.etfPrice = endPrices.etf * 1000;
  lastPoint.goldPrice = endPrices.goldSell * 1000;

  const extras: Record<ChannelKey, { idleCash: number; units: number }> = {
    gold: { idleCash: goldCash, units: goldChi },
    etf: { idleCash: etfCash, units: etfUnits },
    bank: { idleCash: 0, units: 0 },
  };

  const channels: ChannelResult[] = CHANNELS.map((key) => {
    const pot = pots[key];
    const value = finals[key];
    // Measured against what actually reached the pot. Money a milestone took
    // was never invested here, so counting it as a loss would be wrong — and
    // with no milestones `netIn` is simply everything paid in.
    const profit = value - pot.netIn;
    const invested = Math.max(pot.netIn, 0);
    return {
      key,
      value,
      profit,
      // A plan that spent more than it saved nets out below zero, and a rate
      // measured against that is meaningless — fall back to gross saving. The
      // return itself is still well defined: the flows simply include the
      // money taken back out.
      profitPct: invested > 0 ? profit / invested : paidIn > 0 ? profit / paidIn : 0,
      xirr: pot.flows.length ? xirr(pot.flows, value, endDay) : 0,
      realValue: value * toTodaysMoney,
      realProfit: value * toTodaysMoney - pot.netInToday,
      maxDrawdown: paidIn > 0 ? deepestFall(pot.curve) : 0,
      spent: pot.spent,
      unpaid: pot.unpaid,
      brokeMonth: pot.brokeMonth,
      monthsBought: pot.monthsBought,
      ...extras[key],
    };
  });

  channels.sort((a, b) => b.xirr - a.xirr);

  return {
    months,
    paidIn,
    paidInToday,
    inflationFactor: cpiStart > 0 ? cpiEnd / cpiStart : 1,
    salaryStart,
    salaryEnd: salaryAt(lastYearIndex),
    ceilingYear,
    projectedFrom: isProjection ? (months.find((m) => m.projected)?.month ?? null) : null,
    assumedAnnual: isProjection
      ? {
          etf: logLinearMonthlyGrowth(snapshot.months.map((m) => m.etf)) ** 12 - 1,
          gold: logLinearMonthlyGrowth(snapshot.months.map((m) => m.goldBuy)) ** 12 - 1,
          bank: rateFor(snapshot.deposit, endYear) / 100,
        }
      : null,
    milestoneTotal,
    milestoneTotalToday,
    fittedOver: isProjection
      ? { from: snapshot.months[0].month, to: snapshot.months[snapshot.months.length - 1].month }
      : null,
    firstContribution: months[0].contribution,
    lastContribution: months[months.length - 1].contribution,
    etfFees,
    channels,
  };
}
