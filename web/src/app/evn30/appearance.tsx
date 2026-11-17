"use client";

import { useEffect } from "react";

/**
 * The inline script in layout.tsx only runs on a full page load. Arriving here
 * by a client-side navigation from the serif pages renders this route without
 * it, so the class has to be set here too — and kept in step if the reader
 * changes their system theme while the page is open.
 */
export function AppearanceSync() {
  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const root = document.documentElement;
      root.classList.toggle("dark", query.matches);
      root.classList.toggle("light", !query.matches);
    };
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  return null;
}
