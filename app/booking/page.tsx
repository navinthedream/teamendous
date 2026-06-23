"use client";

import { useState, useCallback, useEffect } from "react";

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
    <p className="font-monument text-[#444444] text-[11px] tracking-[0.25em] uppercase mb-8">
      {number}. {text}
    </p>
  );
}

// ---------------------------------------------------------------------------
// ReservationsSection — reusable, no <main> wrapper
// ---------------------------------------------------------------------------
export function ReservationsSection() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const minDate = today;

  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [eventTypesLoading, setEventTypesLoading] = useState(true);
  const [eventTypesError, setEventTypesError] = useState<string | null>(null);

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
    try { setSlots(await fetchAvailableSlots(date, selectedExperience, selectedEventLength)); }
    catch (e) { setSlotsError(e instanceof Error ? e.message : "Could not load slots."); }
    finally { setSlotsLoading(false); }
  }, [selectedExperience, selectedEventLength]);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !selectedEventTypeId) return;
    setSubmitting(true); setBookingError(null);
    try { await submitBooking(selectedSlot.start, name, email, selectedEventTypeId, guestCount, selectedPricing); setConfirmed(true); }
    catch (e) { setBookingError(e instanceof Error ? e.message : "Something went wrong."); }
    finally { setSubmitting(false); }
  };

  const resetAll = () => {
    setConfirmed(false); setSelectedDate(null); setSelectedSlot(null); setSlots([]);
    setName(""); setEmail(""); setGuestCount(2); setSelectedExperience(null);
    setSelectedEventTypeId(null); setSelectedEventLength(120);
    setSelectedPricing({ base: 0, baseGuests: 1, perExtra: 0 });
    setAvailableDays(new Set());
  };

  const calGrid = buildCalendarGrid(viewYear, viewMonth);
  const total = calcTotal(guestCount, selectedPricing);

  return (
    <div className="bg-black text-white">

      {/* Hero */}
      <Section center>
        <p className="font-monument text-[#4a9e8e] text-[11px] tracking-[0.3em] uppercase mb-6">Book Your Experience</p>
        <h1 className="font-monument text-white text-5xl md:text-7xl font-bold mb-6" style={{ letterSpacing: "-0.02em" }}>
          Reservations
        </h1>
        <p className="text-[#555555] text-sm leading-relaxed">
          Book a tea gathering or table reservation at our Toronto location.
        </p>
      </Section>

      {/* 1. Choose Experience */}
      <Section>
        <SectionLabel number={1} text="Choose Experience" />
        <div className="grid grid-cols-2 gap-4">
          {eventTypesLoading && <p className="text-[#444444] text-xs">Loading experiences…</p>}
          {eventTypesError && <p className="text-red-500 text-xs">{eventTypesError}</p>}
          {!eventTypesLoading && eventTypes.map(et => (
            <button
              key={et.id}
              onClick={() => {
                setSelectedExperience(et.slug);
                setSelectedEventTypeId(et.id);
                setSelectedEventLength(et.lengthInMinutes);
                setSelectedPricing(parsePricing(et.description));
                setSelectedDate(null);
                setSelectedSlot(null);
                setSlots([]);
                setAvailableDays(new Set());
              }}
              className={`text-left p-6 border transition-colors duration-200 flex flex-col min-h-[280px] ${selectedExperience === et.slug ? "border-white" : "border-[#222222] hover:border-[#444444]"}`}
            >
              <div className="flex flex-col flex-1">
                <p className="font-monument text-white text-base font-semibold mb-1">{et.title}</p>
                <div className="text-[#555555] text-xs leading-relaxed mt-2" dangerouslySetInnerHTML={{ __html: cleanDescription(et.description) }} />
              </div>
              <div className="flex items-center justify-between mt-6">
                <span className="text-[#4a9e8e] text-xs tracking-widest uppercase">{et.lengthInMinutes} min</span>
                {et.price > 0 && <span className="text-[#4a9e8e] text-xs">${(et.price / 100).toFixed(2)}</span>}
              </div>
            </button>
          ))}
        </div>
      </Section>

      {/* 2. Select Date */}
      {selectedExperience && (
        <Section>
          <SectionLabel number={2} text="Select Date" />
          <div className="w-full max-w-xs">
            <div className="flex items-center justify-between mb-6">
              <button onClick={prevMonth} className="text-[#444444] hover:text-white transition-colors text-xl w-8 h-8 flex items-center justify-center">‹</button>
              <span className="text-white text-sm tracking-[0.15em] uppercase flex items-center gap-2">
                {MONTH_NAMES[viewMonth]} {viewYear}
                {monthLoading && <span className="w-3 h-3 border border-[#4a9e8e] border-t-transparent rounded-full animate-spin inline-block" />}
              </span>
              <button onClick={nextMonth} className="text-[#444444] hover:text-white transition-colors text-xl w-8 h-8 flex items-center justify-center">›</button>
            </div>
            <div className="grid grid-cols-7 mb-2">
              {DOW_LABELS.map(d => (
                <div key={d} className="text-center text-[10px] text-[#333333] uppercase tracking-widest py-1 select-none">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-y-1">
              {calGrid.map((day, i) => {
                if (!day) return <div key={`e-${i}`} aria-hidden />;
                const isDisabled = day < minDate || (!monthLoading && !availableDays.has(toDateString(day)));
                const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                return (
                  <button key={day.toISOString()} disabled={isDisabled} onClick={() => handleDateSelect(day)}
                    className={`mx-auto w-8 h-8 text-xs flex items-center justify-center transition-colors select-none rounded-full
                      ${isDisabled ? "text-[#222222] cursor-not-allowed" : isSelected ? "bg-[#4a9e8e] text-black font-semibold" : "text-[#888888] hover:text-white hover:bg-[#1a1a1a] cursor-pointer"}`}>
                    {day.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
        </Section>
      )}

      {/* 3. Select Time */}
      {selectedDate && (
        <Section>
          <SectionLabel number={3} text="Select Time" />
          <p className="text-[#444444] text-xs mb-8">{formatDateLong(selectedDate)}</p>
          {slotsLoading && (
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 border border-[#4a9e8e] border-t-transparent rounded-full animate-spin" />
              <span className="text-[#444444] text-xs">Checking availability…</span>
            </div>
          )}
          {!slotsLoading && slotsError && (
            <div className="flex items-center gap-4">
              <p className="text-red-500 text-xs">{slotsError}</p>
              <button onClick={() => selectedDate && handleDateSelect(selectedDate)} className="text-[#4a9e8e] text-xs underline">Retry</button>
            </div>
          )}
          {!slotsLoading && !slotsError && slots.length === 0 && (
            <p className="text-[#444444] text-xs">No sessions available — try another date.</p>
          )}
          {!slotsLoading && !slotsError && slots.length > 0 && (
            <div className="grid grid-cols-2 gap-4 w-full">
              {slots.map(slot => (
                <button key={slot.start} onClick={() => { setSelectedSlot(slot); setConfirmed(false); setBookingError(null); }}
                  className={`px-5 py-4 border text-left transition-colors duration-200 ${selectedSlot?.start === slot.start ? "border-white" : "border-[#222222] hover:border-[#444444]"}`}>
                  <p className="text-white text-sm font-medium">{formatTime(slot.start)}</p>
                  <p className="text-[#444444] text-[10px] mt-1 uppercase tracking-widest">{selectedEventLength} min</p>
                  {slot.seatsTotal && (
                    <p className={`text-[10px] mt-1 tracking-widest uppercase ${slot.seatsRemaining && slot.seatsRemaining <= 3 ? "text-red-400" : "text-[#4a9e8e]"}`}>
                      {slot.seatsRemaining}/{slot.seatsTotal} seats remaining
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* 4. Your Details */}
      {selectedSlot && !confirmed && (
        <Section>
          <SectionLabel number={4} text="Your Details" />
          <form onSubmit={handleBookingSubmit} className="flex flex-col gap-6 w-full">
            <div>
              <label className="block text-[#444444] text-[10px] uppercase tracking-[0.2em] mb-2">Name</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Your full name"
                className="w-full bg-transparent border border-[#222222] px-4 py-3 text-white text-sm placeholder:text-[#333333] focus:outline-none focus:border-[#4a9e8e] transition-colors" />
            </div>
            <div>
              <label className="block text-[#444444] text-[10px] uppercase tracking-[0.2em] mb-2">Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                className="w-full bg-transparent border border-[#222222] px-4 py-3 text-white text-sm placeholder:text-[#333333] focus:outline-none focus:border-[#4a9e8e] transition-colors" />
            </div>
            <div>
              <label className="block text-[#444444] text-[10px] uppercase tracking-[0.2em] mb-4">Guests</label>
              <div className="flex items-center gap-5">
                <button type="button" onClick={() => setGuestCount(g => Math.max(1, g - 1))} disabled={guestCount <= 1}
                  className="w-8 h-8 border border-[#222222] text-[#666666] flex items-center justify-center hover:border-[#4a9e8e] hover:text-[#4a9e8e] disabled:opacity-20 disabled:cursor-not-allowed transition-colors text-lg">−</button>
                <span className="text-white font-medium w-4 text-center">{guestCount}</span>
                <button type="button" onClick={() => setGuestCount(g => Math.min(8, g + 1))} disabled={guestCount >= 8}
                  className="w-8 h-8 border border-[#222222] text-[#666666] flex items-center justify-center hover:border-[#4a9e8e] hover:text-[#4a9e8e] disabled:opacity-20 disabled:cursor-not-allowed transition-colors text-lg">+</button>
                <span className="text-[#333333] text-xs">max 8</span>
              </div>
            </div>
            <div className="flex items-baseline justify-between border-t border-[#1a1a1a] pt-6">
              <div>
                <p className="text-[#444444] text-[10px] uppercase tracking-[0.2em] mb-1">Total</p>
                {guestCount > selectedPricing.baseGuests && selectedPricing.perExtra > 0 && (
                  <p className="text-[#333333] text-[10px]">
                    ${selectedPricing.base} + ${(guestCount - selectedPricing.baseGuests) * selectedPricing.perExtra} extra guests
                  </p>
                )}
              </div>
              <p className="text-white text-3xl font-light">
                ${calcTotal(guestCount, selectedPricing)} <span className="text-[#444444] text-sm font-normal">CAD</span>
              </p>
            </div>
            {bookingError && <p className="text-red-500 text-xs">{bookingError}</p>}
            <button type="submit" disabled={submitting}
              className="w-full bg-[#4a9e8e] text-black text-sm font-semibold tracking-[0.1em] uppercase py-4 hover:bg-white transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed">
              {submitting ? "Confirming…" : "Confirm Reservation"}
            </button>
          </form>
        </Section>
      )}

      {/* Confirmation */}
      {confirmed && selectedDate && selectedSlot && (
        <Section>
          <p className="font-monument text-[#4a9e8e] text-[11px] tracking-[0.25em] uppercase mb-6">Reservation Received</p>
          <p className="font-monument text-white text-2xl font-light mb-10">
            We&apos;ll see you soon, {name.split(" ")[0]}.
          </p>
          <div className="border-t border-[#1a1a1a] pt-6 space-y-4 mb-8 w-full max-w-sm">
            {[{ label: "Date", value: formatDateLong(selectedDate) }, { label: "Time", value: formatTime(selectedSlot.start) }, { label: "Guests", value: String(guestCount) }].map(row => (
              <div key={row.label} className="flex justify-between text-sm">
                <span className="text-[#444444]">{row.label}</span>
                <span className="text-white">{row.value}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm border-t border-[#1a1a1a] pt-4">
              <span className="text-[#444444]">Total</span>
              <span className="text-white">${calcTotal(guestCount, selectedPricing)} CAD</span>
            </div>
          </div>
          <div className="border border-[#1a1a1a] p-6 mb-8 w-full max-w-sm">
            <p className="font-monument text-[#4a9e8e] text-[11px] tracking-[0.2em] uppercase mb-3">Complete Your Reservation</p>
            <p className="text-[#555555] text-xs leading-relaxed">
              Send <span className="text-white">${calcTotal(guestCount, selectedPricing)} CAD</span> via e-transfer to{" "}
              <span className="text-[#4a9e8e]">teamendoustoronto@gmail.com</span> to secure your booking.
              Confirmation sent to <span className="text-white">{email}</span>.
            </p>
          </div>
          <button onClick={resetAll} className="text-xs text-[#333333] hover:text-white transition-colors tracking-widest uppercase underline underline-offset-4">
            Book another time
          </button>
        </Section>
      )}

      <div className="h-24" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Default export — standalone /booking route
// ---------------------------------------------------------------------------
export default function BookingPage() {
  return (
    <main className="min-h-screen bg-black">
      <ReservationsSection />
    </main>
  );
}
