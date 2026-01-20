import { recomputeSession } from "../ingest/sessionAggregation";
import { db } from "../firebase/db";
import { SessionEvent } from "../models/sessionEvent";
import { makeEvent } from "./helpers";

describe("Idempotent ingest", () => {
  beforeEach(async () => {
    const events = await db.collection("sessionEvents").get();
    const sessions = await db.collection("sessions").get();

    await Promise.all(events.docs.map(doc => doc.ref.delete()));
    await Promise.all(sessions.docs.map(doc => doc.ref.delete()));
  });
  /**
   * Test #1 - retry duplicate
   */
  it("ignores duplicate retry events and does not double count", async () => {
    const sessionId = "dupTest";
    const now = new Date();

    const events: SessionEvent[] = [
        makeEvent({sessionId,  type: "start", eventTime: now, eventId: "e1",}),
        makeEvent({sessionId,  type: "metric",payload: { calories: 50 }, eventTime: now, eventId: "e2",}),
        makeEvent({sessionId,  type: "metric",payload: { calories: 50 }, eventTime: now, eventId: "e2",}),  // duplicate retry
        makeEvent({sessionId,  type: "end",payload: { calories: 50 }, eventTime: new Date(now.getTime() + 1000), eventId: "e3",}),
    ];

    for (const ev of events) await db.collection("sessionEvents").doc(ev.eventId).set(ev);

    await recomputeSession(sessionId);

    const sessionDoc = await db.collection("sessions").doc(sessionId).get();
    const session = sessionDoc.data();

    expect(session).toBeDefined();
    expect(session?.calories).toBe(50); // duplicate ignored
    expect(session?.eventCount).toBe(3); // counted only unique events
  });
  /**
   * Test #2 - out-of-order arrival
   */
  it("should handle out-of-order events", async () => {
    const sessionId = "ooTest";
    const now = new Date();

    const events: SessionEvent[] = [

        makeEvent({sessionId,  type: "end",payload: { calories: 50 }, eventTime: new Date(now.getTime() + 1000), eventId: "e1",}),
        makeEvent({sessionId,  type: "start",payload: { calories: 50 }, eventTime: now, eventId: "e2",}),
    ];

    for (const ev of events) await db.collection("sessionEvents").doc(ev.eventId).set(ev);

    await recomputeSession(sessionId);

    const sessionDoc = await db.collection("sessions").doc(sessionId).get();
    const session = sessionDoc.data();

    expect(session).toBeDefined();
    expect(session?.durationSec).toBe(1);
    expect(session?.startTime.toDate().getTime()).toBeLessThan(session?.endTime.toDate().getTime());
  });

  /**
   * Test #3 - partial update
   */

  it("should handle partial sessions", async () => {
    const sessionId = "partialTest";
    const now = new Date();

    const events: SessionEvent[] = [

    makeEvent({sessionId,  type: "start",payload: { calories: 50 }, eventTime: now, eventId: "e1",}),
    makeEvent({sessionId,  type: "metric",payload: { calories: 100 }, eventTime: new Date(now.getTime() + 500), eventId: "e2",}),
   ];

    for (const ev of events) await db.collection("sessionEvents").doc(ev.eventId).set(ev);

    await recomputeSession(sessionId);

    const sessionDoc = await db.collection("sessions").doc(sessionId).get();
    const session = sessionDoc.data();

    expect(session).toBeDefined();
    expect(session?.durationSec).toBe(0); // no end event yet
    expect(session?.calories).toBe(100);
  });
});
