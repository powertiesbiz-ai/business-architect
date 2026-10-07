export default function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <div className="min-h-screen bg-ink-50">
      <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-blueprint-600">
          Business Architecture &amp; Transformation
        </p>
        <h1 className="font-serif text-4xl font-bold leading-tight text-ink-900 md:text-6xl">
          Build the Business<br />You Actually Want
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-600">
          Most owners don&apos;t have a business — they have a job they can&apos;t quit.
          This tool designs the company you want: the organization, the people, the systems,
          the economics, and the exact roadmap to get there.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-ink-200 bg-white p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-blueprint-600">Truth</p>
            <p className="mt-2 text-ink-700">An honest diagnosis of where your business really stands — hats, bottlenecks, and owner dependency.</p>
          </div>
          <div className="rounded-xl border border-ink-200 bg-white p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-blueprint-600">Grow</p>
            <p className="mt-2 text-ink-700">The future-state design: org structure, positions, financial model, and hiring plan to get there.</p>
          </div>
          <div className="rounded-xl border border-ink-200 bg-white p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-blueprint-600">Legacy</p>
            <p className="mt-2 text-ink-700">Systems, SOPs, and a roadmap that make the business run without you — an asset, not a job.</p>
          </div>
        </div>

        <div className="mt-12 rounded-xl bg-ink-900 p-8 text-white">
          <p className="font-serif text-xl italic leading-relaxed">
            &ldquo;Tell us where your business is, tell us where you want it to go, and we&apos;ll design
            the organization, people, systems, economics, and roadmap required to get there.&rdquo;
          </p>
        </div>

        <button
          onClick={onStart}
          className="mt-10 w-full rounded-lg bg-blueprint-600 px-8 py-4 text-lg font-semibold text-white hover:bg-blueprint-700 md:w-auto"
        >
          Start Your Blueprint →
        </button>
        <p className="mt-4 text-sm text-ink-500">Takes about 10 minutes. Your answers never leave your browser.</p>
      </div>
    </div>
  );
}
