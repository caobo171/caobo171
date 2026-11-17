import type {
  ChannelKey,
  ChannelResult,
  Inputs,
  MonthPoint,
  SimulationResult,
  Snapshot,
} from "./types";

/** HOSE trades E1VFVN30 in lots of 100 units; an odd amount cannot be bought. */
export const ETF_LOT = 100;
/** Brokerage charged on each ETF purchase. */
export const ETF_FEE = 0.0015;
/** 1 lượng = 10 chỉ. Gold is bought in chỉ. */
export const CHI_PER_TAEL = 10;

export const DEFAULT_INPUTS: Inputs = {
  startYear: 2016,
  mode: "percent",
  salaryToday: 30_000_000,
  raisePct: 8,
  ceilingPct: 60,
  savePct: 25,
  fixedAmount: 2_000_000,
  monthlyCapVnd: 50_000_000,
};

const LABELS: Record<ChannelKey, string> = {
  gold: "SJC gold",
  etf: "VN30 ETF",
  bank: "Bank savings",
};

const unitFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

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

export function simulate(snapshot: Snapshot, inputs: Inputs): SimulationResult {
  const rows = snapshot.months.filter((m) => Number(m.month.slice(0, 4)) >= inputs.startYear);

  const empty: SimulationResult = {
    months: [],
    paidIn: 0,
    paidInToday: 0,
    inflationFactor: 1,
    salaryStart: inputs.salaryToday,
    salaryEnd: inputs.salaryToday,
    ceilingYear: null,
    firstContribution: 0,
    lastContribution: 0,
    etfFees: 0,
    channels: [],
  };
  if (!rows.length) return empty;

  const raiseFactor = 1 + inputs.raisePct / 100;
  const ceilingFactor = 1 + inputs.ceilingPct / 100;
  const lastYearIndex = Math.floor((rows.length - 1) / 12);
  const growthAtEnd = Math.min(raiseFactor ** lastYearIndex, ceilingFactor);
  const salaryStart = inputs.salaryToday / (growthAtEnd || 1);

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

  rows.forEach((row, i) => {
    const year = Number(row.month.slice(0, 4));
    const yearIndex = Math.floor(i / 12);
    const salary = salaryStart * Math.min(raiseFactor ** yearIndex, ceilingFactor);

    const contribution =
      inputs.mode === "fixed"
        ? inputs.fixedAmount
        : Math.min((salary * inputs.savePct) / 100, inputs.monthlyCapVnd);

    if (
      inputs.mode === "percent" &&
      ceilingYear === null &&
      raiseFactor ** yearIndex >= ceilingFactor
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

    // Bank — compounds on what was already there, then this month goes in.
    bank = bank * (1 + rateFor(snapshot.deposit, year) / 100 / 12) + contribution;

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
      contribution,
      paidIn,
      gold: (goldChi * row.goldBuy * 1000) / CHI_PER_TAEL + goldCash,
      etf: etfUnits * row.etf * 1000 + etfCash,
      bank,
    });
  });

  const { latest } = snapshot;
  const endDay = dayNumber(latest.date);
  const endYear = Number(latest.date.slice(0, 4));
  const cpiEnd = rateFor(snapshot.cpi, endYear);
  const cpiStart = rateFor(snapshot.cpi, Number(rows[0].month.slice(0, 4)));

  let paidInToday = 0;
  rows.forEach((row, i) => {
    paidInToday +=
      months[i].contribution * (cpiEnd / rateFor(snapshot.cpi, Number(row.month.slice(0, 4))));
  });

  const finals: Record<ChannelKey, number> = {
    gold: (goldChi * latest.goldBuy * 1000) / CHI_PER_TAEL + goldCash,
    etf: etfUnits * latest.etf * 1000 + etfCash,
    bank,
  };

  const extras: Record<ChannelKey, { idleCash: number; unitsLabel: string; monthsBought: number }> =
    {
      gold: {
        idleCash: goldCash,
        unitsLabel: `${(goldChi / CHI_PER_TAEL).toFixed(1)} lượng`,
        monthsBought: goldMonths,
      },
      etf: {
        idleCash: etfCash,
        unitsLabel: `${unitFormat.format(etfUnits)} units`,
        monthsBought: etfMonths,
      },
      bank: { idleCash: 0, unitsLabel: "compounds monthly", monthsBought: bankMonths },
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
      label: LABELS[key],
      value,
      profit,
      profitPct: paidIn > 0 ? profit / paidIn : 0,
      xirr: paidIn > 0 ? xirr(flows, value, endDay) : 0,
      realProfit: value - paidInToday,
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
    salaryEnd: salaryStart * growthAtEnd,
    ceilingYear,
    firstContribution: months[0].contribution,
    lastContribution: months[months.length - 1].contribution,
    etfFees,
    channels,
  };
}
