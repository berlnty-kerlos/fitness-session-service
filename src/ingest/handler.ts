import { db } from "../firebase/db";
import { SessionEvent } from "../models/sessionEvent";
import { recomputeSession } from "./sessionAggregation"; 
import { validateAndNormalize } from "./validation";
import {
  generateEventId,
  generateSessionId,
} from "./ idempotency";

export async function ingestHandler(rawInput: unknown) {
  const normalized = validateAndNormalize(rawInput as any);

  const sessionId = generateSessionId(
    normalized.userId,
    normalized.clientSessionId
  );

  const eventId = generateEventId({
    userId: normalized.userId,
    clientSessionId: normalized.clientSessionId,
    eventType: normalized.type,
    eventTime: normalized.eventTime,
    payload: normalized.payload,
  });

  const sessionEvent: SessionEvent = {
    eventId,
    sessionId,
    userId: normalized.userId,
    type: normalized.type,
    eventTime: normalized.eventTime,
    receivedAt: new Date(),
    payload: normalized.payload,
    schemaVersion: 1,
  };

  try {
  await db.collection("sessionEvents").doc(sessionEvent.eventId).create(sessionEvent);
} catch (err: any) {
  if (err.code === 6 || err.code === "already-exists") {
    console.warn(`Duplicate event ignored: ${sessionEvent.eventId} for session ${sessionId}`);
  } else {
    throw err;
  }
}
  await recomputeSession(sessionEvent.sessionId);
  return {
    status: "ok",
    sessionId,
    eventId,
  };
}
