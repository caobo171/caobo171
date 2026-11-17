"use client";

import { SegmentedControl, Tooltip } from "@radix-ui/themes";
import { useEffect, useState, useSyncExternalStore } from "react";

import type { Copy } from "@/lib/evn30/copy";
import {
  parseTheme,
  readServerThemeRaw,
  readStoredThemeRaw,
  saveTheme,
  subscribeToStored,
  type ThemeChoice,
} from "@/lib/evn30/storage";

const ORDER: ThemeChoice[] = ["system", "light", "dark"];

const svg = (children: React.ReactNode) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
    strokeLinecap="round"
    aria-hidden
  >
    {children}
  </svg>
);

const ICONS: Record<ThemeChoice, React.ReactNode> = {
  system: svg(
    <>
      <circle cx="8" cy="8" r="5.5" />
      <path d="M8 2.5a5.5 5.5 0 0 1 0 11Z" fill="currentColor" stroke="none" />
    </>,
  ),
  light: svg(
    <>
      <circle cx="8" cy="8" r="3" />
      <path d="M8 1.5V3M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M12.6 3.4l-1 1M4.4 11.6l-1 1" />
    </>,
  ),
  dark: svg(<path d="M13 9.6A5.6 5.6 0 0 1 6.4 3a5.6 5.6 0 1 0 6.6 6.6Z" />),
};

/**
 * Light, dark, or whatever the machine says. Radix keys dark mode off a class
 * rather than a media query, so this owns that class outright: the inline
 * script in the layout sets it before paint, and this keeps it right afterwards,
 * including when the reader changes their system theme with the page open.
 */
export function ThemeToggle({ copy }: { copy: Copy }) {
  const storedRaw = useSyncExternalStore(
    subscribeToStored,
    readStoredThemeRaw,
    readServerThemeRaw,
  );
  const [edit, setEdit] = useState<ThemeChoice | null>(null);
  const choice = edit ?? parseTheme(storedRaw);

  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark = choice === "dark" || (choice === "system" && query.matches);
      const root = document.documentElement;
      root.classList.toggle("dark", dark);
      root.classList.toggle("light", !dark);
    };
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, [choice]);

  const label: Record<ThemeChoice, string> = {
    system: copy.themeAuto,
    light: copy.themeLight,
    dark: copy.themeDark,
  };

  return (
    <SegmentedControl.Root
      size="1"
      value={choice}
      onValueChange={(v) => {
        setEdit(v as ThemeChoice);
        saveTheme(v as ThemeChoice);
      }}
    >
      {ORDER.map((c) => (
        <SegmentedControl.Item key={c} value={c} aria-label={label[c]}>
          <Tooltip content={label[c]}>
            <span style={{ display: "flex", alignItems: "center" }}>{ICONS[c]}</span>
          </Tooltip>
        </SegmentedControl.Item>
      ))}
    </SegmentedControl.Root>
  );
}
