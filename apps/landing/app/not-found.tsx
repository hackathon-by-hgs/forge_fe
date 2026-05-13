import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,77,0,0.2),transparent_42%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.04),transparent_55%)]" />

      <div className="section-container relative z-10 flex min-h-screen flex-col justify-center py-24">
        <p className="mb-6 text-[11px] font-bold uppercase tracking-[0.45em] text-[#FF4D00]">
          404 · PAGE NOT FOUND
        </p>
        <h1 className="max-w-4xl text-[clamp(3rem,9vw,7rem)] font-medium leading-[0.92] tracking-tight">
          This page doesn&apos;t exist, but Forge is still right here.
        </h1>
        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-white/55">
          The page you tried to reach isn&apos;t available. Head back to the landing page and continue from the top.
        </p>

        <div className="mt-12 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-3 bg-[#FF4D00] px-8 py-4 text-[12px] font-bold uppercase tracking-[0.2em] text-black transition-transform duration-300 hover:scale-[1.02]"
          >
            Back To Home
          </Link>
          <Link
            href="/#contact"
            className="inline-flex items-center justify-center gap-3 border border-white/15 bg-white/5 px-8 py-4 text-[12px] font-bold uppercase tracking-[0.2em] text-white transition-colors duration-300 hover:border-white/30 hover:bg-white/10"
          >
            Contact Forge
          </Link>
        </div>
      </div>
    </main>
  );
}
