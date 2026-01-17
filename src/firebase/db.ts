import * as admin from "firebase-admin";

admin.initializeApp({
  projectId: 'fitness-session-service' 
});



export const db = admin.firestore();
