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
    <html lang="en" className={sourceSerif.variable}>
      <body>{children}</body>
    </html>
  );
}
