
import { NextResponse } from "next/server";

type Question = {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
};

const STOP_WORDS = new Set(
  `about above after again against all also am an and any are as at be because been
  before being below between both but by can could did do does doing down during
  each few for from further had has have having he her here hers herself him
  himself his how i if in into is it its itself just more most my myself no nor
  not of off on once only or other our ours ourselves out over own same she
  should so some such than that the their theirs them themselves then there
  these they this those through to too under until up very was we were what
  when where which while who whom why will with would you your yours`.split(
    /\s+/
  )
);

function shuffle<T>(items: T[]): T[] {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function generateQuestions(text: string): Question[] {
  const sentences = text
    .replace(/\r/g, "\n")
    .replace(/[•●▪]/g, "\n")
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) =>
      sentence.replace(/^[\s\d.)\-:]+/, "").trim()
    )
    .filter(
      (sentence) =>
        sentence.length >= 30 &&
        sentence.length <= 350 &&
        /[a-zA-Z]/.test(sentence)
    );

  // Remove duplicate sentences.
  const uniqueSentences = Array.from(
    new Set(sentences.map((sentence) => sentence.replace(/\s+/g, " ")))
  );

  // Find meaningful words that actually occur in the uploaded study material.
  const wordCounts = new Map<string, number>();

  for (const sentence of uniqueSentences) {
    const words = sentence.match(/\b[A-Za-z][A-Za-z-]{3,}\b/g) ?? [];

    for (const word of words) {
      const normalized = word.toLowerCase();

      if (STOP_WORDS.has(normalized)) continue;

      wordCounts.set(normalized, (wordCounts.get(normalized) ?? 0) + 1);
    }
  }

  const usefulWords = [...wordCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([word]) => word)
    .slice(0, 60);

  const questions: Question[] = [];
  const usedAnswers = new Set<string>();
  const usedSentences = new Set<string>();

  for (const sentence of uniqueSentences) {
    if (questions.length >= 10) break;

    const lowerSentence = sentence.toLowerCase();

    // Prefer a meaningful word that occurs in this sentence.
    const answer = usefulWords.find(
      (word) =>
        !usedAnswers.has(word) &&
        new RegExp(`\\b${escapeRegex(word)}\\b`, "i").test(sentence)
    );

    if (!answer || usedSentences.has(lowerSentence)) continue;

    const match = sentence.match(
      new RegExp(`\\b${escapeRegex(answer)}\\b`, "i")
    );

    if (!match) continue;

    const blankSentence = sentence.replace(
      new RegExp(`\\b${escapeRegex(answer)}\\b`, "i"),
      "_____"
    );

    // Use different words from the uploaded material as distractors.
    const distractors = shuffle(
      usefulWords.filter(
        (word) =>
          word !== answer &&
          !new RegExp(`\\b${escapeRegex(word)}\\b`, "i").test(sentence)
      )
    ).slice(0, 3);

    if (distractors.length < 3) continue;

    const questionNumber = questions.length % 3;

    const questionText =
      questionNumber === 0
        ? `Complete the statement from your study material: "${blankSentence}"`
        : questionNumber === 1
        ? `Which word correctly fills the blank? "${blankSentence}"`
        : `Choose the missing term in this statement: "${blankSentence}"`;

    questions.push({
      question: questionText,
      options: shuffle([match[0], ...distractors]),
      answer: match[0],
      explanation: `The original statement in your study material is: "${sentence}"`,
    });

    usedAnswers.add(answer);
    usedSentences.add(lowerSentence);
  }

  return questions;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const text = body?.text;

    if (typeof text !== "string" || text.trim().length < 50) {
      return NextResponse.json(
        { error: "Please provide at least 50 characters of study text." },
        { status: 400 }
      );
    }

    const questions = generateQuestions(text);

    if (questions.length === 0) {
      return NextResponse.json(
        {
          error:
            "Not enough distinct study terms were found. Please upload a document with more readable text.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      questions,
      totalQuestions: questions.length,
      method: "study-text-based",
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to generate the quiz. Please try again." },
      { status: 400 }
    );
  }
}
