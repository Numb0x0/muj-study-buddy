"use client";

/**
 * Browser-side Firebase SDK. Used ONLY for Google sign-in (to obtain an ID
 * token that the server exchanges for a session cookie).
 *
 * Public pages never talk to Firestore from the browser; all reads go through
 * server components / route handlers using the Admin SDK. PDF uploads go to
 * /api/admin/notes/upload with the session cookie.
 */
import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";
import { EMULATOR_HOSTS, firebaseConfig, USE_EMULATORS } from "./config";

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let emulatorsConnected = false;

export function getFirebaseApp(): FirebaseApp {
  if (app) return app;
  // With emulators an API key is still required by the SDK, any non-empty string works.
  const cfg = USE_EMULATORS && !firebaseConfig.apiKey ? { ...firebaseConfig, apiKey: "demo-api-key" } : firebaseConfig;
  app = getApps().length ? getApp() : initializeApp(cfg);
  return app;
}

export function getFirebaseAuth(): Auth {
  if (auth) return auth;
  auth = getAuth(getFirebaseApp());
  connectEmulatorsOnce();
  return auth;
}

function connectEmulatorsOnce() {
  if (!USE_EMULATORS || emulatorsConnected || typeof window === "undefined") return;
  emulatorsConnected = true;
  const a = auth ?? getAuth(getFirebaseApp());
  auth = a;
  connectAuthEmulator(a, EMULATOR_HOSTS.auth, { disableWarnings: true });
}
