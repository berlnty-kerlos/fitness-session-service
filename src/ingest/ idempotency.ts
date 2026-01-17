import crypto from "crypto";

interface IdInput {
  userId: string;
  clientSessionId: string;
  eventType: string;
  eventTime: Date;
  payload: Record<string, unknown>;
}

function stableStringify(obj: Record<string, unknown>): string {
  return JSON.stringify(
    Object.keys(obj)
      .sort()
      .reduce((acc, key) => {
        acc[key] = obj[key];
        return acc;
      }, {} as Record<string, unknown>)
  );
}

export function generateSessionId(
  userId: string,
  clientSessionId: string
): string {
  return crypto
    .createHash("sha256")
    .update(`${userId}:${clientSessionId}`)
    .digest("hex");
}

export function generateEventId(input: IdInput): string {
  const payloadHash = stableStringify(input.payload);

  return crypto
    .createHash("sha256")
    .update(
      `${input.userId}:${input.clientSessionId}:${input.eventType}:${input.eventTime.toISOString()}:${payloadHash}`
    )
    .digest("hex");
}
