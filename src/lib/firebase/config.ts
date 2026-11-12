/** Public Firebase web config. Safe to ship to the browser. */
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
};

export const USE_EMULATORS = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true";

export const EMULATOR_HOSTS = {
  auth: "http://127.0.0.1:9099",
} as const;

/** True when the public web config is populated enough for the browser SDK to boot. */
export const isFirebaseClientConfigured = () =>
  Boolean(firebaseConfig.projectId && (USE_EMULATORS || (firebaseConfig.apiKey && firebaseConfig.appId)));
