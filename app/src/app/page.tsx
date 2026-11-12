import { connection } from "next/server";
import { addNote } from "@/app/actions";
import { getRecentNotes, MAX_NOTE_LENGTH } from "@/lib/notes";

export default async function HomePage() {
  await connection();
  const { notes, source } = await getRecentNotes();

  return (
    <main>
      <h1>Todo List</h1>
      <p className="muted">A very basic todo list</p>

      <form action={addNote}>
        <input name="body" placeholder="Add a task" required maxLength={MAX_NOTE_LENGTH} />
        <button type="submit">Add</button>
      </form>

      <p>
        Currently serving todos data from {" "}
        <span className={`badge badge-${source}`}>{source === "redis" ? "Redis cache" : "Postgres"}</span>
      </p>

      {notes.length === 0 ? (
        <p className="muted">No todos yet.</p>
      ) : (
        <ul>
          {notes.map((note) => (
            <li key={note.id}>
              <span>{note.body}</span>
              <time dateTime={note.createdAt}>{new Date(note.createdAt).toLocaleString("en-US")}</time>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
