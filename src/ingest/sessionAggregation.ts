import { db } from "../firebase/db";
import { SessionEvent } from "../models/sessionEvent";
import { Session } from "../models/session";
import { Timestamp } from "firebase-admin/firestore";
import { getApp } from 'firebase-admin/app';

function toDate(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Timestamp) return value.toDate();
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

export async function recomputeSession(sessionId: string): Promise<void> {
  const eventsSnapshot = await db
    .collection("sessionEvents")
    .where("sessionId", "==", sessionId)
    .orderBy("eventTime")
    .get();

  const events: SessionEvent[] = eventsSnapshot.docs.map(
    (doc) => doc.data() as SessionEvent
  );

  if (events.length === 0) return; // nothing to do

  let startTime: Date | null = null;
  let endTime: Date | null = null;
  let durationSec = 0;
  let calories = 0;
  let lastEventAt: Date | null = null;
  
  const seenEventIds = new Set<string>();

  for (const ev of events) {
    // Skip duplicates
    if (seenEventIds.has(ev.eventId)) {
      console.warn(`Duplicate event ignored: ${ev.eventId} for session ${sessionId}`);
      continue;
    }
    seenEventIds.add(ev.eventId);
    const evTime = toDate(ev.eventTime);
    if (!evTime) continue;

    if (ev.type === "start") {
      if (!startTime || evTime < startTime) startTime = evTime;
    }
    if (ev.type === "end") {
      if (!endTime || evTime > endTime) endTime = evTime;
    }
    if (ev.type === "metric") {
      const c = ev.payload?.calories;
      if (typeof c === "number" && c > 0) calories += c;
    }
    if (!lastEventAt || evTime > lastEventAt) lastEventAt = evTime;
  }

  if (startTime && endTime) {
    durationSec = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
  }
  console.info(`Session ${sessionId} computed: durationSec=${durationSec}, calories=${calories}, events=${events.length}`);
  

  const sessionRef = db.collection("sessions").doc(sessionId);
  const existingDoc = await sessionRef.get();
  let version = 1;

  if (existingDoc.exists) {
    const existingSession = existingDoc.data() as Session;
    version = (existingSession.version || 0) + 1;
  }


  const session: Session = {
    sessionId,
    userId: events[0].userId,
    startTime,
    endTime,
    durationSec,
    calories,
    eventCount: events.length,
    lastEventAt,
    updatedAt: new Date(),
    version,
  };
  
  await sessionRef.set(session, { merge: true });
  console.debug(`Session ${sessionId} saved with version ${version}`);
  console.log("printed sessionId",sessionId);
console.log("App Project ID:", getApp().options.projectId);

}
