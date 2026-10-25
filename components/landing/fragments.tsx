import { Check } from "lucide-react";
import type { Lang } from "@/lib/occasions";
import { messages } from "@/lib/messages";

// Real pieces of what a guest receives, drawn at true size for the landing page.
// Each root carries data-ui: these are the product's own surfaces (its card border,
// its chat bubbles), not page decoration. Sample wording; names are placeholders.

export const SAMPLE: Record<
  Lang,
  { event: string; venue: string; blessing: string; inviteLine: string; families: [string, string]; couple: [string, string]; and: string; date: string; time: string; closing: string; passTitle: string; passNote: string; confirmed: string; thanks: (name: string) => string; now: string; from: string }
> = {
  ar: {
    event: "حفل زواج فهد ونوف",
    venue: "قاعة الياسمين، الرياض",
    blessing: "بارك الله لهما وبارك عليهما وجمع بينهما في خير",
    inviteLine: "تتشرف الأسرتان الكريمتان بدعوتكم لحضور حفل زواج",
    families: ["سارة العتيبي", "مها القحطاني"],
    couple: ["فهد العتيبي", "نوف القحطاني"],
    and: "و",
    date: "15 ديسمبر 2026",
    time: "الزفة 8:00 مساءً",
    closing: "نتشرف بحضوركم",
    passTitle: "رمز الدخول الخاص بك إلى المناسبة",
    passNote: "يُعرض عند الوصول",
    confirmed: "تم تأكيد الحضور",
    thanks: (name) => `شكراً يا ${name}، تم تأكيد حضورك. سيصلك رمز الدخول قبل الحفل.`,
    now: "الآن",
    from: "حكايتي",
  },
  en: {
    event: "Fahad & Nouf’s wedding",
    venue: "Al-Yasmin Hall, Riyadh",
    blessing: "May Allah bless them and unite them in goodness",
    inviteLine: "The two families request the honour of your presence at the wedding of",
    families: ["Sara Al-Otaibi", "Maha Al-Qahtani"],
    couple: ["Fahad Al-Otaibi", "Nouf Al-Qahtani"],
    and: "&",
    date: "15 December 2026",
    time: "Zaffa at 8:00 pm",
    closing: "We look forward to celebrating with you",
    passTitle: "Your entry code for the occasion",
    passNote: "Show it on arrival",
    confirmed: "Attendance confirmed",
    thanks: (name) => `Thank you, ${name}, you’re confirmed. Your entry code arrives before the day.`,
    now: "now",
    from: "Hikayati",
  },
};

function Ornament() {
  return (
    <svg width="120" height="16" viewBox="0 0 120 16" aria-hidden="true" className="mx-auto my-[0.9em] w-[7.5em] text-champagne">
      <path d="M2 8 H48 M72 8 H118" stroke="currentColor" strokeWidth="1" />
      <path d="M60 1 L67 8 L60 15 L53 8 Z" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="51" cy="8" r="1.6" fill="currentColor" />
      <circle cx="69" cy="8" r="1.6" fill="currentColor" />
    </svg>
  );
}

// The printed invitation card. Sized in em, so `className` can set its scale with a font size.
export function Invitation({ lang, className = "" }: { lang: Lang; className?: string }) {
  const s = SAMPLE[lang];
  return (
    <article
      data-ui
      dir={lang === "ar" ? "rtl" : "ltr"}
      lang={lang}
      className={`relative aspect-[3/4.25] overflow-hidden bg-[#fdfbf6] text-ink-deep ${lang === "ar" ? "font-[family-name:var(--font-display-ar)]" : "font-editorial"} ${className}`}
    >
      <div className="absolute inset-[0.9em] border border-champagne/70" />
      <div className="absolute inset-[1.15em] border border-champagne/35" />
      <div className="relative flex h-full flex-col items-center px-[13%] pb-[11%] pt-[12%] text-center">
        <p className="text-[0.95em] leading-[1.7] text-olive">{s.blessing}</p>
        <Ornament />
        <p className="text-[0.82em] leading-[1.7] text-ink-soft">{s.inviteLine}</p>
        <p className="mt-[0.4em] text-[0.85em] leading-[1.7] text-ink-soft">
          {s.families[0]} <span className="mx-1 text-champagne">·</span> {s.families[1]}
        </p>
        <div className="mt-auto">
          <p className="text-[1.75em] leading-[1.4]">{s.couple[0]}</p>
          <p className="my-[0.1em] text-[1.25em] text-champagne">{s.and}</p>
          <p className="text-[1.75em] leading-[1.4]">{s.couple[1]}</p>
        </div>
        <Ornament />
        <p className="text-[0.82em] leading-[1.7] text-ink-soft">{s.venue}</p>
        <p className="text-[0.82em] leading-[1.7]">
          {s.date} <span className="mx-1 text-champagne">·</span> {s.time}
        </p>
        <p className="mt-[0.8em] text-[0.9em] text-olive">{s.closing}</p>
      </div>
    </article>
  );
}

// The chat as the guest sees it: who it's from, the card, the message, the reply buttons.
function Chat({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  const s = SAMPLE[lang];
  return (
    <div data-ui dir={lang === "ar" ? "rtl" : "ltr"} lang={lang} className="w-full max-w-[23rem] rounded-[1.4rem] bg-chat-bg p-4 text-[0.95rem]">
      <div className="mb-3 flex items-center gap-3 px-1">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-olive font-[family-name:var(--font-ruqaa)] text-lg text-paper-warm" aria-hidden="true">
          ح
        </span>
        <p className="leading-tight">
          {s.from} <span className="block text-[0.8rem] text-ink-soft">{s.now}</span>
        </p>
      </div>
      {children}
    </div>
  );
}

export function SentMessage({ lang, name }: { lang: Lang; name: string }) {
  const s = SAMPLE[lang];
  const card = messages[lang].card;
  return (
    <Chat lang={lang}>
      <div className="rounded-xl rounded-ss-sm bg-surface p-1.5">
        <Invitation lang={lang} className="w-full text-[0.5rem]" />
        <p className="px-2 pt-2.5 leading-relaxed">{card.message(name, s.event, s.venue)}</p>
      </div>
      <div className="mt-1 grid grid-cols-2 gap-1">
        {[card.accept, card.decline].map((label) => (
          <span key={label} className="rounded-lg bg-surface py-2 text-center font-medium text-[#027eb5]">
            {label}
          </span>
        ))}
      </div>
    </Chat>
  );
}

export function RepliedMessage({ lang, name }: { lang: Lang; name: string }) {
  const s = SAMPLE[lang];
  const card = messages[lang].card;
  return (
    <Chat lang={lang}>
      <div className="rounded-xl rounded-ss-sm bg-surface px-3 py-2.5 leading-relaxed">{card.message(name, s.event, s.venue)}</div>
      <div className="ms-auto mt-2 w-fit rounded-xl rounded-se-sm bg-whatsapp px-3 py-2.5">{card.accept}</div>
      <div className="mt-2 flex gap-2 rounded-xl rounded-ss-sm bg-surface px-3 py-2.5 leading-relaxed">
        <Check size={18} strokeWidth={2.4} className="mt-0.5 shrink-0 text-olive" />
        {s.thanks(name)}
      </div>
    </Chat>
  );
}

// The entry pass, with a real scannable QR passed in as SVG markup from the server.
export function GuestPass({ lang, name, qr }: { lang: Lang; name: string; qr: string }) {
  const s = SAMPLE[lang];
  return (
    <article data-ui dir={lang === "ar" ? "rtl" : "ltr"} lang={lang} className="w-full max-w-[22rem] rounded-[1.4rem] bg-paper-warm px-7 pb-7 pt-8 text-center">
      <h3 className={`text-[2rem] leading-tight ${lang === "ar" ? "font-[family-name:var(--font-display-ar)]" : "font-editorial"}`}>
        {messages[lang].card.to(name)}
      </h3>
      <p className="mt-3 leading-7 text-ink-soft">
        {s.event}
        <br />
        {s.date} · {s.time}
      </p>
      <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-sage/25 px-4 py-1.5 text-olive">
        <Check size={15} strokeWidth={2.4} /> {s.confirmed}
      </p>
      {/* taste-skill-ignore: the pass's own gold frame around its QR, inside a data-ui fragment */}
      <div
        className="mx-auto mt-5 w-[60%] border border-champagne/60 bg-[#fffdf8] p-3 [&>svg]:h-auto [&>svg]:w-full" /* taste-skill-ignore */
        role="img"
        aria-label={s.passTitle}
        dangerouslySetInnerHTML={{ __html: qr }}
      />
      <p className="mt-4 text-ink-soft">{s.passTitle}</p>
      <p className="text-[0.85rem] text-ink-soft">{s.passNote}</p>
    </article>
  );
}
