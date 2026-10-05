import { avatarTone, initials } from "@/lib/client";

export default function Avatar({ name, seed, size = "md" }: { name: string; seed: string; size?: "sm" | "md" }) {
  const dims = size === "sm" ? "h-8 w-8 text-[11px]" : "h-10 w-10 text-xs";
  return (
    <span className={`${dims} ${avatarTone(seed)} grid shrink-0 place-items-center rounded-full font-semibold`} aria-hidden>
      {initials(name)}
    </span>
  );
}
