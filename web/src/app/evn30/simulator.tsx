"use client";

import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Flex,
  Grid,
  Heading,
  Link as RadixLink,
  SegmentedControl,
  Separator,
  Slider,
  Table,
  Tabs,
  Text,
  TextField,
} from "@radix-ui/themes";
import Link from "next/link";
import { useMemo, useState } from "react";

import { money, percent, plain, signedMoney } from "@/lib/evn30/format";
import { DEFAULT_INPUTS, simulate } from "@/lib/evn30/simulate";
import type { ChannelKey, Inputs, Snapshot } from "@/lib/evn30/types";

import { Chart } from "./chart";
import { Sources } from "./sources";

const START_YEARS = [2016, 2018, 2020, 2022, 2024];

const ACCENT: Record<ChannelKey, "amber" | "indigo" | "gray"> = {
  gold: "amber",
  etf: "indigo",
  bank: "gray",
};

const DOT: Record<ChannelKey, string> = {
  gold: "var(--amber-9)",
  etf: "var(--indigo-9)",
  bank: "var(--gray-8)",
};

const digits = (s: string) => Number(s.replace(/\D/g, "")) || 0;

function Field({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <Box>
      <Flex justify="between" align="baseline" mb="1">
        <Text size="1" color="gray">
          {label}
        </Text>
        <Text size="2" weight="bold">
          {value}
        </Text>
      </Flex>
      {children}
    </Box>
  );
}

export function Evn30Simulator({ snapshot }: { snapshot: Snapshot }) {
  const [draft, setDraft] = useState<Inputs>(DEFAULT_INPUTS);
  const [applied, setApplied] = useState<Inputs>(DEFAULT_INPUTS);

  const result = useMemo(() => simulate(snapshot, applied), [snapshot, applied]);
  // The line under the controls describes what the controls currently say, not
  // what was last applied — otherwise it contradicts the sliders above it.
  const preview = useMemo(() => simulate(snapshot, draft), [snapshot, draft]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(applied);
  const set = <K extends keyof Inputs>(key: K, value: Inputs[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const percentMode = draft.mode === "percent";
  const winner = result.channels[0];

  return (
    <Box>
      <Box
        py="3"
        px="4"
        style={{ borderBottom: "1px solid var(--gray-6)", background: "var(--gray-2)" }}
      >
        <Container size="4">
          <Flex justify="between" align="center">
            <Text size="2" weight="bold">
              Nguyễn Văn Cao
            </Text>
            <Flex gap="4">
              <RadixLink asChild size="2" color="gray">
                <Link href="/">Home</Link>
              </RadixLink>
              <RadixLink asChild size="2" color="gray">
                <Link href="/resume">Resume</Link>
              </RadixLink>
              <RadixLink size="2" href="https://wele-learn.com" target="_blank" color="gray">
                WELE
              </RadixLink>
            </Flex>
          </Flex>
        </Container>
      </Box>

      <Container size="3" px="4" py="6">
        <Heading size="8" mb="2" style={{ letterSpacing: "-0.02em" }}>
          What if I&apos;d just kept buying?
        </Heading>
        <Text as="p" size="3" color="gray" mb="5">
          A share of every paycheque, every month, into three places Vietnamese savers actually
          use. Real prices, real inflation, real fees — and the cash that could not buy a whole lot
          stays cash.
        </Text>

        <Card size="2">
          <Grid columns={{ initial: "1", sm: "2" }} gapX="5" gapY="4">
            <Box>
              <Text size="1" color="gray" as="div" mb="1">
                Starting from
              </Text>
              <SegmentedControl.Root
                size="1"
                value={String(draft.startYear)}
                onValueChange={(v) => set("startYear", Number(v))}
              >
                {START_YEARS.map((y) => (
                  <SegmentedControl.Item key={y} value={String(y)}>
                    {y}
                  </SegmentedControl.Item>
                ))}
              </SegmentedControl.Root>
            </Box>

            <Box>
              <Text size="1" color="gray" as="div" mb="1">
                I save
              </Text>
              <SegmentedControl.Root
                size="1"
                value={draft.mode}
                onValueChange={(v) => set("mode", v as Inputs["mode"])}
              >
                <SegmentedControl.Item value="percent">a share of salary</SegmentedControl.Item>
                <SegmentedControl.Item value="fixed">a fixed amount</SegmentedControl.Item>
              </SegmentedControl.Root>
            </Box>

            {percentMode ? (
              <>
                <Field label="My salary today" value={`${plain(draft.salaryToday)} ₫`}>
                  <TextField.Root
                    size="2"
                    inputMode="numeric"
                    value={plain(draft.salaryToday)}
                    onChange={(e) => set("salaryToday", digits(e.target.value))}
                  />
                </Field>

                <Field label="I save" value={`${draft.savePct}% of it`}>
                  <Slider
                    size="1"
                    value={[draft.savePct]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={([v]) => set("savePct", v)}
                  />
                </Field>

                <Field label="Raise each year" value={`${draft.raisePct}%`}>
                  <Slider
                    size="1"
                    value={[draft.raisePct]}
                    min={0}
                    max={20}
                    step={1}
                    onValueChange={([v]) => set("raisePct", v)}
                  />
                </Field>

                <Field label="…but no higher than" value={`+${draft.ceilingPct}%`}>
                  <Slider
                    size="1"
                    value={[draft.ceilingPct]}
                    min={0}
                    max={200}
                    step={10}
                    onValueChange={([v]) => set("ceilingPct", v)}
                  />
                </Field>

                <Field label="…up to" value={`${plain(draft.monthlyCapVnd)} ₫/mo`}>
                  <Slider
                    size="1"
                    value={[draft.monthlyCapVnd]}
                    min={1_000_000}
                    max={100_000_000}
                    step={1_000_000}
                    onValueChange={([v]) => set("monthlyCapVnd", v)}
                  />
                </Field>
              </>
            ) : (
              <Field label="Every month I put aside" value={`${plain(draft.fixedAmount)} ₫`}>
                <TextField.Root
                  size="2"
                  inputMode="numeric"
                  value={plain(draft.fixedAmount)}
                  onChange={(e) => set("fixedAmount", digits(e.target.value))}
                />
              </Field>
            )}
          </Grid>

          <Separator size="4" my="4" />

          <Flex justify="between" align="center" gap="3" wrap="wrap">
            <Text size="2" color="gray">
              {preview.firstContribution === preview.lastContribution ? (
                <>
                  That&apos;s <strong>{money(preview.firstContribution)}</strong> a month, every
                  month.
                </>
              ) : (
                <>
                  That&apos;s <strong>{money(preview.firstContribution)}</strong>/month at the
                  start, rising to <strong>{money(preview.lastContribution)}</strong>
                  {preview.ceilingYear ? (
                    <> once the ceiling bites in {preview.ceilingYear}</>
                  ) : null}
                  .
                </>
              )}
            </Text>
            <Button size="2" disabled={!dirty} onClick={() => setApplied(draft)}>
              {dirty ? "Apply" : "Applied"}
            </Button>
          </Flex>
        </Card>

        <Text as="p" size="3" my="5">
          Over {result.months.length} months you&apos;d have paid in{" "}
          <strong>{money(result.paidIn)}</strong> — worth{" "}
          <strong>{money(result.paidInToday)}</strong> in today&apos;s money, because prices rose{" "}
          {percent(result.inflationFactor - 1, 1)} along the way. Here&apos;s where it would have
          ended up.
        </Text>

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
                  {c.label}
                </Text>
              </Flex>
              <Text as="div" size="7" weight="bold" style={{ letterSpacing: "-0.02em" }}>
                {money(c.value)}
              </Text>
              <Text as="div" size="2" color="gray" mb="2">
                {signedMoney(c.profit)} on what you paid in
              </Text>
              <Badge color={ACCENT[c.key]} variant="soft">
                {percent(c.xirr)} a year
              </Badge>
            </Card>
          ))}
        </Grid>

        <Card size="2" mb="4">
          <Chart months={result.months} />
        </Card>

        <Tabs.Root defaultValue="summary">
          <Tabs.List>
            <Tabs.Trigger value="summary">Summary</Tabs.Trigger>
            <Tabs.Trigger value="months">Month by month</Tabs.Trigger>
            <Tabs.Trigger value="sources">Where the numbers come from</Tabs.Trigger>
          </Tabs.List>

          <Box pt="4">
            <Tabs.Content value="summary">
              <Table.Root variant="surface" size="1">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>Channel</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Holding</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Bought in</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Idle cash</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Deepest fall</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>After inflation</Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {result.channels.map((c) => (
                    <Table.Row key={c.key}>
                      <Table.RowHeaderCell>{c.label}</Table.RowHeaderCell>
                      <Table.Cell>{c.unitsLabel}</Table.Cell>
                      <Table.Cell>
                        {c.monthsBought} / {result.months.length} months
                      </Table.Cell>
                      <Table.Cell>{money(c.idleCash)}</Table.Cell>
                      <Table.Cell>{percent(c.maxDrawdown, 1)}</Table.Cell>
                      <Table.Cell>{signedMoney(c.realProfit)}</Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
              <Text as="p" size="2" color="gray" mt="3">
                Brokerage paid buying the ETF: {money(result.etfFees)}. Salary modelled from{" "}
                {money(result.salaryStart)} a month at the start to {money(result.salaryEnd)} today.
              </Text>
            </Tabs.Content>

            <Tabs.Content value="months">
              <Box style={{ maxHeight: "28rem", overflowY: "auto" }}>
                <Table.Root variant="surface" size="1">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeaderCell>Month</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Put in</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Paid in so far</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Gold</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>VN30 ETF</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Bank</Table.ColumnHeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {result.months.map((m) => (
                      <Table.Row key={m.month}>
                        <Table.RowHeaderCell>{m.month}</Table.RowHeaderCell>
                        <Table.Cell>{money(m.contribution)}</Table.Cell>
                        <Table.Cell>{money(m.paidIn)}</Table.Cell>
                        <Table.Cell>{money(m.gold)}</Table.Cell>
                        <Table.Cell>{money(m.etf)}</Table.Cell>
                        <Table.Cell>{money(m.bank)}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Box>
            </Tabs.Content>

            <Tabs.Content value="sources">
              <Sources snapshot={snapshot} />
            </Tabs.Content>
          </Box>
        </Tabs.Root>
      </Container>
    </Box>
  );
}
