import { NextRequest, NextResponse } from "next/server";
import { getLocale, getMessages } from "@/lib/i18n-server";
import { db } from "@/lib/db";
import { eventsFor, requireUser } from "@/lib/auth";
import { badRequest, readJson } from "@/lib/http";
import { isLocale } from "@/lib/i18n";
import { isOccasionType } from "@/lib/occasions";
import { Event } from "@/lib/types";
import { randomUUID } from "crypto";

const RATE_PER_CONVERSATION = Number(process.env.RATE_PER_CONVERSATION_SAR) || 0.35;

export async function GET() {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;
  return NextResponse.json(await eventsFor(user));
}

export async function POST(req: NextRequest) {
  const err = (await getMessages()).errors;
  const user = await requireUser();
  if (user instanceof NextResponse) return user;

  const body = await readJson<Event>(req);
  if (!body) return badRequest(err.invalidBody);

  const name = body.name?.trim();
  const inviterName = body.inviterName?.trim();
  const { occasionType, eventDate, templateId } = body;

  if (!name || !eventDate || !inviterName) return badRequest(err.missingFields);
  if (!isOccasionType(occasionType)) return badRequest(err.invalidOccasion);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate) || Number.isNaN(Date.parse(eventDate))) return badRequest(err.invalidDate);
  if (templateId) {
    const template = await db.getTemplate(templateId);
    if (!template || template.occasionType !== occasionType) return badRequest(err.templateMismatch);
  }

  const event: Event = {
    id: randomUUID(),
    name,
    occasionType,
    eventDate,
    venue: body.venue?.trim() || "",
    inviterName,
    templateId: templateId || null,
    ownerPhone: user.phone,
    // Invitations default to the organizer's own language.
    language: isLocale(body.language) ? body.language : await getLocale(),
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
