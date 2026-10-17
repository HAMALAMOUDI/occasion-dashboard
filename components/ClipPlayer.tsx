"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Pause, Play, RotateCcw } from "lucide-react";
import { CLIP_DURATION, CLIP_H, CLIP_W, renderClipFrame, type ClipFonts, type ClipSpec, type ClipText } from "@/lib/clips/engine";
import type { ClipStyle } from "@/lib/clips/themes";
import type { OccasionType } from "@/lib/occasions";
import { useT } from "./I18nProvider";

type PlayerSpec = { style: ClipStyle; occasion: OccasionType; text: ClipText };

// The portal's fonts, as loaded by next/font on <html> (see app/layout.tsx).
function pageFonts(): ClipFonts {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
  return {
    display: v("--font-display", "Georgia, serif"),
    displayAr: v("--font-display-ar", "serif"),
    body: v("--font-body", "system-ui, sans-serif"),
    bodyAr: v("--font-body-ar", "system-ui, sans-serif"),
    script: v("--font-script", "cursive"),
    scriptAr: v("--font-script-ar", "serif"),
  };
}

// Waits for the clip's fonts, but never more than a moment: a font that's slow
// (or deferred in a background tab) mustn't stop the clip from showing. The
// player redraws when fonts finish loading.
async function loadFonts(fonts: ClipFonts, text: ClipText) {
  const { names, ...rest } = text;
  const sample = [...Object.values(rest), names?.a, names?.b, names?.line, "&و"].join(" ");
  const all = Promise.all(
    [
      `700 72px ${fonts.displayAr}`,
      `400 30px ${fonts.displayAr}`,
      `500 28px ${fonts.bodyAr}`,
      `700 64px ${fonts.display}`,
      `500 28px ${fonts.body}`,
      `400 96px ${fonts.script}`,
      `400 96px ${fonts.scriptAr}`,
    ].map((f) =>
      document.fonts.load(f, sample).catch(() => undefined),
    ),
  );
  await Promise.race([all, new Promise((resolve) => setTimeout(resolve, 2500))]);
}

// The moment shown as a still: everything has arrived and the text is complete.
const POSTER_TIME = 10;

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// `autoPlay: false` starts on the finished still and plays on hover or the play button —
// used when many clips share a page, to keep slower phones smooth.
export default function ClipPlayer({
  spec: specProp,
  className = "",
  label,
  autoPlay = true,
}: {
  spec: PlayerSpec;
  className?: string;
  label: string;
  autoPlay?: boolean;
}) {
  const t = useT();
  const canvas = useRef<HTMLCanvasElement>(null);
  const [playing, setPlaying] = useState(() => autoPlay && !reducedMotion());
  const [visible, setVisible] = useState(false);
  // Fonts are loaded per spec; "ready" once the first load settles (later
  // specs, like names being typed, redraw in place when their fonts arrive).
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const clock = useRef({ start: 0, offset: 0 });
  const fonts = useRef<ClipFonts | null>(null);
  // Re-render only when the spec's content changes, not on every new object.
  const specKey = JSON.stringify(specProp);
  const spec = useMemo(() => JSON.parse(specKey) as PlayerSpec, [specKey]);
  const ready = loadedKey !== null;
  // Bumped when late fonts arrive, so a paused still frame is redrawn with them.
  const [fontEpoch, setFontEpoch] = useState(0);
  useEffect(() => {
    const onLoaded = () => setFontEpoch((n) => n + 1);
    document.fonts.addEventListener("loadingdone", onLoaded);
    return () => document.fonts.removeEventListener("loadingdone", onLoaded);
  }, []);

  useEffect(() => {
    let alive = true;
    fonts.current = pageFonts();
    loadFonts(fonts.current, spec.text).then(() => alive && setLoadedKey(specKey));
    return () => {
      alive = false;
    };
  }, [spec, specKey]);

  // A new scene starts from the beginning; edited wording (e.g. names typed in
  // the editor) carries on from the current moment.
  useEffect(() => {
    clock.current = { start: performance.now(), offset: 0 };
  }, [spec.style, spec.occasion]);

  // Only animate while on screen.
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (!ctx || !ready || !fonts.current) return;
    const full: ClipSpec = { ...spec, fonts: fonts.current };
    if (!playing || !visible) {
      // Paused or off screen: show where playback stopped, or the finished
      // invitation if it hasn't played yet (never the blank opening frame).
      const at = clock.current.offset || POSTER_TIME;
      renderClipFrame(ctx, at, full);
      return;
    }
    clock.current.start = performance.now() - clock.current.offset * 1000;
    let raf = 0;
    const tick = (now: number) => {
      const time = ((now - clock.current.start) / 1000) % CLIP_DURATION;
      clock.current.offset = time;
      renderClipFrame(ctx, time, full);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, visible, ready, spec, fontEpoch]);

  const replay = () => {
    clock.current = { start: performance.now(), offset: 0 };
    setPlaying(true);
  };

  return (
    <div className={`relative overflow-hidden ${className}`} onMouseEnter={() => !reducedMotion() && setPlaying(true)}>
      <canvas ref={canvas} width={CLIP_W} height={CLIP_H} className="block h-auto w-full" role="img" aria-label={label} />
      {!ready && <div className="absolute inset-0 animate-pulse bg-line/50" />}
      <div className="absolute bottom-2 end-2 flex gap-1">
        <button
          type="button"
          onClick={replay}
          className="grid h-8 w-8 place-items-center rounded-full bg-black/35 text-white backdrop-blur hover:bg-black/55"
          aria-label={t.clips.replay}
          title={t.clips.replay}
        >
          <RotateCcw size={14} />
        </button>
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          className="grid h-8 w-8 place-items-center rounded-full bg-black/35 text-white backdrop-blur hover:bg-black/55"
          aria-label={playing ? t.clips.pause : t.clips.play}
          title={playing ? t.clips.pause : t.clips.play}
        >
          {playing ? <Pause size={14} /> : <Play size={14} />}
        </button>
      </div>
    </div>
  );
}

// ------------------------------------------------------------ video download

const MIME_TYPES = ["video/mp4;codecs=avc1.42E01E", "video/mp4", "video/webm;codecs=vp9", "video/webm"];

// Records the clip in real time from a hidden canvas (12 seconds) and returns the video.
async function recordClip(spec: PlayerSpec, onSecond: (s: number) => void): Promise<{ blob: Blob; ext: string }> {
  const mime = MIME_TYPES.find((m) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m));
  if (!mime) throw new Error("no-recorder");
  const fonts = pageFonts();
  await loadFonts(fonts, spec.text);

  const el = document.createElement("canvas");
  el.width = CLIP_W;
  el.height = CLIP_H;
  el.style.cssText = "position:fixed;left:-10000px;top:0;pointer-events:none";
  document.body.appendChild(el);
  const ctx = el.getContext("2d")!;
  const full: ClipSpec = { ...spec, fonts };
  renderClipFrame(ctx, 0, full);

  const recorder = new MediaRecorder(el.captureStream(30), { mimeType: mime, videoBitsPerSecond: 6_000_000 });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const stopped = new Promise<void>((resolve) => (recorder.onstop = () => resolve()));
  recorder.start();

  await new Promise<void>((resolve) => {
    const start = performance.now();
    let lastSecond = -1;
    const tick = (now: number) => {
      const time = (now - start) / 1000;
      renderClipFrame(ctx, Math.min(time, CLIP_DURATION), full);
      const s = Math.floor(time);
      if (s !== lastSecond) onSecond((lastSecond = s));
      if (time < CLIP_DURATION + 0.2) requestAnimationFrame(tick);
      else resolve();
    };
    requestAnimationFrame(tick);
  });
  recorder.stop();
  await stopped;
  el.remove();
  return { blob: new Blob(chunks, { type: mime.split(";")[0] }), ext: mime.startsWith("video/mp4") ? "mp4" : "webm" };
}

export function DownloadClipButton({ spec, filename, className = "" }: { spec: PlayerSpec; filename: string; className?: string }) {
  const t = useT();
  const [state, setState] = useState<{ kind: "idle" } | { kind: "recording"; s: number } | { kind: "done" } | { kind: "error"; msg: string }>({
    kind: "idle",
  });

  async function download() {
    setState({ kind: "recording", s: 0 });
    try {
      const { blob, ext } = await recordClip(spec, (s) => setState({ kind: "recording", s: Math.max(0, CLIP_DURATION - s) }));
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}.${ext}`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      setState({ kind: "done" });
    } catch (e) {
      setState({ kind: "error", msg: e instanceof Error && e.message === "no-recorder" ? t.clips.noRecorder : String(e) });
    }
  }

  return (
    <div className={className}>
      <button type="button" onClick={download} disabled={state.kind === "recording"} className="btn-secondary btn-sm">
        <Download size={13} />
        {state.kind === "recording" ? t.clips.recording(state.s) : state.kind === "done" ? t.clips.downloaded : t.clips.download}
      </button>
      {state.kind === "error" && <p className="mt-1 text-xs text-decline">{state.msg}</p>}
    </div>
  );
}
