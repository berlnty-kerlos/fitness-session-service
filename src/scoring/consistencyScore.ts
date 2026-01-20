import { Timestamp } from "firebase-admin/firestore";
import { Session } from "../models/session";

interface ConsistencyScoreResult {
  score: number;   // 0–100
  bullets: string[];
  chart: { date: string; sessions: number }[];
}

export function computeConsistencyScore(sessions: Session[], now: Date = new Date()): ConsistencyScoreResult {
  const sessionsPerDay: Record<string, number> = {};

  const today = new Date(now.toISOString().slice(0, 10));
  const startDate = new Date(today.getTime() - 27 * 24 * 60 * 60 * 1000); // last 28 days

  for (let d = 0; d < 28; d++) {
    const dateStr = new Date(startDate.getTime() + d * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    sessionsPerDay[dateStr] = 0;
  }

  for (const s of sessions) {
    if (!s.endTime) continue;
    const end = s.endTime instanceof Timestamp   ? s.endTime.toDate()   : s.endTime;
    const year = end.getFullYear();
    const month = String(end.getMonth() + 1).padStart(2, '0');
    const day = String(end.getDate()).padStart(2, '0');

    const dateStr = `${year}-${month}-${day}`;

    if (sessionsPerDay[dateStr] !== undefined) {
      sessionsPerDay[dateStr] += 1;
    }
  }

  const sessionCounts = Object.values(sessionsPerDay);
  const totalDaysTrained = sessionCounts.filter(c => c > 0).length;
  const longestGap = (() => {
    let maxGap = 0;
    let currentGap = 0;
    for (const c of sessionCounts) {
      if (c === 0) currentGap++;
      else {
        if (currentGap > maxGap) maxGap = currentGap;
        currentGap = 0;
      }
    }
    return Math.max(maxGap, currentGap);
  })();


  const score = Math.min(Math.round((totalDaysTrained / 28) * 100), 100);

  const bullets = [
    `You trained ${totalDaysTrained}/28 days`,
    `Longest gap: ${longestGap} day${longestGap > 1 ? "s" : ""}`,
    `Average sessions per training day: ${
      totalDaysTrained ? (sessions.length / totalDaysTrained).toFixed(1) : 0
    }`,
  ];

  const chart = Object.entries(sessionsPerDay).map(([date, count]) => ({ date, sessions: count }));

  return { score, bullets, chart };
}
