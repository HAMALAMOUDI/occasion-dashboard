import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { badRequest, readJson } from "@/lib/http";
import { CardTemplate, Event } from "@/lib/types";
import { randomUUID } from "crypto";

const OCCASION_TYPES: CardTemplate["occasionType"][] = ["wedding", "graduation", "corporate", "birthday"];
const RATE_PER_CONVERSATION = Number(process.env.RATE_PER_CONVERSATION_SAR) || 0.35;

export async function GET() {
  return NextResponse.json(await db.getEvents());
}

export async function POST(req: NextRequest) {
  const body = await readJson<Event>(req);
  if (!body) return badRequest("Invalid JSON body");

  const name = body.name?.trim();
  const inviterName = body.inviterName?.trim();
  const { occasionType, eventDate, templateId } = body;

  if (!name || !occasionType || !eventDate || !inviterName) return badRequest("Missing required fields");
  if (!OCCASION_TYPES.includes(occasionType)) return badRequest(`occasionType must be one of: ${OCCASION_TYPES.join(", ")}`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate) || Number.isNaN(Date.parse(eventDate))) {
    return badRequest("eventDate must be a valid YYYY-MM-DD date");
  }
  if (templateId) {
    const template = await db.getTemplate(templateId);
    if (!template || template.occasionType !== occasionType) return badRequest("templateId does not match the occasion type");
  }

  const event: Event = {
    id: randomUUID(),
    name,
    occasionType,
    eventDate,
    venue: body.venue?.trim() || "",
    inviterName,
    templateId: templateId || null,
    reminderWeekSentAt: null,
    reminderDaySentAt: null,
    createdAt: new Date().toISOString(),
  };

  await db.createEvent(event, {
    id: randomUUID(),
    eventId: event.id,
    conversationsUsed: 0,
    ratePerConversation: RATE_PER_CONVERSATION,
    invoiceStatus: "draft",
    issuedAt: null,
  });

  return NextResponse.json(event, { status: 201 });
}
