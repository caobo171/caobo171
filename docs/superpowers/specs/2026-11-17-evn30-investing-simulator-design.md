# /evn30 — Vietnamese monthly-investing simulator

**Date:** 2026-11-17
**Status:** approved (conversation, 2026-11-17)
**Route:** `/evn30` on caobo171's personal site (`web/`)

## Intent

A public page on a personal site that answers one question honestly: *if I had saved
part of my salary every month and put it somewhere, where would I be now?*

The visitor sets out a plausible saving life — a salary, raises that eventually stop, a
share of it put aside each month — and the page runs that plan through three places
Vietnamese savers actually use, with real historical prices: the **VN30 ETF
(E1VFVN30)**, a **bank savings account**, and **SJC gold**.

The owner's own stated priority: *"I do it for visitors but I think it's much accurate
as possible."* Both halves matter. Accuracy is the thing worth showing off; a page that
flatters one asset is not worth visiting.

The result the data gives is itself a reason to publish: over 2016–2026, **gold beat the
VN30 ETF**, 16.19%/yr against 11.85%, with bank savings at 5.93% and inflation at
2.97%. That is not the answer a finance blog usually gives.

## Goals

- Real historical prices for all three channels — no assumed rates of return anywhere.
- Real Vietnamese CPI, so "profit" can be stated in today's purchasing power.
- Model the frictions that make a backtest honest: trading lots, gold's buy/sell spread,
  brokerage fees, and cash that has to wait because it can't buy a whole unit.
- Fast, playable inputs — moving a slider re-answers the question immediately.
- Radix UI visual language, as requested.

## Non-goals

- Forecasting. Every number is backward-looking. The page never projects a future return.
- Investment advice, or a recommendation between the three channels.
- Live/intraday prices. Data is a committed snapshot, refreshed by hand.
- Accounts, saving a scenario, sharing a permalink.
- Lump-sum mode ("what if I'd put it all in at once"). Considered and deferred; it
  doubles the inputs and nobody has asked for it yet.

## Anti-goals

Things that would make this a failure even if it ran correctly:

- **Looking precise while being approximate.** Any number whose provenance is weak must
  say so on the page, not in a comment.
- **Flattering a channel by ignoring its costs.** Gold's 2.2% spread and the ETF's lot
  size are the kind of detail that quietly inflates a backtest. They are modelled.
- **A cockpit.** Six inputs is already near the limit for a page a stranger lands on.

## Constraints

### Data, and where it runs out

| Series | Source | Coverage | Confidence |
|---|---|---|---|
| E1VFVN30 daily close | DNSE Entrade chart API | 2014-10-06 → today | High — real traded prices |
| SJC gold daily buy/sell | `andy-nguyen-21/gold-market-data-vietnam` (GitHub CSV) | 2016-01-01 → today | Medium — community scrape, not official SJC |
| Vietnam CPI, annual | World Bank `FP.CPI.TOTL` | 2013 → 2025 | High — official; 2026 extrapolated at 3.3% |
| 12-month deposit rate | Hand-built yearly table | 2016 → 2026 | **Low** — no free historical series exists |

Two consequences the page must state plainly:

1. **The window starts January 2016**, not 2014, because that is where gold history
   begins. The ETF has more history than the comparison can use.
2. **Deposit rates are the weakest number on the page.** Vietnamese 12-month rates are
   not published as a usable free series. A yearly table is assembled from reported
   market rates and shown to the visitor, so they can judge it.

### Other constraints

- `E1VFVN30` trades in **lots of 100 units** on HOSE. A month that cannot afford a lot
  buys nothing and the cash carries.
- **SJC gold is bought at the shop's selling price and valued at its buying price.** The
  spread (1.4% in 2016, 2.2% today) is a real cost and is charged.
- Gold is bought in **chỉ** (0.1 tael). At today's price one chỉ is 13.75M ₫, which is
  more than a month's saving in the default scenario — so gold genuinely cannot buy every
  month. It bought in 121 of 131 months.
- Existing site is Next.js 16.3.4 App Router, React 19, CSS Modules, no chart library,
  no client-side state anywhere. Self-hosted behind pm2 on port 41717.

## Approaches considered

**How the data reaches the page** — the decision that shaped everything else.

1. **Fetch upstream at request time (ISR).** Always current. Rejected: it puts two
   undocumented third-party endpoints on the critical path of a public page, and every
   slider move would need a round trip or a duplicated client-side model anyway.
2. **Cached API route + client math.** A route handler caches upstream daily; the page
   fetches once and simulates in the browser. Better, but a failed upstream fetch still
   breaks the page unless a committed fallback exists — at which point the fallback is
   doing the real work.
3. **Committed snapshot + client math.** ✅ **Chosen.** A JSON snapshot lives in the
   repo. A refresh script rewrites it on demand. The page ships the snapshot and does
   every calculation in the browser.

Chosen because the sliders have to feel instant, monthly investing does not care whether
prices are three days stale, and a public page that cannot break is worth more than a
public page that is current to the minute. The snapshot also makes every published number
reproducible, which is the point of the page.

**Snapshot granularity.** The model acts once a month, so the snapshot stores one row per
month — the first trading day and its prices — rather than ~4,000 daily rows. No accuracy
is lost, because monthly is exactly the resolution the simulation uses. ~131 rows.

**Charting.** Hand-rolled SVG, not a library. Four polylines, gridlines and a legend is
~80 lines, adds no dependency, and won't fight Radix's theming.

**Styling.** `@radix-ui/themes`, scoped to `/evn30` via a route-group layout. The serif
homepage is untouched. Its Slider, SegmentedControl, TextField, Tabs and Card are exactly
the controls this page needs, and they bring keyboard accessibility for free.

## The model

### Inputs

| Input | Default | Notes |
|---|---|---|
| Start year | 2016 | 2016 / 2018 / 2020 / 2022 / 2024 |
| Saving mode | % of salary | or a fixed ₫ amount |
| Salary today | 30,000,000 ₫/mo | only shown in % mode |
| Annual raise | 8%/yr | only shown in % mode |
| Raise ceiling | +60% | only shown in % mode |
| Saving rate | 25% of salary | or a fixed amount in ₫ mode |
| Monthly cap | 50,000,000 ₫ | only shown in % mode |

### Salary, worked backwards

The visitor enters **today's** salary, not their salary in 2016 — that is the number a
person can actually answer. The model back-solves the starting salary:

```
salary(year y) = salary_start × min((1 + raise)^y, ceiling)
salary_start   = salary_today / min((1 + raise)^years_elapsed, ceiling)
```

With the defaults the ceiling binds: 1.08^10 = 2.16 > 1.60, so the starting salary is
30M / 1.6 = **18.75M ₫**, rising to 30M and flattening in 2022. The page says this out
loud — the moment your raises stop is interesting, not an implementation detail.

In **fixed-amount mode** the salary, raise, ceiling and cap inputs are irrelevant and the
contribution is simply the fixed figure each month. The salary controls stand down.

### Each month

```
contribution = min(salary × rate, cap)      (or the fixed amount)
```

and that same contribution goes into all three channels:

- **VN30 ETF** — cash accumulates; buy `floor(cash / (price × 100 × 1.0015))` lots;
  0.15% brokerage charged on the buy; leftover cash stays cash.
- **Bank savings** — balance compounds monthly at that year's 12-month rate, then the
  contribution is added.
- **SJC gold** — cash accumulates; buy `floor(cash / sellPrice_per_chỉ)` chỉ; leftover
  cash stays cash. Holdings are valued at the buy price.

### Results

Per channel: final value, profit against money paid in, **money-weighted annual return
(XIRR)** — not a naive total/invested ratio, because the money arrived progressively —
and the deepest fall from peak along the way.

Inflation is applied by inflating every past contribution into today's ₫ using real CPI,
so "real profit" compares like with like. Over the default window prices rose 36.4%.

## Layout

Validated in a mockup before building. Top to bottom:

1. Title and one line of framing.
2. **One card of controls** — four of the six inputs are sliders whose label carries the
   current value, so the card reads as a sentence rather than a panel of widgets. A line
   underneath spells out the resulting contribution ("4.69M ₫/month in 2016, rising to
   7.50M ₫ once the ceiling bites in 2022"). Apply button.
3. A sentence giving what was paid in, nominal and in today's money.
4. **Three stat cards**, winner highlighted.
5. **The chart** — four lines: the three channels plus what you paid in.
6. **Tabs**: Summary · Month by month · Where the numbers come from.

Light and dark both ship, following the system preference — Radix makes this nearly free.

## Left to the builder

- Exact Radix accent colour and grey scale.
- Whether the chart gets a hover crosshair. Desirable, not required for a first version.
- The month-by-month table's exact columns.
- Mobile layout specifics beyond "controls stack to one column".
- The wording of the explanatory copy, within the voice above.
