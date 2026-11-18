import type { Metadata } from "next";
import { Source_Serif_4 } from "next/font/google";
import "./globals.css";

const sourceSerif = Source_Serif_4({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "600", "700"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  // Absolute base for every relative og:image on the site; without it Next
  // emits localhost URLs and Facebook/YouTube cannot fetch the card image.
  metadataBase: new URL("https://kaobuilder.com"),
  title: "Nguyễn Văn Cao",
  description:
    "Developer in Vietnam. Building products — usually alone, usually late. Still trying to become a real engineer.",
  openGraph: {
    title: "Nguyễn Văn Cao",
    description:
      "Developer in Vietnam. Building products — usually alone, usually late.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // /evn30 sets a light/dark class on <html> before paint; React must not fight it.
    <html lang="en" className={sourceSerif.variable} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
