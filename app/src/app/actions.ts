"use server";

import { revalidatePath } from "next/cache";
import { createNote, parseNoteBody } from "@/lib/notes";

export async function addNote(formData: FormData): Promise<void> {
  const body = parseNoteBody(formData.get("body"));
  if (!body) return;
  await createNote(body);
  revalidatePath("/");
}
