
"use client";

import { useState } from "react";

type QuizQuestion = {
  question: string;
  options: string[];
  answer: string;
  explanation?: string;
  type?: string;
};

type QuizReport = {
  score: number;
  total: number;
  percentage: number;
  missedQuestions: QuizQuestion[];
};

export default function QuizPage() {
  const [studyText, setStudyText] = useState("");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [report, setReport] = useState<QuizReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function generateQuiz() {
    if (studyText.trim().length < 20) {
      setError("Please paste at least 20 characters of your study material.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");
    setQuestions([]);
    setAnswers({});
    setReport(null);

    try {
      const response = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: studyText.trim(),
          numberOfQuestions: 10,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to generate the quiz.");
      }

      if (!Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error("No questions were generated. Please try different text.");
      }

      const validQuestions = data.questions.filter(
        (question: QuizQuestion) =>
          typeof question.question === "string" &&
          Array.isArray(question.options) &&
          question.options.length > 0 &&
          typeof question.answer === "string"
      );

      if (validQuestions.length === 0) {
        throw new Error("The generated questions have an unexpected format.");
      }

      setQuestions(validQuestions);
      setMessage(`${validQuestions.length} questions are ready. Good luck!`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while generating your quiz."
      );
    } finally {
      setLoading(false);
    }
  }

  function submitQuiz() {
    if (questions.length === 0) return;

    const unanswered = questions.length - Object.keys(answers).length;

    if (unanswered > 0) {
      setError(`Please answer all questions before submitting. ${unanswered} remaining.`);
      return;
    }

    let score = 0;

    const missedQuestions = questions.filter((question, index) => {
      const selected = answers[index]?.trim().toLowerCase();
      const correct = question.answer.trim().toLowerCase();

      if (selected === correct) {
        score++;
        return false;
      }

      return true;
    });

    setReport({
      score,
      total: questions.length,
      percentage: Math.round((score / questions.length) * 100),
      missedQuestions,
    });

    setError("");
    setMessage("Quiz submitted successfully!");
  }

  function resetQuiz() {
    setQuestions([]);
    setAnswers({});
    setReport(null);
    setError("");
    setMessage("");
  }

  return (
    <main className="min-h-screen bg-[#f7f6ff] text-slate-800">
      <header className="border-b border-violet-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5">
          <a href="/dashboard" className="text-lg font-bold text-violet-700">
            GapFinder AI
          </a>
          <a
            href="/dashboard"
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-violet-50"
          >
            ← Dashboard
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-5 py-8 md:py-12">
        <section className="rounded-3xl bg-gradient-to-r from-violet-700 to-indigo-600 p-7 text-white shadow-lg md:p-9">
          <p className="text-sm font-semibold uppercase tracking-widest text-violet-200">
            SMART PRACTICE
          </p>
          <h1 className="mt-3 text-3xl font-bold md:text-4xl">
            Test what you know.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-violet-100 md:text-base">
            Practise with your own study material, check your understanding,
            and identify concepts that need more revision.
          </p>
        </section>

        <section className="mt-7 rounded-2xl border border-violet-100 bg-white p-6 shadow-sm md:p-8">
          <h2 className="text-xl font-bold">Create your practice quiz</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Copy the extracted text from your Dashboard or paste your own study notes.
          </p>

          <label
            htmlFor="study-material"
            className="mt-6 block text-sm font-semibold"
          >
            Study material
          </label>

          <textarea
            id="study-material"
            value={studyText}
            onChange={(event) => setStudyText(event.target.value)}
            placeholder="Paste your PDF text or study notes here..."
            rows={10}
            maxLength={100000}
            disabled={loading}
            className="mt-2 w-full rounded-xl border border-slate-200 p-4 text-sm leading-6 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100 disabled:bg-slate-50"
          />

          <div className="mt-2 flex justify-between gap-3 text-xs text-slate-400">
            <span>{studyText.length.toLocaleString()} characters</span>
            <span>Maximum 100,000</span>
          </div>

          <button
            type="button"
            onClick={generateQuiz}
            disabled={loading}
            className="mt-5 w-full rounded-xl bg-violet-600 px-6 py-3.5 font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {loading ? "Generating questions..." : "Generate practice quiz →"}
          </button>

          {message && (
            <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
              {message}
            </p>
          )}

          {error && (
            <p role="alert" className="mt-4 break-words rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
              {error}
            </p>
          )}
        </section>

        {questions.length > 0 && !report && (
          <section className="mt-7 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-bold">Your quiz</h2>
              <span className="rounded-full bg-violet-100 px-4 py-2 text-sm font-semibold text-violet-700">
                {Object.keys(answers).length}/{questions.length} answered
              </span>
            </div>

            {questions.map((question, index) => (
              <article
                key={`${index}-${question.question}`}
                className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm md:p-7"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">
                  Question {index + 1}
                  {question.type ? ` · ${question.type.replace(/_/g, " ")}` : ""}
                </p>

                <h3 className="mt-3 font-semibold leading-7">
                  {question.question}
                </h3>

                <div className="mt-5 space-y-3">
                  {question.options.map((option, optionIndex) => {
                    const selected = answers[index] === option;

                    return (
                      <label
                        key={`${optionIndex}-${option}`}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                          selected
                            ? "border-violet-400 bg-violet-50"
                            : "border-slate-200 hover:border-violet-200 hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${index}`}
                          value={option}
                          checked={selected}
                          onChange={() =>
                            setAnswers((current) => ({
                              ...current,
                              [index]: option,
                            }))
                          }
                          className="mt-1 accent-violet-600"
                        />
                        <span className="text-sm leading-6">{option}</span>
                      </label>
                    );
                  })}
                </div>
              </article>
            ))}

            <button
              type="button"
              onClick={submitQuiz}
              className="w-full rounded-xl bg-indigo-600 px-6 py-4 font-semibold text-white transition hover:bg-indigo-700"
            >
              Submit answers & view knowledge-gap report
            </button>
          </section>
        )}

        {report && (
          <section className="mt-7 space-y-6">
            <div className="rounded-2xl border border-violet-100 bg-white p-7 text-center shadow-sm md:p-10">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-3xl text-violet-700">
                ✓
              </span>
              <h2 className="mt-4 text-2xl font-bold">Your knowledge-gap report</h2>
              <p className="mt-2 text-sm text-slate-500">
                Use the questions you missed to guide your next revision session.
              </p>

              <p className="mt-6 text-5xl font-bold text-violet-700">
                {report.percentage}%
              </p>
              <p className="mt-2 text-sm text-slate-500">Quiz score</p>

              <div className="mt-6 grid grid-cols-2 gap-4 text-left">
                <div className="rounded-xl bg-emerald-50 p-4">
                  <p className="text-sm text-emerald-700">Correct answers</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-800">
                    {report.score}
                  </p>
                </div>
                <div className="rounded-xl bg-rose-50 p-4">
                  <p className="text-sm text-rose-700">Needs revision</p>
                  <p className="mt-1 text-2xl font-bold text-rose-800">
                    {report.missedQuestions.length}
                  </p>
                </div>
              </div>

              <p className="mt-5 text-sm leading-6 text-slate-600">
                {report.percentage >= 80
                  ? "Great work! Review the questions you missed to strengthen your understanding."
                  : report.percentage >= 50
                    ? "You have a good starting point. Focus your next revision session on the missed questions."
                    : "Spend some time reviewing the study material, then try another practice quiz."}
              </p>
            </div>

            {report.missedQuestions.length > 0 ? (
              <div className="rounded-2xl border border-violet-100 bg-white p-6 shadow-sm md:p-8">
                <h3 className="text-xl font-bold">Questions to revise</h3>
                <div className="mt-5 space-y-5">
                  {report.missedQuestions.map((question) => {
                    const index = questions.indexOf(question);

                    return (
                      <article
                        key={index}
                        className="rounded-xl border border-rose-100 bg-rose-50/40 p-4"
                      >
                        <p className="font-semibold leading-6">
                          {question.question}
                        </p>
                        <p className="mt-3 text-sm text-slate-600">
                          <span className="font-semibold">Your answer: </span>
                          {answers[index]}
                        </p>
                        <p className="mt-2 text-sm text-emerald-800">
                          <span className="font-semibold">Expected answer: </span>
                          {question.answer}
                        </p>
                        {question.explanation && (
                          <p className="mt-3 text-sm leading-6 text-slate-600">
                            <span className="font-semibold">Explanation: </span>
                            {question.explanation}
                          </p>
                        )}
                      </article>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-emerald-50 p-6 text-center text-emerald-800">
                Excellent! You answered every question correctly.
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={resetQuiz}
                className="rounded-xl bg-violet-600 px-5 py-3.5 font-semibold text-white hover:bg-violet-700"
              >
                Try another quiz
              </button>
              <a
                href="/topics"
                className="rounded-xl border border-violet-200 bg-white px-5 py-3.5 text-center font-semibold text-violet-700 hover:bg-violet-50"
              >
                Analyse topics →
              </a>
            </div>
          </section>
        )}

        <footer className="py-8 text-center text-sm text-slate-400">
          GapFinder AI · Learn smarter, not harder.
        </footer>
      </div>
    </main>
  );
}
