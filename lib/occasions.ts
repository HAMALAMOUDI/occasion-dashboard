// Every occasion the portal supports, with its wording in English and Arabic.
//
// `rsvp: false` marks announcement-style occasions (condolences): invitations
// go out without Accept/Decline buttons, there are no reply stats, and no
// reminders are sent. `tone` keeps celebratory touches (🎉, "celebrate") away
// from solemn occasions.

export type Lang = "en" | "ar";
type Text = Record<Lang, string>;

export interface Occasion {
  id: string;
  emoji: string;
  rsvp: boolean;
  tone: "celebration" | "formal" | "solemn";
  label: Text;
  namePlaceholder: Text;
  hostLabel: Text;
  hostPlaceholder: Text;
  // Opening line on the card, written so it reads correctly whoever the host is
  // (Arabic verbs agree with their subject, so the host is a separate signature).
  cardLine: Text;
  // Signature before the host's name, e.g. "Hosted by" / "الداعي".
  hostPrefix: Text;
}

export const OCCASIONS = [
  {
    id: "wedding",
    emoji: "💍",
    rsvp: true,
    tone: "celebration",
    label: { en: "Wedding", ar: "حفل زواج" },
    namePlaceholder: { en: "Sara & Ahmed's Wedding", ar: "حفل زواج سارة وأحمد" },
    hostLabel: { en: "Who is the invitation from?", ar: "الداعي" },
    hostPlaceholder: { en: "The Al-Otaibi family", ar: "عائلة العتيبي" },
    cardLine: { en: "You are cordially invited to", ar: "يسرّنا دعوتكم لحضور" },
    hostPrefix: { en: "Hosted by", ar: "الداعي" },
  },
  {
    id: "engagement",
    emoji: "💐",
    rsvp: true,
    tone: "celebration",
    label: { en: "Engagement", ar: "ملكة وخطوبة" },
    namePlaceholder: { en: "Noura & Faisal's Engagement", ar: "ملكة نورة وفيصل" },
    hostLabel: { en: "Who is the invitation from?", ar: "الداعي" },
    hostPlaceholder: { en: "The Al-Harbi family", ar: "عائلة الحربي" },
    cardLine: { en: "Join us to celebrate", ar: "يسعدنا مشاركتكم فرحة" },
    hostPrefix: { en: "Hosted by", ar: "الداعي" },
  },
  {
    id: "graduation",
    emoji: "🎓",
    rsvp: true,
    tone: "celebration",
    label: { en: "Graduation", ar: "حفل تخرج" },
    namePlaceholder: { en: "Reem's Graduation Party", ar: "حفل تخرج ريم" },
    hostLabel: { en: "Who is the invitation from?", ar: "الداعي" },
    hostPlaceholder: { en: "Reem and her family", ar: "ريم وعائلتها" },
    cardLine: { en: "Join us to celebrate", ar: "يسعدنا دعوتكم لمشاركتنا فرحة" },
    hostPrefix: { en: "Hosted by", ar: "الداعي" },
  },
  {
    id: "eid",
    emoji: "🌙",
    rsvp: true,
    tone: "celebration",
    label: { en: "Eid gathering", ar: "معايدة العيد" },
    namePlaceholder: { en: "Family Eid Gathering", ar: "معايدة العائلة" },
    hostLabel: { en: "Who is the invitation from?", ar: "الداعي" },
    hostPlaceholder: { en: "The Al-Qahtani family", ar: "عائلة القحطاني" },
    cardLine: { en: "Eid Mubarak! You're invited to", ar: "عيدكم مبارك، ويسعدنا دعوتكم إلى" },
    hostPrefix: { en: "Hosted by", ar: "الداعي" },
  },
  {
    id: "ramadan",
    emoji: "🏮",
    rsvp: true,
    tone: "celebration",
    label: { en: "Ramadan iftar / ghabga", ar: "إفطار وغبقة رمضان" },
    namePlaceholder: { en: "Ramadan Ghabga", ar: "غبقة رمضانية" },
    hostLabel: { en: "Who is the invitation from?", ar: "الداعي" },
    hostPlaceholder: { en: "The Al-Shehri family", ar: "عائلة الشهري" },
    cardLine: { en: "Join us for", ar: "يسعدنا دعوتكم إلى" },
    hostPrefix: { en: "Hosted by", ar: "الداعي" },
  },
  {
    id: "newborn",
    emoji: "👶",
    rsvp: true,
    tone: "celebration",
    label: { en: "Newborn / Aqeeqah", ar: "مولود جديد / عقيقة" },
    namePlaceholder: { en: "Welcoming Baby Yousef", ar: "عقيقة المولود يوسف" },
    hostLabel: { en: "Who is the invitation from?", ar: "الداعي" },
    hostPlaceholder: { en: "Khalid & Hind Al-Ghamdi", ar: "خالد وهند الغامدي" },
    cardLine: { en: "Share our joy at", ar: "شاركونا فرحتنا في" },
    hostPrefix: { en: "Hosted by", ar: "الداعي" },
  },
  {
    id: "birthday",
    emoji: "🎂",
    rsvp: true,
    tone: "celebration",
    label: { en: "Birthday", ar: "عيد ميلاد" },
    namePlaceholder: { en: "Lulu's 30th Birthday", ar: "عيد ميلاد لولو الثلاثين" },
    hostLabel: { en: "Who is the invitation from?", ar: "الداعي" },
    hostPlaceholder: { en: "Lulu", ar: "لولو" },
    cardLine: { en: "Come celebrate", ar: "شاركونا الاحتفال بـ" },
    hostPrefix: { en: "Hosted by", ar: "الداعي" },
  },
  {
    id: "corporate",
    emoji: "💼",
    rsvp: true,
    tone: "formal",
    label: { en: "Corporate event", ar: "فعالية رسمية" },
    namePlaceholder: { en: "Annual Partners Dinner", ar: "العشاء السنوي للشركاء" },
    hostLabel: { en: "Hosting organization", ar: "الجهة المنظمة" },
    hostPlaceholder: { en: "Acme Arabia", ar: "شركة أكمي العربية" },
    cardLine: { en: "You are cordially invited to", ar: "يسرّنا دعوتكم لحضور" },
    hostPrefix: { en: "Hosted by", ar: "الجهة المنظمة" },
  },
  {
    id: "condolence",
    emoji: "🤲",
    rsvp: false,
    tone: "solemn",
    label: { en: "Condolences", ar: "عزاء" },
    namePlaceholder: { en: "Condolences for the late Abdullah Al-Harbi", ar: "عزاء الفقيد عبدالله الحربي" },
    hostLabel: { en: "Family receiving condolences", ar: "أهل الفقيد" },
    hostPlaceholder: { en: "The Al-Harbi family", ar: "أبناء وإخوان الفقيد" },
    cardLine: { en: "To Allah we belong, and to Him we shall return", ar: "إنا لله وإنا إليه راجعون" },
    hostPrefix: { en: "Receiving condolences:", ar: "أهل الفقيد" },
  },
  {
    id: "other",
    emoji: "✨",
    rsvp: true,
    tone: "celebration",
    label: { en: "Other gathering", ar: "مناسبة أخرى" },
    namePlaceholder: { en: "Friends' Dinner", ar: "عشاء الأصدقاء" },
    hostLabel: { en: "Who is the invitation from?", ar: "الداعي" },
    hostPlaceholder: { en: "Your name", ar: "اسمك" },
    cardLine: { en: "You're invited to", ar: "يسعدنا دعوتكم إلى" },
    hostPrefix: { en: "Hosted by", ar: "الداعي" },
  },
] as const satisfies readonly Occasion[];

export type OccasionType = (typeof OCCASIONS)[number]["id"];

export const OCCASION_IDS = OCCASIONS.map((o) => o.id) as OccasionType[];

export function isOccasionType(value: unknown): value is OccasionType {
  return typeof value === "string" && (OCCASION_IDS as string[]).includes(value);
}

// Unknown ids (e.g. from older data) fall back to "other" rather than crashing.
export function occasion(id: string): Occasion {
  return OCCASIONS.find((o) => o.id === id) ?? OCCASIONS[OCCASIONS.length - 1];
}

// "Hosted by X" / "الداعي: X" / "أهل الفقيد: X" — the host signature for this occasion.
export function hostLine(o: Occasion, lang: Lang, name: string) {
  return lang === "ar" ? `${o.hostPrefix.ar}: ${name}` : `${o.hostPrefix.en} ${name}`;
}
