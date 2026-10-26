
import { NextResponse } from "next/server";

const STOP_WORDS = new Set([
  "the", "and", "for", "are", "was", "were", "with", "that",
  "this", "from", "have", "has", "had", "not", "but", "you",
  "your", "can", "will", "its", "into", "their", "they", "them",
  "then", "than", "when", "where", "which", "what", "who",
  "how", "why", "all", "any", "each", "per", "use", "used",
  "using", "also", "such", "more", "most", "other", "these",
  "those", "about", "between", "through", "there", "been",
  "being", "may", "might", "should", "would", "could",
]);

function detectTopics(text: string) {
  const phrases = text
    .replace(/\r/g, "\n")
    .split(/[\n.!?;:|]+/)
    .map((line) => line.trim())
    .filter((line) => line.length >= 4 && line.length <= 140);

  const counts = new Map<string, number>();

  for (const phrase of phrases) {
    const words = phrase.match(/[A-Za-z][A-Za-z0-9+#.-]*/g) ?? [];
    const usefulWords = words.filter(
      (word) =>
        word.length > 2 &&
        !STOP_WORDS.has(word.toLowerCase()) &&
        !/^\d+$/.test(word)
    );

    if (usefulWords.length === 0) continue;

    const candidate = usefulWords.slice(0, 7).join(" ");
    const key = candidate.toLowerCase();

    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([topic, occurrences]) => ({
      topic: topic.replace(/\b\w/g, (letter) => letter.toUpperCase()),
      occurrences,
    }));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const text = body?.text;

    if (typeof text !== "string" || text.trim().length < 20) {
      return NextResponse.json(
        { error: "Please provide at least 20 characters of extracted text." },
        { status: 400 }
      );
    }

    const topics = detectTopics(text);

    return NextResponse.json({
      topics,
      totalTopics: topics.length,
      method: "keyword-based",
      message: "These are candidate topics detected from text patterns. Review them against your syllabus.",
    });
  } catch (error) {
    console.error("Topic analysis failed:", error);

    return NextResponse.json(
      { error: "Unable to analyze the supplied text." },
      { status: 400 }
    );
  }
}
