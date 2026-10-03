import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = db.getBillingForEvent(id);
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(record);
}

// Marks the invoice as issued. In production this is where you'd generate
// the ZATCA-compliant (Fatoora) XML invoice + QR code and push it through
// the ZATCA e-invoicing portal before marking issuedAt.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = db.getBillingForEvent(id);
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = { ...record, invoiceStatus: "issued" as const, issuedAt: new Date().toISOString() };
  db.upsertBilling(updated);
  return NextResponse.json(updated);
}
