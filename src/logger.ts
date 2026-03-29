// ---------------------------------------------------------------------------
// Logger — append-only JSONL call log
// ---------------------------------------------------------------------------
// Writes to ~/.hebline/calls.jsonl — metadata only, never content.
// This is the data basis for future Hebbian Learning.
// ---------------------------------------------------------------------------

import { appendFile, mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import type { CallLogEntry } from "./types.js";

const LOG_DIR = join(homedir(), ".hebline");
const LOG_FILE = join(LOG_DIR, "calls.jsonl");

let dirReady = false;

async function ensureDir(): Promise<void> {
  if (dirReady) return;
  await mkdir(LOG_DIR, { recursive: true });
  dirReady = true;
}

export async function logCall(entry: CallLogEntry): Promise<void> {
  await ensureDir();
  await appendFile(LOG_FILE, JSON.stringify(entry) + "\n", "utf-8");
}
