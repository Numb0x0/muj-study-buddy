// Starts the Firebase Emulator Suite (auth, firestore, UI). No Storage: files live in Firestore.
// Data persists in ./emulator-data between runs (imported only when a snapshot exists).
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";

const args = ["firebase", "emulators:start", "--only", "auth,firestore", "--project", "demo-muj-study-buddy", "--export-on-exit=./emulator-data"];
if (existsSync("./emulator-data/firebase-export-metadata.json")) args.push("--import=./emulator-data");
const child = spawn("npx", args, { stdio: "inherit", shell: process.platform === "win32" });
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => child.kill(sig));
child.on("exit", (code) => process.exit(code ?? 0));
