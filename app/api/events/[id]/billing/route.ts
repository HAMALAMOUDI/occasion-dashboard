import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { conflict, notFound } from "@/lib/http";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = await db.getBillingForEvent(id);
  if (!record) return notFound();
  return NextResponse.json(record);
}

// Marks the invoice as issued. In production this is where you'd generate
// the ZATCA-compliant (Fatoora) XML invoice + QR code and push it through
// the ZATCA e-invoicing portal before marking issuedAt.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const issued = await db.issueInvoice(id);
  if (issued) return NextResponse.json(issued);

  const record = await db.getBillingForEvent(id);
  if (!record) return notFound();
  return conflict(`Invoice is already ${record.invoiceStatus}`);
}
