export type EventType = "start" | "metric" | "end";

export interface RawEventInput {
  userId: string;
  clientSessionId: string;
  type: EventType;
  timestamp: string;
  payload?: Record<string, unknown>;
}

export interface NormalizedEvent {
  userId: string;
  clientSessionId: string;
  type: EventType;
  eventTime: Date;
  payload: Record<string, unknown>;
}

const MAX_FUTURE_MS = 5 * 60 * 1000;

export function validateAndNormalize(
  input: RawEventInput
): NormalizedEvent {
  if (!input.userId || !input.clientSessionId) {
    throw new Error("Missing userId or clientSessionId");
  }

  if (!["start", "metric", "end"].includes(input.type)) {
    throw new Error("Invalid event type");
  }

  const parsedTime = new Date(input.timestamp);
  if (isNaN(parsedTime.getTime())) {
    throw new Error("Invalid timestamp");
  }

  parsedTime.setMilliseconds(0);

  return {
    userId: input.userId.trim(),
    clientSessionId: input.clientSessionId.trim(),
    type: input.type,
    eventTime: parsedTime,
    payload: input.payload ?? {},
  };
}
