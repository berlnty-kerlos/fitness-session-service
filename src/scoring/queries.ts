import { db } from "../firebase/db";
import { Session } from "../models/session";
import { Timestamp } from "firebase-admin/firestore";

export async function getSessionsLast28Days(userId: string): Promise<Session[]> {
  const now = new Date();
  const startDate = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);

  const snapshot = await db
    .collection("sessions")
    .where("userId", "==", userId)
    .where("endTime", ">=", Timestamp.fromDate(startDate))
    .orderBy("endTime", "asc") 
    .get();

  return snapshot.docs.map(doc => doc.data() as Session);
}
