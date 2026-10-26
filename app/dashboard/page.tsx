
"use client";

import { useEffect, useRef, useState } from "react";

type ExtractedPDF = {
  filename: string;
  text: string;
  characters: number;
};

type StudyNote = {
  id: string;
  title: string;
  subject: string;
  content: string;
  createdAt: string;
};

const NOTES_STORAGE_KEY = "gapfinder-study-notes";

export default function Dashboard() {
  const fileInput = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [extractedPDFs, setExtractedPDFs] = useState<ExtractedPDF[]>([]);
  const [error, setError] = useState("");

  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteSubject, setNoteSubject] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [notesLoaded, setNotesLoaded] = useState(false);
  const [noteMessage, setNoteMessage] = useState("");

  useEffect(() => {
    try {
      const savedNotes = localStorage.getItem(NOTES_STORAGE_KEY);

      if (savedNotes) {
        const parsed: unknown = JSON.parse(savedNotes);

        if (Array.isArray(parsed)) {
          setNotes(parsed as StudyNote[]);
        }
      }
    } catch {
      setNoteMessage("Saved notes could not be loaded.");
    } finally {
      setNotesLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!notesLoaded) return;

    try {
      localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
    } catch {
      setNoteMessage("Could not save notes. Browser storage may be full.");
    }
  }, [notes, notesLoaded]);

  function handleFiles(selectedFiles: FileList | null) {
    if (!selectedFiles) return;

    const allowed = /\.(pdf|docx|txt|md)$/i;
    const selected = Array.from(selectedFiles);
    const valid = selected.filter((file) => allowed.test(file.name));

    setError(
      valid.length !== selected.length
        ? "Some files were skipped. Choose PDF, DOCX, TXT, or Markdown files."
        : ""
    );

    setFiles((current) => [
      ...current,
      ...valid.filter(
        (file) =>
          !current.some(
            (old) => old.name === file.name && old.size === file.size
          )
      ),
    ]);
  }

  async function extractPDFs() {
    const pdfFiles = files.filter((file) =>
      file.name.toLowerCase().endsWith(".pdf")
    );

    if (pdfFiles.length === 0) {
      setError("Please select a PDF file first.");
      return;
    }

    setIsUploading(true);
    setError("");
    setStatus("Reading your PDF files...");

    const results: ExtractedPDF[] = [];
    const failures: string[] = [];

    try {
      for (const file of pdfFiles) {
        try {
          const formData = new FormData();
          formData.append("file", file);

          const response = await fetch("/api/extract-pdf", {
            method: "POST",
            body: formData,
          });

          const contentType = response.headers.get("content-type") || "";

          if (!contentType.includes("application/json")) {
            throw new Error(`Server returned HTTP ${response.status}.`);
          }

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || `Server error: ${response.status}`);
          }

          results.push({
            filename: data.fileName ?? data.filename ?? file.name,
            text: data.text,
            characters: data.characters ?? data.text?.length ?? 0,
          });
        } catch (err) {
          console.error("PDF extraction error:", err);

          failures.push(
            `${file.name}: ${
              err instanceof Error ? err.message : String(err)
            }`
          );
        }
      }

      setExtractedPDFs((current) => [
        ...current.filter(
          (old) => !results.some((item) => item.filename === old.filename)
        ),
        ...results,
      ]);

      if (failures.length === 0) {
        setStatus(`Successfully read ${results.length} PDF file(s).`);
      } else {
        setStatus(
          `Read ${results.length} PDF file(s). ${failures.length} failed.`
        );
        setError(failures.join(" | "));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("");
    } finally {
      setIsUploading(false);
    }
  }

  function saveNote() {
    const title = noteTitle.trim();
    const content = noteContent.trim();

    if (!title || !content) {
      setNoteMessage("Please enter a note title and some note content.");
      return;
    }

    const newNote: StudyNote = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title,
      subject: noteSubject.trim() || "General",
      content,
      createdAt: new Date().toLocaleDateString(),
    };

    setNotes((current) => [newNote, ...current]);
    setNoteTitle("");
    setNoteSubject("");
    setNoteContent("");
    setNoteMessage("Your study note has been saved in this browser.");
  }

  function deleteNote(id: string) {
    setNotes((current) => current.filter((note) => note.id !== id));
    setNoteMessage("Study note deleted.");
  }

  const totalCharacters = extractedPDFs.reduce(
    (total, pdf) => total + pdf.characters,
    0
  );

  return (
    <main className="min-h-screen bg-[#f7f6ff] text-slate-800">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-violet-100 bg-white px-5 py-7 lg:flex">
        <a href="/" className="flex items-center gap-3 text-xl font-bold">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-lg text-white">
            G
          </span>
          <span>
            GapFinder <span className="text-violet-600">AI</span>
          </span>
        </a>

        <p className="mb-3 mt-10 px-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Workspace
        </p>

        <nav className="space-y-2">
          <a href="/dashboard" className="flex items-center gap-3 rounded-xl bg-violet-50 px-4 py-3 font-semibold text-violet-700">
            <span>▦</span> Dashboard
          </a>
          <a href="/topics" className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-600 transition hover:bg-violet-50 hover:text-violet-700">
            <span>◎</span> Topic Analysis
          </a>
          <a href="/quiz" className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-600 transition hover:bg-violet-50 hover:text-violet-700">
            <span>✓</span> Practice Quiz
          </a>
          <a href="/#how-it-works" className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-600 transition hover:bg-violet-50 hover:text-violet-700">
            <span>ⓘ</span> How it works
          </a>
        </nav>

        <div className="mt-auto rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 p-5 text-white">
          <p className="text-lg font-bold">Study smarter.</p>
          <p className="mt-2 text-sm leading-6 text-violet-100">
            Small revision sessions can make a big difference.
          </p>
          <a href="/quiz" className="mt-4 inline-block rounded-lg bg-white px-4 py-2 text-sm font-semibold text-violet-700">
            Start a quiz →
          </a>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-violet-100 bg-white/90 px-5 py-4 backdrop-blur md:px-9">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 font-bold text-violet-700 lg:hidden">
              G
            </span>
            <div>
              <p className="text-sm text-slate-500">Student workspace</p>
              <p className="font-semibold">My learning dashboard</p>
            </div>
          </div>
          <a href="/" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium transition hover:border-violet-300 hover:text-violet-700">
            Home
          </a>
        </header>

        <div className="mx-auto max-w-7xl px-5 py-8 md:px-9 md:py-10">
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-700 via-violet-600 to-indigo-600 p-7 text-white shadow-lg shadow-violet-200 md:p-10">
            <div className="relative z-10 max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-widest text-violet-200">
                YOUR PERSONAL STUDY SPACE
              </p>
              <h1 className="mt-4 text-3xl font-bold leading-tight md:text-4xl">
                Let&apos;s find your knowledge gaps.
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-violet-100 md:text-base">
                Upload your study materials, save your notes, discover
                important topics, and practise what you learn—all in one place.
              </p>
              <a href="/topics" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-violet-700 shadow-sm transition hover:bg-violet-50">
                Explore my topics <span>→</span>
              </a>
            </div>
            <div className="pointer-events-none absolute -right-10 -top-20 h-64 w-64 rounded-full border-[35px] border-white/10" />
            <div className="pointer-events-none absolute -bottom-24 right-28 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          </section>

          <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard icon="▤" title="Study materials" value={String(files.length + notes.length)} detail="Selected files and saved notes" />
            <StatCard icon="◫" title="PDFs processed" value={String(extractedPDFs.length)} detail="Successfully read" />
            <StatCard icon="✧" title="Text extracted" value={totalCharacters.toLocaleString()} detail="Characters extracted" />
          </section>

          <section className="mt-8 grid items-start gap-6 xl:grid-cols-[1.5fr_1fr]">
            <div className="space-y-6">
              <section className="rounded-2xl border border-violet-100 bg-white p-6 shadow-sm md:p-8">
                <div className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-2xl text-violet-700">
                    ↑
                  </span>
                  <div>
                    <h2 className="text-xl font-bold">Upload study materials</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Select PDFs, DOCX, TXT, or Markdown files. PDF text can
                      be extracted here.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  className="mt-7 w-full rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50/50 px-5 py-9 text-center transition hover:border-violet-400 hover:bg-violet-50"
                >
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl text-violet-600 shadow-sm">
                    ↑
                  </span>
                  <span className="mt-4 block font-semibold text-slate-800">
                    Choose files from your computer
                  </span>
                  <span className="mt-2 block text-sm text-slate-500">
                    PDF, DOCX, TXT or Markdown
                  </span>
                </button>

                <input
                  ref={fileInput}
                  type="file"
                  multiple
                  accept=".pdf,.docx,.txt,.md"
                  className="hidden"
                  onChange={(event) => {
                    handleFiles(event.target.files);
                    event.target.value = "";
                  }}
                />

                {files.length > 0 && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Selected materials</h3>
                      <span className="text-sm text-slate-500">
                        {files.length} file(s)
                      </span>
                    </div>

                    <ul className="mt-3 space-y-2">
                      {files.map((file, index) => (
                        <li key={`${file.name}-${file.size}-${index}`} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm">
                          <span className="break-all text-slate-700">{file.name}</span>
                          <button
                            type="button"
                            disabled={isUploading}
                            onClick={() => {
                              setFiles((current) =>
                                current.filter((_, i) => i !== index)
                              );
                              setExtractedPDFs((current) =>
                                current.filter((pdf) => pdf.filename !== file.name)
                              );
                            }}
                            className="shrink-0 font-medium text-rose-500 hover:text-rose-700 disabled:opacity-50"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>

                    <button
                      type="button"
                      onClick={extractPDFs}
                      disabled={isUploading}
                      className="mt-5 w-full rounded-xl bg-violet-600 px-6 py-3.5 font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                    >
                      {isUploading ? "Reading your PDFs..." : "Extract PDF text →"}
                    </button>
                  </div>
                )}

                {status && (
                  <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700" role="status">
                    {status}
                  </p>
                )}
                {error && (
                  <p className="mt-3 break-words rounded-xl bg-rose-50 p-3 text-sm text-rose-700" role="alert">
                    {error}
                  </p>
                )}

                {extractedPDFs.length > 0 && (
                  <div className="mt-8 space-y-5">
                    <h3 className="text-lg font-bold">Extracted PDF text</h3>
                    {extractedPDFs.map((pdf) => (
                      <article key={pdf.filename} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <h4 className="break-all font-semibold text-violet-700">{pdf.filename}</h4>
                        <p className="mt-1 text-xs text-slate-500">
                          {pdf.characters.toLocaleString()} characters extracted
                        </p>
                        <pre className="mt-4 max-h-80 overflow-auto whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                          {pdf.text.slice(0, 10000)}
                          {pdf.text.length > 10000 ? "\n\n[Preview limited to the first 10,000 characters]" : ""}
                        </pre>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-violet-100 bg-white p-6 shadow-sm md:p-8">
                <div className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-2xl text-indigo-700">
                    ✎
                  </span>
                  <div>
                    <h2 className="text-xl font-bold">Create study notes</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Write your own revision notes and save them for later.
                    </p>
                  </div>
                </div>

                <form
                  className="mt-6 space-y-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    saveNote();
                  }}
                >
                  <div>
                    <label htmlFor="note-title" className="mb-1.5 block text-sm font-medium">
                      Note title
                    </label>
                    <input
                      id="note-title"
                      value={noteTitle}
                      onChange={(event) => setNoteTitle(event.target.value)}
                      placeholder="e.g. Semantic Web — Unit 1"
                      maxLength={120}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                    />
                  </div>

                  <div>
                    <label htmlFor="note-subject" className="mb-1.5 block text-sm font-medium">
                      Subject (optional)
                    </label>
                    <input
                      id="note-subject"
                      value={noteSubject}
                      onChange={(event) => setNoteSubject(event.target.value)}
                      placeholder="e.g. Semantic Web"
                      maxLength={100}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                    />
                  </div>

                  <div>
                    <label htmlFor="note-content" className="mb-1.5 block text-sm font-medium">
                      Your notes
                    </label>
                    <textarea
                      id="note-content"
                      value={noteContent}
                      onChange={(event) => setNoteContent(event.target.value)}
                      placeholder="Write definitions, key points, examples, or revision notes..."
                      rows={7}
                      maxLength={50000}
                      className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 leading-6 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                    />
                    <p className="mt-1 text-right text-xs text-slate-400">
                      {noteContent.length.toLocaleString()} / 50,000 characters
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-xl bg-indigo-600 px-6 py-3.5 font-semibold text-white transition hover:bg-indigo-700 sm:w-auto"
                  >
                    Save study note →
                  </button>
                </form>

                {noteMessage && (
                  <p className="mt-4 rounded-xl bg-violet-50 p-3 text-sm text-violet-700" role="status">
                    {noteMessage}
                  </p>
                )}
              </section>

              <section className="rounded-2xl border border-violet-100 bg-white p-6 shadow-sm md:p-8">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold">My saved notes</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {notes.length} note(s) saved in this browser
                    </p>
                  </div>
                  <span className="rounded-xl bg-violet-100 px-3 py-2 text-sm font-semibold text-violet-700">
                    {notes.length}
                  </span>
                </div>

                {notes.length === 0 ? (
                  <p className="mt-5 rounded-xl bg-slate-50 p-5 text-sm leading-6 text-slate-500">
                    Your saved notes will appear here after you create your first one.
                  </p>
                ) : (
                  <div className="mt-5 space-y-4">
                    {notes.map((note) => (
                      <article key={note.id} className="rounded-xl border border-slate-200 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="break-words font-semibold text-slate-800">
                              {note.title}
                            </h3>
                            <p className="mt-1 text-xs text-violet-700">
                              {note.subject} · {note.createdAt}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => deleteNote(note.id)}
                            className="shrink-0 text-sm font-medium text-rose-500 hover:text-rose-700"
                          >
                            Delete
                          </button>
                        </div>
                        <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                          {note.content}
                        </p>
                      </article>
                    ))}
                  </div>
                )}

                <p className="mt-5 text-xs leading-5 text-slate-400">
                  Notes are stored locally in this browser. They are not yet
                  synced across devices or student accounts.
                </p>
              </section>
            </div>

            <div className="space-y-6">
              <section className="rounded-2xl border border-violet-100 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold">Continue learning</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Pick your next step and keep moving forward.
                </p>
                <div className="mt-5 space-y-3">
                  <QuickLink href="/topics" icon="◎" title="Analyse topics" text="Find important concepts in your materials" />
                  <QuickLink href="/quiz" icon="✓" title="Practise a quiz" text="Test your understanding" />
                </div>
              </section>

              <section className="rounded-2xl border border-violet-100 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold">Your study workflow</h2>
                <div className="mt-5 space-y-5">
                  <Step number="01" title="Upload materials" text="Add your notes and study resources." />
                  <Step number="02" title="Discover topics" text="Identify key concepts to focus on." />
                  <Step number="03" title="Test yourself" text="Use quizzes to check your understanding." />
                  <Step number="04" title="Review gaps" text="Use missed questions to guide revision." />
                </div>
              </section>
            </div>
          </section>

          <footer className="mt-10 border-t border-violet-100 py-6 text-center text-sm text-slate-500">
            GapFinder AI · Learn smarter, not harder.
          </footer>
        </div>
      </div>
    </main>
  );
}

function StatCard({
  icon,
  title,
  value,
  detail,
}: {
  icon: string;
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-xl text-violet-600">
          {icon}
        </span>
      </div>
      <p className="mt-4 break-words text-3xl font-bold tracking-tight text-slate-800">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </article>
  );
}

function QuickLink({
  href,
  icon,
  title,
  text,
}: {
  href: string;
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <a href={href} className="group flex items-start gap-3 rounded-xl border border-slate-100 p-4 transition hover:border-violet-200 hover:bg-violet-50">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-lg text-violet-700">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-slate-800">{title}</span>
        <span className="mt-1 block text-sm leading-5 text-slate-500">{text}</span>
      </span>
      <span className="text-violet-500 transition group-hover:translate-x-1">→</span>
    </a>
  );
}

function Step({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-xs font-bold text-violet-700">
        {number}
      </span>
      <div>
        <h3 className="font-semibold text-slate-800">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-500">{text}</p>
      </div>
    </div>
  );
}
