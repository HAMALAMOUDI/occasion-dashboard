import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { db } from "@/lib/db";
import { sendBarcode } from "@/lib/whatsapp";

// In production this route's logic lives inside your WhatsApp webhook handler,
// triggered by Meta posting the guest's button-tap payload — not called
// directly from the dashboard. It's exposed here so the demo dashboard can
// simulate a guest response without a live WhatsApp number.
export async function POST(req: NextRequest, { params }: { params: Promise<{ guestId: string }> }) {
  const { guestId } = await params;
  const { decision } = await req.json(); // "accept" | "decline"

  if (decision !== "accept" && decision !== "decline") {
    return NextResponse.json({ error: "decision must be accept or decline" }, { status: 400 });
  }

  if (decision === "decline") {
    const updated = db.updateGuest(guestId, { status: "declined", respondedAt: new Date().toISOString() });
    return NextResponse.json(updated);
  }

  const barcodeValue = `INV-${guestId.slice(0, 8).toUpperCase()}`;
  const dataUrl = await QRCode.toDataURL(barcodeValue, { margin: 1, width: 240 });

  const updated = db.updateGuest(guestId, {
    status: "accepted",
    respondedAt: new Date().toISOString(),
    barcodeValue,
  });

  if (updated) await sendBarcode(updated, dataUrl);

  return NextResponse.json({ ...updated, barcodeDataUrl: dataUrl });
}
