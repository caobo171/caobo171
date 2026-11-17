export type SavingMode = "percent" | "fixed";
export type ChannelKey = "gold" | "etf" | "bank";

/**
 * Prices are in thousands of VND, as the upstream sources publish them:
 * `etf` per fund unit, `goldBuy` / `goldSell` per lượng (tael).
 */
export interface SnapshotMonth {
  month: string; // "2016-01"
  date: string; // first trading day used, "2016-01-04"
  etf: number;
  goldBuy: number;
  goldSell: number;
}

export interface SnapshotLatest {
  date: string;
  etfDate: string;
  etf: number;
  goldDate: string;
  goldBuy: number;
  goldSell: number;
}

export interface Snapshot {
  generatedAt: string;
  latest: SnapshotLatest;
  months: SnapshotMonth[];
  /** Annual consumer price index by year. */
  cpi: Record<string, number>;
  /** Representative 12-month deposit rate by year, in percent. */
  deposit: Record<string, number>;
  sources: Record<string, string>;
}

export interface Inputs {
  /** Inclusive first month of the plan, "YYYY-MM". */
  startMonth: string;
  /** Inclusive last month. Empty means "as far as the data goes"; a month past
   *  the data projects forward on an assumed growth rate. */
  endMonth: string;
  /** Money already saved before the plan starts, in VND. */
  initialCapital: number;
  mode: SavingMode;
  /** Monthly salary in the first month of the plan, in VND. */
  salaryStart: number;
  raisePct: number;
  /** The salary never rises above this, in VND. */
  salaryCeiling: number;
  savePct: number;
  /** Used instead of a share of salary when `mode` is "fixed". */
  fixedAmount: number;
  monthlyCapVnd: number;
}

export interface MonthPoint {
  month: string;
  /** True once the prices behind this point are assumed rather than observed. */
  projected: boolean;
  /** What one fund unit cost that month, in VND. */
  etfPrice: number;
  /** What one lượng of gold cost to buy that month, in VND. */
  goldPrice: number;
  contribution: number;
  /** Cumulative money put in, up to and including this month. */
  paidIn: number;
  gold: number;
  etf: number;
  bank: number;
}

export interface ChannelResult {
  key: ChannelKey;
  value: number;
  profit: number;
  profitPct: number;
  /** Money-weighted annual return, as a fraction. */
  xirr: number;
  /** The final value deflated into today's purchasing power. Equal to `value`
   *  for a run that ends today; smaller for one that ends in the future. */
  realValue: number;
  /** `realValue` less the contributions, both in today's money. */
  realProfit: number;
  /** Deepest fall from a running peak, as a negative fraction. */
  maxDrawdown: number;
  idleCash: number;
  /** Chi of gold, or fund units. Zero for the bank. Formatted by the UI, which
   *  knows the reader's language. */
  units: number;
  monthsBought: number;
}

export interface SimulationResult {
  months: MonthPoint[];
  paidIn: number;
  paidInToday: number;
  inflationFactor: number;
  salaryStart: number;
  salaryEnd: number;
  /** First calendar year the raise ceiling binds, or null if it never does. */
  ceilingYear: number | null;
  firstContribution: number;
  lastContribution: number;
  /** Total brokerage paid buying the ETF, in VND. */
  etfFees: number;
  /** First month whose prices are assumed, or null for a pure backtest. */
  projectedFrom: string | null;
  /** The annual growth assumed beyond the data, per channel. */
  assumedAnnual: Record<ChannelKey, number> | null;
  /** The span the growth rates were fitted over — always the whole history. */
  fittedOver: { from: string; to: string } | null;
  /** Best return first. */
  channels: ChannelResult[];
}
