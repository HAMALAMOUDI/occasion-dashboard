import { NextRequest, NextResponse } from "next/server";
import { getMessages } from "@/lib/i18n-server";
import { db } from "@/lib/db";
import { requireEvent } from "@/lib/auth";
import { conflict, notFound } from "@/lib/http";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const err = (await getMessages()).errors;
  const { id } = await params;
  const access = await requireEvent(id);
  if (access instanceof NextResponse) return access;
  const record = await db.getBillingForEvent(id);
  if (!record) return notFound(err.notFound);
  return NextResponse.json(record);
}

// Marks the invoice as issued. In production this is where you'd generate
// the ZATCA-compliant (Fatoora) XML invoice + QR code and push it through
// the ZATCA e-invoicing portal before marking issuedAt.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const t = await getMessages();
  const { id } = await params;
  const access = await requireEvent(id);
  if (access instanceof NextResponse) return access;
  const issued = await db.issueInvoice(id);
  if (issued) return NextResponse.json(issued);

  const record = await db.getBillingForEvent(id);
  if (!record) return notFound(t.errors.notFound);
  return conflict(t.errors.invoiceAlready(t.billing.status[record.invoiceStatus]));
}
