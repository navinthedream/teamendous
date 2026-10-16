"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

// ---------------------------------------------------------------------------
// Cal.com config
// ---------------------------------------------------------------------------
const CAL_USERNAME = "navin-pandey-scvuvp";
const API_KEY = process.env.NEXT_PUBLIC_CAL_API_KEY ?? "";
const CAL_API_BASE = "https://api.cal.com/v2";
const SLOTS_API_VERSION = "2024-09-04";
const BOOKINGS_API_VERSION = "2024-08-13";

const DOW_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// ---------------------------------------------------------------------------
// Hardcoded rich event content — keyed by Cal.com event slug.
// Update the slug keys here if they differ from your Cal.com slugs.
// ---------------------------------------------------------------------------
type EventIncludeItem = {
  name: string;
  description?: string;
  items?: string[];
  note?: string;
};

type HardcodedEventContent = {
  title: string;
  subtitle: string;
  tagline: string;
  about: string[];
  package: { label: string; startingAt: string; guests: string; extra?: string };
  includes: EventIncludeItem[];
  image?: string; // relative path e.g. "/images/tea-gathering.jpg"
};

const HARDCODED_EVENT_CONTENT: Record<string, HardcodedEventContent> = {
  // ↓ Update this key to match your Cal.com event slug
  "tea-gathering": {
    title: "WELLNESS TEA GATHERING",
    subtitle: "A Mindful Tea & Seasonal Gathering Experience",
    tagline: "Slow down and reconnect through tea, warmth, and meaningful conversation.",
    about: [],
    package: { label: "", startingAt: "", guests: "" },
    image: "/tea-gathering.jpg",
    includes: [
      {
        name: "Wellness Tea",
        description: "A curated selection of wellness-focused Chinese tea designed to create a calming and grounding experience.",
      },
      {
        name: "Roasting Dishes · Fruits · Seasonal Snacks",
        items: [
          "Peanuts",
          "Rice Cake",
          "Rice Crisp Crackers",
          "Milk Flakes",
          "Roasted Sweet Potato",
          "Marshmallow",
          "Chestnuts",
          "Chinese Dates",
          "Dried Plums",
          "Seasonal Fruits",
        ],
        note: "Items may vary depending on seasonal availability. If a dish is unavailable, it will be replaced with another item of equal value.",
      },
    ],
  },
};

const INSTRUCTOR_BY_SLUG: Record<string, {
  name: string;
  credentials: string;
  bio: string;
}> = {
  "matcha-mat-pilates": {
    name: "Perla Bashmanian",
    credentials: "Certified Personal Trainer · Pilates Instructor · Certified Nutrition Coach",
    bio: "Passionate about helping women build strength, confidence, and sustainable healthy habits. Her approach combines movement, wellness, and community to create supportive environments where participants can improve their health, develop positive habits, and feel their best both physically and mentally. Through fitness and wellness education, she aims to help individuals build a balanced lifestyle that supports long-term health and well-being.",
  },
  "sip-stretch-yoga": {
    name: "Perla Bashmanian",
    credentials: "Certified Personal Trainer · Pilates Instructor · Certified Nutrition Coach",
    bio: "Passionate about helping women build strength, confidence, and sustainable healthy habits. Her approach combines movement, wellness, and community to create supportive environments where participants can improve their health, develop positive habits, and feel their best both physically and mentally. Through fitness and wellness education, she aims to help individuals build a balanced lifestyle that supports long-term health and well-being.",
  },
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Slot = {
  start: string;
  seatsBooked?: number;
  seatsRemaining?: number;
  seatsTotal?: number;
};

type EventType = {
  id: number;
  title: string;
  slug: string;
  lengthInMinutes: number;
  description: string | null;
  price: number;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}
function formatDateLong(d: Date) {
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}
function buildCalendarGrid(year: number, month: number): (Date | null)[] {
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = Array(firstDow).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  return cells;
}
function toDateString(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function parsePricing(description: string | null) {
  const match = description?.match(/\\?\[pricing:\s*base=(\d+),\s*baseGuests=(\d+),\s*perExtra=(\d+)\\?\]/);
  if (!match) return { base: 0, baseGuests: 1, perExtra: 0 };
  return { base: Number(match[1]), baseGuests: Number(match[2]), perExtra: Number(match[3]) };
}

function cleanDescription(description: string | null) {
  return description?.replace(/\\?\[pricing:.*?\\?\]/g, "").trim() ?? "";
}

function calcTotal(guests: number, pricing: { base: number; baseGuests: number; perExtra: number }): number {
  if (guests <= pricing.baseGuests) return pricing.base;
  return pricing.base + (guests - pricing.baseGuests) * pricing.perExtra;
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------
async function fetchEventTypes(): Promise<EventType[]> {
  const res = await fetch(`${CAL_API_BASE}/event-types?username=${CAL_USERNAME}`, {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "cal-api-version": "2024-06-14",
    },
  });
  if (!res.ok) throw new Error("Failed to fetch event types");
  const json = await res.json();
  const types: EventType[] = json?.data ?? [];

  // Fetch full details for each event type to get complete description
  const fullTypes = await Promise.all(
    types.map(async (et) => {
      const detailRes = await fetch(`${CAL_API_BASE}/event-types/${et.id}`, {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "cal-api-version": "2024-06-14",
        },
      });
      if (!detailRes.ok) return et;
      const detailJson = await detailRes.json();
      return { ...et, description: detailJson?.data?.description ?? et.description };
    })
  );

  return fullTypes;
}

async function fetchAvailableSlots(date: Date, slug: string, duration: number): Promise<Slot[]> {
  const endDate = new Date(date);
  endDate.setDate(endDate.getDate() + 1);
  const params = new URLSearchParams({
    username: CAL_USERNAME,
    eventTypeSlug: slug,
    duration: String(duration),
    start: toDateString(date),
    end: toDateString(endDate),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  const res = await fetch(`${CAL_API_BASE}/slots?${params}`, { headers: { Authorization: `Bearer ${API_KEY}`, "cal-api-version": SLOTS_API_VERSION } });
  if (!res.ok) throw new Error(`Failed to load slots (${res.status})`);
  const json = await res.json();
  const slots: Slot[] = json?.data?.[toDateString(date)] ?? [];
  return slots;
}

async function fetchMonthAvailability(year: number, month: number, slug: string): Promise<Set<string>> {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  const params = new URLSearchParams({
    username: CAL_USERNAME,
    eventTypeSlug: slug,
    start: toDateString(start),
    end: toDateString(end),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  const res = await fetch(`${CAL_API_BASE}/slots?${params}`, {
    headers: { Authorization: `Bearer ${API_KEY}`, "cal-api-version": SLOTS_API_VERSION },
  });
  if (!res.ok) return new Set();
  const json = await res.json();
  return new Set(Object.keys(json?.data ?? {}));
}

async function submitBooking(
  slot: string,
  name: string,
  email: string,
  eventTypeId: number,
  guestCount: number,
  pricing: { base: number; baseGuests: number; perExtra: number }
): Promise<void> {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const res = await fetch(`${CAL_API_BASE}/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}`, "cal-api-version": BOOKINGS_API_VERSION },
    body: JSON.stringify({
      start: slot,
      eventTypeId,
      attendee: { name, email, timeZone },
      metadata: {
        guestCount: String(guestCount),
        totalOwed: `$${calcTotal(guestCount, pricing)} CAD`,
      },
      bookingFieldsResponses: {
        notes: `Guests: ${guestCount} · Total owed via e-transfer: $${calcTotal(guestCount, pricing)} CAD`,
      },
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string })?.message ?? `Booking failed (${res.status})`);
  }
}

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------
function Section({ children, center = false }: { children: React.ReactNode; center?: boolean }) {
  return (
    <div className="w-full border-t border-[#1a1a1a]">
      <div className={`mx-auto max-w-2xl px-8 py-16 flex flex-col items-center ${center ? "text-center" : ""}`}>
        {children}
      </div>
    </div>
  );
}

function SectionLabel({ number, text }: { number: number; text: string }) {
  return (
    <p className="font-monument text-[#aaaaaa] text-[11px] tracking-[0.25em] uppercase mb-8">
      {number}. {text}
    </p>
  );
}

// ---------------------------------------------------------------------------
const EVENT_TRANSLATIONS_ZH: Record<string, { title: string; description: string }> = {
  "tea-gathering": {
    title: "健康茶聚",
    description: "在茶、温暖和有意义的对话中放慢脚步，重新联系。以传统中国茶文化为灵感，我们的茶聚体验专为亲密时刻而设计。",
  },
  "matcha-mat-pilates": {
    title: "抹茶垫上普拉提",
    description: "每周五上午8:00 · 适合初学者的全身锻炼，专为增强力量、改善姿势和提高灵活性而设计。",
  },
  "sip-stretch-yoga": {
    title: "品饮伸展瑜伽",
    description: "每周五晚上8:00 · 温和的恢复性瑜伽课程，帮助学员在繁忙的一周后释放紧张情绪、改善灵活性。",
  },
};

// ReservationsSection — reusable, no <main> wrapper
// ---------------------------------------------------------------------------
export function ReservationsSection({
  mode = "full",
  initialEvent,
  lang = "en",
}: {
  mode?: "preview" | "full";
  initialEvent?: string;
  lang?: "en" | "zh";
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const minDate = today;

  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [eventTypesLoading, setEventTypesLoading] = useState(true);
  const [eventTypesError, setEventTypesError] = useState<string | null>(null);

  const [bookingStep, setBookingStep] = useState<1 | 2 | 3 | 4>(1);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [selectedExperience, setSelectedExperience] = useState<string | null>(null);
  const [selectedEventTypeId, setSelectedEventTypeId] = useState<number | null>(null);
  const [selectedEventLength, setSelectedEventLength] = useState<number>(120);
  const [selectedPricing, setSelectedPricing] = useState({ base: 0, baseGuests: 1, perExtra: 0 });

  const [viewYear, setViewYear] = useState(minDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(minDate.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [guestCount, setGuestCount] = useState(2);
  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [availableDays, setAvailableDays] = useState<Set<string>>(new Set());
  const [monthLoading, setMonthLoading] = useState(false);


  useEffect(() => {
    fetchEventTypes()
      .then(setEventTypes)
      .catch(e => setEventTypesError(e.message))
      .finally(() => setEventTypesLoading(false));
  }, []);

  useEffect(() => {
    if (!initialEvent || eventTypesLoading || eventTypes.length === 0) return;
    const et = eventTypes.find(e => e.slug === initialEvent);
    if (!et) return;
    setExpandedCard(et.slug);
    setSelectedExperience(et.slug);
    setSelectedEventTypeId(et.id);
    setSelectedEventLength(et.lengthInMinutes);
    setSelectedPricing(parsePricing(et.description));
  }, [initialEvent, eventTypes, eventTypesLoading]);

  useEffect(() => {
    if (!selectedExperience) return;
    setAvailableDays(new Set());
    setMonthLoading(true);
    fetchMonthAvailability(viewYear, viewMonth, selectedExperience)
      .then(setAvailableDays)
      .finally(() => setMonthLoading(false));
  }, [viewYear, viewMonth, selectedExperience]);

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); };

  const handleDateSelect = useCallback(async (date: Date) => {
    if (!selectedExperience) return;
    setSelectedDate(date); setSelectedSlot(null); setConfirmed(false); setBookingError(null); setSlots([]); setSlotsError(null); setSlotsLoading(true);
    setBookingStep(2);
    try { setSlots(await fetchAvailableSlots(date, selectedExperience, selectedEventLength)); }
    catch (e) { setSlotsError(e instanceof Error ? e.message : "Could not load slots."); }
    finally { setSlotsLoading(false); }
  }, [selectedExperience, selectedEventLength]);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !selectedEventTypeId) return;
    setSubmitting(true); setBookingError(null);
    try { await submitBooking(selectedSlot.start, name, email, selectedEventTypeId, guestCount, selectedPricing); setConfirmed(true); setBookingStep(4); }
    catch (e) { setBookingError(e instanceof Error ? e.message : "Something went wrong."); }
    finally { setSubmitting(false); }
  };

  const resetAll = () => {
    setConfirmed(false); setSelectedDate(null); setSelectedSlot(null); setSlots([]);
    setName(""); setEmail(""); setGuestCount(2); setSelectedExperience(null);
    setSelectedEventTypeId(null); setSelectedEventLength(120);
    setSelectedPricing({ base: 0, baseGuests: 1, perExtra: 0 });
    setAvailableDays(new Set()); setExpandedCard(null); setBookingStep(1);
  };

  const handleBack = () => {
    if (bookingStep === 2) {
      setSelectedDate(null); setSlots([]); setSlotsError(null);
      setBookingStep(1);
    } else if (bookingStep === 3) {
      setSelectedSlot(null); setBookingError(null);
      setBookingStep(2);
    }
  };

  const calGrid = buildCalendarGrid(viewYear, viewMonth);
  const visible = eventTypes.filter((e) => !e.hidden);
  const displayedEventTypes = initialEvent
    ? visible.filter(et => et.slug === initialEvent)
    : visible;

  // ── Reusable booking step JSX blocks ──────────────────────────────────────

  const calendarBlock = (
    <div className="w-full">
      <div className="flex items-center justify-between mb-8">
        <button onClick={prevMonth} className="text-[#aaaaaa] hover:text-white transition-colors text-2xl w-10 h-10 flex items-center justify-center">‹</button>
        <span className="text-white text-sm tracking-[0.2em] uppercase flex items-center gap-2">
          {MONTH_NAMES[viewMonth]} {viewYear}
          {monthLoading && <span className="w-3 h-3 border border-[#4a9e8e] border-t-transparent rounded-full animate-spin inline-block" />}
        </span>
        <button onClick={nextMonth} className="text-[#aaaaaa] hover:text-white transition-colors text-2xl w-10 h-10 flex items-center justify-center">›</button>
      </div>
      <div className="grid grid-cols-7 mb-3">
        {DOW_LABELS.map(d => (
          <div key={d} className="text-center text-[10px] text-[#bbbbbb] uppercase tracking-widest py-2 select-none">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-2">
        {calGrid.map((day, i) => {
          if (!day) return <div key={`e-${i}`} aria-hidden />;
          const isDisabled = day < minDate || (!monthLoading && !availableDays.has(toDateString(day)));
          const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
          return (
            <button key={day.toISOString()} disabled={isDisabled} onClick={() => handleDateSelect(day)}
              className={`mx-auto w-11 h-11 text-sm flex items-center justify-center transition-colors select-none rounded-full
                ${isDisabled ? "text-[#2a2a2a] cursor-not-allowed" : isSelected ? "bg-[#4a9e8e] text-black font-semibold" : "text-[#bbbbbb] hover:text-white hover:bg-[#1a1a1a] cursor-pointer"}`}>
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );

  const timeSlotsBlock = selectedDate && (
    <>
      <p className="text-[#aaaaaa] text-xs mb-6">{formatDateLong(selectedDate)}</p>
      {slotsLoading && (
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 border border-[#4a9e8e] border-t-transparent rounded-full animate-spin" />
          <span className="text-[#aaaaaa] text-xs">Checking availability…</span>
        </div>
      )}
      {!slotsLoading && slotsError && (
        <div className="flex items-center gap-4">
          <p className="text-red-500 text-xs">{slotsError}</p>
          <button onClick={() => selectedDate && handleDateSelect(selectedDate)} className="text-[#4a9e8e] text-xs underline">Retry</button>
        </div>
      )}
      {!slotsLoading && !slotsError && slots.length === 0 && (
        <p className="text-[#aaaaaa] text-xs">No sessions available — try another date.</p>
      )}
      {!slotsLoading && !slotsError && slots.length > 0 && (
        <div className="grid grid-cols-2 gap-3 w-full">
          {slots.map(slot => (
            <button key={slot.start} onClick={() => { setSelectedSlot(slot); setConfirmed(false); setBookingError(null); setBookingStep(3); }}
              className={`px-5 py-4 border text-left transition-colors duration-200 ${selectedSlot?.start === slot.start ? "border-white" : "border-[#222222] hover:border-[#444444]"}`}>
              <p className="text-white text-sm font-medium">{formatTime(slot.start)}</p>
              <p className="text-[#aaaaaa] text-[10px] mt-1 uppercase tracking-widest">{selectedEventLength} min</p>
              {slot.seatsTotal && (
                <p className={`text-[10px] mt-1 tracking-widest uppercase ${slot.seatsRemaining && slot.seatsRemaining <= 3 ? "text-red-400" : "text-[#4a9e8e]"}`}>
                  {slot.seatsRemaining}/{slot.seatsTotal} seats remaining
                </p>
              )}
            </button>
          ))}
        </div>
      )}
    </>
  );

  const detailsFormBlock = selectedSlot && !confirmed && (
    <form onSubmit={handleBookingSubmit} className="flex flex-col gap-6 w-full">
      <div>
        <label className="block text-[#aaaaaa] text-[10px] uppercase tracking-[0.2em] mb-2">Name</label>
        <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Your full name"
          className="w-full bg-transparent border border-[#222222] px-4 py-3 text-white text-sm placeholder:text-[#666666] focus:outline-none focus:border-[#4a9e8e] transition-colors" />
      </div>
      <div>
        <label className="block text-[#aaaaaa] text-[10px] uppercase tracking-[0.2em] mb-2">Email</label>
        <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
          className="w-full bg-transparent border border-[#222222] px-4 py-3 text-white text-sm placeholder:text-[#666666] focus:outline-none focus:border-[#4a9e8e] transition-colors" />
      </div>
      {!selectedSlot?.seatsTotal && (
        <div>
          <label className="block text-[#cccccc] text-[10px] uppercase tracking-[0.2em] mb-3">Guests</label>
          <div className="flex items-center gap-5">
            <button type="button" onClick={() => setGuestCount(g => Math.max(1, g - 1))} disabled={guestCount <= 1}
              className="w-8 h-8 border border-[#222222] text-[#cccccc] flex items-center justify-center hover:border-[#4a9e8e] hover:text-[#4a9e8e] disabled:opacity-20 disabled:cursor-not-allowed transition-colors text-lg">−</button>
            <span className="text-white font-medium w-4 text-center">{guestCount}</span>
            <button type="button" onClick={() => setGuestCount(g => Math.min(8, g + 1))} disabled={guestCount >= 8}
              className="w-8 h-8 border border-[#222222] text-[#cccccc] flex items-center justify-center hover:border-[#4a9e8e] hover:text-[#4a9e8e] disabled:opacity-20 disabled:cursor-not-allowed transition-colors text-lg">+</button>
            <span className="text-[#bbbbbb] text-xs">max 8</span>
          </div>
        </div>
      )}
      <div className="flex items-baseline justify-between border-t border-[#1a1a1a] pt-5">
        <div>
          <p className="text-[#cccccc] text-[10px] uppercase tracking-[0.2em] mb-1">Total</p>
          {!selectedSlot?.seatsTotal && guestCount > selectedPricing.baseGuests && selectedPricing.perExtra > 0 && (
            <p className="text-[#bbbbbb] text-[10px]">${selectedPricing.base} + ${(guestCount - selectedPricing.baseGuests) * selectedPricing.perExtra} extra</p>
          )}
          {selectedSlot?.seatsTotal && (
            <p className="text-[#bbbbbb] text-[10px]">Per person · each guest books individually</p>
          )}
        </div>
        <p className="text-white text-3xl font-light">
          ${selectedSlot?.seatsTotal ? selectedPricing.base : calcTotal(guestCount, selectedPricing)}
          <span className="text-[#cccccc] text-sm font-normal"> CAD</span>
        </p>
      </div>
      {bookingError && <p className="text-red-500 text-xs">{bookingError}</p>}
      <button type="submit" disabled={submitting}
        className="w-full bg-[#4a9e8e] text-black text-sm font-semibold tracking-[0.1em] uppercase py-4 hover:bg-white transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed">
        {submitting ? "Confirming…" : "Confirm Reservation"}
      </button>
    </form>
  );

  const confirmationBlock = confirmed && selectedDate && selectedSlot && (
    <>
      <p className="font-monument text-[#4a9e8e] text-[11px] tracking-[0.25em] uppercase mb-6">Reservation Received</p>
      <p className="font-monument text-white text-2xl font-light mb-10">
        We&apos;ll see you soon, {name.split(" ")[0]}.
      </p>
      <div className="border-t border-[#1a1a1a] pt-6 space-y-4 mb-8 w-full max-w-sm">
        {[{ label: "Date", value: formatDateLong(selectedDate) }, { label: "Time", value: formatTime(selectedSlot.start) }, { label: "Guests", value: String(guestCount) }].map(row => (
          <div key={row.label} className="flex justify-between text-sm">
            <span className="text-[#aaaaaa]">{row.label}</span>
            <span className="text-white">{row.value}</span>
          </div>
        ))}
        <div className="flex justify-between text-sm border-t border-[#1a1a1a] pt-4">
          <span className="text-[#aaaaaa]">Total</span>
          <span className="text-white">${calcTotal(guestCount, selectedPricing)} CAD</span>
        </div>
      </div>
      <div className="border border-[#1a1a1a] p-6 mb-8 w-full max-w-sm">
        <p className="font-monument text-[#4a9e8e] text-[11px] tracking-[0.2em] uppercase mb-3">Complete Your Reservation</p>
        <p className="text-[#cccccc] text-xs leading-relaxed">
          Send <span className="text-white">${calcTotal(guestCount, selectedPricing)} CAD</span> via e-transfer to{" "}
          <span className="text-[#4a9e8e]">teamendoustoronto@gmail.com</span> to secure your booking.
          Confirmation sent to <span className="text-white">{email}</span>.
        </p>
      </div>
      <button onClick={resetAll} className="text-xs text-[#cccccc] hover:text-white transition-colors tracking-widest uppercase underline underline-offset-4">
        Book another time
      </button>
    </>
  );

  // ── Two-column layout for the full booking page ────────────────────────────
  if (mode === "full") {
    const eventContent = initialEvent ? (HARDCODED_EVENT_CONTENT[initialEvent] ?? null) : null;
    const currentEvent = displayedEventTypes[0] ?? null;

    return (
      <div className="bg-black text-white flex flex-col">

        {/* ── TOP SECTION: Event info ───────────────────────────────────── */}
        <div className="w-full border-b border-[#1a1a1a] flex flex-col">

          {/* Image area */}
          <div className="w-full aspect-[16/6] bg-[#080808] relative overflow-hidden">
            {eventContent?.image ? (
              <Image
                src={eventContent.image}
                alt={eventContent.title}
                fill
                className="object-cover object-center"
                sizes="100vw"
                priority
              />
            ) : (
              <Image
                src="/concept3.png"
                alt=""
                fill
                className="object-cover object-center opacity-60"
                sizes="100vw"
                priority
              />
            )}
          </div>

          <div className="max-w-3xl mx-auto w-full px-8 py-10 flex flex-col gap-0">
            {eventContent ? (
              <>
                {/* Title & subtitle */}
                <p className="text-[#4a9e8e] text-[10px] tracking-[0.3em] uppercase mb-3">{eventContent.subtitle}</p>
                <h1 className="font-monument text-white text-2xl lg:text-3xl font-bold leading-tight mb-5" style={{ letterSpacing: "-0.01em" }}>
                  {eventContent.title}
                </h1>

                {/* Tagline */}
                <p className="text-[#cccccc] text-sm leading-relaxed italic mb-6">{eventContent.tagline}</p>

                {/* About paragraphs */}
                {eventContent.about.length > 0 && (
                  <div className="flex flex-col gap-3 mb-8">
                    {eventContent.about.map((p, i) => (
                      <p key={i} className="text-[#bbbbbb] text-xs leading-relaxed">{p}</p>
                    ))}
                  </div>
                )}

                {/* Package */}
                {eventContent.package.startingAt && (
                  <div className="border-t border-[#1a1a1a] pt-7 mb-7">
                    <p className="text-[#bbbbbb] text-[10px] uppercase tracking-[0.25em] mb-2">{eventContent.package.label}</p>
                    <p className="font-monument text-white text-2xl font-light mb-1">{eventContent.package.startingAt}</p>
                    <p className="text-[#cccccc] text-xs mb-1">{eventContent.package.guests}</p>
                    {eventContent.package.extra && (
                      <p className="text-[#4a9e8e] text-xs">{eventContent.package.extra}</p>
                    )}
                  </div>
                )}

                {/* Includes */}
                <div className="border-t border-[#1a1a1a] pt-7">
                  <p className="text-[#bbbbbb] text-[10px] uppercase tracking-[0.25em] mb-6">Experience Includes</p>
                  <div className="flex flex-col gap-6">
                    {eventContent.includes.map((item, i) => (
                      <div key={i}>
                        <p className="font-monument text-white text-xs font-semibold mb-1">{item.name}</p>
                        {item.description && (
                          <p className="text-[#aaaaaa] text-xs leading-relaxed mb-2">{item.description}</p>
                        )}
                        {item.items && (
                          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 mb-2">
                            {item.items.map(it => (
                              <li key={it} className="text-[#cccccc] text-[11px] flex items-center gap-1.5">
                                <span className="w-1 h-1 rounded-full bg-[#4a9e8e] flex-shrink-0" />
                                {it}
                              </li>
                            ))}
                          </ul>
                        )}
                        {item.note && (
                          <p className="text-[#bbbbbb] text-[10px] leading-relaxed italic">{item.note}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Instructor — shown when slug has an entry */}
                {initialEvent && INSTRUCTOR_BY_SLUG[initialEvent] && (() => {
                  const instructor = INSTRUCTOR_BY_SLUG[initialEvent];
                  return (
                    <div className="border-t border-[#1a1a1a] pt-7 mt-7">
                      <p className="text-[#aaaaaa] text-[10px] uppercase tracking-[0.25em] mb-4">Instructor</p>
                      <p className="font-monument text-white text-sm mb-1">{instructor.name}</p>
                      <p className="text-[#4a9e8e] text-[10px] uppercase tracking-widest mb-3">{instructor.credentials}</p>
                      <p className="text-[#cccccc] text-xs leading-relaxed">{instructor.bio}</p>
                    </div>
                  );
                })()}
              </>
            ) : eventTypesLoading ? (
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 border border-[#4a9e8e] border-t-transparent rounded-full animate-spin" />
                <span className="text-[#aaaaaa] text-xs">Loading…</span>
              </div>
            ) : currentEvent ? (
              <>
                <h1 className="font-monument text-white text-2xl lg:text-3xl font-bold mb-5">{currentEvent.title}</h1>
                <p className="text-[#4a9e8e] text-xs tracking-widest uppercase mb-4">{currentEvent.lengthInMinutes} min</p>
                <div
                  className="text-[#bbbbbb] text-xs leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: cleanDescription(currentEvent.description) }}
                />
                {/* Instructor fallback for non-hardcoded events */}
                {initialEvent && INSTRUCTOR_BY_SLUG[initialEvent] && (() => {
                  const instructor = INSTRUCTOR_BY_SLUG[initialEvent];
                  return (
                    <div className="border-t border-[#1a1a1a] pt-7 mt-7">
                      <p className="text-[#aaaaaa] text-[10px] uppercase tracking-[0.25em] mb-4">Instructor</p>
                      <p className="font-monument text-white text-sm mb-1">{instructor.name}</p>
                      <p className="text-[#4a9e8e] text-[10px] uppercase tracking-widest mb-3">{instructor.credentials}</p>
                      <p className="text-[#cccccc] text-xs leading-relaxed">{instructor.bio}</p>
                    </div>
                  );
                })()}
              </>
            ) : null}
          </div>
        </div>

        {/* ── BOTTOM SECTION: Booking steps ────────────────────────────── */}
        <div className="w-full flex flex-col max-w-3xl mx-auto">

          {/* Progress bar — 3 segments, filled up to current step */}
          {bookingStep < 4 && (
            <div className="flex gap-1 px-8 pt-4 pb-0">
              {([1, 2, 3] as const).map(n => (
                <div
                  key={n}
                  className={`h-px flex-1 transition-colors duration-500 ${bookingStep >= n ? "bg-[#4a9e8e]" : "bg-[#1a1a1a]"}`}
                />
              ))}
            </div>
          )}

          {/* Loading while event types resolve */}
          {(eventTypesLoading || (!selectedExperience && !eventTypesError)) && bookingStep === 1 && (
            <div className="px-8 lg:px-12 py-16 flex items-center gap-3">
              <div className="w-4 h-4 border border-[#4a9e8e] border-t-transparent rounded-full animate-spin" />
              <span className="text-[#aaaaaa] text-xs tracking-widest">Loading availability…</span>
            </div>
          )}

          {/* Step 1: Select Date */}
          {bookingStep === 1 && selectedExperience && (
            <div className="px-8 py-10 flex flex-col flex-1 justify-center">
              <p className="font-monument text-[#aaaaaa] text-[11px] tracking-[0.25em] uppercase mb-10">Select Date</p>
              {calendarBlock}
            </div>
          )}

          {/* Step 2: Select Time */}
          {bookingStep === 2 && (
            <div className="px-8 py-10">
              <div className="flex items-center justify-between mb-6">
                <p className="font-monument text-[#aaaaaa] text-[11px] tracking-[0.25em] uppercase">Select Time</p>
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1.5 text-[#bbbbbb] hover:text-white text-[10px] uppercase tracking-widest transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5M12 5l-7 7 7 7" />
                  </svg>
                  Back
                </button>
              </div>
              {timeSlotsBlock}
            </div>
          )}

          {/* Step 3: Your Details */}
          {bookingStep === 3 && (
            <div className="px-8 py-10">
              <div className="flex items-center justify-between mb-8">
                <p className="font-monument text-[#aaaaaa] text-[11px] tracking-[0.25em] uppercase">Your Details</p>
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1.5 text-[#bbbbbb] hover:text-white text-[10px] uppercase tracking-widest transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5M12 5l-7 7 7 7" />
                  </svg>
                  Back
                </button>
              </div>
              {detailsFormBlock}
            </div>
          )}

          {/* Step 4: Confirmation */}
          {bookingStep === 4 && confirmed && selectedDate && selectedSlot && (
            <div className="px-8 py-16 flex flex-col items-center text-center">
              {confirmationBlock}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Preview layout for homepage embed ─────────────────────────────────────
  return (
    <div className="bg-black text-white">

      {/* Hero */}
      <Section center>
        <p className="font-monument text-[#4a9e8e] text-[11px] tracking-[0.3em] uppercase mb-6">
          {lang === "zh" ? "预约体验" : "Book Your Experience"}
        </p>
        <h1 className="font-monument text-white text-5xl md:text-7xl font-bold mb-6" style={{ letterSpacing: "-0.02em" }}>
          {lang === "zh" ? "预约" : "Reservations"}
        </h1>
        <p className="text-[#cccccc] text-sm leading-relaxed">
          {lang === "zh" ? "在六时茶茗多伦多门店预订茶聚或桌位。" : "Book a tea gathering or table reservation at our Toronto location."}
        </p>
      </Section>

      {/* 1. Choose Experience */}
      <Section>
        <SectionLabel number={1} text="Choose Experience" />
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))" }}>
          {eventTypesLoading && <p className="text-[#aaaaaa] text-xs">Loading experiences…</p>}
          {eventTypesError && <p className="text-red-500 text-xs">{eventTypesError}</p>}
          {!eventTypesLoading && displayedEventTypes.map(et => {
            const isExpanded = expandedCard === et.slug;
            return (
              <div
                key={et.id}
                onClick={() => setExpandedCard(isExpanded ? null : et.slug)}
                className={`text-left p-6 border transition-colors duration-200 flex flex-col min-h-[160px] cursor-pointer ${isExpanded ? "border-white" : "border-[#222222] hover:border-[#444444]"}`}
              >
                <div className="flex flex-col flex-1">
                  <p className="font-monument text-white text-base font-semibold mb-1">
                    {lang === "zh" && EVENT_TRANSLATIONS_ZH[et.slug]?.title ? EVENT_TRANSLATIONS_ZH[et.slug].title : et.title}
                  </p>
                  <div
                    className={`text-[#cccccc] text-xs leading-relaxed overflow-hidden transition-all duration-300 ${isExpanded ? "max-h-[500px] opacity-100 mt-3" : "max-h-0 opacity-0"}`}
                    dangerouslySetInnerHTML={{ __html: lang === "zh" && EVENT_TRANSLATIONS_ZH[et.slug]?.description ? EVENT_TRANSLATIONS_ZH[et.slug].description : cleanDescription(et.description) }}
                  />
                  {isExpanded && (
                    <div className="mt-5">
                      <Link
                        href={`/booking?event=${et.slug}`}
                        onClick={e => e.stopPropagation()}
                        className="inline-block px-6 py-3 bg-[#4a9e8e] text-black text-xs font-semibold tracking-[0.1em] uppercase hover:bg-white transition-colors duration-200"
                      >
                        Book Now
                      </Link>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between mt-6">
                  <span className="text-[#4a9e8e] text-xs tracking-widest uppercase">{et.lengthInMinutes} min</span>
                  {et.price > 0 && <span className="text-[#4a9e8e] text-xs">${(et.price / 100).toFixed(2)}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <div className="h-24" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Default export — standalone /booking route
// ---------------------------------------------------------------------------
function BookingPageInner() {
  const searchParams = useSearchParams();
  const initialEvent = searchParams.get("event") ?? undefined;
  return (
    <>
      {/* Top navigation bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-8 border-b border-white/10 bg-black/80 backdrop-blur-sm">
        <Link
          href="/#reservations"
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors duration-200"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          <span className="font-monument text-[10px] tracking-[0.2em] uppercase">Back</span>
        </Link>
        <Link href="/" className="font-monument text-white text-sm tracking-[0.2em] uppercase">
          Teamendous
        </Link>
        <div className="w-16" />
      </div>
      <main className="bg-black mt-14 min-h-[calc(100vh-56px)] flex flex-col">
        <ReservationsSection mode="full" initialEvent={initialEvent} />
      </main>
    </>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-black" />}>
      <BookingPageInner />
    </Suspense>
  );
}
