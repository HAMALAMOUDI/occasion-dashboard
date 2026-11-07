"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Camera, CameraOff, CircleAlert, CircleCheck, DoorOpen, Users } from "lucide-react";
import { useLocale, useT } from "@/components/I18nProvider";
import type { Event, Stats } from "@/lib/types";

type Scan = {
  kind: "checked_in" | "already" | "unknown_code" | "not_coming";
  name?: string;
  attending?: number;
  checkedInAt?: string | null;
};

// The browser's own QR decoder where it has one (Chrome, Android); jsQR otherwise (Safari).
type Detector = { detect(source: CanvasImageSource): Promise<{ rawValue: string }[]> };
declare global {
  interface Window {
    BarcodeDetector?: new (opts: { formats: string[] }) => Detector;
  }
}

// Scan guests' QR passes at the door, with the camera or by typing the code.
export default function CheckInPage() {
  const { id } = useParams<{ id: string }>();
  const t = useT();
  const T = t.checkIn;
  const locale = useLocale();
  const [event, setEvent] = useState<Event | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [scan, setScan] = useState<Scan | null>(null);
  const [recent, setRecent] = useState<{ name: string; attending: number; at: string }[]>([]);
  const [code, setCode] = useState("");
  const [camera, setCamera] = useState<"off" | "on" | "error">("off");
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const last = useRef<{ code: string; at: number }>({ code: "", at: 0 });
  const busy = useRef(false);

  const refresh = useCallback(() => {
    fetch(`/api/events/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { event: Event; stats: Stats }) => {
        setEvent(d.event);
        setStats(d.stats);
      })
      .catch(() => undefined);
  }, [id]);
  useEffect(refresh, [refresh]);

  const time = (iso?: string | null) => (iso ? new Date(iso).toLocaleTimeString(locale === "ar" ? "ar-SA" : "en-GB", { hour: "numeric", minute: "2-digit" }) : "");

  const submit = useCallback(
    async (value: string) => {
      const v = value.trim();
      // The camera sees the same pass many times a second: one request per pass, per few seconds.
      if (!v || busy.current || (v === last.current.code && Date.now() - last.current.at < 4000)) return;
      busy.current = true;
      last.current = { code: v, at: Date.now() };
      // Refusals (404 unknown pass, 409 not coming) carry the result and name too, so read every body.
      const body: { result?: Scan["kind"]; guest?: { name: string; attending: number; checkedInAt: string | null } } | null = await fetch(
        `/api/events/${id}/check-in`,
        { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code: v }) }
      )
        .then((r) => r.json())
        .catch(() => null);
      busy.current = false;
      const kind: Scan["kind"] = body?.result ?? "unknown_code";
      const next: Scan = { kind, name: body?.guest?.name, attending: body?.guest?.attending, checkedInAt: body?.guest?.checkedInAt };
      setScan(next);
      navigator.vibrate?.(kind === "checked_in" ? 80 : [60, 60, 60]);
      if (kind === "checked_in" && next.name) {
        setRecent((r) => [{ name: next.name!, attending: next.attending ?? 1, at: next.checkedInAt ?? new Date().toISOString() }, ...r].slice(0, 8));
        refresh();
      }
    },
    [id, refresh]
  );

  function stopCamera() {
    stream.current?.getTracks().forEach((tr) => tr.stop());
    stream.current = null;
    setCamera("off");
  }

  async function startCamera() {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      stream.current = s;
      setCamera("on");
    } catch {
      setCamera("error");
    }
  }

  // While the camera runs, decode a few frames a second.
  useEffect(() => {
    if (camera !== "on" || !video.current || !stream.current) return;
    const el = video.current;
    el.srcObject = stream.current;
    el.play().catch(() => undefined);
    let stopped = false;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const native = window.BarcodeDetector ? new window.BarcodeDetector({ formats: ["qr_code"] }) : null;
    let jsQR: typeof import("jsqr").default | null = null;
    if (!native) import("jsqr").then((m) => (jsQR = m.default));

    const timer = setInterval(async () => {
      if (stopped || el.readyState < 2 || !ctx) return;
      try {
        if (native) {
          const [hit] = await native.detect(el);
          if (hit) submit(hit.rawValue);
        } else if (jsQR) {
          canvas.width = el.videoWidth;
          canvas.height = el.videoHeight;
          ctx.drawImage(el, 0, 0);
          const hit = jsQR(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height, { inversionAttempts: "dontInvert" });
          if (hit) submit(hit.data);
        }
      } catch {
        // A frame that can't be read; the next one will do.
      }
    }, 250);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [camera, submit]);

  // Leaving the page turns the camera off.
  useEffect(() => () => stream.current?.getTracks().forEach((tr) => tr.stop()), []);

  const tone = {
    checked_in: "bg-accept-bg text-accept",
    already: "bg-pending-bg text-pending",
    unknown_code: "bg-decline-bg text-decline",
    not_coming: "bg-decline-bg text-decline",
  };
  const headline = (s: Scan) =>
    s.kind === "checked_in" ? T.welcome(s.name ?? "") : s.kind === "already" ? T.already(s.name ?? "", time(s.checkedInAt)) : s.kind === "not_coming" ? T.notComing(s.name ?? "") : T.unknown;

  return (
    <div className="animate-fade-up space-y-6">
      <Link href={`/events/${id}`} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft size={15} className="rtl:rotate-180" /> {event?.name ?? T.back}
      </Link>
      <div>
        <h1 className="font-serif text-3xl sm:text-4xl">{T.title}</h1>
        <p className="mt-2 text-muted">{T.intro}</p>
      </div>

      {stats && (
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <span className="inline-flex items-center gap-1.5">
            <DoorOpen size={16} className="text-pine" /> {t.stats.checkedIn(stats.checkedIn, stats.accepted)}
          </span>
          <span className="inline-flex items-center gap-1.5 text-muted">
            <Users size={16} /> {t.stats.seats(stats.seatsComing, stats.seats)}
          </span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-4">
          <div className="card overflow-hidden">
            <div className="relative aspect-[4/3] bg-ink">
              {camera === "on" ? (
                <>
                  <video ref={video} muted playsInline className="h-full w-full object-cover" />
                  <span aria-hidden="true" className="pointer-events-none absolute inset-[18%] rounded-2xl border-2 border-white/80" />
                </>
              ) : (
                <div className="grid h-full place-items-center p-6 text-center text-sm text-white/80">
                  {camera === "error" ? T.cameraError : <Camera size={40} className="opacity-60" />}
                </div>
              )}
            </div>
            <div className="flex justify-center p-3">
              {camera === "on" ? (
                <button onClick={stopCamera} className="btn-secondary btn-md">
                  <CameraOff size={16} /> {T.stop}
                </button>
              ) : (
                <button onClick={startCamera} className="btn-primary btn-md">
                  <Camera size={16} /> {T.start}
                </button>
              )}
            </div>
          </div>

          {scan && (
            <div className={`flex items-start gap-3 rounded-2xl px-5 py-4 ${tone[scan.kind]}`} role="status" aria-live="assertive">
              {scan.kind === "checked_in" ? <CircleCheck size={28} className="shrink-0" /> : <CircleAlert size={28} className="shrink-0" />}
              <div>
                <p className="font-serif text-2xl">{headline(scan)}</p>
                {scan.kind === "checked_in" && scan.attending && <p className="mt-1 text-sm">{t.guests.seatsCount(scan.attending)}</p>}
              </div>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              last.current = { code: "", at: 0 };
              submit(code);
              setCode("");
            }}
            className="card flex items-end gap-2 p-4"
          >
            <div className="flex-1">
              <label htmlFor="pass-code" className="label">
                {T.manual}
              </label>
              <input id="pass-code" value={code} onChange={(e) => setCode(e.target.value)} dir="ltr" placeholder="INV-…" autoCapitalize="characters" className="input font-mono" />
            </div>
            <button type="submit" className="btn-primary btn-md">
              {T.check}
            </button>
          </form>
        </div>

        <aside className="card p-5 self-start">
          <h2 className="font-medium">{T.recent}</h2>
          {recent.length === 0 ? (
            <p className="mt-2 text-sm text-muted">{T.none}</p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {recent.map((r, i) => (
                <li key={i} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="min-w-0 truncate font-medium">{r.name}</span>
                  <span className="shrink-0 text-xs text-muted tabular-nums">
                    {t.guests.seatsCount(r.attending)} · {time(r.at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
