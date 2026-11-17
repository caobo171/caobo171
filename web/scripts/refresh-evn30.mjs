/**
 * Rebuilds src/data/evn30-snapshot.json from upstream sources.
 *
 * The simulator only ever acts on the first trading day of each month, so the
 * snapshot stores one row per month rather than ~4,000 daily rows. Prices stay
 * in thousands of VND, exactly as the sources give them.
 *
 *   node scripts/refresh-evn30.mjs
 */
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const OUT = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "src",
  "data",
  "evn30-snapshot.json",
);

const FIRST_MONTH = "2016-01"; // where the SJC gold series begins
const CPI_FALLBACK_GROWTH = 1.033; // used only for years the World Bank has not published

const SOURCES = {
  etf: "DNSE Entrade chart API — E1VFVN30 daily close (services.entrade.com.vn)",
  gold: "github.com/andy-nguyen-21/gold-market-data-vietnam — SJC daily buy/sell, community-maintained",
  cpi: "World Bank FP.CPI.TOTL, Vietnam, annual index",
  deposit:
    "Hand-built table of representative 12-month VND deposit rates. No free historical series is published; treat as approximate.",
};

/** Representative 12-month VND deposit rate by year, in percent. */
const DEPOSIT = {
  2016: 6.5,
  2017: 6.8,
  2018: 6.9,
  2019: 7.0,
  2020: 6.0,
  2021: 5.5,
  2022: 7.2,
  2023: 6.3,
  2024: 5.0,
  2025: 5.2,
  2026: 5.0,
};

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

async function get(url, as = "json") {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return as === "json" ? res.json() : res.text();
}

const iso = (seconds) => new Date(seconds * 1000).toISOString().slice(0, 10);

async function fetchEtf() {
  const now = Math.floor(Date.now() / 1000);
  const data = await get(
    `https://services.entrade.com.vn/chart-api/v2/ohlcs/stock?from=1420070400&to=${now}&symbol=E1VFVN30&resolution=1D`,
  );
  if (!Array.isArray(data?.t) || !data.t.length) throw new Error("ETF response had no bars");
  const byDate = new Map();
  data.t.forEach((t, i) => {
    const close = data.c[i];
    if (close) byDate.set(iso(t), close);
  });
  return byDate;
}

async function fetchGold() {
  const csv = await get(
    "https://raw.githubusercontent.com/andy-nguyen-21/gold-market-data-vietnam/main/sjc_gold_prices.csv",
    "text",
  );
  const [header, ...lines] = csv.trim().split("\n");
  const cols = header.split(",").map((c) => c.trim());
  const [iDate, iBuy, iSell] = ["date", "gia_mua", "gia_ban"].map((c) => cols.indexOf(c));
  if (iDate < 0 || iBuy < 0 || iSell < 0) throw new Error(`unexpected gold CSV header: ${header}`);

  // Several quotes per day; the last line for a date is that day's closing quote.
  const byDate = new Map();
  for (const line of lines) {
    const f = line.split(",");
    const buy = Number(f[iBuy]);
    const sell = Number(f[iSell]);
    if (!Number.isFinite(buy) || !Number.isFinite(sell) || buy <= 0 || sell <= 0) continue;
    byDate.set(f[iDate].trim(), { buy, sell });
  }
  return byDate;
}

async function fetchCpi(lastYear) {
  const body = await get(
    "https://api.worldbank.org/v2/country/VNM/indicator/FP.CPI.TOTL?format=json&per_page=60&date=2013:2030",
  );
  const rows = body?.[1];
  if (!Array.isArray(rows)) throw new Error("unexpected World Bank CPI response");
  const cpi = {};
  for (const r of rows) if (r.value) cpi[r.date] = Number(r.value.toFixed(4));

  const published = Object.keys(cpi).map(Number).sort((a, b) => a - b);
  if (!published.length) throw new Error("World Bank returned no CPI values");

  // Carry the index forward for years that have not been published yet.
  for (let y = published[published.length - 1] + 1; y <= lastYear; y++) {
    cpi[y] = Number((cpi[y - 1] * CPI_FALLBACK_GROWTH).toFixed(4));
  }
  return cpi;
}

const monthKey = (d) => d.slice(0, 7);

/** First date in `byDate` on or after the 1st of `month`, within a 20-day window. */
function firstOnOrAfter(byDate, month) {
  const start = new Date(`${month}-01T00:00:00Z`);
  for (let i = 0; i < 20; i++) {
    const d = new Date(start.getTime() + i * 86_400_000).toISOString().slice(0, 10);
    if (monthKey(d) !== month) break; // ran past the end of the month
    const hit = byDate.get(d);
    if (hit !== undefined) return { date: d, value: hit };
  }
  return null;
}

function monthsBetween(first, last) {
  const out = [];
  let [y, m] = first.split("-").map(Number);
  const [ly, lm] = last.split("-").map(Number);
  while (y < ly || (y === ly && m <= lm)) {
    out.push(`${y}-${String(m).padStart(2, "0")}`);
    if (++m === 13) { m = 1; y++; }
  }
  return out;
}

const lastMonthOf = (byDate) => monthKey([...byDate.keys()].sort().at(-1));

/**
 * Structure is not enough. Both price feeds are third-party — one is a
 * community scrape — and a silent swap of the buy/sell columns or a change of
 * units would still parse cleanly while producing a flattered or absurd result.
 * These are the checks that would have caught that.
 */
function checkPlausible(months) {
  const fail = (m, why) => {
    throw new Error(`${m.month} looks wrong: ${why}. Refusing to write the snapshot.`);
  };

  for (const m of months) {
    // Gold shops always sell higher than they buy. If this flips, the model
    // would turn the spread from a cost into a gain.
    if (m.goldSell <= m.goldBuy) {
      fail(m, `goldSell ${m.goldSell} is not above goldBuy ${m.goldBuy}`);
    }
    // Thousands of VND per lượng, and per fund unit.
    if (m.goldSell < 20_000 || m.goldSell > 500_000) fail(m, `goldSell ${m.goldSell} out of range`);
    if (m.etf < 5 || m.etf > 200) fail(m, `etf ${m.etf} out of range`);
  }

  for (let i = 1; i < months.length; i++) {
    for (const key of ["etf", "goldBuy", "goldSell"]) {
      const move = Math.abs(months[i][key] / months[i - 1][key] - 1);
      if (move > 0.5) {
        fail(months[i], `${key} moved ${(move * 100).toFixed(0)}% from ${months[i - 1].month}`);
      }
    }
  }
}

async function main() {
  const [etf, gold] = await Promise.all([fetchEtf(), fetchGold()]);

  const lastMonth = [lastMonthOf(etf), lastMonthOf(gold)].sort()[0];
  const months = [];
  const missing = [];

  for (const month of monthsBetween(FIRST_MONTH, lastMonth)) {
    const e = firstOnOrAfter(etf, month);
    const g = firstOnOrAfter(gold, month);
    if (!e || !g) {
      missing.push(`${month}${e ? "" : " (etf)"}${g ? "" : " (gold)"}`);
      continue;
    }
    months.push({
      month,
      date: e.date,
      etf: e.value,
      goldBuy: g.value.buy,
      goldSell: g.value.sell,
    });
  }

  if (missing.length) {
    throw new Error(`no price for ${missing.length} month(s): ${missing.join(", ")}`);
  }
  if (months.length < 24) throw new Error(`only ${months.length} months resolved; refusing to write`);

  checkPlausible(months);

  const cpi = await fetchCpi(Number(lastMonth.slice(0, 4)));

  // Holdings are valued at the most recent price available, not at the first
  // trading day of the current month — otherwise the headline figure is stale
  // by up to four weeks.
  const etfLast = [...etf.keys()].sort().at(-1);
  const goldLast = [...gold.keys()].sort().at(-1);
  const latest = {
    date: [etfLast, goldLast].sort()[0],
    etfDate: etfLast,
    etf: etf.get(etfLast),
    goldDate: goldLast,
    goldBuy: gold.get(goldLast).buy,
    goldSell: gold.get(goldLast).sell,
  };

  const snapshot = {
    generatedAt: new Date().toISOString(),
    latest,
    months,
    cpi,
    deposit: DEPOSIT,
    sources: SOURCES,
  };

  await writeFile(OUT, `${JSON.stringify(snapshot, null, 2)}\n`);
  console.log(
    `wrote ${months.length} months, ${months[0].month} → ${months.at(-1).month}, ` +
      `to ${path.relative(process.cwd(), OUT)}`,
  );
  console.log(`CPI years: ${Object.keys(cpi).join(", ")}`);
}

main().catch((err) => {
  console.error(`refresh-evn30 failed: ${err.message}`);
  process.exit(1);
});
