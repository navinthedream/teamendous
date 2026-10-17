import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getEventType } from "@/lib/cal-server";
import { parsePricing, getAmounts } from "@/lib/pricing";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const { eventTypeId, start, name, email, guestCount, timeZone } = body ?? {};

    if (!eventTypeId || !start || !name || !email || guestCount == null || !timeZone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const et = await getEventType(eventTypeId as number);
    const pricing = parsePricing(et.description);

    if (pricing.base <= 0) {
      return NextResponse.json({ error: "Pricing not configured for this event" }, { status: 400 });
    }

    const { subtotalCents } = getAmounts(pricing, guestCount as number, et.seated);

    const whenLabel = new Date(start as string).toLocaleString("en-CA", {
      timeZone: "America/Toronto",
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

    const origin = req.headers.get("origin") ?? new URL(req.url).origin;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    const session = await stripe.checkout.sessions.create({
      ui_mode: "embedded_page",
      mode: "payment",
      redirect_on_completion: "if_required",
      return_url: `${origin}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      customer_email: email as string,
      submit_type: "book",

      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      line_items: [
        {
          price_data: {
            currency: "cad",
            unit_amount: subtotalCents,
            product_data: { name: `${et.title} — ${whenLabel}` },
          },
          quantity: 1,
          tax_rates: [process.env.STRIPE_HST_TAX_RATE_ID!],
        },
      ],
      payment_intent_data: { receipt_email: email as string, capture_method: "manual" },
      metadata: {
        eventTypeId: String(eventTypeId),
        slug: et.slug,
        start: start as string,
        name: name as string,
        email: email as string,
        guestCount: String(et.seated ? 1 : guestCount),
        timeZone: timeZone as string,
      },
    });

    return NextResponse.json({ clientSecret: session.client_secret, sessionId: session.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
