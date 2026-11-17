import { describe, expect, test } from "vitest";

import { money, signedMoney } from "./format";

describe("money — billions tier", () => {
  // The page routinely reaches a few billion dong. Before this tier existed a
  // six-billion pot read "6.000,0 triệu ₫", which no Vietnamese reader parses
  // at a glance.
  test("shows a billion-sized amount in tỉ, not thousands of millions", () => {
    expect(money(6_000_000_000, "vi")).toBe("6,00 tỷ ₫");
    expect(money(6_000_000_000, "en")).toBe("6.00B ₫");
  });

  test("keeps two decimals, so 50 million is still visible at this scale", () => {
    expect(money(2_050_000_000, "vi")).toBe("2,05 tỷ ₫");
  });

  test("switches tiers exactly at a billion", () => {
    expect(money(999_000_000, "en")).toBe("999.0M ₫");
    expect(money(1_000_000_000, "en")).toBe("1.00B ₫");
  });

  test("carries the sign on a loss", () => {
    expect(money(-2_500_000_000, "vi")).toBe("-2,50 tỷ ₫");
    expect(signedMoney(2_500_000_000, "en")).toBe("+2.50B ₫");
  });

  test("leaves the smaller tiers alone", () => {
    expect(money(2_004_224, "en")).toBe("2.0M ₫");
    expect(money(250_000, "vi")).toBe("250 nghìn ₫");
    expect(money(0, "vi")).toBe("0 ₫");
  });
});
