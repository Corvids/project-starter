import { connection, NextResponse, type NextRequest } from "next/server";
import { createNote, getRecentNotes, MAX_NOTE_LENGTH, parseNoteBody } from "@/lib/notes";

export async function GET() {
  await connection();
  const { notes, source } = await getRecentNotes();
  return NextResponse.json(
    { source, notes },
    { headers: { "Cache-Control": "no-store", "X-Cache": source === "redis" ? "HIT" : "MISS" } },
  );
}

export async function POST(request: NextRequest) {
  const payload: unknown = await request.json().catch(() => null);
  const body = parseNoteBody(
    payload && typeof payload === "object" && "body" in payload ? payload.body : null,
  );
  if (!body) {
    return NextResponse.json(
      { error: `"body" must be a non-empty string of at most ${MAX_NOTE_LENGTH} characters` },
      { status: 400 },
    );
  }
  const note = await createNote(body);
  return NextResponse.json(note, { status: 201 });
}
