
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <nav className="flex items-center justify-between px-8 py-6">
        <h1 className="text-2xl font-bold text-cyan-400">
          GapFinder AI
        </h1>
        <span className="text-sm text-slate-300">
          Learn smarter, not harder.
        </span>
      </nav>

      <section className="mx-auto max-w-5xl px-6 py-24 text-center">
        <p className="mb-5 inline-block rounded-full border border-cyan-400/30 px-4 py-2 text-sm text-cyan-300">
          Your personal AI study companion
        </p>

        <h2 className="text-4xl font-bold leading-tight md:text-6xl">
          Discover what you know.
          <br />
          <span className="text-cyan-400">
            Find what you don&apos;t.
          </span>
        </h2>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-300">
          Upload your syllabus, notes, textbooks and past question
          papers. GapFinder AI identifies your knowledge gaps and
          creates a personalized revision plan just for you.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href="/dashboard"
            className="rounded-xl bg-cyan-400 px-7 py-4 font-semibold text-slate-950 hover:bg-cyan-300"
          >
            Find My Knowledge Gaps →
          </Link>

          <a
            href="#how-it-works"
            className="rounded-xl border border-slate-600 px-7 py-4 font-semibold hover:bg-slate-800"
          >
            How It Works
          </a>
        </div>
      </section>

      <section
        id="how-it-works"
        className="mx-auto grid max-w-5xl gap-6 px-6 pb-24 md:grid-cols-3"
      >
        <Feature
          number="01"
          title="Upload Your Materials"
          description="Add your syllabus, notes and previous exam papers."
        />
        <Feature
          number="02"
          title="Discover Your Gaps"
          description="Take targeted assessments to identify weak topics."
        />
        <Feature
          number="03"
          title="Revise With a Plan"
          description="Get a personalized study plan based on your results."
        />
      </section>
    </main>
  );
}

function Feature({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <p className="text-sm font-semibold text-cyan-400">{number}</p>
      <h3 className="mt-4 text-xl font-bold">{title}</h3>
      <p className="mt-3 leading-7 text-slate-300">{description}</p>
    </article>
  );
}

