
import { NextResponse } from "next/server";

const STOP_WORDS = new Set([
  "the", "and", "for", "are", "was", "were", "with", "that",
  "this", "from", "have", "has", "had", "not", "but", "you",
  "your", "can", "will", "its", "into", "their", "they", "them",
  "then", "than", "when", "where", "which", "what", "who",
  "how", "why", "all", "any", "each", "per", "use", "used",
  "using", "also", "such", "more", "most", "other", "these",
  "those", "about", "between", "through", "there", "been",
  "being", "may", "might", "should", "would", "could", "does",
  "did", "doing", "because", "while", "within", "without",
  "under", "over", "after", "before", "during", "both", "very",
  "some", "many", "much", "make", "made", "get", "got", "page",
  "unit", "chapter", "example", "examples", "figure", "table",
]);

const GENERIC_PHRASES = [
  "sample study material",
  "sample study notes",
  "study material",
  "study notes",
  "quick revision",
  "revision points",
  "revision notes",
  "prepared testing",
  "upload text extraction",
  "gapfinder",
  "table of contents",
  "contents",
  "references",
  "bibliography",
  "acknowledgement",
  "acknowledgments",
  "conclusion",
  "introduction",
  "learning objectives",
  "important questions",
  "short answer questions",
  "long answer questions",
];

const DOMAIN_ALIASES: Record<string, string> = {
  "rdf": "Resource Description Framework (RDF)",
  "resource description framework": "Resource Description Framework (RDF)",
  "owl": "Web Ontology Language (OWL)",
  "web ontology language": "Web Ontology Language (OWL)",
  "uri": "Uniform Resource Identifier (URI)",
  "uniform resource identifier": "Uniform Resource Identifier (URI)",
  "url": "Uniform Resource Locator (URL)",
  "uniform resource locator": "Uniform Resource Locator (URL)",
  "xml": "XML Technologies",
  "sparql": "SPARQL Query Language",
  "semantic web": "Semantic Web",
  "topic maps": "Topic Maps",
  "ontology spectrum": "Ontology Spectrum",
  "ontologies": "Ontologies",
  "ontology": "Ontologies",
  "semantic search": "Semantic Search",
  "web search agents": "Web Search Agents",
  "pragmatic meaning": "Pragmatics",
  "pragmatics": "Pragmatics",
  "semantics": "Semantics",
};

function normalizeText(text: string): string {
  return text
    .replace(/\r/g, "\n")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n");
}

function isGenericHeading(phrase: string): boolean {
  const normalized = phrase
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) return true;

  if (
    GENERIC_PHRASES.some(
      (generic) =>
        normalized === generic ||
        normalized.startsWith(`${generic} `)
    )
  ) {
    return true;
  }

  // Filter short page labels and phrases that mostly describe a document.
  const words = normalized.split(" ");

  if (
    words.length <= 2 &&
    words.every((word) =>
      ["unit", "page", "chapter", "section", "sample", "notes"].includes(word)
    )
  ) {
    return true;
  }

  return false;
}

function canonicalTopic(phrase: string): string {
  const key = phrase.toLowerCase().replace(/\s+/g, " ").trim();

  if (DOMAIN_ALIASES[key]) {
    return DOMAIN_ALIASES[key];
  }

  return phrase
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .trim();
}

function detectTopics(text: string) {
  const normalizedText = normalizeText(text);

  const phrases = normalizedText
    .split(/[\n.!?;:|]+/)
    .map((line) => line.trim())
    .filter((line) => line.length >= 3 && line.length <= 180);

  const counts = new Map<string, number>();

  for (const phrase of phrases) {
    if (isGenericHeading(phrase)) continue;

    const words =
      phrase.match(/[A-Za-z][A-Za-z0-9+#.-]*/g) ?? [];

    const usefulWords = words.filter((word) => {
      const lower = word.toLowerCase();

      return (
        lower.length > 2 &&
        !STOP_WORDS.has(lower) &&
        !/^\d+$/.test(lower)
      );
    });

    if (usefulWords.length === 0) continue;

    // Keep meaningful short phrases rather than creating long fragments.
    const candidate = usefulWords.slice(0, 6).join(" ");
    if (candidate.length < 4 || isGenericHeading(candidate)) continue;

    const topic = canonicalTopic(candidate);
    const key = topic.toLowerCase();

    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  // Boost recognized domain concepts when they occur in the source.
  const searchableText = normalizedText.toLowerCase();

  for (const [alias, topic] of Object.entries(DOMAIN_ALIASES)) {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const matches = searchableText.match(
      new RegExp(`\\b${escaped}\\b`, "g")
    );

    if (matches && matches.length > 0) {
      const key = topic.toLowerCase();
      counts.set(key, (counts.get(key) ?? 0) + matches.length);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0]);
    })
    .slice(0, 15)
    .map(([topic, occurrences]) => ({
      topic,
      occurrences,
    }));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const text = body?.text;

    if (typeof text !== "string" || text.trim().length < 20) {
      return NextResponse.json(
        {
          error:
            "Please provide at least 20 characters of extracted study text.",
        },
        { status: 400 }
      );
    }

    const topics = detectTopics(text);

    return NextResponse.json({
      topics,
      totalTopics: topics.length,
      method: "improved-keyword-based",
      message:
        "These are candidate topics identified using text patterns and recognized academic terms. Review them against your syllabus.",
    });
  } catch (error) {
    console.error("Topic analysis failed:", error);

    return NextResponse.json(
      { error: "Unable to analyze the supplied text." },
      { status: 400 }
    );
  }
}

