#  Fitness Session Service

**Backend service for fitness session ingest and analytics, designed for idempotent writes, late event handling, and deterministic scoring.**

---

## Features

1. **Idempotent Session Ingest**
   - Safely handles retries without creating duplicate sessions.
   - Aggregates events for calories, duration, and counts.
   - Supports out-of-order event arrivals and partial updates.
   - Observability: logs duplicate attempts, session recomputations, and version changes.

2. **Explainable 28-Day Consistency Score (v1)**
   - Pure function returning:
     - `score` (0–100)
     - 3–5 **explanation bullets**
     - Minimal chart data (sessions per day)
   - Fully explainable — no AI magic.
   - Mobile-friendly output shape.

3. **Firestore Integration**
   - Stores raw `sessionEvents` and aggregated `sessions`.
   - Efficient queries with **single range queries**, avoiding N+1 problems.
   - Index suggestion: `(userId, sessionId, eventTime)` to speed up event aggregation.

---

## Installation

```bash
git clone https://github.com/berlnty-kerlos/fitness-session-service
cd fitness-session-service
npm install
```

**Optional:** Start Firestore emulator for local dry-run

```bash
firebase emulators:start --only firestore
```

---

## ⚡ Dry-Run / Local Test

```bash
npm run dev
```

Example output:

```
Session b0efb3be7e7... computed: durationSec=2033, calories=200, events=13
Session saved with version 13
Consistency score:
{
  score: 4,
  bullets: [
    'You trained 1/28 days',
    'Longest gap: 27 days',
    'Average sessions per training day: 1.0'
  ],
  chart: [ ... ]
}
Dry-run complete
```

---

## Scoring Example: Tiny Dataset

**Assume today:** 2026-01-20  

**User sessions in the last 28 days:**

| Date | Sessions |
|------|----------|
| 2026-01-20 | 1 |
| 2026-01-15 | 1 |
| 2026-01-10 | 1 |

---

### Step 1: Training Days

```
Trained 3/28 days → trainingRatio = 3/28 ≈ 0.107
```

---

### Step 2: Longest Gap

```
Training days: Jan 10 → Jan 15 → Jan 20
Gaps: 5 days, 5 days → Longest gap = 5
Gap penalty = 1 - (5/28) ≈ 0.82
```

---

### Step 3: Final Score

```
score = round(trainingRatio*70 + gapPenalty*30)
      = round(0.107*70 + 0.82*30)
      ≈ round(7.5 + 24.6) = 32
```

---

### Step 4: Output Shape

```json
{
  "score": 32,
  "bullets": [
    "You trained 3/28 days",
    "Longest gap: 5 days",
    "Average sessions per training day: 1.0"
  ],
  "chart": [
    { "date": "2026-01-10", "sessions": 1 },
    { "date": "2026-01-15", "sessions": 1 },
    { "date": "2026-01-20", "sessions": 1 }
  ]
}
```

Explainable, deterministic, and mobile-ready.

---

## Testing

**Session Ingest Tests:**

- Retry duplicate events
- Out-of-order arrival
- Partial updates

**Consistency Score Tests:**

- Sparse data
- Dense data
- Timezone boundary
- Invalid or future timestamps

Run all tests:

```bash
npm test
```

---

## Observability / Metrics

- Log every **duplicate session event** received.
- Track **session version increments** in production logs.
- Measure **aggregation duration** and `eventCount` for each session.
- Optional: emit metrics to monitoring tools (Datadog, Prometheus).

---

## Notes

- Use Firestore `Timestamp` safely; all computations normalize to JS `Date`.
- All scoring is **explainable**, no AI involved.
- Design is production-ready, with **idempotent ingestion** and **defensible scoring**.
