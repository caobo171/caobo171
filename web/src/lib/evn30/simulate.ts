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
  if (!endMonth || endMonth <= lastReal.month || !history.length) return history;

  // Fit on the window the reader actually chose, so the assumption reflects the
  // period they are looking at.
  const basis = snapshot.months.filter((m) => m.month >= startMonth);
  const etfGrowth = logLinearMonthlyGrowth(basis.map((m) => m.etf));
  const goldGrowth = logLinearMonthlyGrowth(basis.map((m) => m.goldBuy));
  const spread = lastReal.goldSell / lastReal.goldBuy;

  const rows = [...history];
  let month = nextMonth(lastReal.month);
  let step = 1;
  while (month <= endMonth) {
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
    step += 1;
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
  let etfMonths = 0;
  let goldMonths = 0;
  let bankMonths = 0;
  let ceilingYear: number | null = null;

  const months: MonthPoint[] = [];
  const flows: Array<{ day: number; amount: number }> = [];

  // Money already saved before the plan starts, put to work in the first month
  // under the same lot and spread rules as everything else.
  const seed = Math.max(0, inputs.initialCapital);
  if (seed > 0) {
    etfCash += seed;
    goldCash += seed;
    bank += seed;
    paidIn += seed;
    flows.push({ day: dayNumber(rows[0].date), amount: seed });
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
    if (contribution > 0) {
      flows.push({ day: dayNumber(row.date), amount: contribution });
      bankMonths += 1;
    }

    // VN30 ETF — whole lots only; the remainder waits as cash.
    etfCash += contribution;
    const lotCost = row.etf * 1000 * ETF_LOT * (1 + ETF_FEE);
    const lots = Math.floor(etfCash / lotCost);
    if (lots > 0) {
      etfCash -= lots * lotCost;
      etfUnits += lots * ETF_LOT;
      etfFees += lots * row.etf * 1000 * ETF_LOT * ETF_FEE;
      etfMonths += 1;
    }

    // Bank — compounds on what was already there, then this month goes in. The
    // table quotes 12-month rates, which are effective: a deposit advertised at
    // 6.5% pays 6.5% over the year, so the monthly factor is the twelfth root,
    // not r/12 (which would quietly pay 6.70%).
    bank = bank * (1 + rateFor(snapshot.deposit, year) / 100) ** (1 / 12) + contribution;

    // Gold — bought at the shop's selling price, in whole chỉ.
    goldCash += contribution;
    const chiCost = (row.goldSell * 1000) / CHI_PER_TAEL;
    const chi = Math.floor(goldCash / chiCost);
    if (chi > 0) {
      goldCash -= chi * chiCost;
      goldChi += chi;
      goldMonths += 1;
    }

    months.push({
      month: row.month,
      projected: row.projected,
      etfPrice: row.etf * 1000,
      goldPrice: row.goldSell * 1000,
      contribution,
      paidIn,
      gold: (goldChi * row.goldBuy * 1000) / CHI_PER_TAEL + goldCash,
      etf: etfUnits * row.etf * 1000 + etfCash,
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
  const todayYear = Number(snapshot.latest.date.slice(0, 4));
  const cpiRef = cpiFor(snapshot.cpi, todayYear);
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
  lastPoint.gold = finals.gold;
  lastPoint.etf = finals.etf;
  lastPoint.bank = finals.bank;
  lastPoint.etfPrice = endPrices.etf * 1000;
  lastPoint.goldPrice = endPrices.goldSell * 1000;

  const extras: Record<ChannelKey, { idleCash: number; units: number; monthsBought: number }> = {
    gold: { idleCash: goldCash, units: goldChi, monthsBought: goldMonths },
    etf: { idleCash: etfCash, units: etfUnits, monthsBought: etfMonths },
    bank: { idleCash: 0, units: 0, monthsBought: bankMonths },
  };

  const seriesFor: Record<ChannelKey, number[]> = {
    gold: months.map((m) => m.gold),
    etf: months.map((m) => m.etf),
    bank: months.map((m) => m.bank),
  };

  const channels: ChannelResult[] = (["gold", "etf", "bank"] as ChannelKey[]).map((key) => {
    const value = finals[key];
    const profit = value - paidIn;
    return {
      key,
      value,
      profit,
      profitPct: paidIn > 0 ? profit / paidIn : 0,
      xirr: paidIn > 0 ? xirr(flows, value, endDay) : 0,
      realValue: value * toTodaysMoney,
      realProfit: value * toTodaysMoney - paidInToday,
      maxDrawdown: paidIn > 0 ? deepestFall(seriesFor[key]) : 0,
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
          etf: logLinearMonthlyGrowth(
            snapshot.months.filter((m) => m.month >= inputs.startMonth).map((m) => m.etf),
          ) ** 12 - 1,
          gold:
            logLinearMonthlyGrowth(
              snapshot.months.filter((m) => m.month >= inputs.startMonth).map((m) => m.goldBuy),
            ) ** 12 - 1,
          bank: rateFor(snapshot.deposit, endYear) / 100,
        }
      : null,
    firstContribution: months[0].contribution,
    lastContribution: months[months.length - 1].contribution,
    etfFees,
    channels,
  };
}
