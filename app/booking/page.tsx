"use client";

import { useState, useCallback } from "react";

const CAL_USERNAME = "navin-pandey-scvuvp";
const CAL_EVENT_SLUG = "30min";
const API_KEY = process.env.NEXT_PUBLIC_CAL_API_KEY ?? "";
const EVENT_TYPE_ID = 5673722;
const CAL_API_BASE = "https://api.cal.com/v2";
const SLOTS_API_VERSION = "2024-09-04";
const BOOKINGS_API_VERSION = "2024-08-13";
const FIXED_SLOT_HOURS = [10, 14];

const SNACKS = [
  "Peanuts", "Rice Cake", "Rice Crisp Crackers", "Milk Flakes",
  "Roasted Sweet Potato", "Marshmallow", "Chestnuts",
  "Chinese Dates", "Dried Plums", "Seasonal Fruits",
];

const DOW_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

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
function calcTotal(guests: number): number {
  return guests <= 2 ? 49 : 49 + (guests - 2) * 20;
}

async function fetchAvailableSlots(date: Date): Promise<string[]> {
  const endDate = new Date(date);
  endDate.setDate(endDate.getDate() + 1);
  const params = new URLSearchParams({ username: CAL_USERNAME, eventTypeSlug: CAL_EVENT_SLUG, start: toDateString(date), end: toDateString(endDate) });
  const res = await fetch(`${CAL_API_BASE}/slots?${params}`, { headers: { Authorization: `Bearer ${API_KEY}`, "cal-api-version": SLOTS_API_VERSION } });
  if (!res.ok) throw new Error(`Failed to load slots (${res.status})`);
  const json = await res.json();
  const slots: { start: string }[] = json?.data?.[toDateString(date)] ?? [];
  return slots.map((s) => s.start).filter((iso) => FIXED_SLOT_HOURS.includes(new Date(iso).getHours()));
}

async function submitBooking(slot: string, name: string, email: string): Promise<void> {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const res = await fetch(`${CAL_API_BASE}/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}`, "cal-api-version": BOOKINGS_API_VERSION },
    body: JSON.stringify({ start: slot, eventTypeId: EVENT_TYPE_ID, attendee: { name, email, timeZone } }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string })?.message ?? `Booking failed (${res.status})`);
  }
}

export default function BookingPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const minDate = new Date(today);
  minDate.setDate(minDate.getDate() + 7);

  const [viewYear, setViewYear] = useState(minDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(minDate.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [guestCount, setGuestCount] = useState(2);
  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); } else setViewMonth((m) => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); } else setViewMonth((m) => m + 1); };

  const handleDateSelect = useCallback(async (date: Date) => {
    setSelectedDate(date); setSelectedSlot(null); setConfirmed(false); setBookingError(null); setSlots([]); setSlotsError(null); setSlotsLoading(true);
    try { setSlots(await fetchAvailableSlots(date)); } catch (e) { setSlotsError(e instanceof Error ? e.message : "Could not load slots."); } finally { setSlotsLoading(false); }
  }, []);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;
    setSubmitting(true); setBookingError(null);
    try { await submitBooking(selectedSlot, name, email); setConfirmed(true); }
    catch (e) { setBookingError(e instanceof Error ? e.message : "Something went wrong."); }
    finally { setSubmitting(false); }
  };

  const resetAll = () => { setConfirmed(false); setSelectedDate(null); setSelectedSlot(null); setSlots([]); setName(""); setEmail(""); setGuestCount(2); };
  const calGrid = buildCalendarGrid(viewYear, viewMonth);
  const total = calcTotal(guestCount);

  return (
    <main className="min-h-screen bg-[#0f1a0f] flex flex-col items-center px-4 py-16">

      {/* Hero */}
      <div className="w-full max-w-3xl text-center mb-6">
        <p className="text-[#a8c89a] tracking-[0.3em] uppercase text-xs font-medium mb-4">Teamendous · Toronto</p>
        <h1 className="text-white text-4xl md:text-5xl font-bold mb-3" style={{ fontFamily: "'Georgia', serif" }}>
          Tea Gathering <span className="text-[#a8c89a]">围炉小聚</span>
        </h1>
        <p className="text-[#6b8f63] text-base md:text-lg">A Mindful Tea &amp; Seasonal Gathering Experience</p>
        <p className="text-center max-w-none mx-auto text-[#6b8f63] text-sm leading-relaxed mt-3 mb-8">
          Slow down and reconnect through tea, warmth, and meaningful conversation.
          Inspired by traditional Chinese tea culture, our Tea Gathering experience
          is designed for intimate moments shared around the table.
        </p>
      </div>

      <div className="h-12" />
      {/* Booking card */}
      <div className="w-full max-w-3xl mb-24">
        <div className="rounded-2xl overflow-hidden shadow-2xl border border-[#1e3a1e] bg-[#1a2e1a]">
          <div className="flex flex-col md:flex-row min-h-[460px]">

            {/* Left: Calendar */}
            <div className="md:w-[52%] p-8 border-b border-[#1e3a1e] md:border-b-0 md:border-r md:border-[#1e3a1e]">
              <div className="flex items-center justify-between mb-6">
                <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-full text-[#a8c89a] hover:bg-[#2d4d2d] transition-colors text-lg">‹</button>
                <span className="text-white text-sm font-semibold tracking-wide">{MONTH_NAMES[viewMonth]} {viewYear}</span>
                <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-full text-[#a8c89a] hover:bg-[#2d4d2d] transition-colors text-lg">›</button>
              </div>
              <div className="grid grid-cols-7 mb-2">
                {DOW_LABELS.map((d) => (
                  <div key={d} className="text-center text-[10px] text-[#4d7a44] font-semibold uppercase py-1 select-none">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-y-1">
                {calGrid.map((day, i) => {
                  if (!day) return <div key={`e-${i}`} aria-hidden />;
                  const isDisabled = day < minDate;
                  const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                  return (
                    <button key={day.toISOString()} disabled={isDisabled} onClick={() => handleDateSelect(day)}
                      className={["mx-auto w-9 h-9 rounded-full text-sm flex items-center justify-center transition-colors select-none",
                        isDisabled ? "text-[#2a3e2a] cursor-not-allowed" : isSelected ? "bg-[#a8c89a] text-[#0f1a0f] font-bold" : "text-[#b8ccb0] hover:bg-[#2d4d2d] cursor-pointer"].join(" ")}>
                      {day.getDate()}
                    </button>
                  );
                })}
              </div>
              <p className="text-[#2a3e2a] text-[10px] text-center mt-5">Bookings require at least 1 week notice</p>
            </div>

            {/* Right: Slots / Form / Confirmation */}
            <div className="md:w-[48%] p-8 flex flex-col">

              {/* Confirmed */}
              {confirmed && selectedDate && selectedSlot && (
                <div className="flex flex-col items-center justify-center flex-1 text-center gap-5">
                  <div className="w-12 h-12 rounded-full bg-[#a8c89a]/15 flex items-center justify-center">
                    <svg className="w-6 h-6 text-[#a8c89a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-semibold text-base mb-1">Reservation Received</p>
                    <p className="text-[#6b8f63] text-xs">Confirmation sent to <span className="text-[#a8c89a]">{email}</span></p>
                  </div>
                  <div className="bg-[#0f1a0f] rounded-xl px-5 py-4 w-full text-left space-y-2">
                    <p className="text-[#a8c89a] font-semibold text-sm">{formatDateLong(selectedDate)}</p>
                    <p className="text-[#6b8f63] text-sm">{formatTime(selectedSlot)} · 2 hours</p>
                    <p className="text-[#6b8f63] text-sm">{guestCount} guest{guestCount !== 1 ? "s" : ""} · ${calcTotal(guestCount)} CAD</p>
                  </div>
                  <div className="border border-[#a8c89a]/30 rounded-xl px-5 py-4 w-full text-left space-y-2">
                    <p className="text-[#a8c89a] font-semibold text-sm">Complete Your Reservation</p>
                    <p className="text-[#8aaa82] text-sm leading-relaxed">
                      Send <span className="text-white font-semibold">${calcTotal(guestCount)} CAD</span> via e-transfer to{" "}
                      <span className="text-[#a8c89a] font-medium">teamendoustoronto@gmail.com</span> to secure your booking.
                    </p>
                  </div>
                  <button onClick={resetAll} className="text-xs text-[#4d7a44] underline underline-offset-2 hover:text-[#a8c89a] transition-colors">Book another time</button>
                </div>
              )}

              {/* Booking form */}
              {!confirmed && selectedSlot && (
                <div className="flex flex-col flex-1">
                  <div className="flex items-center gap-3 mb-6">
                    <button onClick={() => setSelectedSlot(null)} className="text-[#4d7a44] hover:text-[#a8c89a] transition-colors text-lg leading-none">←</button>
                    <div>
                      <p className="text-white text-sm font-medium">{selectedDate ? formatDateLong(selectedDate) : ""}</p>
                      <p className="text-[#a8c89a] text-xs">{formatTime(selectedSlot)} · 2 hours</p>
                    </div>
                  </div>
                  <form onSubmit={handleBookingSubmit} className="flex flex-col gap-4 flex-1">
                    <div>
                      <label className="block text-[#6b8f63] text-[10px] uppercase tracking-widest mb-1.5">Name</label>
                      <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name"
                        className="w-full bg-[#0f1a0f] border border-[#2d4d2d] rounded-lg px-4 py-3 text-white text-sm placeholder:text-[#2d4d2d] focus:outline-none focus:border-[#a8c89a] transition-colors" />
                    </div>
                    <div>
                      <label className="block text-[#6b8f63] text-[10px] uppercase tracking-widest mb-1.5">Email</label>
                      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                        className="w-full bg-[#0f1a0f] border border-[#2d4d2d] rounded-lg px-4 py-3 text-white text-sm placeholder:text-[#2d4d2d] focus:outline-none focus:border-[#a8c89a] transition-colors" />
                    </div>
                    <div>
                      <label className="block text-[#6b8f63] text-[10px] uppercase tracking-widest mb-1.5">Guests</label>
                      <div className="flex items-center gap-4">
                        <button type="button" onClick={() => setGuestCount((g) => Math.max(1, g - 1))} disabled={guestCount <= 1}
                          className="w-9 h-9 rounded-full border border-[#2d4d2d] text-[#a8c89a] flex items-center justify-center hover:border-[#a8c89a] disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-lg">−</button>
                        <span className="text-white font-semibold text-lg w-4 text-center">{guestCount}</span>
                        <button type="button" onClick={() => setGuestCount((g) => Math.min(8, g + 1))} disabled={guestCount >= 8}
                          className="w-9 h-9 rounded-full border border-[#2d4d2d] text-[#a8c89a] flex items-center justify-center hover:border-[#a8c89a] disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-lg">+</button>
                        <span className="text-[#4d7a44] text-xs">max 8</span>
                      </div>
                    </div>
                    <div className="bg-[#0f1a0f] rounded-xl px-4 py-3 flex items-center justify-between mt-1">
                      <div>
                        <p className="text-[#6b8f63] text-xs uppercase tracking-widest">Total</p>
                        {guestCount > 2 && <p className="text-[#4d7a44] text-[10px] mt-0.5">$49 + ${(guestCount - 2) * 20} extra</p>}
                      </div>
                      <p className="text-white font-bold text-2xl">${total} <span className="text-[#6b8f63] text-xs font-normal">CAD</span></p>
                    </div>
                    {bookingError && <p className="text-red-400 text-xs">{bookingError}</p>}
                    <button type="submit" disabled={submitting}
                      className="mt-auto w-full bg-[#a8c89a] text-[#0f1a0f] font-semibold text-sm py-3 rounded-xl hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                      {submitting ? "Confirming…" : "Confirm Reservation"}
                    </button>
                  </form>
                </div>
              )}

              {/* No date selected */}
              {!confirmed && !selectedSlot && !selectedDate && (
                <div className="flex flex-col items-center justify-center flex-1 text-center gap-3">
                  <svg className="w-10 h-10 text-[#2a3e2a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-[#4d7a44] text-sm">Select a date to continue</p>
                  <p className="text-[#2a3e2a] text-xs">Two sessions available daily</p>
                </div>
              )}

              {/* Loading */}
              {!confirmed && !selectedSlot && selectedDate && slotsLoading && (
                <div className="flex flex-col items-center justify-center flex-1 gap-3">
                  <div className="w-6 h-6 border-2 border-[#a8c89a] border-t-transparent rounded-full animate-spin" />
                  <p className="text-[#6b8f63] text-sm">Checking availability…</p>
                </div>
              )}

              {/* Error */}
              {!confirmed && !selectedSlot && selectedDate && !slotsLoading && slotsError && (
                <div className="flex flex-col items-center justify-center flex-1 text-center gap-3">
                  <p className="text-red-400 text-sm">{slotsError}</p>
                  <button onClick={() => selectedDate && handleDateSelect(selectedDate)} className="text-[#a8c89a] text-xs underline">Try again</button>
                </div>
              )}

              {/* No slots */}
              {!confirmed && !selectedSlot && selectedDate && !slotsLoading && !slotsError && slots.length === 0 && (
                <div className="flex flex-col items-center justify-center flex-1 text-center gap-2">
                  <p className="text-white text-sm font-medium">{formatDateLong(selectedDate)}</p>
                  <p className="text-[#6b8f63] text-sm">No sessions available on this day.</p>
                </div>
              )}

              {/* Slot buttons */}
              {!confirmed && !selectedSlot && selectedDate && !slotsLoading && !slotsError && slots.length > 0 && (
                <div className="flex flex-col flex-1">
                  <p className="text-white text-sm font-medium mb-1">{formatDateLong(selectedDate)}</p>
                  <p className="text-[#4d7a44] text-xs mb-6">{slots.length} session{slots.length !== 1 ? "s" : ""} available · 2 hours each</p>
                  <div className="flex flex-col gap-3">
                    {slots.map((slot) => (
                      <button key={slot} onClick={() => setSelectedSlot(slot)}
                        className="w-full px-5 py-5 rounded-xl border border-[#2d4d2d] hover:border-[#a8c89a] hover:bg-[#2d4d2d]/40 transition-all text-left group">
                        <p className="text-base font-semibold text-[#b8ccb0] group-hover:text-[#a8c89a]">{formatTime(slot)}</p>
                        <p className="text-[#4d7a44] text-xs mt-1">2-hour session</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
      
      <div className="h-12" />
      {/* Package Details */}
      <div className="w-full max-w-2xl mx-auto px-6 pb-24 mt-16">

        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-white text-3xl font-bold mb-3" style={{ fontFamily: "'Georgia', serif" }}>Basic Package</h2>
          <p className="text-[#a8c89a] text-xl font-medium mb-2">Starting at $49 CAD · 2 Hours</p>
          <p className="text-[#6b8f63] text-sm">Includes 1–2 Guests · +$20 CAD per additional guest</p>
          <p className="text-[#4d7a44] text-xs mt-1">Perfect for friends, family, date gatherings, or quiet celebrations</p>
        </div>

        <div className="border-t border-[#1e3a1e] mb-10" />

        {/* Whats included */}
        <p className="text-[#4d7a44] text-xs uppercase tracking-widest text-center mb-6">What&apos;s Included</p>
        <div className="flex flex-wrap justify-center gap-3 mb-4">
          {SNACKS.map((item) => (
            <span key={item} className="px-5 py-2 rounded-full border border-[#2d4d2d] text-[#8aaa82] text-sm whitespace-nowrap">
              {item}
            </span>
          ))}
        </div>
        <p className="text-center text-[#4d7a44] text-xs italic mt-3 mb-10">
          Items may vary depending on seasonal availability.
        </p>

        <div className="border-t border-[#1e3a1e] mb-10" />

        {/* Reservation notes */}
        <p className="text-[#4d7a44] text-xs uppercase tracking-widest text-center mb-6">Reservation Notes</p>
        <div className="flex flex-col gap-4 mb-10">
          {[
            "Reservations required at least 1 week in advance",
            "Full prepayment required via e-transfer to secure reservation",
            "Limited daily availability for a more private and mindful experience",
          ].map((note) => (
            <p key={note} className="text-[#8aaa82] text-sm text-center">· {note}</p>
          ))}
        </div>

        <div className="border-t border-[#1e3a1e] mb-10" />

      </div>
      <div className="h-12" />

    </main>
  );
}
