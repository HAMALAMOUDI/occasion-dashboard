"use client";

import { useEffect, useState } from "react";

type Labels = { days: string; hours: string; minutes: string; today: string; passed: string };

// Days, hours and minutes until the occasion's date begins (Saudi time), then
// "it's today", then "it has passed". Before hydration it shows nothing, so the
// server and the guest's clock never disagree on screen.
export default function Countdown({ date, labels }: { date: string; labels: Labels }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, 30_000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, []);
  if (now === null) return <div className="h-[5.5rem]" aria-hidden="true" />;

  const start = Date.parse(`${date}T00:00:00+03:00`);
  const end = start + 24 * 3600_000;
  if (now >= end) return <p className="text-[1.0625rem] text-ink-soft">{labels.passed}</p>;
  if (now >= start) return <p className="font-editorial text-[2rem] text-ink-deep">{labels.today}</p>;

  const mins = Math.floor((start - now) / 60_000);
  const parts = [
    [Math.floor(mins / 1440), labels.days],
    [Math.floor((mins % 1440) / 60), labels.hours],
    [mins % 60, labels.minutes],
  ] as const;
  return (
    <div className="flex justify-center gap-3" role="timer">
      {parts.map(([n, label]) => (
        <div key={label} className="min-w-[5.25rem] bg-bone px-3 py-3 text-center">
          <span className="block font-editorial text-[2.25rem] leading-none tabular-nums text-ink-deep">{n}</span>
          <span className="mt-1 block text-[0.8125rem] text-ink-soft">{label}</span>
        </div>
      ))}
    </div>
  );
}
