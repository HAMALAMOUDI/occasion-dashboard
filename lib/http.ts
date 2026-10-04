import { NextRequest, NextResponse } from "next/server";

// Parses a JSON body without throwing — malformed bodies become a 400 instead
// of an unhandled 500.
export async function readJson<T = Record<string, unknown>>(req: NextRequest): Promise<Partial<T> | null> {
  try {
    const body = await req.json();
    return body && typeof body === "object" ? (body as Partial<T>) : null;
  } catch {
    return null;
  }
}

export function badRequest(error: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ error, ...extra }, { status: 400 });
}

export function notFound(error = "Not found") {
  return NextResponse.json({ error }, { status: 404 });
}

export function conflict(error: string) {
  return NextResponse.json({ error }, { status: 409 });
}
