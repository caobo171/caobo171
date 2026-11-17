import { Box, Callout, Code, Heading, Table, Text } from "@radix-ui/themes";

import type { Snapshot } from "@/lib/evn30/types";

const ROWS = [
  {
    what: "VN30 ETF (E1VFVN30) daily close",
    where: "DNSE Entrade chart API",
    span: "2014-10 → today",
    trust: "Real traded prices.",
  },
  {
    what: "SJC gold daily buy / sell",
    where: "github.com/andy-nguyen-21/gold-market-data-vietnam",
    span: "2016-01 → today",
    trust: "A community-maintained scrape, not an official SJC feed. It is why this page starts in 2016.",
  },
  {
    what: "Vietnam CPI, annual",
    where: "World Bank FP.CPI.TOTL",
    span: "2013 → 2025",
    trust: "Official. The current year is carried forward at 3.3% until it is published.",
  },
  {
    what: "12-month deposit rate",
    where: "Hand-built table",
    span: "2016 → today",
    trust: "The weakest number on this page. No free historical series of Vietnamese deposit rates is published, so these are representative market rates, not an index.",
  },
];

export function Sources({ snapshot }: { snapshot: Snapshot }) {
  const generated = snapshot.generatedAt.slice(0, 10);

  return (
    <Box>
      <Callout.Root color="gray" mb="4">
        <Callout.Text>
          Every figure on this page comes from the four series below, frozen into a snapshot taken
          on {generated}. Nothing is fetched while you use the page, and nothing is assumed about
          the future.
        </Callout.Text>
      </Callout.Root>

      <Table.Root variant="surface" size="1" mb="5">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>Series</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Source</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Covers</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>How much to trust it</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {ROWS.map((r) => (
            <Table.Row key={r.what}>
              <Table.RowHeaderCell>{r.what}</Table.RowHeaderCell>
              <Table.Cell>
                <Text size="1">{r.where}</Text>
              </Table.Cell>
              <Table.Cell>
                <Text size="1">{r.span}</Text>
              </Table.Cell>
              <Table.Cell>
                <Text size="1">{r.trust}</Text>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>

      <Heading size="3" mb="2">
        What the model charges you
      </Heading>
      <Box asChild mb="4">
        <ul style={{ paddingLeft: "1.1rem", marginTop: 0 }}>
          <li>
            <Text size="2" color="gray">
              The ETF trades in lots of 100 units. A month that cannot afford a lot buys nothing and
              the cash waits. Brokerage of <Code>0.15%</Code> is charged on every purchase.
            </Text>
          </li>
          <li>
            <Text size="2" color="gray">
              Gold is bought at the shop&apos;s selling price and valued at its buying price, so the
              spread is a real cost — about 2.2% today. It is bought in whole chỉ, and one chỉ now
              costs more than many months&apos; saving.
            </Text>
          </li>
          <li>
            <Text size="2" color="gray">
              The bank compounds monthly at that year&apos;s rate and takes any amount, so it is the
              only channel that never leaves money idle.
            </Text>
          </li>
          <li>
            <Text size="2" color="gray">
              Returns are money-weighted (XIRR), not total profit divided by what you put in —
              money that arrived last year has not had ten years to work.
            </Text>
          </li>
        </ul>
      </Box>

      <Heading size="3" mb="2">
        What it does not do
      </Heading>
      <Text as="p" size="2" color="gray">
        It does not predict anything. Every price here already happened, and the fact that gold won
        the last ten years in Vietnam is not a reason to expect it to win the next ten. This is a
        record, not advice.
      </Text>
    </Box>
  );
}
