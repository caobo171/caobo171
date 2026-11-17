import { Box, Callout, Heading, Table, Text } from "@radix-ui/themes";

import type { Copy, Lang } from "@/lib/evn30/copy";
import { dayName, percent } from "@/lib/evn30/format";
import type { Snapshot } from "@/lib/evn30/types";

export function Sources({
  snapshot,
  copy,
  lang,
}: {
  snapshot: Snapshot;
  copy: Copy;
  lang: Lang;
}) {
  // Derived rather than written down, so none of it goes stale on a refresh.
  const cpiYears = Object.keys(snapshot.cpi)
    .map(Number)
    .sort((a, b) => a - b);
  const spread = snapshot.latest.goldSell / snapshot.latest.goldBuy - 1;
  const depositYears = Object.keys(snapshot.deposit)
    .map(Number)
    .sort((a, b) => a - b);

  const rows = copy.rows.map((r, i) =>
    i === 2 ? { ...r, span: `${cpiYears[0]} → ${cpiYears[cpiYears.length - 1]}` } : r,
  );

  return (
    <Box>
      <Callout.Root color="gray" mb="4">
        <Callout.Text>{copy.sourcesIntro(dayName(snapshot.generatedAt.slice(0, 10), lang))}</Callout.Text>
      </Callout.Root>

      <Table.Root variant="surface" size="1" mb="5">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>{copy.thSeries}</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>{copy.thSource}</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>{copy.thCovers}</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>{copy.thTrust}</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {rows.map((r) => (
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

      <Heading size="3" mb="1">
        {copy.depositHeading}
      </Heading>
      <Text as="p" size="2" color="gray" mb="3">
        {copy.depositIntro}
      </Text>
      <Table.Root variant="surface" size="1" mb="5">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>{copy.thYear}</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>{copy.thRate}</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {depositYears.map((y) => (
            <Table.Row key={y}>
              <Table.RowHeaderCell>{y}</Table.RowHeaderCell>
              <Table.Cell>{percent(snapshot.deposit[String(y)] / 100, 1, lang)}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>

      <Heading size="3" mb="2">
        {copy.chargesHeading}
      </Heading>
      <Box asChild mb="4">
        <ul style={{ paddingLeft: "1.1rem", marginTop: 0 }}>
          {copy.charges.map((line, i) => (
            <li key={i}>
              <Text size="2" color="gray">
                {/* The gold spread moves, so it is read from the snapshot rather than written down. */}
                {i === 1 ? `${line} ${spreadNote(spread, lang)}` : line}
              </Text>
            </li>
          ))}
        </ul>
      </Box>

      <Heading size="3" mb="2">
        {copy.notHeading}
      </Heading>
      <Text as="p" size="2" color="gray">
        {copy.notBody}
      </Text>
    </Box>
  );
}

function spreadNote(spread: number, lang: Lang): string {
  const p = percent(spread, 1, lang);
  return lang === "vi" ? `Hiện chênh lệch khoảng ${p}.` : `That spread is about ${p} today.`;
}
