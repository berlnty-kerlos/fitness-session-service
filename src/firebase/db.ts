import * as admin from "firebase-admin";


if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.GCLOUD_PROJECT || "fitness-session-service",
  });
}

export const db = admin.firestore();
