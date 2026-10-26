
import { NextResponse } from "next/server";

type Question = {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  type: "concept" | "comparison" | "application" | "reasoning" | "fill_blank";
};

type Concept = {
  term: string;
  definition: string;
  wrongOptions: string[];
  keywords: string[];
};

const CONCEPTS: Concept[] = [
  {
    term: "Semantic Web",
    definition:
      "an extension of the Web that adds structured meaning to data so computers can interpret and connect information",
    wrongOptions: [
      "a system used only to format web pages",
      "a network designed only for sending email",
      "a method for storing images without descriptions",
    ],
    keywords: ["semantic web", "structured meaning", "machine-readable"],
  },
  {
    term: "Ontology",
    definition:
      "a formal representation of concepts, properties, and relationships within a domain",
    wrongOptions: [
      "a list of website addresses without relationships",
      "a visual design for arranging web pages",
      "a technique for compressing image files",
    ],
    keywords: ["ontology", "ontologies", "concepts and relationships"],
  },
  {
    term: "Knowledge graph",
    definition:
      "a representation of entities and the relationships connecting them",
    wrongOptions: [
      "a collection of unrelated images",
      "a list of passwords stored by a browser",
      "a style sheet used to design a website",
    ],
    keywords: ["knowledge graph", "knowledge graphs", "entities and relationships"],
  },
  {
    term: "Metadata",
    definition:
      "data that describes other data and helps people and systems organize resources",
    wrongOptions: [
      "data that must always be hidden from users",
      "a programming language for web layouts",
      "a network connection between computers",
    ],
    keywords: ["metadata", "describes other data", "describe resources"],
  },
  {
    term: "RDF",
    definition:
      "a framework for representing information as subject-predicate-object statements",
    wrongOptions: [
      "a protocol used only to transfer video",
      "a format for styling HTML headings",
      "a search ranking method based only on page length",
    ],
    keywords: ["rdf", "subject-predicate-object", "triples"],
  },
  {
    term: "SPARQL",
    definition:
      "a query language used to retrieve and manipulate data stored as RDF",
    wrongOptions: [
      "a language for styling web page colors",
      "a tool used only to extract text from PDFs",
      "a file format for audio recordings",
    ],
    keywords: ["sparql", "query language", "rdf data"],
  },
  {
    term: "Web search agents",
    definition:
      "software agents that help search for information and resources on the Web",
    wrongOptions: [
      "hardware devices that only print web pages",
      "programs that exclusively edit photographs",
      "databases that cannot retrieve information",
    ],
    keywords: ["web search agents", "search agents"],
  },
  {
    term: "Topic maps",
    definition:
      "a way to represent and navigate topics and the relationships between them",
    wrongOptions: [
      "a technique for encrypting network traffic",
      "a tool used only to crop images",
      "a method for measuring computer temperature",
    ],
    keywords: ["topic maps", "topic map", "topics and relationships"],
  },
];

const STOP_WORDS = new Set(
  `about after again also all and are because been before being both but can
  could did does doing down each for from further had has have having here
  how into its just more most other our out over same should some such than
  that the their them then there these they this those through too under very
  was were what when where which while who will with would your sample material
  important study unit page introduction conclusion general example notes official
  based designed primarily people read`.split(/\s+/)
);

function shuffle<T>(items: T[]): T[] {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function hasEvidence(text: string, concept: Concept): boolean {
  const lower = text.toLowerCase();
  return concept.keywords.some((keyword) =>
    lower.includes(keyword.toLowerCase())
  );
}

// Always keep the correct answer in the options.
function makeOptions(
  answer: string,
  wrongOptions: string[]
): string[] {
  const uniqueWrongOptions = [
    ...new Set(
      wrongOptions.filter(
        (option) => option.trim().toLowerCase() !== answer.trim().toLowerCase()
      )
    ),
  ];

  return shuffle([
    answer,
    ...shuffle(uniqueWrongOptions).slice(0, 3),
  ]);
}

function splitSentences(text: string): string[] {
  return text
    .replace(/\r/g, "\n")
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => sentence.replace(/^[\s\d.)\-:]+/, "").trim())
    .filter(
      (sentence) =>
        sentence.length >= 45 &&
        sentence.length <= 500 &&
        sentence.split(/\s+/).length >= 8 &&
        !/^(unit|page|sample study material|important note|table of contents)\b/i.test(
          sentence
        )
    );
}

function generateQuestions(text: string): Question[] {
  const lower = text.toLowerCase();
  const sentences = splitSentences(text);
  const questions: Question[] = [];
  const used = new Set<string>();

  // 1. Concept questions grounded in the uploaded study text.
  for (const concept of CONCEPTS) {
    if (questions.length >= 3) break;
    if (!hasEvidence(text, concept)) continue;

    questions.push({
      type: "concept",
      question: `Which option best describes ${concept.term}?`,
      options: makeOptions(concept.definition, concept.wrongOptions),
      answer: concept.definition,
      explanation: `${concept.term}: ${concept.definition}.`,
    });

    used.add(concept.term);
  }

  // 2. Comparison question.
  if (
    questions.length < 6 &&
    lower.includes("traditional web") &&
    lower.includes("semantic web")
  ) {
    const answer =
      "The traditional Web mainly links documents, while the Semantic Web adds structured meaning that helps computers interpret data.";

    questions.push({
      type: "comparison",
      question:
        "What is a key difference between the traditional Web and the Semantic Web?",
      options: makeOptions(answer, [
        "Both are designed only for styling web pages.",
        "The traditional Web interprets all data automatically, but the Semantic Web cannot.",
        "The Semantic Web removes relationships and descriptions from data.",
      ]),
      answer,
      explanation:
        "The Semantic Web adds structured meaning to data, helping computers interpret relationships and information.",
    });
  }

  // 3. Application questions.
  for (const concept of CONCEPTS) {
    if (questions.length >= 8) break;
    if (used.has(concept.term) || !hasEvidence(text, concept)) continue;

    let task = "make Web data more meaningful to computers";

    switch (concept.term) {
      case "Ontology":
        task = "formally define concepts and relationships within a domain";
        break;
      case "Knowledge graph":
        task = "represent entities and the relationships connecting them";
        break;
      case "Metadata":
        task = "describe data and help organize resources";
        break;
      case "RDF":
        task = "represent information as subject-predicate-object statements";
        break;
      case "SPARQL":
        task = "query information stored as RDF data";
        break;
      case "Web search agents":
        task = "help locate relevant information on the Web";
        break;
      case "Topic maps":
        task = "represent and navigate topics and their relationships";
        break;
    }

    const otherConcepts = CONCEPTS
      .filter((item) => item.term !== concept.term)
      .map((item) => item.term);

    questions.push({
      type: "application",
      question: `A system needs to ${task}. Which concept best fits this task?`,
      options: makeOptions(concept.term, [
        ...otherConcepts,
        "Cascading Style Sheets",
      ]),
      answer: concept.term,
      explanation: `${concept.term} is associated with this task in the study material.`,
    });

    used.add(concept.term);
  }

  // 4. Reasoning question when the notes support it.
  if (
    questions.length < 9 &&
    /data integration|interoperability|shared vocabularies/i.test(text)
  ) {
    const answer =
      "They help systems interpret information consistently and combine data from different sources.";

    questions.push({
      type: "reasoning",
      question:
        "Why can shared vocabularies and structured descriptions help data integration?",
      options: makeOptions(answer, [
        "They guarantee that all data is private without any security controls.",
        "They remove the need to describe data.",
        "They prevent computers from connecting information across sources.",
      ]),
      answer,
      explanation:
        "Shared vocabularies give systems a more consistent way to interpret and combine information.",
    });
  }

  // 5. Fill-in-the-blank questions only for known terms found in a source sentence.
  const usedBlankTerms = new Set<string>();

  for (const sentence of sentences) {
    if (questions.length >= 10) break;

    const matchingConcept = CONCEPTS.find(
      (concept) =>
        !usedBlankTerms.has(concept.term.toLowerCase()) &&
        new RegExp(
          `\\b${concept.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
          "i"
        ).test(sentence)
    );

    if (!matchingConcept) continue;

    const escapedTerm = matchingConcept.term.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

    const blanked = sentence.replace(
      new RegExp(`\\b${escapedTerm}\\b`, "i"),
      "_____"
    );

    const otherTerms = CONCEPTS
      .filter((concept) => concept.term !== matchingConcept.term)
      .map((concept) => concept.term);

    questions.push({
      type: "fill_blank",
      question: `Complete the statement from your notes: "${blanked}"`,
      options: makeOptions(matchingConcept.term, otherTerms),
      answer: matchingConcept.term,
      explanation: `Review the source sentence: "${sentence}"`,
    });

    usedBlankTerms.add(matchingConcept.term.toLowerCase());
  }

  return questions.slice(0, 10);
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

    const questions = generateQuestions(text.trim());

    if (questions.length === 0) {
      return NextResponse.json(
        {
          error:
            "Not enough usable study content was found. Paste explanatory notes containing definitions, comparisons, applications, or reasoning.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      questions,
      totalQuestions: questions.length,
      method: "mixed-format study-text prototype",
    });
  } catch (error) {
    console.error("Quiz generation failed:", error);

    return NextResponse.json(
      { error: "Unable to generate the quiz. Please try again." },
      { status: 400 }
    );
  }
}
