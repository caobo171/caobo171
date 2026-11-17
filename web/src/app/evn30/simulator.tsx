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
import { DEFAULT_INPUTS, retirement, simulate, WITHDRAWAL_RATE } from "@/lib/evn30/simulate";
import {
  parseInputs,
  parseLang,
  readServerLangRaw,
  readServerRaw,
  readStoredLangRaw,
  readStoredRaw,
  saveInputs,
  MAX_MILESTONES,
  saveLang,
  setLangParam,
  subscribeToStored,
} from "@/lib/evn30/storage";
import type { ChannelKey, Inputs, Milestone, Snapshot } from "@/lib/evn30/types";

import { Chart } from "./chart";
import { Methodology } from "./methodology";
import { Sources } from "./sources";
import { ThemeToggle } from "./theme";

/** The furthest year any control offers. */
const LAST_YEAR = 2100;

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

function Stat({
  label,
  value,
  help,
  note,
}: {
  label: string;
  value: string;
  help?: string;
  note?: string;
}) {
  return (
    <Box>
      <Flex align="center" gap="1">
        <Text as="div" size="1" color="gray">
          {label}
        </Text>
        {help ? <InfoDot text={help} /> : null}
      </Flex>
      <Text as="div" size="4" weight="bold" style={{ letterSpacing: "-0.01em" }}>
        {value}
      </Text>
      {note ? (
        <Text as="div" size="1" color="gray">
          {note}
        </Text>
      ) : null}
    </Box>
  );
}

/** Starting points, so the first milestone is one click rather than five fields. */
const PRESETS: Array<{
  label: "presetHouse" | "presetCar" | "presetChild";
  upfront: number;
  annual: number;
  years: number;
}> = [
  { label: "presetHouse", upfront: 800_000_000, annual: 120_000_000, years: 20 },
  { label: "presetCar", upfront: 300_000_000, annual: 40_000_000, years: 10 },
  { label: "presetChild", upfront: 50_000_000, annual: 60_000_000, years: 22 },
];

/**
 * One milestone's fields. Laid out with wrapping flex rather than a column
 * grid: the row has to survive a phone without a breakpoint deciding which
 * field gets squeezed.
 */
function MilestoneRow({
  m,
  t,
  lang,
  years,
  outside,
  onChange,
  onRemove,
}: {
  m: Milestone;
  t: Copy;
  lang: Lang;
  years: number[];
  outside: boolean;
  onChange: (next: Milestone) => void;
  onRemove: () => void;
}) {
  const label = (text: string, note?: string) => (
    <Flex gap="1" align="baseline" mb="1">
      <Text as="div" size="1" color="gray">
        {text}
      </Text>
      {note ? (
        <Text as="div" size="1" color="amber">
          {note}
        </Text>
      ) : null}
    </Flex>
  );

  return (
    <Card size="1" mb="2">
      <Flex gap="2" align="end" wrap="wrap">
        <Box style={{ flex: "2 1 9rem" }}>
          {label(t.mName)}
          <TextField.Root
            size="1"
            value={m.name}
            maxLength={60}
            placeholder={t.mNamePlaceholder}
            onChange={(e) => onChange({ ...m, name: e.target.value })}
          />
        </Box>

        <Box style={{ flex: "1 1 6rem" }}>
          {label(t.mYear, outside ? t.mOutsideRun : undefined)}
          <Select.Root
            size="1"
            value={String(m.year)}
            onValueChange={(v) => onChange({ ...m, year: Number(v) })}
          >
            <Select.Trigger style={{ width: "100%" }} aria-label={t.mYear} />
            <Select.Content position="popper">
              {years.map((y) => (
                <Select.Item key={y} value={String(y)}>
                  {y}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </Box>

        <Box style={{ flex: "1 1 8rem" }}>
          {label(t.mUpfront)}
          <TextField.Root
            size="1"
            inputMode="numeric"
            value={plain(m.upfront, lang)}
            onChange={(e) => onChange({ ...m, upfront: digits(e.target.value) })}
          />
        </Box>

        <Box style={{ flex: "1 1 8rem" }}>
          {label(t.mAnnual)}
          <TextField.Root
            size="1"
            inputMode="numeric"
            value={plain(m.annual, lang)}
            onChange={(e) => onChange({ ...m, annual: digits(e.target.value) })}
          />
        </Box>

        <Box style={{ flex: "0 1 5rem" }}>
          {label(t.mYears, m.years === 0 ? t.mYearsForever : undefined)}
          <TextField.Root
            size="1"
            inputMode="numeric"
            value={String(m.years)}
            onChange={(e) => onChange({ ...m, years: Math.min(100, digits(e.target.value)) })}
          />
        </Box>

        <Button size="1" variant="ghost" color="gray" onClick={onRemove} aria-label={t.removeMilestone}>
          {t.removeMilestone}
        </Button>
      </Flex>
    </Card>
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
  // Out to the end of the century: someone starting now retires in the 2070s,
  // and a milestone like a child runs for twenty years after that.
  for (let y = lastRealYear + 1; y <= LAST_YEAR; y++) years.push(y);
  const horizon = `${years[years.length - 1]}-12`;

  // Milestones live in the draft like every other control, so one Apply moves
  // the whole scenario.
  const setMilestones = (next: Milestone[]) => setDraftEdit({ ...draft, milestones: next });
  const lastRunYear = preview.months.length
    ? Number(preview.months[preview.months.length - 1].month.slice(0, 4))
    : lastRealYear;
  const newMilestoneYear = Math.min(
    Math.max(Number(draft.startMonth.slice(0, 4)), lastRealYear),
    years[years.length - 1],
  );
  // Derived from the ids already in the list rather than a clock or a random
  // source: the compiler rejects impure calls in render, and a deterministic id
  // also survives a reload unchanged.
  const nextId = `m${
    draft.milestones.reduce((max, x) => Math.max(max, Number(x.id.replace(/\D/g, "")) || 0), 0) + 1
  }`;
  const addMilestone = (preset?: (typeof PRESETS)[number]) => {
    if (draft.milestones.length >= MAX_MILESTONES) return;
    setMilestones([
      ...draft.milestones,
      {
        id: nextId,
        name: preset ? t[preset.label] : "",
        year: newMilestoneYear,
        upfront: preset?.upfront ?? 0,
        annual: preset?.annual ?? 0,
        years: preset?.years ?? 0,
      },
    ]);
  };
  const full = draft.milestones.length >= MAX_MILESTONES;
  // A milestone dated past the end of the run is silently never charged. The
  // amber marker on its own row was too quiet: a reader sets one for 2030 and
  // then goes looking for a cost that is never going to appear.
  const outside = draft.milestones.filter((m) => m.year > lastRunYear);
  const hasMilestones = result.milestoneTotal > 0;

  // A projected run is not "priced" on any real date — it ends on an assumed one.
  const inflationPerYear = result.months.length
    ? result.inflationFactor ** (12 / result.months.length) - 1
    : 0;

  const verdicts = new Map(
    result.channels.map((c) => [c.key, retirement(c.realValue, applied.monthlySpend)]),
  );

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
                  // Also into the URL, so the link someone copies opens the
                  // way they were reading it.
                  setLangParam(v as Lang);
                }}
              >
                {LANGS.map((l) => (
                  <SegmentedControl.Item key={l} value={l}>
                    {l.toUpperCase()}
                  </SegmentedControl.Item>
                ))}
              </SegmentedControl.Root>
              <ThemeToggle copy={t} />
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
                    max={50}
                    step={1}
                    onValueChange={([v]) => set("raisePct", v)}
                  />
                </Field>

                <Field
                  label={t.monthlyCap}
                  value={`${plain(draft.monthlyCapVnd, lang)} ₫${t.perMonth}`}
                  help={t.monthlyCapHelp}
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
                <Field label={t.ceiling} value={`${plain(draft.salaryCeiling, lang)} ₫`}>
                  <TextField.Root
                    size="2"
                    inputMode="numeric"
                    aria-label={t.ceiling}
                    value={plain(draft.salaryCeiling, lang)}
                    onChange={(e) => set("salaryCeiling", digits(e.target.value))}
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

            <Field
              label={t.monthlySpend}
              value={`${plain(draft.monthlySpend, lang)} ₫${t.perMonth}`}
              help={t.monthlySpendHelp}
            >
              <TextField.Root
                size="2"
                inputMode="numeric"
                aria-label={t.monthlySpend}
                value={plain(draft.monthlySpend, lang)}
                onChange={(e) => set("monthlySpend", digits(e.target.value))}
              />
            </Field>
          </Grid>

          <Separator size="4" my="4" />

          <Flex align="center" gap="1" mb="1">
            <Text size="2" weight="bold">
              {t.milestonesHeading}
            </Text>
            <InfoDot text={t.milestonesHelp} />
          </Flex>
          <Text as="p" size="1" color="gray" mb="3">
            {t.milestonesIntro}
          </Text>

          {draft.milestones.map((m) => (
            <MilestoneRow
              key={m.id}
              m={m}
              t={t}
              lang={lang}
              years={years}
              outside={m.year > lastRunYear}
              onChange={(next) =>
                setMilestones(draft.milestones.map((x) => (x.id === m.id ? next : x)))
              }
              onRemove={() => setMilestones(draft.milestones.filter((x) => x.id !== m.id))}
            />
          ))}

          {draft.milestones.length === 0 ? (
            <Text as="p" size="1" color="gray" mb="3">
              {t.milestonesNone}
            </Text>
          ) : null}

          {outside.length ? (
            <Callout.Root color="amber" size="1" mb="3">
              <Callout.Text>
                {t.milestonesOutside(
                  outside.map((m) => `“${m.name || m.year}”`).join(", "),
                  preview.months.length
                    ? monthName(preview.months[preview.months.length - 1].month, lang)
                    : String(lastRunYear),
                )}
              </Callout.Text>
            </Callout.Root>
          ) : null}

          <Flex gap="2" wrap="wrap" align="center">
            {PRESETS.map((preset) => (
              <Button
                key={preset.label}
                size="1"
                variant="soft"
                color="gray"
                disabled={full}
                onClick={() => addMilestone(preset)}
              >
                + {t[preset.label]}
              </Button>
            ))}
            <Button size="1" variant="ghost" color="gray" disabled={full} onClick={() => addMilestone()}>
              {t.addMilestone}
            </Button>
          </Flex>

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
            <Stat
              label={t.paidIn}
              value={money(result.paidIn, lang)}
              // Shown as one figure with its restatement underneath. Side by
              // side as peers, the smaller one reads as a loss.
              note={t.inTodaysMoney(money(result.paidInToday, lang))}
              help={t.paidInHelp}
            />
            {hasMilestones ? (
              <Stat
                label={t.milestoneTotalLabel}
                value={money(result.milestoneTotal, lang)}
                note={t.inTodaysMoney(money(result.milestoneTotalToday, lang))}
                help={t.milestoneTotalHelp}
              />
            ) : null}
            <Stat
              label={t.windowLabel}
              value={`${t.windowLength(result.months.length)} · ${
                result.months.length ? monthName(result.months[0].month, lang) : "—"
              }`}
            />
            <Stat
              label={t.inflationLabel}
              // The cumulative figure alone reads as a catastrophe; the annual
              // equivalent is what tells you it is ordinary.
              value={`+${percent(result.inflationFactor - 1, 1, lang)} · ${percent(
                inflationPerYear,
                1,
                lang,
              )}${lang === "vi" ? "/năm" : "/yr"}`}
              help={t.inflationHelp(`${percent(inflationPerYear, 1, lang)}`)}
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
              {c.brokeMonth ? (
                // A pot that ran dry earned a return on the way down, and saying
                // so beside a balance of zero reads as nonsense. What the reader
                // needs here is that the plan did not survive, and when.
                <Box mb="2">
                  <Badge color="red" variant="soft">
                    {t.broke}
                  </Badge>
                  <Text as="div" size="2" color="red" mt="1">
                    {t.brokeLine(monthName(c.brokeMonth, lang), money(c.unpaid, lang))}
                  </Text>
                  <Text as="div" size="1" color="gray" mt="1">
                    −{money(c.spent, lang)} {t.spentOnMilestones}
                  </Text>
                </Box>
              ) : (
                <>
                  <Tooltip content={t.beforeInflationHelp}>
                    <Text as="div" size="2" color="gray" style={{ cursor: "help" }}>
                      {signedMoney(c.profit, lang)} {t.onWhatYouPaidIn}
                    </Text>
                  </Tooltip>
                  {/* The nominal figure on its own invites "and after
                      inflation?" — and the answer a reader wants first is what
                      the pot is actually worth, not only how much of it is
                      gain. On a run to 2100 the two differ by an order of
                      magnitude, and the card used to state only the gain. */}
                  <Flex align="center" gap="1" mb="2">
                    <Text as="div" size="2" color="gray">
                      {t.realLine(money(c.realValue, lang), signedMoney(c.realProfit, lang))}
                    </Text>
                    <InfoDot text={t.afterInflationHelp} />
                  </Flex>
                  <Badge color={ACCENT[c.key]} variant="soft">
                    {percent(c.xirr, 2, lang)} {t.aYear}
                  </Badge>
                  {c.spent > 0 ? (
                    <Text as="div" size="1" color="gray" mt="2">
                      −{money(c.spent, lang)} {t.spentOnMilestones}
                    </Text>
                  ) : null}
                </>
              )}
              {/* What the pot would pay, and whether that is enough to live on. */}
              <Separator size="4" my="3" />
              <Flex align="center" gap="1">
                <Text as="div" size="2">
                  {t.incomeLine(
                    money(verdicts.get(c.key)!.monthlyIncome, lang),
                    percent(WITHDRAWAL_RATE, 0, lang),
                  )}
                </Text>
                <InfoDot text={t.incomeHelp} />
              </Flex>
              {verdicts.get(c.key)!.covers !== null ? (
                <Flex align="center" gap="2" mt="2" wrap="wrap">
                  <Badge color={verdicts.get(c.key)!.covers ? "green" : "red"} variant="soft">
                    {verdicts.get(c.key)!.covers ? t.covers : t.coversNot}
                  </Badge>
                  <Text size="1" color="gray">
                    {verdicts.get(c.key)!.covers
                      ? t.coverageEnough(percent(verdicts.get(c.key)!.coverage!, 0, lang))
                      : t.coverageShort(
                          percent(verdicts.get(c.key)!.coverage!, 0, lang),
                          money(verdicts.get(c.key)!.shortfallMonthly, lang),
                          money(verdicts.get(c.key)!.potNeeded, lang),
                        )}
                  </Text>
                </Flex>
              ) : null}
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
            <Tabs.Trigger value="method">{t.tabMethod}</Tabs.Trigger>
            <Tabs.Trigger value="sources">{t.tabSources}</Tabs.Trigger>
          </Tabs.List>

          <Box pt="4">
            <Tabs.Content value="summary">
              <Table.Root variant="surface" size="1">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>{t.thChannel}</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>{t.thNetWorth}</Table.ColumnHeaderCell>
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
                      <Table.Cell>
                        <Text as="div" weight="medium">
                          {money(c.value, lang)}
                        </Text>
                        <Text as="div" size="1" color="gray">
                          {t.inTodaysMoney(money(c.realValue, lang))}
                        </Text>
                      </Table.Cell>
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
                      {hasMilestones ? (
                        <Table.ColumnHeaderCell>{t.thMilestoneCost}</Table.ColumnHeaderCell>
                      ) : null}
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
                        {hasMilestones ? (
                          <Table.Cell>
                            {m.milestoneCost > 0 ? (
                              <Text color="red">−{money(m.milestoneCost, lang)}</Text>
                            ) : (
                              "—"
                            )}
                          </Table.Cell>
                        ) : null}
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

            <Tabs.Content value="method">
              <Methodology lang={lang} />
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
