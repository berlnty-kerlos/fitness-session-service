export interface Session {
  sessionId: string;
  userId: string;

  startTime: Date | null;
  endTime: Date | null;

  durationSec: number;
  calories: number;

  eventCount: number;
  lastEventAt: Date | null;

  updatedAt: Date;
  version: number;
}
