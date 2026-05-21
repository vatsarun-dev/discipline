import admin from 'firebase-admin';
import { env } from '../config/env.js';

export function getFirebaseApp() {
  if (admin.apps.length) {
    return admin.app();
  }

  if (!env.firebaseProjectId || !env.firebaseClientEmail || !env.firebasePrivateKey) {
    return null;
  }

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.firebaseProjectId,
      clientEmail: env.firebaseClientEmail,
      privateKey: env.firebasePrivateKey.replace(/\\n/g, '\n')
    })
  });
}
