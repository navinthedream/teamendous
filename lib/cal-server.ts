const API_KEY = process.env.NEXT_PUBLIC_CAL_API_KEY ?? "";
const CAL_API_BASE = "https://api.cal.com/v2";

export async function getEventType(id: number): Promise<{
  id: number;
  slug: string;
  title: string;
  description: string | null;
  seated: boolean;
}> {
  const res = await fetch(`${CAL_API_BASE}/event-types/${id}`, {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "cal-api-version": "2024-06-14",
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string })?.message ?? `getEventType failed (${res.status})`);
  }
  const json = await res.json();
  const d = json?.data;
  return {
    id: d.id,
    slug: d.slug,
    title: d.title,
    description: d.description ?? null,
    seated: d.seats?.disabled === false,
  };
}

export async function createBooking(input: {
  start: string;
  eventTypeId: number;
  name: string;
  email: string;
  timeZone: string;
  notes: string;
  metadata: Record<string, string>;
}): Promise<string> {
  const res = await fetch(`${CAL_API_BASE}/bookings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
      "cal-api-version": "2024-08-13",
    },
    body: JSON.stringify({
      start: input.start,
      eventTypeId: input.eventTypeId,
      attendee: { name: input.name, email: input.email, timeZone: input.timeZone },
      metadata: input.metadata,
      bookingFieldsResponses: { notes: input.notes },
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const e = new Error((err as { message?: string })?.message ?? `Booking failed (${res.status})`) as Error & { status: number };
    e.status = res.status;
    throw e;
  }
  const json = await res.json();
  return json?.data?.uid as string;
}
