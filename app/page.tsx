"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { ReservationsSection } from "./booking/page";

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
    locationTitle: "Location",
    locationSub: "Our Store",
    businessHours: "Business Hours",
    googleMaps: "Google Maps",
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
    locationTitle: "门店",
    locationSub: "我们的店铺",
    businessHours: "营业时间",
    googleMaps: "谷歌地图",
  },
};

const NAV_HREFS = ["#top", "#concept", "#menu", "#tea-collection", "#reservations", "#location"];

// ---------------------------------------------------------------------------
// Menu data & types
// ---------------------------------------------------------------------------
type MenuItem = { name: string; nameZh: string; price: number };
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
      { name: "Espresso", nameZh: "浓缩咖啡", price: 2.99 },
      { name: "Single Shot Espresso", nameZh: "单份浓缩", price: 1.50 },
      { name: "Double Shots Espresso", nameZh: "双份浓缩", price: 2.99 },
      { name: "Americano", nameZh: "美式咖啡", price: 3.99 },
      { name: "Cappuccino", nameZh: "卡布奇诺", price: 5.49 },
      { name: "Coffee Latte", nameZh: "咖啡拿铁", price: 5.49 },
      { name: "Vanilla Latte", nameZh: "香草拿铁", price: 6.99 },
      { name: "Pumpkin Spice Latte", nameZh: "南瓜拿铁", price: 6.99 },
      { name: "Hot Pumpkin Spice Latte", nameZh: "热南瓜拿铁", price: 6.99 },
      { name: "Iced Pumpkin Spice Latte", nameZh: "冰南瓜拿铁", price: 6.99 },
      { name: "Coconut Espresso", nameZh: "椰子浓缩", price: 6.99 },
      { name: "Osmanthus Oolong Coffee Latte", nameZh: "桂花乌龙咖啡拿铁", price: 6.99 },
      { name: "Sicilian-inspired Citrus Espresso", nameZh: "西西里柑橘浓缩", price: 6.99 },
      { name: "Peachy Oolong Americano", nameZh: "蜜桃乌龙美式", price: 6.99 },
      { name: "Espresso Tonic", nameZh: "浓缩汤力", price: 6.99 },
    ],
  },
  {
    category: "Matcha",
    categoryZh: "抹茶",
    subgroups: [
      {
        label: "Hot",
        items: [
          { name: "Hot Matcha Latte", nameZh: "热抹茶拿铁", price: 7.79 },
          { name: "Hot Black Sesame Matcha", nameZh: "热黑芝麻抹茶", price: 7.79 },
          { name: "Coconut Matcha", nameZh: "椰子抹茶", price: 7.79 },
        ],
      },
      {
        label: "Iced",
        items: [
          { name: "Iced Matcha Latte", nameZh: "冰抹茶拿铁", price: 7.79 },
          { name: "Iced Strawberry Matcha Latte", nameZh: "冰草莓抹茶拿铁", price: 7.79 },
          { name: "Iced Coconut Matcha", nameZh: "冰椰子抹茶", price: 7.79 },
          { name: "Iced Ube Matcha Latte", nameZh: "冰紫薯抹茶拿铁", price: 6.99 },
          { name: "Iced Black Sesame Matcha", nameZh: "冰黑芝麻抹茶", price: 7.79 },
          { name: "Iced Matcha Cloud", nameZh: "冰抹茶云朵", price: 7.79 },
          { name: "Matcha Latte", nameZh: "抹茶拿铁", price: 7.79 },
          { name: "Black Sesame Matcha", nameZh: "黑芝麻抹茶", price: 7.79 },
          { name: "Matcha Cloud", nameZh: "抹茶云朵", price: 6.99 },
          { name: "Matcha Yuzu", nameZh: "抹茶柚子", price: 7.79 },
          { name: "Matcha Tonic", nameZh: "抹茶汤力", price: 6.99 },
          { name: "Blueberry Yuzu Matcha Tonic", nameZh: "蓝莓柚子抹茶汤力", price: 7.79 },
          { name: "Iced Matcha Yuzu Fizz", nameZh: "冰抹茶柚子气泡", price: 7.79 },
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
          { name: "Hot Hojicha Latte", nameZh: "热焙茶拿铁", price: 7.79 },
          { name: "Hot Black Sesame Hojicha", nameZh: "热黑芝麻焙茶", price: 7.79 },
          { name: "Hot Pumpkin Spice Hojicha Latte", nameZh: "热南瓜焙茶拿铁", price: 6.99 },
        ],
      },
      {
        label: "Iced",
        items: [
          { name: "Iced Hojicha Latte", nameZh: "冰焙茶拿铁", price: 7.79 },
          { name: "Iced Black Sesame Hojicha", nameZh: "冰黑芝麻焙茶", price: 7.79 },
          { name: "Iced Pumpkin Spice Hojicha Latte", nameZh: "冰南瓜焙茶拿铁", price: 6.99 },
          { name: "Black Sesame Hojicha", nameZh: "黑芝麻焙茶", price: 7.79 },
        ],
      },
    ],
  },
  {
    category: "Oolong & Green Tea",
    categoryZh: "乌龙与绿茶",
    items: [
      { name: "Iced Orange Peachy Oolong", nameZh: "冰橙子蜜桃乌龙", price: 6.99 },
      { name: "Hot Orange Peachy Oolong", nameZh: "热橙子蜜桃乌龙", price: 6.99 },
      { name: "Iced Peachy Oolong Milk Tea", nameZh: "冰蜜桃乌龙奶茶", price: 6.99 },
      { name: "Osmanthus Oolong Cloud", nameZh: "桂花乌龙云朵", price: 6.99 },
      { name: "Iced Yuzu Passionfruit Green Tea", nameZh: "冰柚子百香果绿茶", price: 6.99 },
      { name: "Hot Yuzu Passionfruit Green Tea", nameZh: "热柚子百香果绿茶", price: 6.99 },
      { name: "Hot Jasmine Tropical Infusion", nameZh: "热茉莉热带花草茶", price: 6.99 },
    ],
  },
  {
    category: "Specialty Lattes & Others",
    categoryZh: "特色拿铁",
    items: [
      { name: "Black Sesame Latte", nameZh: "黑芝麻拿铁", price: 6.99 },
      { name: "Blueberry Cloud Latte", nameZh: "蓝莓云朵拿铁", price: 6.99 },
      { name: "Iced Ube Matcha Latte", nameZh: "冰紫薯抹茶拿铁", price: 6.99 },
    ],
  },
  {
    category: "Pastries",
    categoryZh: "糕点",
    items: [
      { name: "Apple Pastry", nameZh: "苹果酥", price: 5.99 },
      { name: "Pear Pastry", nameZh: "梨子酥", price: 5.99 },
      { name: "Orange Pastry", nameZh: "橙子酥", price: 5.99 },
      { name: "Starlight Pastry", nameZh: "星光酥", price: 5.99 },
      { name: "Flower Pastry", nameZh: "花朵酥", price: 5.99 },
      { name: "Magnolia Pastry", nameZh: "玉兰酥", price: 5.99 },
      { name: "Peanut Pastry", nameZh: "花生酥", price: 5.99 },
      { name: "Sesame Pocket", nameZh: "芝麻饼", price: 2.99 },
    ],
  },
  {
    category: "Desserts & Sweets",
    categoryZh: "甜点",
    items: [
      { name: "Matcha Basque Cheesecake", nameZh: "抹茶巴斯克芝士蛋糕", price: 6.99 },
      { name: "Egg Tart", nameZh: "蛋挞", price: 5.99 },
      { name: "Dubai Chocolate Mochi", nameZh: "迪拜巧克力麻糬", price: 5.99 },
      { name: "Tea Chocolate", nameZh: "茶巧克力", price: 39.00 },
    ],
  },
  {
    category: "Merchandise & Products",
    categoryZh: "周边产品",
    items: [
      { name: "Hojicha Powder 80g", nameZh: "焙茶粉 80克", price: 30.00 },
      { name: "Oolong Tea Lover 5g x 8 bags", nameZh: "乌龙茶爱好者 5克×8包", price: 52.00 },
      { name: "Yashi Flavour Oolong 50g", nameZh: "鸭屎香乌龙 50克", price: 49.00 },
      { name: "Teamendous Bamboo Thermos Bottle", nameZh: "六时茶茗竹制保温瓶", price: 29.00 },
      { name: "Tea Ware Pouch", nameZh: "茶具收纳包", price: 25.00 },
    ],
  },
];

// ---------------------------------------------------------------------------
// MenuSection component
// ---------------------------------------------------------------------------
function MenuSection({ lang }: { lang: "en" | "zh" }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

  const itemCount = (cat: MenuCategory) =>
    cat.items?.length ?? cat.subgroups?.reduce((s, g) => s + g.items.length, 0) ?? 0;

  return (
    <section id="menu" className="w-screen min-h-screen bg-black py-24 pb-32">
      <p className="text-[#4a9e8e] text-xs tracking-[0.3em] text-center mb-20">{lang === "zh" ? "茶饮菜单" : "TEA MENU"}</p>

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
                  <span className="font-monument text-white text-sm tracking-widest uppercase">
                    {lang === "zh" ? cat.categoryZh : cat.category}
                  </span>
                  <span className="text-[#777777] text-xs" style={{ fontFamily: "serif" }}>
                    {lang === "zh" ? cat.category : cat.categoryZh}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[#777777] text-[10px] tracking-widest uppercase">
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
                      <span className="text-white/80 text-xs">{lang === "zh" ? item.nameZh : item.name}</span>
                      <span className="text-[#666666] text-xs">${item.price.toFixed(2)}</span>
                    </div>
                  ))}

                  {/* Subgrouped items */}
                  {cat.subgroups?.map((sg) => (
                    <div key={sg.label}>
                      <p className="text-[#4a9e8e] text-[10px] tracking-[0.25em] uppercase pt-5 pb-2">
                        {lang === "zh" ? (sg.label === "Hot" ? "热饮" : "冷饮") : sg.label}
                      </p>
                      {sg.items.map((item) => (
                        <div
                          key={item.name}
                          className="flex items-center justify-between py-3 border-b border-[#111111]"
                        >
                          <span className="text-white/80 text-xs">{lang === "zh" ? item.nameZh : item.name}</span>
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

// ---------------------------------------------------------------------------
// Tea Collection data & component
// ---------------------------------------------------------------------------
const TEA_COLLECTION = [
  {
    category: "Black Tea",
    categoryZh: "红茶",
    items: [
      { name: "Jiuqu Hongmei", nameZh: "九曲红梅", weight: "4g" },
      { name: "Yunnan Wuliang Mountain", nameZh: "云南无量山", weight: "4g" },
    ],
  },
  {
    category: "Pu'er Tea",
    categoryZh: "普洱茶",
    items: [
      { name: "Shou Pu'er", nameZh: "熟普", weight: "8g" },
    ],
  },
  {
    category: "Oolong Tea",
    categoryZh: "乌龙茶",
    items: [
      { name: "Dancong", nameZh: "单丛", weight: "8g" },
      { name: "Ya Shi Xiang", nameZh: "鸭屎香", weight: "4g" },
      { name: "Lei Kou Chai", nameZh: "雷扣柴", weight: "4g" },
    ],
  },
  {
    category: "Green Tea",
    categoryZh: "绿茶",
    items: [
      { name: "Dragon Well", nameZh: "龙井", weight: "4g" },
    ],
  },
];

function TeaCollectionSection({ lang }: { lang: "en" | "zh" }) {
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  const toggle = (category: string) =>
    setOpenCategory(openCategory === category ? null : category);

  return (
    <section id="tea-collection" className="min-h-screen bg-black px-8 py-24 border-t border-[#1a1a1a]">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center">
          <h2 className="font-monument text-white text-5xl md:text-6xl mb-4" style={{ letterSpacing: "-0.02em" }}>
            {lang === "zh" ? "精选茶叶" : "TEA COLLECTION"}
          </h2>
          <p className="font-monument text-[#4a9e8e] text-[10px] tracking-[0.3em] uppercase mb-3">精选茶叶</p>
          <p className="text-[#777777] text-sm">{lang === "zh" ? "Single-origin teas sourced from premier tea regions across China." : "Single-origin teas, brewed one leaf at a time."}</p>
        </div>

        {/* Two col grid */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-12 mt-16 items-start">
          {/* Left: accordion tea list */}
          <div>
            {TEA_COLLECTION.map((cat) => {
              const isOpen = openCategory === cat.category;
              return (
                <div key={cat.category} className="border-t border-[#1a1a1a]">
                  <button
                    onClick={() => toggle(cat.category)}
                    className="w-full flex items-center justify-between py-4 text-left"
                  >
                    <div className="flex items-baseline gap-3">
                      <span className="text-[#4a9e8e] text-[10px] tracking-widest uppercase">
                        {lang === "zh" ? cat.categoryZh : cat.category}
                      </span>
                      <span className="text-[#555555] text-[10px] tracking-widest uppercase">
                        {lang === "zh" ? cat.category : cat.categoryZh}
                      </span>
                    </div>
                    <span className="text-[#666666] text-sm">{isOpen ? "−" : "+"}</span>
                  </button>

                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    {cat.items.map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between py-3 border-b border-[#1a1a1a]"
                      >
                        <div className="flex items-baseline gap-2">
                          <span className="text-white/80 text-sm">{lang === "zh" ? item.nameZh : item.name}</span>
                          <span className="text-[#555555] text-xs">{lang === "zh" ? item.name : item.nameZh}</span>
                        </div>
                        <span className="text-[#666666] text-sm">{item.weight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: featured product card */}
          <div className="border border-[#1a1a1a] p-0 overflow-hidden">
            <div className="w-full h-48 bg-[#0a0a0a] flex items-center justify-center">
              <span className="text-[#333333] text-xs tracking-widest uppercase">Image Coming Soon</span>
            </div>
            <div className="p-5">
              <p className="text-[#4a9e8e] text-[10px] uppercase tracking-widest mb-2">Coming Soon</p>
              <p className="font-monument text-white text-lg mb-2">Jingdezhen Teaware</p>
              <p className="text-[#666666] text-xs mb-2">来自中国景德镇的手工茶器即将上线</p>
              <p className="text-[#888888] text-xs leading-relaxed">Handcrafted teaware from Jingdezhen, China — the porcelain capital of the world.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const [lang, setLang] = useState<"en" | "zh">("en");
  const [currentVideo, setCurrentVideo] = useState(1);

  const handleVideoEnd = () => {
    setCurrentVideo(v => v === 5 ? 1 : v + 1);
  };
  const t = content[lang];

  return (
    <>
      {/* ── Section 1: Hero ─────────────────────────────────────────── */}
      <section id="top" className="relative w-screen h-screen overflow-hidden bg-black">

        {/* Background video */}
        <video
          key={currentVideo}
          autoPlay
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          onEnded={handleVideoEnd}
        >
          <source src={`/teamendous-${currentVideo}.mp4`} type="video/mp4" />
        </video>

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Top left: Logo block */}
        <div className="absolute top-8 left-10 z-10 flex flex-col gap-1">
          <span className="font-monument text-white text-3xl tracking-widest uppercase font-semibold">
            {t.logo}
          </span>
          <span className="font-monument text-white/70 text-xs tracking-wide opacity-70">
            {t.logoSub}
          </span>
          {/* Teal leaf/teardrop icon */}
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg" className="mt-1 animate-raindrop">
            <path d="M4 0C4 0 0 3 0 5.5C0 6.88 1.79 8 4 8C6.21 8 8 6.88 8 5.5C8 3 4 0 4 0Z" fill="#4a9e8e" />
          </svg>
        </div>

        {/* Bottom left: Chinese vertical text + tagline */}
        <div className="absolute bottom-20 left-10 z-10">
          <div className="flex gap-4 mb-4">
            <div
              className="text-white text-4xl leading-normal tracking-widest"
              style={{ fontFamily: "serif", writingMode: "vertical-rl", textOrientation: "upright" }}
            >
              六时之间
            </div>
            <div
              className="text-white text-4xl leading-normal tracking-widest"
              style={{ fontFamily: "serif", writingMode: "vertical-rl", textOrientation: "upright" }}
            >
              一盏清茗
            </div>
          </div>
          <p className="font-monument text-[#4a9e8e] text-[10px] tracking-[0.4em] uppercase mb-3">
            {t.tagline}
          </p>
          <div className="w-12 h-px bg-white opacity-50" />
        </div>

      </section>

      {/* ── Section 2: Concept ──────────────────────────────────────── */}
      <section id="concept" className="relative w-screen h-screen overflow-hidden bg-black">

        {/* Background image */}
        <Image
          src="/concept4.png"
          alt=""
          fill
          className="object-cover"
        />

        {/* Bottom fade to black */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black to-transparent z-10" />

        {/* Centered content */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center px-8 text-center pb-16">
          <h2 className="font-monument text-white text-4xl md:text-5xl font-bold tracking-widest uppercase mb-4">
            {t.conceptTitle}
          </h2>
          <p className="font-monument text-[#4a9e8e] text-[10px] tracking-[0.3em] uppercase mb-14">
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
      <MenuSection lang={lang} />

      {/* ── Section 4: Tea Collection ───────────────────────────────── */}
      <TeaCollectionSection lang={lang} />

      {/* ── Section 5: Reservations ─────────────────────────────────── */}
      <div id="reservations">
        <ReservationsSection mode="preview" lang={lang} />
      </div>

      {/* ── Section 5: Location ─────────────────────────────────────── */}
      <section id="location" className="w-screen min-h-screen bg-black text-white py-24 pb-32">
        {/* Header */}
        <div className="text-center mb-2">
          <h2 className="font-monument text-white text-4xl md:text-6xl tracking-widest uppercase mb-4 text-center">
            {t.locationTitle}
          </h2>
          <p className="font-monument text-[#4a9e8e] text-[10px] tracking-[0.3em] uppercase">
            {t.locationSub}
          </p>
        </div>

        {/* Two-column content */}
        <div className="max-w-3xl mx-auto px-8 grid grid-cols-1 md:grid-cols-2 gap-12 mt-16 items-start text-center md:text-left">

          {/* Left: store info */}
          <div>
            <p className="text-[#777777] text-[10px] tracking-widest uppercase mb-3">(Toronto)</p>
            <p className="font-monument text-white text-xl mb-1">TEAMENDOUS Toronto</p>
            <p className="text-[#777777] text-[10px] tracking-widest mb-6">TEAMENDOUS · Toronto</p>

            <p className="text-white text-sm">10 Karl Fraser Rd,</p>
            <p className="text-white text-sm mb-6">North York, ON M3C 0E9</p>

            <div className="flex flex-col gap-3 mb-8 items-center md:items-start">
              {/* Email */}
              <a href="mailto:teamendoustoronto@gmail.com" className="flex items-center gap-2 text-[#4a9e8e] text-sm break-all hover:opacity-80 transition-opacity">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M2 7l10 7 10-7" />
                </svg>
                teamendoustoronto@gmail.com
              </a>
              {/* Phone */}
              <a href="tel:+14165468800" className="flex items-center gap-2 text-[#4a9e8e] text-sm hover:opacity-80 transition-opacity">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.07 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 5 5l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 14.92z" />
                </svg>
                +1 (416) 546-8800
              </a>
              {/* Instagram */}
              <a href="https://instagram.com/teamendous.toronto" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[#4a9e8e] text-sm hover:opacity-80 transition-opacity">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
                </svg>
                @teamendous.toronto
              </a>
            </div>

            {/* Google Maps */}
            <a
              href="https://maps.google.com/?q=10+Karl+Fraser+Rd+North+York+ON+M3C+0E9"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white text-sm flex items-center gap-2 hover:text-[#4a9e8e] transition-colors justify-center md:justify-start"
            >
              {t.googleMaps}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          </div>

          {/* Right: hours */}
          <div>
            <p className="text-[#777777] text-[10px] tracking-widest uppercase mb-6">{t.businessHours}</p>
            <div className="border-t border-[#111111] pt-6 space-y-0 mx-auto md:mx-0">
            {[
              { day: "MON", hours: "11:00 AM – 8:00 PM", closed: false },
              { day: "TUE", hours: "11:00 AM – 8:00 PM", closed: false },
              { day: "WED", hours: "11:00 AM – 8:00 PM", closed: false },
              { day: "THU", hours: "11:00 AM – 8:00 PM", closed: false },
              { day: "FRI", hours: "11:00 AM – 10:00 PM", closed: false },
              { day: "SAT", hours: "10:30 AM – 10:00 PM", closed: false },
              { day: "SUN", hours: "11:00 AM – 8:00 PM", closed: false },
            ].map(({ day, hours, closed }) => (
              <div key={day} className="flex justify-between md:justify-between justify-center gap-8 py-3 border-b border-[#111111]">
                <span className="text-[#777777] text-xs tracking-widest">{day}</span>
                <span className={`text-xs ${closed ? "text-[#777777]" : "text-white"}`}>{hours}</span>
              </div>
            ))}
            </div>
          </div>

        </div>
      </section>

      {/* ── Fixed bottom nav bar ────────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between px-10 py-5 border-t border-white/10 bg-black/20 backdrop-blur-sm">
        {/* Left: nav links */}
        <div className="flex items-center gap-4 md:gap-8 overflow-x-auto scrollbar-hide whitespace-nowrap px-2">
          {t.nav.map((label, i) => {
            const href = NAV_HREFS[i];
            return href.startsWith("/") ? (
              <Link
                key={i}
                href={href}
                className="font-monument text-white/70 text-xs tracking-[0.2em] uppercase hover:text-white transition-colors duration-200 whitespace-nowrap"
              >
                {label}
              </Link>
            ) : (
              <a
                key={i}
                href={href}
                className="font-monument text-white/70 text-xs tracking-[0.2em] uppercase hover:text-white transition-colors duration-200 whitespace-nowrap"
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
