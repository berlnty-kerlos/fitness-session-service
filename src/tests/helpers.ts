
import { SessionEvent } from "../models/sessionEvent";

export function makeEvent(
  overrides: Partial<SessionEvent>
): SessionEvent {
  return {
    eventId: overrides.eventId ?? crypto.randomUUID(),
    sessionId: overrides.sessionId ?? "s1",
    userId: overrides.userId ?? "u1",
    type: overrides.type ?? "metric",
    eventTime: overrides.eventTime ?? new Date(),
    receivedAt: new Date(),
    payload: overrides.payload ?? {},
    schemaVersion: 1,
  };
}
