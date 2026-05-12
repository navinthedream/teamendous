"use client";

import { useState, useCallback } from "react";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const CAL_USERNAME = "navin-pandey-scvuvp";
const CAL_EVENT_SLUG = "30min";

/**
 * Cal.com API key — generate one at:
 * Cal.com Dashboard → Settings → Developer → API Keys → Add New Key
 *
 * Add to .env.local:
 *   NEXT_PUBLIC_CAL_API_KEY=cal_live_xxxxxxxxxxxx
 *
 * ⚠️  NEXT_PUBLIC_ exposes this key in the browser bundle. For production,
 * proxy these requests through /app/api/cal/route.ts using a server-only var.
 */
const API_KEY = process.env.NEXT_PUBLIC_CAL_API_KEY ?? "";

/**
 * Find your numeric event type ID:
 * Cal.com → Event Types → click your 30min event → the ID is in the URL:
 *   /event-types/<ID>
 */
const EVENT_TYPE_ID = 5673722; // TODO: replace with your numeric event type ID

const CAL_API_BASE = "https://api.cal.com/v2";
const SLOTS_API_VERSION = "2024-09-04";
const BOOKINGS_API_VERSION = "2024-08-13";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const DOW_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDateLong(d: Date) {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

/** Returns an array of (Date | null) where null = empty leading cell. */
function buildCalendarGrid(year: number, month: number): (Date | null)[] {
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = Array(firstDow).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  return cells;
}

// ---------------------------------------------------------------------------
// Cal.com API calls
// ---------------------------------------------------------------------------
/** Format a Date as YYYY-MM-DD (local calendar date, not UTC). */
function toDateString(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

async function fetchAvailableSlots(date: Date): Promise<string[]> {
  // end = the day after the selected date (exclusive upper bound)
  const endDate = new Date(date);
  endDate.setDate(endDate.getDate() + 1);

  const params = new URLSearchParams({
    username: CAL_USERNAME,
    eventTypeSlug: CAL_EVENT_SLUG,
    start: toDateString(date),
    end: toDateString(endDate),
  });

  const res = await fetch(`${CAL_API_BASE}/slots?${params}`, {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "cal-api-version": SLOTS_API_VERSION,
    },
  });

  if (!res.ok) throw new Error(`Failed to load slots (${res.status})`);
  const json = await res.json();

  // Response: { status: "success", data: { "YYYY-MM-DD": [{ start: "..." }] } }
  const dateKey = toDateString(date);
  const slots: { start: string }[] = json?.data?.[dateKey] ?? [];
  return slots.map((s) => s.start);
}

async function submitBooking(
  slot: string,
  name: string,
  email: string
): Promise<void> {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const res = await fetch(`${CAL_API_BASE}/bookings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
      "cal-api-version": BOOKINGS_API_VERSION,
    },
    body: JSON.stringify({
      start: slot,
      eventTypeId: EVENT_TYPE_ID, // must be a number
      attendee: { name, email, timeZone },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string })?.message ?? `Booking failed (${res.status})`
    );
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function BookingPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calendar navigation
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  // Selection state
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // Booking form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  // Month navigation
  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const handleDateSelect = useCallback(async (date: Date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setConfirmed(false);
    setBookingError(null);
    setSlots([]);
    setSlotsError(null);
    setSlotsLoading(true);
    try {
      setSlots(await fetchAvailableSlots(date));
    } catch (e) {
      setSlotsError(e instanceof Error ? e.message : "Could not load slots.");
    } finally {
      setSlotsLoading(false);
    }
  }, []);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;
    setSubmitting(true);
    setBookingError(null);
    try {
      await submitBooking(selectedSlot, name, email);
      setConfirmed(true);
    } catch (e) {
      setBookingError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetAll = () => {
    setConfirmed(false);
    setSelectedDate(null);
    setSelectedSlot(null);
    setSlots([]);
    setName("");
    setEmail("");
    setNotes("");
  };

  const calGrid = buildCalendarGrid(viewYear, viewMonth);

  return (
    <main className="min-h-screen bg-[#0f1a0f] flex flex-col items-center justify-start px-4 py-16">
      {/* Header */}
      <div className="text-center mb-10">
        <p className="text-[#a8c89a] tracking-[0.3em] uppercase text-sm font-medium mb-3">
          Reserve Your Spot
        </p>
        <h1
          className="text-white text-5xl font-bold mb-4"
          style={{ fontFamily: "'Georgia', serif", letterSpacing: "-0.02em" }}
        >
          Book a Table
        </h1>
        <p className="text-[#6b8f63] text-base max-w-md mx-auto leading-relaxed">
          Select a date and time below to reserve your table at Teamendous.
          We'll confirm your booking by email.
        </p>
      </div>

      {/* Two-panel card */}
      <div className="w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl border border-[#1e3a1e] bg-[#1a2e1a]">
        <div className="flex flex-col md:flex-row min-h-[420px]">

          {/* ── Left panel: Month calendar ─────────────────────────────── */}
          <div className="md:w-[52%] p-6 border-b border-[#1e3a1e] md:border-b-0 md:border-r md:border-[#1e3a1e]">
            {/* Month nav */}
            <div className="flex items-center justify-between mb-5">
              <button
                onClick={prevMonth}
                aria-label="Previous month"
                className="w-8 h-8 flex items-center justify-center rounded-full text-[#a8c89a] hover:bg-[#2d4d2d] transition-colors text-lg leading-none"
              >
                ‹
              </button>
              <span className="text-white text-sm font-semibold tracking-wide">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </span>
              <button
                onClick={nextMonth}
                aria-label="Next month"
                className="w-8 h-8 flex items-center justify-center rounded-full text-[#a8c89a] hover:bg-[#2d4d2d] transition-colors text-lg leading-none"
              >
                ›
              </button>
            </div>

            {/* Day-of-week labels */}
            <div className="grid grid-cols-7 mb-2">
              {DOW_LABELS.map((d) => (
                <div
                  key={d}
                  className="text-center text-[10px] text-[#4d7a44] font-semibold uppercase py-1 select-none"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-y-1">
              {calGrid.map((day, i) => {
                if (!day) return <div key={`e-${i}`} aria-hidden />;
                const isPast = day < today;
                const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                const isToday = isSameDay(day, today);

                return (
                  <button
                    key={day.toISOString()}
                    disabled={isPast}
                    onClick={() => handleDateSelect(day)}
                    aria-label={day.toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                    })}
                    aria-pressed={isSelected}
                    className={[
                      "mx-auto w-8 h-8 rounded-full text-sm flex items-center justify-center transition-colors select-none",
                      isPast
                        ? "text-[#2a3e2a] cursor-not-allowed"
                        : isSelected
                        ? "bg-[#a8c89a] text-[#0f1a0f] font-bold"
                        : isToday
                        ? "ring-1 ring-[#a8c89a] text-[#a8c89a] hover:bg-[#2d4d2d] cursor-pointer"
                        : "text-[#b8ccb0] hover:bg-[#2d4d2d] cursor-pointer",
                    ].join(" ")}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Right panel: Slots / Form / Confirmation ────────────────── */}
          <div className="md:w-[48%] p-6 flex flex-col">

            {/* — Confirmed — */}
            {confirmed && (
              <div className="flex flex-col items-center justify-center flex-1 text-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#a8c89a]/15 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-[#a8c89a]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-semibold mb-1">Booking Confirmed!</p>
                  <p className="text-[#6b8f63] text-sm">
                    A confirmation has been sent to{" "}
                    <span className="text-[#a8c89a]">{email}</span>.
                  </p>
                </div>
                {selectedDate && selectedSlot && (
                  <div className="bg-[#0f1a0f] rounded-xl px-4 py-3 text-sm w-full">
                    <p className="text-[#a8c89a] font-medium">
                      {formatDateLong(selectedDate)}
                    </p>
                    <p className="text-[#6b8f63]">{formatTime(selectedSlot)}</p>
                  </div>
                )}
                <button
                  onClick={resetAll}
                  className="mt-1 text-xs text-[#4d7a44] underline underline-offset-2 hover:text-[#a8c89a] transition-colors"
                >
                  Book another time
                </button>
              </div>
            )}

            {/* — Booking form (slot selected) — */}
            {!confirmed && selectedSlot && (
              <div className="flex flex-col flex-1">
                {/* Back + selected slot summary */}
                <div className="flex items-center gap-2 mb-5">
                  <button
                    onClick={() => setSelectedSlot(null)}
                    aria-label="Back to time slots"
                    className="text-[#4d7a44] hover:text-[#a8c89a] transition-colors text-base leading-none"
                  >
                    ←
                  </button>
                  <div>
                    <p className="text-white text-sm font-medium leading-tight">
                      {selectedDate ? formatDateLong(selectedDate) : ""}
                    </p>
                    <p className="text-[#a8c89a] text-xs">{formatTime(selectedSlot)}</p>
                  </div>
                </div>

                <form onSubmit={handleBookingSubmit} className="flex flex-col gap-3 flex-1">
                  <div>
                    <label className="block text-[#6b8f63] text-[10px] uppercase tracking-widest mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full bg-[#0f1a0f] border border-[#2d4d2d] rounded-lg px-3 py-2 text-white text-sm placeholder:text-[#2d4d2d] focus:outline-none focus:border-[#a8c89a] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[#6b8f63] text-[10px] uppercase tracking-widest mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full bg-[#0f1a0f] border border-[#2d4d2d] rounded-lg px-3 py-2 text-white text-sm placeholder:text-[#2d4d2d] focus:outline-none focus:border-[#a8c89a] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[#6b8f63] text-[10px] uppercase tracking-widest mb-1">
                      Notes{" "}
                      <span className="normal-case tracking-normal opacity-50 text-[10px]">
                        (optional)
                      </span>
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any special requests?"
                      rows={3}
                      className="w-full bg-[#0f1a0f] border border-[#2d4d2d] rounded-lg px-3 py-2 text-white text-sm placeholder:text-[#2d4d2d] focus:outline-none focus:border-[#a8c89a] transition-colors resize-none"
                    />
                  </div>

                  {bookingError && (
                    <p className="text-red-400 text-xs">{bookingError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="mt-auto w-full bg-[#a8c89a] text-[#0f1a0f] font-semibold text-sm py-2.5 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Confirming…" : "Confirm Reservation"}
                  </button>
                </form>
              </div>
            )}

            {/* — No date selected yet — */}
            {!confirmed && !selectedSlot && !selectedDate && (
              <div className="flex flex-col items-center justify-center flex-1 text-center gap-3">
                <svg
                  className="w-10 h-10 text-[#2a3e2a]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-[#4d7a44] text-sm">
                  Select a date to see available times
                </p>
              </div>
            )}

            {/* — Loading slots — */}
            {!confirmed && !selectedSlot && selectedDate && slotsLoading && (
              <div className="flex flex-col items-center justify-center flex-1 gap-3">
                <div className="w-6 h-6 border-2 border-[#a8c89a] border-t-transparent rounded-full animate-spin" />
                <p className="text-[#6b8f63] text-sm">Loading availability…</p>
              </div>
            )}

            {/* — Slots error — */}
            {!confirmed && !selectedSlot && selectedDate && !slotsLoading && slotsError && (
              <div className="flex flex-col items-center justify-center flex-1 text-center gap-3">
                <p className="text-red-400 text-sm">{slotsError}</p>
                <button
                  onClick={() => selectedDate && handleDateSelect(selectedDate)}
                  className="text-[#a8c89a] text-xs underline underline-offset-2 hover:opacity-80 transition-opacity"
                >
                  Try again
                </button>
              </div>
            )}

            {/* — No slots available — */}
            {!confirmed && !selectedSlot && selectedDate && !slotsLoading && !slotsError && slots.length === 0 && (
              <div className="flex flex-col items-center justify-center flex-1 text-center gap-2">
                <p className="text-white text-sm font-medium">
                  {formatDateLong(selectedDate)}
                </p>
                <p className="text-[#6b8f63] text-sm">No availability on this day.</p>
                <p className="text-[#4d7a44] text-xs">Try another date.</p>
              </div>
            )}

            {/* — Slot grid — */}
            {!confirmed && !selectedSlot && selectedDate && !slotsLoading && !slotsError && slots.length > 0 && (
              <div className="flex flex-col flex-1">
                <p className="text-white text-sm font-medium mb-0.5">
                  {formatDateLong(selectedDate)}
                </p>
                <p className="text-[#4d7a44] text-xs mb-4">
                  {slots.length} time{slots.length !== 1 ? "s" : ""} available
                </p>
                <div className="overflow-y-auto flex-1 pr-1 max-h-64">
                  <div className="grid grid-cols-2 gap-2">
                    {slots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setSelectedSlot(slot)}
                        className="px-3 py-2 rounded-lg border border-[#2d4d2d] text-[#b8ccb0] text-sm hover:border-[#a8c89a] hover:text-[#a8c89a] hover:bg-[#2d4d2d]/40 transition-all"
                      >
                        {formatTime(slot)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </main>
  );
}
