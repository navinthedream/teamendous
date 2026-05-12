import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0f1a0f] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Subtle background texture */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #a8c89a 1px, transparent 0)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Decorative circles */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-[#1e3a1e] opacity-40 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-[#1e3a1e] opacity-30 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 text-center max-w-xl">
        <p className="text-[#a8c89a] tracking-[0.4em] uppercase text-xs font-semibold mb-6">
          Toronto's Finest
        </p>

        <h1
          className="text-white text-7xl font-bold mb-4 leading-none"
          style={{ fontFamily: "'Georgia', serif", letterSpacing: "-0.03em" }}
        >
          Team<span className="text-[#a8c89a]">endous</span>
        </h1>

        <div className="w-12 h-px bg-[#a8c89a] mx-auto my-6 opacity-60" />

        <p className="text-[#6b8f63] text-lg leading-relaxed mb-10">
          An experience worth gathering for. Reserve your table and let us take care of the rest.
        </p>

        <Link
          href="/booking"
          className="inline-block bg-[#a8c89a] text-[#0f1a0f] font-semibold text-sm tracking-widest uppercase px-10 py-4 rounded-full hover:bg-white transition-colors duration-300"
        >
          Reserve a Table
        </Link>
      </div>

      {/* Footer */}
      <p className="absolute bottom-8 text-[#2d4d2d] text-xs tracking-widest uppercase">
        Toronto, Ontario
      </p>
    </main>
  );
}
