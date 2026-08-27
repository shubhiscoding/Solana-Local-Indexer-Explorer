import { describe, it, expect } from "vitest";
import { serializeBigInts } from "./serialization";

describe("serializeBigInts", () => {
  it("returns null/undefined unchanged", () => {
    expect(serializeBigInts(null)).toBeNull();
    expect(serializeBigInts(undefined)).toBeUndefined();
  });

  it("converts a top-level bigint to a string", () => {
    expect(serializeBigInts(123n)).toBe("123");
  });

  it("converts a Date to an ISO string", () => {
    const d = new Date("2026-01-01T00:00:00.000Z");
    expect(serializeBigInts(d)).toBe("2026-01-01T00:00:00.000Z");
  });

  it("leaves primitives (number, string, boolean) unchanged", () => {
    expect(serializeBigInts(42)).toBe(42);
    expect(serializeBigInts("hello")).toBe("hello");
    expect(serializeBigInts(true)).toBe(true);
  });

  it("recursively converts bigints inside a nested object", () => {
    const input = {
      signature: "abc123",
      slot: 100n,
      fee: 5000n,
      meta: { computeUnitsUsed: 2100n },
    };
    expect(serializeBigInts(input)).toEqual({
      signature: "abc123",
      slot: "100",
      fee: "5000",
      meta: { computeUnitsUsed: "2100" },
    });
  });

  it("recursively converts bigints inside an array", () => {
    const input = [{ slot: 1n }, { slot: 2n }, { slot: 3n }];
    expect(serializeBigInts(input)).toEqual([
      { slot: "1" },
      { slot: "2" },
      { slot: "3" },
    ]);
  });

  it("handles a realistic API payload shape (transaction list + pagination)", () => {
    const input = {
      transactions: [
        { signature: "sig1", slot: 10n, fee: 5000n, blockTime: new Date("2026-01-01T00:00:00.000Z") },
      ],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    };
    const output = serializeBigInts(input);
    expect(output.transactions[0].slot).toBe("10");
    expect(output.transactions[0].fee).toBe("5000");
    expect(output.transactions[0].blockTime).toBe("2026-01-01T00:00:00.000Z");
    // Non-bigint numeric fields must stay as numbers, not get stringified.
    expect(output.pagination.page).toBe(1);
    expect(typeof output.pagination.page).toBe("number");
  });

  it("handles a negative bigint (balanceChange can be negative)", () => {
    expect(serializeBigInts(-10000n)).toBe("-10000");
  });

  it("handles zero as a bigint", () => {
    expect(serializeBigInts(0n)).toBe("0");
  });
});
