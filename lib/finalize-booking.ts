import Stripe from "stripe";
import { createBooking } from "@/lib/cal-server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function finalizeBooking(sessionId: string): Promise<"confirmed" | "cancelled"> {
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["payment_intent"],
  });

  const pi = session.payment_intent as Stripe.PaymentIntent;

  if (pi.metadata?.calBookingUid) return "confirmed";
  if (pi.status === "canceled") return "cancelled";
  if (pi.status !== "requires_capture") throw new Error("Payment not authorized");

  const { start, eventTypeId, name, email, timeZone, guestCount } = session.metadata ?? {};
  const paidTotal = `$${(session.amount_total! / 100).toFixed(2)} CAD`;

  try {
    const uid = await createBooking({
      start,
      eventTypeId: Number(eventTypeId),
      name,
      email,
      timeZone,
      notes: `Guests: ${guestCount} · Paid via Stripe: ${paidTotal} incl. HST`,
      metadata: {
        guestCount,
        paidTotal,
        stripeSession: session.id,
      },
    });

    await stripe.paymentIntents.capture(pi.id);
    await stripe.paymentIntents.update(pi.id, { metadata: { calBookingUid: uid } });
    return "confirmed";
  } catch (err) {
    const status = (err as { status?: number }).status;
    if (status !== undefined && status >= 400 && status <= 499) {
      await stripe.paymentIntents.cancel(pi.id);
      return "cancelled";
    }
    throw err;
  }
}
