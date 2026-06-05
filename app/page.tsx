"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

const content = {
  en: {
    logo: "TEAMENDOUS",
    logoSub: "六时茶茗",
    tagline: "TEA FOR EVERY MOMENT",
    nav: ["TOP", "CONCEPT", "MENU", "TEA COLLECTION", "RESERVATIONS", "LOCATION"],
    conceptTitle: "CONCEPT",
    conceptSub: "BRAND PHILOSOPHY",
    paragraphs: [
      "TEAMENDOUS draws inspiration from the ancient Chinese practice of dividing the day into six periods, using tea as a medium to honor every moment.",
      "We believe that a fine cup of tea embodies nature's gift — from garden to cup, each leaf carries the memory of mountains, rain, and dew.",
      "Rooted in Eastern aesthetics and fused with contemporary design, TEAMENDOUS is dedicated to presenting every tea connoisseur with a sensory journey that transcends time and space.",
      "From the first light of dawn to the rise of the moon, let every cup of tea become life's most beautiful ritual.",
    ],
  },
  zh: {
    logo: "TEAMENDOUS",
    logoSub: "六时茶茗",
    tagline: "茶，敬每一刻时光",
    nav: ["首页", "理念", "菜单", "精选茶叶", "预约", "门店"],
    conceptTitle: "理念",
    conceptSub: "品牌理念",
    paragraphs: [
      "六时茶茗，取意古人将一日分为六时之理，以茶为媒，敬每一刻时光。",
      "我们相信，一杯好茶蕴含着自然的馈赠，从茶园到杯盏，每一片叶子都承载着山川雨露的记忆。",
      "以东方美学为根基，融合当代设计语言，六时茶茗致力于为每一位茶客呈现一场跨越时空的味觉旅程。",
      "从晨曦初露到月上枝头，让每一盏茶，成为生活中最美的仪式。",
    ],
  },
};

const NAV_HREFS = ["#top", "#concept", "#", "#", "/booking", "#"];

export default function Home() {
  const [lang, setLang] = useState<"en" | "zh">("en");
  const t = content[lang];

  return (
    <>
      {/* ── Section 1: Hero ─────────────────────────────────────────── */}
      <section id="top" className="relative w-screen h-screen overflow-hidden bg-black">

        {/* Background image */}
        <Image
          src="/hero.avif"
          alt=""
          fill
          priority
          className="object-cover"
        />

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Top left: Logo block */}
        <div className="absolute top-8 left-10 z-10 flex flex-col gap-1">
          <span
            className="text-white text-sm tracking-widest uppercase font-semibold"
            style={{ fontVariant: "small-caps" }}
          >
            {t.logo}
          </span>
          <span className="text-white/60 text-xs tracking-wide" style={{ fontFamily: "serif" }}>
            {t.logoSub}
          </span>
          {/* Teal leaf/teardrop icon */}
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg" className="mt-1">
            <path d="M4 0C4 0 0 3 0 5.5C0 6.88 1.79 8 4 8C6.21 8 8 6.88 8 5.5C8 3 4 0 4 0Z" fill="#4a9e8e" />
          </svg>
        </div>

        {/* Bottom left: Chinese vertical text + tagline */}
        <div className="absolute bottom-20 left-10 z-10">
          <div className="flex gap-4 mb-4">
            <div
              className="text-white text-2xl leading-snug tracking-widest"
              style={{ fontFamily: "serif", writingMode: "vertical-rl", textOrientation: "upright" }}
            >
              六时之间
            </div>
            <div
              className="text-white text-2xl leading-snug tracking-widest"
              style={{ fontFamily: "serif", writingMode: "vertical-rl", textOrientation: "upright" }}
            >
              一盏清茗
            </div>
          </div>
          <p className="text-[#4a9e8e] text-[10px] tracking-[0.3em] uppercase mb-3">
            {t.tagline}
          </p>
          <div className="w-12 h-px bg-white opacity-50" />
        </div>

      </section>

      {/* ── Section 2: Concept ──────────────────────────────────────── */}
      <section id="concept" className="relative w-screen h-screen overflow-hidden bg-black">

        {/* Background image */}
        <Image
          src="/concept.jpg"
          alt=""
          fill
          className="object-cover"
        />

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/60" />

        {/* Centered content */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center px-8 text-center pb-16">
          <h2
            className="text-white text-4xl md:text-5xl font-bold tracking-widest uppercase mb-4"
            style={{ fontFamily: "'Georgia', serif" }}
          >
            {t.conceptTitle}
          </h2>
          <p className="text-[#4a9e8e] text-[10px] tracking-[0.3em] uppercase mb-14">
            {t.conceptSub}
          </p>

          <div className="max-w-xl mx-auto space-y-8">
            {t.paragraphs.map((para, i) => (
              <p key={i} className="text-white text-sm leading-loose">
                {para}
              </p>
            ))}
          </div>
        </div>

      </section>

      {/* ── Fixed bottom nav bar ────────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between px-10 py-5 border-t border-white/10 bg-black/20 backdrop-blur-sm">
        {/* Left: nav links */}
        <div className="flex items-center gap-8">
          {t.nav.map((label, i) => {
            const href = NAV_HREFS[i];
            return href.startsWith("/") ? (
              <Link
                key={i}
                href={href}
                className="text-white/70 text-[10px] tracking-[0.2em] uppercase hover:text-white transition-colors duration-200"
              >
                {label}
              </Link>
            ) : (
              <a
                key={i}
                href={href}
                className="text-white/70 text-[10px] tracking-[0.2em] uppercase hover:text-white transition-colors duration-200"
              >
                {label}
              </a>
            );
          })}
        </div>

        {/* Right: language toggle */}
        <div className="flex items-center gap-2">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/70">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          <button
            onClick={() => setLang(lang === "en" ? "zh" : "en")}
            className="text-white text-xs tracking-widest hover:text-[#4a9e8e] transition-colors"
          >
            {lang === "en" ? "中" : "EN"}
          </button>
        </div>
      </nav>
    </>
  );
}
