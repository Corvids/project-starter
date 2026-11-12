import { db } from "@/lib/db";
import { redis } from "@/lib/redis";

const CACHE_KEY = "notes:recent";
const CACHE_TTL_SECONDS = 60;
const RECENT_LIMIT = 20;
export const MAX_NOTE_LENGTH = 280;

export type NoteView = { id: number; body: string; createdAt: string };
export type CacheSource = "redis" | "postgres";

export async function getRecentNotes(): Promise<{ notes: NoteView[]; source: CacheSource }> {
  const cached = await redis().get(CACHE_KEY);
  if (cached) {
    return { notes: JSON.parse(cached) as NoteView[], source: "redis" };
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
  await redis().set(CACHE_KEY, JSON.stringify(notes), "EX", CACHE_TTL_SECONDS);
  return { notes, source: "postgres" };
}

export function parseNoteBody(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const body = input.trim();
  return body.length > 0 && body.length <= MAX_NOTE_LENGTH ? body : null;
}

export async function createNote(body: string): Promise<NoteView> {
  const row = await db().note.create({ data: { body } });
  await redis().del(CACHE_KEY);
  return { id: row.id, body: row.body, createdAt: row.createdAt.toISOString() };
}
