import type { Metadata } from "next";

import snapshotJson from "@/data/evn30-snapshot.json";
import type { Snapshot } from "@/lib/evn30/types";

import { Evn30Simulator } from "./simulator";

const snapshot = snapshotJson as unknown as Snapshot;

export const metadata: Metadata = {
  title: "Mua đều mỗi tháng thì bao giờ đủ nghỉ hưu? - VN30, vàng và tiết kiệm",
  description:
    "Để dành một phần lương mỗi tháng từ 2016 và xem tiền đi về đâu: quỹ ETF VN30, gửi tiết kiệm ngân hàng, hay vàng SJC. Giá thật, lạm phát thật, phí thật.",
  openGraph: {
    title: "Mua đều mỗi tháng thì bao giờ đủ nghỉ hưu?",
    description:
      "Quỹ ETF VN30, gửi tiết kiệm ngân hàng và vàng SJC, từ 2016 đến nay, theo giá và lạm phát thật của Việt Nam.",
    type: "website",
    locale: "vi_VN",
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
