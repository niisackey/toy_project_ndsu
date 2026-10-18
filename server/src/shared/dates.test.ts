import { describe, expect, it } from "vitest";
import { nextOccurrenceFromAnchor } from "./dates";

describe("nextOccurrenceFromAnchor", () => {
  it("returns the anchor date unchanged when it is still in the future", () => {
    const from = new Date(2026, 0, 1); // 2026-01-01
    expect(nextOccurrenceFromAnchor("2026-03-15", from)).toBe("2026-03-15");
  });

  it("returns the anchor date unchanged when it is exactly today", () => {
    const from = new Date(2026, 2, 15); // 2026-03-15
    expect(nextOccurrenceFromAnchor("2026-03-15", from)).toBe("2026-03-15");
  });

  it("rolls a passed anchor forward to the next occurrence of that day-of-month", () => {
    // anchor day-of-month is 5; "today" is 2026-03-20, so the next occurrence is April 5
    const from = new Date(2026, 2, 20); // 2026-03-20
    expect(nextOccurrenceFromAnchor("2025-01-05", from)).toBe("2026-04-05");
  });

  it("clamps the rolled-forward date when the target month is shorter than the anchor's day-of-month", () => {
    // anchor day-of-month is 29; rolling forward from 2026-01-31 lands in
    // February 2026 (28 days, not a leap year), so it must clamp to the 28th
    const from = new Date(2026, 0, 31); // 2026-01-31
    expect(nextOccurrenceFromAnchor("2025-01-29", from)).toBe("2026-02-28");
  });
});
