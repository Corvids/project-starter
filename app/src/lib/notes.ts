import { db } from "@/lib/db";
import { redis } from "@/lib/redis";

const CACHE_VERSION_KEY = "notes:recent:version";
const CACHE_TTL_SECONDS = 60;
const RECENT_LIMIT = 20;
export const MAX_NOTE_LENGTH = 280;

export type NoteView = { id: number; body: string; createdAt: string };
export type CacheSource = "redis" | "postgres";

export async function getRecentNotes(): Promise<{ notes: NoteView[]; source: CacheSource }> {
  const version = await readCacheVersion();
  if (version !== null) {
    const cached = await readCachedNotes(version);
    if (cached) {
      return { notes: cached, source: "redis" };
    }
  }

  const rows = await db().note.findMany({
    orderBy: { createdAt: "desc" },
    take: RECENT_LIMIT,
  });
  const notes = rows.map((row) => ({
    id: row.id,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
  }));
  if (version !== null) {
    await writeCachedNotes(version, notes);
  }
  return { notes, source: "postgres" };
}

export function parseNoteBody(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const body = input.trim();
  return body.length > 0 && body.length <= MAX_NOTE_LENGTH ? body : null;
}

export async function createNote(body: string): Promise<NoteView> {
  const row = await db().note.create({ data: { body } });
  await bumpCacheVersion();
  return { id: row.id, body: row.body, createdAt: row.createdAt.toISOString() };
}

function cacheKey(version: string): string {
  return `notes:recent:${version}`;
}

async function readCacheVersion(): Promise<string | null> {
  try {
    return (await redis().get(CACHE_VERSION_KEY)) ?? "0";
  } catch (error) {
    logCacheError(error);
    return null;
  }
}

async function readCachedNotes(version: string): Promise<NoteView[] | null> {
  try {
    const payload = await redis().get(cacheKey(version));
    return payload === null ? null : parseCachedNotes(payload);
  } catch (error) {
    logCacheError(error);
    return null;
  }
}

async function writeCachedNotes(version: string, notes: NoteView[]): Promise<void> {
  try {
    await redis().set(cacheKey(version), JSON.stringify(notes), "EX", CACHE_TTL_SECONDS);
  } catch (error) {
    logCacheError(error);
  }
}

async function bumpCacheVersion(): Promise<void> {
  try {
    await redis().incr(CACHE_VERSION_KEY);
  } catch (error) {
    logCacheError(error);
  }
}

function parseCachedNotes(payload: string): NoteView[] | null {
  try {
    const parsed: unknown = JSON.parse(payload);
    return Array.isArray(parsed) && parsed.every(isNoteView) ? parsed : null;
  } catch (error) {
    logCacheError(error);
    return null;
  }
}

function isNoteView(value: unknown): value is NoteView {
  if (!value || typeof value !== "object") return false;
  const note = value as Record<string, unknown>;
  return (
    Number.isSafeInteger(note.id) &&
    typeof note.body === "string" &&
    typeof note.createdAt === "string"
  );
}

function logCacheError(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[cache] ${message}`);
}
