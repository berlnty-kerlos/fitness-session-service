import { computeConsistencyScore } from "../scoring/consistencyScore";

type TestSession = {
  endTime?: Date | null;
};

describe("Consistency Score v1", () => {
  /**
   * Test #1 — Sparse data
   * User trains once in 28 days → very low score
   */
  it("handles sparse data", () => {
    const sessions: TestSession[] = [
      { endTime: new Date("2026-01-20T10:00:00Z") },
    ];

    const result = computeConsistencyScore(
      sessions as any,
      new Date("2026-01-20T12:00:00Z")
    );

    expect(result.score).toBeLessThan(10);
    expect(result.bullets).toContain("You trained 1/28 days");
    expect(result.chart.filter(d => d.sessions > 0).length).toBe(1);
  });

  /**
   * Test #2 — Dense data
   * User trains almost every day → high score
   */
  it("handles dense data", () => {
    const now = new Date("2026-01-28T12:00:00Z");

    const sessions: TestSession[] = Array.from({ length: 25 }, (_, i) => ({
      endTime: new Date(now.getTime() - i * 24 * 60 * 60 * 1000),
    }));

    const result = computeConsistencyScore(sessions as any, now);

    expect(result.score).toBeGreaterThan(85);
    expect(result.bullets[0]).toContain("25/28");
    expect(result.chart.filter(d => d.sessions > 0).length).toBeGreaterThan(20);
  });

  /**
   * Test #3 — Timezone boundary
   * Late-night session should not shift into wrong day
   */
  it("handles timezone boundary correctly", () => {
    const sessions: TestSession[] = [
      // 23:30 local time (+02:00)
      { endTime: new Date("2026-01-20T23:30:00+02:00") },
    ];

    const result = computeConsistencyScore(
      sessions as any,
      new Date("2026-01-21T08:00:00+02:00")
    );

    const activeDays = result.chart.filter(d => d.sessions > 0);

    expect(activeDays.length).toBe(1);
    expect(activeDays[0].date).toBe("2026-01-20");
  });

  /**
   * Test #4 — Weird timestamps
   * Null, invalid, or future timestamps are ignored
   */
  it("ignores invalid or future timestamps", () => {
    const sessions: TestSession[] = [
      { endTime: null },
      { endTime: new Date("invalid") },
      { endTime: new Date("2099-01-01T00:00:00Z") },
      { endTime: new Date("2026-01-20T10:00:00Z") },
    ];

    const result = computeConsistencyScore(
      sessions as any,
      new Date("2026-01-20T12:00:00Z")
    );

    expect(result.bullets).toContain("You trained 1/28 days");
    expect(result.chart.filter(d => d.sessions > 0).length).toBe(1);
  });
});
