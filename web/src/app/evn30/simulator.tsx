"use client";

import {
  Badge,
  Box,
  Button,
  Callout,
  Card,
  Container,
  Flex,
  Grid,
  Heading,
  Link as RadixLink,
  SegmentedControl,
  Select,
  Separator,
  Slider,
  Table,
  Tabs,
  Text,
  TextField,
  Tooltip,
} from "@radix-ui/themes";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

import { GITHUB, WELE } from "@/app/links";
import { COPY, LANGS, type Copy, type Lang } from "@/lib/evn30/copy";
import { dayName, money, monthName, percent, plain, signedMoney, tael } from "@/lib/evn30/format";
import { DEFAULT_INPUTS, simulate } from "@/lib/evn30/simulate";
import {
  parseInputs,
  parseLang,
  readServerLangRaw,
  readServerRaw,
  readStoredLangRaw,
  readStoredRaw,
  saveInputs,
  saveLang,
  subscribeToStored,
} from "@/lib/evn30/storage";
import type { ChannelKey, Inputs, Snapshot } from "@/lib/evn30/types";

import { Chart } from "./chart";
import { Sources } from "./sources";

/** How long a run to open up when the reader moves the start past the end. */
const DEFAULT_RUN_MONTHS = 12;

const addMonths = (month: string, n: number): string => {
  const [y, m] = month.split("-").map(Number);
  const total = y * 12 + (m - 1) + n;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
};

const DOT: Record<ChannelKey, string> = {
  gold: "var(--amber-9)",
  etf: "var(--indigo-9)",
  bank: "var(--gray-8)",
};

const ACCENT: Record<ChannelKey, "amber" | "indigo" | "gray"> = {
  gold: "amber",
  etf: "indigo",
  bank: "gray",
};

const digits = (s: string) => Number(s.replace(/\D/g, "")) || 0;

function InfoDot({ text }: { text: string }) {
  return (
    <Tooltip content={text}>
      <span
        tabIndex={0}
        role="note"
        aria-label={text}
        style={{ cursor: "help", display: "inline-flex", color: "var(--gray-9)" }}
      >
        <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden focusable="false">
          <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.3" />
          <circle cx="8" cy="4.7" r="0.95" fill="currentColor" />
          <path d="M8 7.2v4.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </span>
    </Tooltip>
  );
}

function Field({
  label,
  value,
  help,
  children,
}: {
  label: string;
  value: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <Box>
      <Flex justify="between" align="baseline" gap="2" mb="1">
        <Flex align="center" gap="1">
          <Text size="1" color="gray">
            {label}
          </Text>
          {help ? <InfoDot text={help} /> : null}
        </Flex>
        <Text size="2" weight="bold" style={{ textAlign: "right" }}>
          {value}
        </Text>
      </Flex>
      {children}
    </Box>
  );
}

const MONTHS = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];

function MonthYearPicker({
  value,
  years,
  min,
  max,
  onChange,
  t,
}: {
  value: string;
  years: number[];
  min: string;
  max: string;
  onChange: (month: string) => void;
  t: Copy;
}) {
  const [year, month] = value.split("-");
  const clamp = (v: string) => (v < min ? min : v > max ? max : v);

  return (
    <Flex gap="2">
      <Select.Root value={month} onValueChange={(m) => onChange(clamp(`${year}-${m}`))}>
        <Select.Trigger aria-label={t.monthLabel} style={{ flex: 1 }} />
        <Select.Content position="popper">
          {MONTHS.map((m) => (
            <Select.Item key={m} value={m}>
              {`${t.monthLabel} ${Number(m)}`}
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>
      <Select.Root value={year} onValueChange={(y) => onChange(clamp(`${y}-${month}`))}>
        <Select.Trigger aria-label={t.yearLabel} style={{ flex: 1 }} />
        <Select.Content position="popper">
          {years.map((y) => (
            <Select.Item key={y} value={String(y)}>
              {y}
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>
    </Flex>
  );
}

function A11ySlider({
  label,
  ...rest
}: React.ComponentProps<typeof Slider> & { label: string }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    host.current
      ?.querySelectorAll('[role="slider"]')
      .forEach((el) => el.setAttribute("aria-label", label));
  }, [label]);
  return (
    <div ref={host}>
      <Slider {...rest} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Text as="div" size="1" color="gray">
        {label}
      </Text>
      <Text as="div" size="4" weight="bold" style={{ letterSpacing: "-0.01em" }}>
        {value}
      </Text>
    </Box>
  );
}

export function Evn30Simulator({ snapshot }: { snapshot: Snapshot }) {
  const langRaw = useSyncExternalStore(subscribeToStored, readStoredLangRaw, readServerLangRaw);
  const [langEdit, setLangEdit] = useState<Lang | null>(null);
  const lang = langEdit ?? parseLang(langRaw);
  const t = COPY[lang];

  const storedRaw = useSyncExternalStore(subscribeToStored, readStoredRaw, readServerRaw);
  const stored = useMemo(() => parseInputs(storedRaw) ?? DEFAULT_INPUTS, [storedRaw]);

  const [draftEdit, setDraftEdit] = useState<Inputs | null>(null);
  const [appliedEdit, setAppliedEdit] = useState<Inputs | null>(null);
  const draft = draftEdit ?? stored;
  const applied = appliedEdit ?? stored;

  const apply = () => {
    setAppliedEdit(draft);
    saveInputs(draft);
  };

  const result = useMemo(() => simulate(snapshot, applied), [snapshot, applied]);
  // Describes what the controls say now, not what was last applied — otherwise
  // the line contradicts the sliders directly above it.
  const preview = useMemo(() => simulate(snapshot, draft), [snapshot, draft]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(applied);
  const set = <K extends keyof Inputs>(key: K, value: Inputs[K]) =>
    setDraftEdit({ ...draft, [key]: value });

  const percentMode = draft.mode === "percent";
  const winner = result.channels[0];

  // Both ends range over the data and twenty years past it. Starting in the
  // future is a fair question — "what if I begin next year?" — and the run is
  // then projected throughout.
  const firstMonth = snapshot.months[0].month;
  const lastRealMonth = snapshot.months[snapshot.months.length - 1].month;
  const lastRealYear = Number(lastRealMonth.slice(0, 4));
  const years = [...new Set(snapshot.months.map((m) => Number(m.month.slice(0, 4))))];
  for (let y = lastRealYear + 1; y <= lastRealYear + 20; y++) years.push(y);
  const horizon = `${years[years.length - 1]}-12`;

  // A projected run is not "priced" on any real date — it ends on an assumed one.
  const priced = result.projectedFrom
    ? monthName(result.months[result.months.length - 1]?.month ?? lastRealMonth, lang)
    : dayName(snapshot.latest.date, lang);

  const holding = (key: ChannelKey, units: number) =>
    key === "gold" ? tael(units, lang) : key === "etf" ? t.fundUnits(plain(units, lang)) : t.bankHolding;

  return (
    <Box>
      <Box
        py="3"
        px="4"
        style={{ borderBottom: "1px solid var(--gray-6)", background: "var(--gray-2)" }}
      >
        <Container size="4">
          <Flex justify="between" align="center" gap="3">
            <Text size="2" weight="bold" style={{ whiteSpace: "nowrap" }}>
              Nguyễn Văn Cao
            </Text>
            <Flex gap="4" align="center" wrap="wrap" justify="end">
              <RadixLink asChild size="2" color="gray">
                <Link href="/">{t.home}</Link>
              </RadixLink>
              <RadixLink asChild size="2" color="gray">
                <Link href="/resume">{t.resume}</Link>
              </RadixLink>
              <RadixLink size="2" href={WELE} target="_blank" rel="noopener noreferrer" color="gray">
                WELE
              </RadixLink>
              <RadixLink
                size="2"
                href={GITHUB}
                target="_blank"
                rel="noopener noreferrer"
                color="gray"
              >
                GitHub
              </RadixLink>
              <SegmentedControl.Root
                size="1"
                value={lang}
                onValueChange={(v) => {
                  setLangEdit(v as Lang);
                  saveLang(v as Lang);
                }}
              >
                {LANGS.map((l) => (
                  <SegmentedControl.Item key={l} value={l}>
                    {l.toUpperCase()}
                  </SegmentedControl.Item>
                ))}
              </SegmentedControl.Root>
            </Flex>
          </Flex>
        </Container>
      </Box>

      <Container size="3" px="4" py="6">
        <Heading size="8" mb="2" style={{ letterSpacing: "-0.02em" }}>
          {t.title}
        </Heading>
        <Text as="p" size="3" color="gray" mb="5">
          {t.subtitle}
        </Text>

        <Card size="2">
          <Grid columns={{ initial: "1", sm: "2" }} gapX="5" gapY="4">
            <Field
              label={t.startingFrom}
              value={`${monthName(draft.startMonth, lang)} · ${t.windowLength(preview.months.length)}`}
            >
              <MonthYearPicker
                value={draft.startMonth}
                years={years}
                min={firstMonth}
                max={horizon}
                onChange={(m) => {
                  // Moving the start past the end would leave an empty run, so
                  // carry the end along rather than showing a blank page.
                  const end = draft.endMonth || lastRealMonth;
                  setDraftEdit({
                    ...draft,
                    startMonth: m,
                    endMonth: m >= end ? addMonths(m, DEFAULT_RUN_MONTHS) : draft.endMonth,
                  });
                }}
                t={t}
              />
            </Field>

            <Field
              label={t.endingAt}
              value={
                draft.endMonth
                  ? monthName(draft.endMonth, lang)
                  : `${monthName(lastRealMonth, lang)} · ${t.toLatest}`
              }
            >
              <MonthYearPicker
                value={draft.endMonth || lastRealMonth}
                years={years}
                min={addMonths(draft.startMonth, 1)}
                max={horizon}
                onChange={(m) => set("endMonth", m === lastRealMonth ? "" : m)}
                t={t}
              />
            </Field>

            <Box>
              <Text size="1" color="gray" as="div" mb="1">
                {t.iSaveLabel}
              </Text>
              <SegmentedControl.Root
                size="1"
                value={draft.mode}
                onValueChange={(v) => set("mode", v as Inputs["mode"])}
              >
                <SegmentedControl.Item value="percent">{t.modePercent}</SegmentedControl.Item>
                <SegmentedControl.Item value="fixed">{t.modeFixed}</SegmentedControl.Item>
              </SegmentedControl.Root>
            </Box>

            <Field
              label={t.initialCapital}
              value={`${plain(draft.initialCapital, lang)} ₫`}
              help={t.initialCapitalHelp}
            >
              <TextField.Root
                size="2"
                inputMode="numeric"
                aria-label={t.initialCapital}
                value={plain(draft.initialCapital, lang)}
                onChange={(e) => set("initialCapital", digits(e.target.value))}
              />
            </Field>

            {percentMode ? (
              <>
                <Field label={t.salaryStart} value={`${plain(draft.salaryStart, lang)} ₫`}>
                  <TextField.Root
                    size="2"
                    inputMode="numeric"
                    aria-label={t.salaryStart}
                    value={plain(draft.salaryStart, lang)}
                    onChange={(e) => set("salaryStart", digits(e.target.value))}
                  />
                </Field>

                <Field label={t.savePct} value={t.savePctValue(draft.savePct)}>
                  <A11ySlider
                    size="1"
                    label={t.savePct}
                    value={[draft.savePct]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={([v]) => set("savePct", v)}
                  />
                </Field>

                <Field
                  label={t.raiseEachYear}
                  value={
                    `${percent(draft.raisePct / 100, 0, lang)} · ${money(preview.salaryEnd, lang)} ${t.salaryToday}` +
                    // Without this the slider looks broken: past the ceiling the
                    // final salary stops moving however hard you drag.
                    (preview.ceilingYear ? ` — ${t.cappedFrom(preview.ceilingYear)}` : "")
                  }
                >
                  <A11ySlider
                    size="1"
                    label={t.raiseEachYear}
                    value={[draft.raisePct]}
                    min={0}
                    max={20}
                    step={1}
                    onValueChange={([v]) => set("raisePct", v)}
                  />
                </Field>

                <Field label={t.ceiling} value={`${plain(draft.salaryCeiling, lang)} ₫`}>
                  <TextField.Root
                    size="2"
                    inputMode="numeric"
                    aria-label={t.ceiling}
                    value={plain(draft.salaryCeiling, lang)}
                    onChange={(e) => set("salaryCeiling", digits(e.target.value))}
                  />
                </Field>

                <Field
                  label={t.monthlyCap}
                  value={`${plain(draft.monthlyCapVnd, lang)} ₫${t.perMonth}`}
                >
                  <A11ySlider
                    size="1"
                    label={t.monthlyCap}
                    value={[draft.monthlyCapVnd]}
                    min={1_000_000}
                    max={100_000_000}
                    step={1_000_000}
                    onValueChange={([v]) => set("monthlyCapVnd", v)}
                  />
                </Field>
              </>
            ) : (
              <Field label={t.fixedAmount} value={`${plain(draft.fixedAmount, lang)} ₫`}>
                <TextField.Root
                  size="2"
                  inputMode="numeric"
                  aria-label={t.fixedAmount}
                  value={plain(draft.fixedAmount, lang)}
                  onChange={(e) => set("fixedAmount", digits(e.target.value))}
                />
              </Field>
            )}
          </Grid>

          <Separator size="4" my="4" />

          <Flex justify="between" align="center" gap="3" wrap="wrap">
            <Text size="2" color="gray">
              {preview.firstContribution === preview.lastContribution
                ? t.contribFlat(money(preview.firstContribution, lang))
                : t.contribRising(
                    money(preview.firstContribution, lang),
                    money(preview.lastContribution, lang),
                    preview.ceilingYear,
                  )}
            </Text>
            <Button size="2" disabled={!dirty} onClick={apply}>
              {dirty ? t.apply : t.applied}
            </Button>
          </Flex>
        </Card>

        <Card size="2" my="4">
          <Flex gap="6" wrap="wrap">
            <Stat label={t.paidIn} value={money(result.paidIn, lang)} />
            <Stat label={t.inTodaysMoney} value={money(result.paidInToday, lang)} />
            <Stat
              label={t.windowLabel}
              value={`${t.windowLength(result.months.length)} · ${
                result.months.length ? monthName(result.months[0].month, lang) : "—"
              }`}
            />
            <Stat
              label={t.inflationLabel}
              value={`+${percent(result.inflationFactor - 1, 1, lang)}`}
            />
            <Stat label={t.pricedLabel} value={priced} />
          </Flex>
        </Card>

        {result.projectedFrom && result.assumedAnnual ? (
          <Callout.Root color="amber" mb="4">
            <Callout.Text>
              {t.projectionNote(
                monthName(result.projectedFrom, lang),
                result.fittedOver
                  ? `${monthName(result.fittedOver.from, lang)} → ${monthName(result.fittedOver.to, lang)}`
                  : "",
                percent(result.assumedAnnual.etf, 1, lang),
                percent(result.assumedAnnual.gold, 1, lang),
                percent(result.assumedAnnual.bank, 1, lang),
              )}
            </Callout.Text>
          </Callout.Root>
        ) : null}

        <Grid columns={{ initial: "1", sm: "3" }} gap="3" mb="4">
          {result.channels.map((c) => (
            <Card
              key={c.key}
              size="2"
              style={
                c.key === winner.key && result.paidIn > 0
                  ? { outline: `1px solid ${DOT[c.key]}` }
                  : undefined
              }
            >
              <Flex align="center" gap="2" mb="1">
                <Box
                  style={{ width: 9, height: 9, borderRadius: 2, background: DOT[c.key] }}
                  aria-hidden
                />
                <Text size="1" color="gray">
                  {t[c.key]}
                </Text>
              </Flex>
              <Text as="div" size="7" weight="bold" style={{ letterSpacing: "-0.02em" }}>
                {money(c.value, lang)}
              </Text>
              <Tooltip content={t.beforeInflationHelp}>
                <Text as="div" size="2" color="gray" mb="2" style={{ cursor: "help" }}>
                  {signedMoney(c.profit, lang)} {t.onWhatYouPaidIn}
                </Text>
              </Tooltip>
              <Badge color={ACCENT[c.key]} variant="soft">
                {percent(c.xirr, 2, lang)} {t.aYear}
              </Badge>
            </Card>
          ))}
        </Grid>

        <Card size="2" mb="4">
          <Chart months={result.months} copy={t} lang={lang} latestDate={priced} />
        </Card>

        <Tabs.Root defaultValue="summary">
          <Tabs.List>
            <Tabs.Trigger value="summary">{t.tabSummary}</Tabs.Trigger>
            <Tabs.Trigger value="months">{t.tabMonths}</Tabs.Trigger>
            <Tabs.Trigger value="sources">{t.tabSources}</Tabs.Trigger>
          </Tabs.List>

          <Box pt="4">
            <Tabs.Content value="summary">
              <Table.Root variant="surface" size="1">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>{t.thChannel}</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>{t.thHolding}</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>{t.thBoughtIn}</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>{t.thIdleCash}</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>{t.thDeepestFall}</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>
                      <Flex align="center" gap="1">
                        {t.thAfterInflation}
                        <InfoDot text={t.afterInflationHelp} />
                      </Flex>
                    </Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {result.channels.map((c) => (
                    <Table.Row key={c.key}>
                      <Table.RowHeaderCell>{t[c.key]}</Table.RowHeaderCell>
                      <Table.Cell>{holding(c.key, c.units)}</Table.Cell>
                      <Table.Cell>{t.ofMonths(c.monthsBought, result.months.length)}</Table.Cell>
                      <Table.Cell>{money(c.idleCash, lang)}</Table.Cell>
                      <Table.Cell>{percent(c.maxDrawdown, 1, lang)}</Table.Cell>
                      <Table.Cell>{signedMoney(c.realProfit, lang)}</Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
              <Text as="p" size="2" color="gray" mt="3">
                {t.brokerage(money(result.etfFees, lang))}{" "}
                {applied.mode === "percent"
                  ? t.salaryModelled(
                      money(result.salaryStart, lang),
                      money(result.salaryEnd, lang),
                    )
                  : null}
              </Text>
            </Tabs.Content>

            <Tabs.Content value="months">
              <Box style={{ maxHeight: "28rem", overflow: "auto" }}>
                <Table.Root variant="surface" size="1">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeaderCell>{t.thMonth}</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>{t.thPutIn}</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>{t.thPaidInSoFar}</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>{t.thEtfPrice}</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>{t.thGoldPrice}</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>{t.gold}</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>{t.etf}</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>{t.bank}</Table.ColumnHeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {result.months.map((m) => (
                      <Table.Row key={m.month}>
                        <Table.RowHeaderCell>{m.month}</Table.RowHeaderCell>
                        <Table.Cell>{money(m.contribution, lang)}</Table.Cell>
                        <Table.Cell>{money(m.paidIn, lang)}</Table.Cell>
                        <Table.Cell>{plain(m.etfPrice, lang)} ₫</Table.Cell>
                        <Table.Cell>{money(m.goldPrice, lang)}</Table.Cell>
                        <Table.Cell>{money(m.gold, lang)}</Table.Cell>
                        <Table.Cell>{money(m.etf, lang)}</Table.Cell>
                        <Table.Cell>{money(m.bank, lang)}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Box>
            </Tabs.Content>

            <Tabs.Content value="sources">
              <Sources snapshot={snapshot} copy={t} lang={lang} />
            </Tabs.Content>
          </Box>
        </Tabs.Root>
      </Container>
    </Box>
  );
}
