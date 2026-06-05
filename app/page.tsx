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

const NAV_HREFS = ["#top", "#concept", "#menu", "#", "/booking", "#"];

// ---------------------------------------------------------------------------
// Menu data & types
// ---------------------------------------------------------------------------
type MenuItem = { name: string; price: number };
type Subgroup = { label: string; items: MenuItem[] };
type MenuCategory = {
  category: string;
  categoryZh: string;
  items?: MenuItem[];
  subgroups?: Subgroup[];
};

const MENU_DATA: MenuCategory[] = [
  {
    category: "Espresso & Coffee",
    categoryZh: "浓缩咖啡",
    items: [
      { name: "Espresso", price: 2.99 },
      { name: "Single Shot Espresso", price: 1.50 },
      { name: "Double Shots Espresso", price: 2.99 },
      { name: "Americano", price: 3.99 },
      { name: "Cappuccino", price: 5.49 },
      { name: "Coffee Latte", price: 5.49 },
      { name: "Vanilla Latte", price: 6.99 },
      { name: "Pumpkin Spice Latte", price: 6.99 },
      { name: "Hot Pumpkin Spice Latte", price: 6.99 },
      { name: "Iced Pumpkin Spice Latte", price: 6.99 },
      { name: "Coconut Espresso", price: 6.99 },
      { name: "Osmanthus Oolong Coffee Latte", price: 6.99 },
      { name: "Sicilian-inspired Citrus Espresso", price: 6.99 },
      { name: "Peachy Oolong Americano", price: 6.99 },
      { name: "Espresso Tonic", price: 6.99 },
    ],
  },
  {
    category: "Matcha",
    categoryZh: "抹茶",
    subgroups: [
      {
        label: "Hot",
        items: [
          { name: "Hot Matcha Latte", price: 7.79 },
          { name: "Hot Black Sesame Matcha", price: 7.79 },
          { name: "Coconut Matcha", price: 7.79 },
        ],
      },
      {
        label: "Iced",
        items: [
          { name: "Iced Matcha Latte", price: 7.79 },
          { name: "Iced Strawberry Matcha Latte", price: 7.79 },
          { name: "Iced Coconut Matcha", price: 7.79 },
          { name: "Iced Ube Matcha Latte", price: 6.99 },
          { name: "Iced Black Sesame Matcha", price: 7.79 },
          { name: "Iced Matcha Cloud", price: 7.79 },
          { name: "Matcha Latte", price: 7.79 },
          { name: "Black Sesame Matcha", price: 7.79 },
          { name: "Matcha Cloud", price: 6.99 },
          { name: "Matcha Yuzu", price: 7.79 },
          { name: "Matcha Tonic", price: 6.99 },
          { name: "Blueberry Yuzu Matcha Tonic", price: 7.79 },
          { name: "Iced Matcha Yuzu Fizz", price: 7.79 },
        ],
      },
    ],
  },
  {
    category: "Hojicha",
    categoryZh: "焙茶",
    subgroups: [
      {
        label: "Hot",
        items: [
          { name: "Hot Hojicha Latte", price: 7.79 },
          { name: "Hot Black Sesame Hojicha", price: 7.79 },
          { name: "Hot Pumpkin Spice Hojicha Latte", price: 6.99 },
        ],
      },
      {
        label: "Iced",
        items: [
          { name: "Iced Hojicha Latte", price: 7.79 },
          { name: "Iced Black Sesame Hojicha", price: 7.79 },
          { name: "Iced Pumpkin Spice Hojicha Latte", price: 6.99 },
          { name: "Black Sesame Hojicha", price: 7.79 },
        ],
      },
    ],
  },
  {
    category: "Oolong & Green Tea",
    categoryZh: "乌龙与绿茶",
    items: [
      { name: "Iced Orange Peachy Oolong", price: 6.99 },
      { name: "Hot Orange Peachy Oolong", price: 6.99 },
      { name: "Iced Peachy Oolong Milk Tea", price: 6.99 },
      { name: "Osmanthus Oolong Cloud", price: 6.99 },
      { name: "Iced Yuzu Passionfruit Green Tea", price: 6.99 },
      { name: "Hot Yuzu Passionfruit Green Tea", price: 6.99 },
      { name: "Hot Jasmine Tropical Infusion", price: 6.99 },
    ],
  },
  {
    category: "Specialty Lattes & Others",
    categoryZh: "特色拿铁",
    items: [
      { name: "Black Sesame Latte", price: 6.99 },
      { name: "Blueberry Cloud Latte", price: 6.99 },
      { name: "Iced Ube Matcha Latte", price: 6.99 },
    ],
  },
  {
    category: "Pastries",
    categoryZh: "糕点",
    items: [
      { name: "Apple Pastry", price: 5.99 },
      { name: "Pear Pastry", price: 5.99 },
      { name: "Orange Pastry", price: 5.99 },
      { name: "Starlight Pastry", price: 5.99 },
      { name: "Flower Pastry", price: 5.99 },
      { name: "Magnolia Pastry", price: 5.99 },
      { name: "Peanut Pastry", price: 5.99 },
      { name: "Sesame Pocket", price: 2.99 },
    ],
  },
  {
    category: "Desserts & Sweets",
    categoryZh: "甜点",
    items: [
      { name: "Matcha Basque Cheesecake", price: 6.99 },
      { name: "Egg Tart", price: 5.99 },
      { name: "Dubai Chocolate Mochi", price: 5.99 },
      { name: "Tea Chocolate", price: 39.00 },
    ],
  },
  {
    category: "Merchandise & Products",
    categoryZh: "周边产品",
    items: [
      { name: "Hojicha Powder 80g", price: 30.00 },
      { name: "Oolong Tea Lover 5g x 8 bags", price: 52.00 },
      { name: "Yashi Flavour Oolong 50g", price: 49.00 },
      { name: "Teamendous Bamboo Thermos Bottle", price: 29.00 },
      { name: "Tea Ware Pouch", price: 25.00 },
    ],
  },
];

// ---------------------------------------------------------------------------
// MenuSection component
// ---------------------------------------------------------------------------
function MenuSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

  const itemCount = (cat: MenuCategory) =>
    cat.items?.length ?? cat.subgroups?.reduce((s, g) => s + g.items.length, 0) ?? 0;

  return (
    <section id="menu" className="w-screen min-h-screen bg-black py-24 pb-32">
      <p className="text-[#4a9e8e] text-xs tracking-[0.3em] text-center mb-20">茶饮菜单</p>

      <div className="max-w-3xl mx-auto px-8">
        {MENU_DATA.map((cat, i) => {
          const isOpen = openIndex === i;
          return (
            <div key={cat.category} className="border-b border-[#1a1a1a]">
              {/* Category row */}
              <button
                onClick={() => toggle(i)}
                className="w-full flex items-center justify-between py-5 text-left group"
              >
                <div className="flex items-baseline gap-3">
                  <span className="text-white text-sm tracking-widest uppercase">
                    {cat.category}
                  </span>
                  <span className="text-[#444444] text-xs" style={{ fontFamily: "serif" }}>
                    {cat.categoryZh}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[#444444] text-[10px] tracking-widest uppercase">
                  <span>{itemCount(cat)} items</span>
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 10 10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                  >
                    <path d="M2 3.5l3 3 3-3" />
                  </svg>
                </div>
              </button>

              {/* Expanded items */}
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="pb-4">
                  {/* Flat items list */}
                  {cat.items?.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between py-3 border-b border-[#111111]"
                    >
                      <span className="text-white/80 text-xs">{item.name}</span>
                      <span className="text-[#666666] text-xs">${item.price.toFixed(2)}</span>
                    </div>
                  ))}

                  {/* Subgrouped items */}
                  {cat.subgroups?.map((sg) => (
                    <div key={sg.label}>
                      <p className="text-[#4a9e8e] text-[10px] tracking-[0.25em] uppercase pt-5 pb-2">
                        {sg.label}
                      </p>
                      {sg.items.map((item) => (
                        <div
                          key={item.name}
                          className="flex items-center justify-between py-3 border-b border-[#111111]"
                        >
                          <span className="text-white/80 text-xs">{item.name}</span>
                          <span className="text-[#666666] text-xs">${item.price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

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

      {/* ── Section 3: Menu ─────────────────────────────────────────── */}
      <MenuSection />

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
