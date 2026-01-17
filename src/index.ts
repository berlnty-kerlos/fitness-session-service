import * as functions from "firebase-functions";
import { ingestHandler } from "./ingest/handler";


export const ingestSession = functions.https.onRequest(async (req, res) => {
  try {
    const result = await ingestHandler(req.body);
    res.json(result);
  } catch (err: any) {
    console.error("Ingest error:", err);
    res.status(400).json({ error: err.message });
  }
});


if (require.main === module) {
  (async () => {
    console.log("Fitness session service dry-run");

    const testEvents = [
      {
        userId: "u1",
        clientSessionId: "session1",
        type: "start",
        timestamp: new Date().toISOString(),
        payload: {},
      },
      {
        userId: "u1",
        clientSessionId: "session1",
        type: "metric",
        timestamp: new Date().toISOString(),
        payload: { calories: 50 },
      },
      {
        userId: "u1",
        clientSessionId: "session1",
        type: "end",
        timestamp: new Date().toISOString(),
        payload: {},
      },
    ];

    for (const event of testEvents) {
      const result = await ingestHandler(event);
      console.log(result);
    }

    console.log("Dry-run complete");
  })();
}
