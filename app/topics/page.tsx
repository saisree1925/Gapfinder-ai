
"use client";

import { useState } from "react";

type Topic = {
  topic: string;
  occurrences: number;
};

async function readResponse(response: Response) {
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    const body = await response.text();
    console.error("Expected JSON but received:", body.slice(0, 300));
    throw new Error(
      `Server returned a non-JSON response (HTTP ${response.status}). Check the VS Code terminal for details.`
    );
  }

  return response.json();
}

export default function TopicsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [characters, setCharacters] = useState(0);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function analyzePDF(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setMessage("Please select a PDF file first.");
      return;
    }

    setLoading(true);
    setMessage("");
    setTopics([]);
    setCharacters(0);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const extractResponse = await fetch("/api/extract-pdf", {
        method: "POST",
        body: formData,
      });

      const extracted = await readResponse(extractResponse);

      if (!extractResponse.ok) {
        throw new Error(extracted.error || "PDF extraction failed.");
      }

      const topicResponse = await fetch("/api/analyze-topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: extracted.text }),
      });

      const result = await readResponse(topicResponse);

      if (!topicResponse.ok) {
        throw new Error(result.error || "Topic analysis failed.");
      }

      setTopics(result.topics || []);
      setCharacters(extracted.characters || extracted.text.length);
      setMessage(`Analysis complete! Processed ${extracted.filename || file.name}.`);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-white">
      <div className="mx-auto max-w-3xl">
        <a href="/dashboard" className="text-sm text-cyan-400 hover:text-cyan-300">
          ← Back to Dashboard
        </a>

        <h1 className="mt-6 text-3xl font-bold">GapFinder AI — Topic Analysis</h1>
        <p className="mt-3 text-slate-400">
          Upload your study PDF to extract its text and identify candidate topics automatically.
        </p>

        <form onSubmit={analyzePDF} className="mt-8 rounded-2xl border border-slate-700 bg-slate-900 p-6">
          <label className="mb-3 block font-medium" htmlFor="pdf">
            Select study material (PDF)
          </label>

          <input
            id="pdf"
            type="file"
            accept=".pdf,application/pdf"
            onChange={(event) => {
              setFile(event.target.files?.[0] || null);
              setMessage("");
              setTopics([]);
              setCharacters(0);
            }}
            className="block w-full rounded-lg border border-slate-700 bg-slate-800 p-3 text-sm text-slate-300"
          />

          <button
            type="submit"
            disabled={!file || loading}
            className="mt-5 w-full rounded-lg bg-cyan-400 px-5 py-3 font-bold text-slate-950 disabled:opacity-50"
          >
            {loading ? "Analyzing PDF..." : "Extract Text & Find Topics"}
          </button>

          {message && (
            <p className="mt-4 rounded-lg bg-slate-800 p-3 text-sm text-slate-200">
              {message}
            </p>
          )}
        </form>

        {characters > 0 && (
          <div className="mt-6 rounded-xl border border-slate-700 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Text extracted successfully</p>
            <p className="mt-1 text-2xl font-bold">{characters.toLocaleString()} characters</p>
          </div>
        )}

        {topics.length > 0 && (
          <section className="mt-8">
            <h2 className="text-xl font-bold">Detected Topics</h2>
            <p className="mt-2 text-sm text-slate-400">
              These are keyword-based candidate topics. Review them against your syllabus.
            </p>

            <div className="mt-4 space-y-3">
              {topics.map((item, index) => (
                <div key={`${item.topic}-${index}`} className="flex items-center justify-between gap-4 rounded-xl border border-slate-700 bg-slate-900 p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/15 font-bold text-cyan-300">
                      {index + 1}
                    </span>
                    <span className="font-medium">{item.topic}</span>
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                    {item.occurrences} occurrence{item.occurrences === 1 ? "" : "s"}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {characters > 0 && topics.length === 0 && !loading && (
          <p className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200">
            Text was extracted, but no candidate topics were detected. Try a PDF containing readable study notes.
          </p>
        )}
      </div>
    </main>
  );
}
