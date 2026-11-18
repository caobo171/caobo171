import type { Metadata } from "next";

import snapshotJson from "@/data/evn30-snapshot.json";
import type { Snapshot } from "@/lib/evn30/types";

import { Evn30Simulator } from "./simulator";

const snapshot = snapshotJson as unknown as Snapshot;

export const metadata: Metadata = {
  title: "What if I'd just kept buying? — VN30, gold and the bank",
  description:
    "Put part of a Vietnamese salary aside every month since 2016 and watch where it lands: the VN30 ETF, a bank savings account, or SJC gold. Real prices, real inflation, real fees.",
  openGraph: {
    title: "What if I'd just kept buying?",
    description:
      "VN30 ETF vs bank savings vs SJC gold, 2016 to today, with real Vietnamese prices and inflation.",
    type: "website",
    images: [
      {
        url: "/evn30-og.png",
        width: 1200,
        height: 630,
        alt: "Mua đều 10 năm vẫn chưa đủ — vàng SJC 1,10 tỷ đ, quỹ ETF VN30 876,6 triệu đ, gửi tiết kiệm 633,5 triệu đ, cả ba đều chưa đủ để nghỉ hưu.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/evn30-og.png"],
  },
};

export default function Evn30Page() {
  return <Evn30Simulator snapshot={snapshot} />;
}
