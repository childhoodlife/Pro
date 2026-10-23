import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

// Your web app's Firebase configuration provided by user
export const firebaseConfig = {
  apiKey: "AIzaSyCt9wUKXMDXgQSN3CslMqxioC73OCyqaDA",
  authDomain: "childhoodlife-acdc7.firebaseapp.com",
  databaseURL: "https://childhoodlife-acdc7-default-rtdb.firebaseio.com",
  projectId: "childhoodlife-acdc7",
  storageBucket: "childhoodlife-acdc7.firebasestorage.app",
  messagingSenderId: "277479291989",
  appId: "1:277479291989:web:c99386e5c700567a4468dc",
  measurementId: "G-1JCVXNJK8L",
};

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

export const firebaseApp = app;
export const db: Firestore = getFirestore(app);
export const auth: Auth = getAuth(app);

export function isFirebaseConfigured(): boolean {
  return !!firebaseConfig.apiKey && firebaseConfig.apiKey.length > 5;
}
