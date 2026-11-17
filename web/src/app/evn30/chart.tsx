"use client";

import { Box, Flex, Text } from "@radix-ui/themes";
import { useMemo, useState } from "react";

import type { Copy, Lang } from "@/lib/evn30/copy";
import { money, monthName } from "@/lib/evn30/format";
import type { ChannelKey, MonthPoint } from "@/lib/evn30/types";

const W = 820;
const H = 300;
const PAD = { left: 62, right: 10, top: 12, bottom: 26 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

export const SERIES: Array<{ key: ChannelKey; color: string; width: number }> = [
  { key: "gold", color: "var(--amber-9)", width: 2.2 },
  { key: "etf", color: "var(--indigo-9)", width: 2 },
  { key: "bank", color: "var(--gray-8)", width: 1.8 },
];

const PAID_COLOR = "var(--gray-11)";

/** Axis labels need to be short: 2_004_000_000 → "2.0B" / "2,0 tỷ". */
function axisTick(vnd: number, lang: Lang): string {
  if (vnd === 0) return "0";
  const n = (v: number, dp: number) =>
    v.toLocaleString(lang === "vi" ? "vi-VN" : "en-US", {
      minimumFractionDigits: dp,
      maximumFractionDigits: dp,
    });
  if (vnd >= 1_000_000_000) {
    if (vnd < 1e12) return lang === "vi" ? `${n(vnd / 1e9, 1)} tỷ` : `${n(vnd / 1e9, 1)}B`;
    return lang === "vi" ? `${n(vnd / 1e12, 1)} ngh.tỷ` : `${n(vnd / 1e12, 1)}T`;
  }
  return lang === "vi" ? `${n(vnd / 1e6, 0)} tr` : `${n(vnd / 1e6, 0)}M`;
}

export function Chart({
  months,
  copy,
  lang,
  latestDate,
}: {
  months: MonthPoint[];
  copy: Copy;
  lang: Lang;
  latestDate: string;
}) {
  const [hover, setHover] = useState<number | null>(null);

  const max = useMemo(
    () => Math.max(1, ...months.flatMap((m) => [m.gold, m.etf, m.bank, m.paidIn])),
    [months],
  );

  if (months.length < 2) return null;

  const x = (i: number) => PAD.left + (i / (months.length - 1)) * PLOT_W;
  const y = (v: number) => PAD.top + (1 - v / max) * PLOT_H;
  const point = (m: MonthPoint, i: number, pick: (m: MonthPoint) => number) =>
    `${x(i).toFixed(1)},${y(pick(m)).toFixed(1)}`;
  const path = (pick: (m: MonthPoint) => number) =>
    months.map((m, i) => point(m, i, pick)).join(" ");

  // Where the observed prices stop and the assumption begins. The two halves
  // overlap by one point so the line joins up.
  const firstProjected = months.findIndex((m) => m.projected);
  const solidPath = (pick: (m: MonthPoint) => number) =>
    (firstProjected < 0 ? months : months.slice(0, firstProjected))
      .map((m, i) => point(m, i, pick))
      .join(" ");
  const dashedPath = (pick: (m: MonthPoint) => number) =>
    firstProjected < 1
      ? ""
      : months
          .slice(firstProjected - 1)
          .map((m, i) => point(m, firstProjected - 1 + i, pick))
          .join(" ");

  const yearTicks = months
    .map((m, i) => ({ i, year: Number(m.month.slice(0, 4)), isJan: m.month.endsWith("-01") }))
    .filter((t) => t.isJan && t.year % 2 === 0);

  const shown = hover === null ? months[months.length - 1] : months[hover];

  return (
    <Box>
      <Flex gap="4" wrap="wrap" mb="2" align="baseline">
        <Text size="1" color="gray" style={{ minWidth: "7rem" }}>
          {hover === null ? latestDate : monthName(shown.month, lang)}
        </Text>
        {SERIES.map((s) => (
          <Flex key={s.key} align="center" gap="1">
            <Box style={{ width: 9, height: 9, borderRadius: 2, background: s.color }} aria-hidden />
            <Text size="1" color="gray">
              {copy[s.key]}
            </Text>
            <Text size="1" weight="medium">
              {money(shown[s.key], lang)}
            </Text>
          </Flex>
        ))}
        <Flex align="center" gap="1">
          <Box style={{ width: 9, height: 2, background: PAID_COLOR, borderRadius: 2 }} aria-hidden />
          <Text size="1" color="gray">
            {copy.paidInShort}
          </Text>
          <Text size="1" weight="medium">
            {money(shown.paidIn, lang)}
          </Text>
        </Flex>
      </Flex>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", height: "auto", display: "block", touchAction: "pan-y" }}
        role="img"
        aria-label={`${copy.gold}, ${copy.etf}, ${copy.bank}: ${monthName(months[0].month, lang)} → ${monthName(months[months.length - 1].month, lang)}`}
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const box = e.currentTarget.getBoundingClientRect();
          const px = ((e.clientX - box.left) / box.width) * W;
          const ratio = (px - PAD.left) / PLOT_W;
          const i = Math.round(ratio * (months.length - 1));
          setHover(i >= 0 && i < months.length ? i : null);
        }}
      >
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <g key={f}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(max * f)}
              y2={y(max * f)}
              stroke="var(--gray-4)"
              strokeWidth="1"
            />
            <text
              x={PAD.left - 8}
              y={y(max * f) + 3.5}
              textAnchor="end"
              fontSize="10.5"
              fill="var(--gray-10)"
            >
              {axisTick(max * f, lang)}
            </text>
          </g>
        ))}

        {yearTicks.map((t) => (
          <text
            key={t.year}
            x={x(t.i)}
            y={H - 8}
            textAnchor="middle"
            fontSize="10.5"
            fill="var(--gray-10)"
          >
            {t.year}
          </text>
        ))}

        <polyline
          points={path((m) => m.paidIn)}
          fill="none"
          stroke={PAID_COLOR}
          strokeWidth="1.3"
          strokeDasharray="4 3"
        />
        {SERIES.map((s) => (
          <g key={s.key}>
            <polyline
              points={solidPath((m) => m[s.key])}
              fill="none"
              stroke={s.color}
              strokeWidth={s.width}
              strokeLinejoin="round"
            />
            {firstProjected > 0 && (
              <polyline
                points={dashedPath((m) => m[s.key])}
                fill="none"
                stroke={s.color}
                strokeWidth={s.width}
                strokeLinejoin="round"
                strokeDasharray="5 4"
                opacity="0.75"
              />
            )}
          </g>
        ))}

        {firstProjected > 0 && (
          <line
            x1={x(firstProjected - 1)}
            x2={x(firstProjected - 1)}
            y1={PAD.top}
            y2={PAD.top + PLOT_H}
            stroke="var(--amber-9)"
            strokeWidth="1"
            strokeDasharray="3 3"
            opacity="0.7"
          />
        )}

        {hover !== null && (
          <g pointerEvents="none">
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={PAD.top}
              y2={PAD.top + PLOT_H}
              stroke="var(--gray-8)"
              strokeWidth="1"
            />
            {SERIES.map((s) => (
              <circle
                key={s.key}
                cx={x(hover)}
                cy={y(months[hover][s.key])}
                r="3.2"
                fill="var(--color-background)"
                stroke={s.color}
                strokeWidth="2"
              />
            ))}
          </g>
        )}
      </svg>
    </Box>
  );
}
