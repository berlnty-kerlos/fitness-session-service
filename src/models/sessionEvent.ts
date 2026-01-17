export type SessionEventType = "start" | "metric" | "end";

export interface SessionEvent {
  eventId: string;
  sessionId: string;
  userId: string;

  type: SessionEventType;

  eventTime: Date;
  receivedAt: Date;

  payload: Record<string, unknown>;

  schemaVersion: 1;
}
