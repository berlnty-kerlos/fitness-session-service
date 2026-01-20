import * as functions from "firebase-functions";
import { ingestHandler } from "./ingest/handler";
import { computeConsistencyScore } from "./scoring/consistencyScore";
import { getSessionsLast28Days } from "./scoring/queries";

export const ingestSession = functions.https.onRequest(async (req, res) => {
  try {
    const result = await ingestHandler(req.body);
    res.json(result);
  } catch (err: any) {
    console.error("Ingest error:", err);
    res.status(400).json({ error: err.message });
  }
});


export const consistencyScore = functions.https.onRequest(async (req, res) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) {
      res.status(400).json({ error: "userId is required" });
      return;
    }

    const sessions = await getSessionsLast28Days(userId);
    const score = computeConsistencyScore(sessions);

    res.json(score);
  } catch (err: any) {
    console.error("Score error:", err);
    res.status(500).json({ error: err.message });
  }
});


if (require.main === module) {
  (async () => {
    console.log("Fitness session service dry-run");

    const userId = "u1";
    const now = new Date();

    const testEvents = [
      {
        userId,
        clientSessionId: "session1",
        type: "start",
        timestamp: now.toISOString(),
        payload: {},
      },
      {
        userId,
        clientSessionId: "session1",
        type: "metric",
        timestamp: now.toISOString(),
        payload: { calories: 50 },
      },
      {
        userId,
        clientSessionId: "session1",
        type: "end",
        timestamp: new Date(now.getTime() + 1800_000).toISOString(),
        payload: {},
      },
    ];

    //Ingest events
    for (const event of testEvents) {
      const result = await ingestHandler(event);
      console.log("Ingested:", result);
    }

    //Compute score
    const sessions = await getSessionsLast28Days(userId);
    const score = computeConsistencyScore(sessions);

    console.log("Consistency score:");
    console.dir(score, { depth: null });

    console.log("Dry-run complete");
    process.exit(0);
  })();
}
