import "server-only";

/**
 * Firebase Admin SDK — SERVER ONLY. Never import from a client component.
 *
 * Credentials resolution order:
 *  1. FIREBASE_SERVICE_ACCOUNT_KEY (raw JSON or base64 JSON) → cert()
 *  2. Emulators (FIRESTORE_EMULATOR_HOST etc.) → projectId only, no credentials needed
 *  3. Application Default Credentials (gcloud / GCP runtime)
 */
import { cert, getApps, initializeApp, applicationDefault, type App, type ServiceAccount } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

export class AdminConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminConfigError";
  }
}

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "";

export const usingEmulators =
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true" ||
  Boolean(process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST);

function parseServiceAccount(raw: string): ServiceAccount {
  const trimmed = raw.trim();
  const json = trimmed.startsWith("{") ? trimmed : Buffer.from(trimmed, "base64").toString("utf8");
  const parsed = JSON.parse(json) as Record<string, string>;
  return {
    projectId: parsed.project_id ?? parsed.projectId,
    clientEmail: parsed.client_email ?? parsed.clientEmail,
    privateKey: (parsed.private_key ?? parsed.privateKey ?? "").replace(/\\n/g, "\n"),
  };
}

/** Ensure the Admin SDK picks up emulator hosts even if only the public flag was set. */
function applyEmulatorEnvDefaults() {
  if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS !== "true") return;
  process.env.FIRESTORE_EMULATOR_HOST ||= "127.0.0.1:8080";
  process.env.FIREBASE_AUTH_EMULATOR_HOST ||= "127.0.0.1:9099";
}

let adminApp: App | undefined;

export function getAdminApp(): App {
  if (adminApp) return adminApp;
  if (getApps().length) {
    adminApp = getApps()[0];
    return adminApp;
  }
  applyEmulatorEnvDefaults();

  if (!projectId) {
    throw new AdminConfigError("NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set. Copy .env.example to .env.local and fill it in.");
  }

  const saRaw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (saRaw) {
    adminApp = initializeApp({ credential: cert(parseServiceAccount(saRaw)), projectId });
  } else if (usingEmulators) {
    adminApp = initializeApp({ projectId });
  } else {
    try {
      adminApp = initializeApp({ credential: applicationDefault(), projectId });
    } catch {
      throw new AdminConfigError(
        "No Firebase Admin credentials found. Set FIREBASE_SERVICE_ACCOUNT_KEY in .env.local (or enable emulators).",
      );
    }
  }
  return adminApp;
}

export function adminAuth(): Auth {
  return getAuth(getAdminApp());
}

let firestoreInstance: Firestore | undefined;
export function adminDb(): Firestore {
  if (firestoreInstance) return firestoreInstance;
  firestoreInstance = getFirestore(getAdminApp());
  try {
    firestoreInstance.settings({ ignoreUndefinedProperties: true });
  } catch {
    // settings() can only be called once; ignore if already initialised elsewhere
  }
  return firestoreInstance;
}

/** True when the server can talk to Firebase at all (used for friendly setup screens). */
export function isAdminConfigured(): boolean {
  return Boolean(projectId && (process.env.FIREBASE_SERVICE_ACCOUNT_KEY || usingEmulators || process.env.GOOGLE_APPLICATION_CREDENTIALS));
}
