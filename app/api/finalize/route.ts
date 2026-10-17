import { NextRequest, NextResponse } from "next/server";
import { finalizeBooking } from "@/lib/finalize-booking";

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();
    const status = await finalizeBooking(sessionId as string);
    return NextResponse.json({ status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
