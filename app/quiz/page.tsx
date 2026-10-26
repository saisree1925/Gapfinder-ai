"use client";

import { useState } from "react";

type Question = {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
};

export default function QuizPage() {
  const [text, setText] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function generateQuiz() {
    setLoading(true);
    setMessage("");
    setQuestions([]);
    setAnswers({});
    setSubmitted(false);

    try {
      const response = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not generate quiz.");
      }

      setQuestions(result.questions);
      setMessage(`Created ${result.questions.length} practice questions.`);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  const score = questions.filter(
    (question, index) => answers[index] === question.answer
  ).length;

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-white">
      <div className="mx-auto max-w-3xl">
        <a href="/topics" className="text-cyan-400 hover:text-cyan-300">
          ← Back to Topic Analysis
        </a>

        <h1 className="mt-6 text-3xl font-bold">Practice Quiz</h1>
        <p className="mt-3 text-slate-400">
          Paste text from your study material to create practice questions.
        </p>

        <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-900 p-5">
          <label htmlFor="study-text" className="mb-3 block font-medium">
            Study material
          </label>

          <textarea
            id="study-text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Paste the text extracted from your PDF here..."
            rows={8}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 p-4 text-white outline-none focus:border-cyan-400"
          />

          <button
            onClick={generateQuiz}
            disabled={loading || text.trim().length < 50}
            className="mt-4 w-full rounded-lg bg-cyan-400 px-5 py-3 font-bold text-slate-950 hover:bg-cyan-300 disabled:opacity-50"
          >
            {loading ? "Generating..." : "Generate Practice Quiz"}
          </button>

          {message && (
            <p className="mt-4 text-sm text-slate-300">{message}</p>
          )}
        </div>

        {questions.length > 0 && (
          <section className="mt-8 space-y-5">
            {questions.map((question, index) => (
              <div
                key={index}
                className="rounded-xl border border-slate-700 bg-slate-900 p-5"
              >
                <h2 className="font-semibold">
                  {index + 1}. {question.question}
                </h2>

                <div className="mt-4 space-y-3">
                  {question.options.map((option) => (
                    <label
                      key={option}
                      className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-700 p-3 hover:bg-slate-800"
                    >
                      <input
                        type="radio"
                        name={`question-${index}`}
                        value={option}
                        checked={answers[index] === option}
                        disabled={submitted}
                        onChange={() =>
                          setAnswers((previous) => ({
                            ...previous,
                            [index]: option,
                          }))
                        }
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>

                {submitted && (
                  <div className="mt-4 rounded-lg bg-slate-800 p-3 text-sm">
                    <p
                      className={
                        answers[index] === question.answer
                          ? "text-green-400"
                          : "text-amber-300"
                      }
                    >
                      Correct answer: {question.answer}
                    </p>
                    <p className="mt-2 text-slate-300">
                      {question.explanation}
                    </p>
                  </div>
                )}
              </div>
            ))}

            {!submitted ? (
              <button
                onClick={() => setSubmitted(true)}
                className="w-full rounded-lg bg-green-500 px-5 py-3 font-bold text-white hover:bg-green-400"
              >
                Submit Answers
              </button>
            ) : (
              <div className="rounded-xl border border-slate-700 bg-slate-900 p-6 text-center">
                <h2 className="text-2xl font-bold">
                  Your Score: {score}/{questions.length}
                </h2>
                <p className="mt-2 text-slate-400">
                  Review the explanations above to reinforce your learning.
                </p>
                <button
                  onClick={() => {
                    setQuestions([]);
                    setAnswers({});
                    setSubmitted(false);
                    setMessage("");
                  }}
                  className="mt-4 rounded-lg bg-cyan-400 px-5 py-3 font-bold text-slate-950"
                >
                  Try Another Quiz
                </button>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}