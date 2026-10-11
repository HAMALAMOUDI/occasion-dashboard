import type { Lang, OccasionType } from "../occasions";

// The Hikayati card catalog: 2 styles × 8 categories × 20 layouts, each with a
// choice of palettes. Data copied from the "Hikayati Invitation Cards" design
// canvas (designs/hikayati/*.dc.html); the layout markup itself is in
// markup.generated.ts.

export type DesignStyle = "classic" | "modern";
export const DESIGN_STYLES: DesignStyle[] = ["classic", "modern"];

export const DESIGN_CATEGORIES = ["wedding", "engagement", "henna", "birthday", "graduation", "baby", "gathering", "corporate"] as const;
export type DesignCategory = (typeof DESIGN_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<DesignCategory, Record<Lang, string>> = {
  wedding: { en: "Weddings", ar: "حفلات الزفاف" },
  engagement: { en: "Engagements", ar: "الملكة والخطوبة" },
  henna: { en: "Henna nights", ar: "ليالي الحناء" },
  birthday: { en: "Birthdays", ar: "أعياد الميلاد" },
  graduation: { en: "Graduations", ar: "حفلات التخرج" },
  baby: { en: "Baby celebrations", ar: "استقبال المواليد" },
  gathering: { en: "Private gatherings", ar: "المناسبات الخاصة" },
  corporate: { en: "Corporate events", ar: "الفعاليات الرسمية" },
};

// Which design categories suit each occasion (first = default). Condolences
// get none: these are celebratory designs.
export const CATEGORIES_FOR_OCCASION: Record<OccasionType, DesignCategory[]> = {
  wedding: ["wedding", "henna"],
  henna: ["henna", "wedding"],
  engagement: ["engagement", "wedding"],
  graduation: ["graduation"],
  eid: ["gathering"],
  ramadan: ["gathering"],
  newborn: ["baby"],
  birthday: ["birthday"],
  corporate: ["corporate"],
  condolence: [],
  other: ["gathering", "birthday", "corporate"],
};

export const LAYOUT_NAMES: Record<DesignStyle, { en: string; ar: string }[]> = {
  classic: [
    ["Classic double frame", "إطار كلاسيكي"], ["Arch", "قوس"], ["Poster headline", "عنوان ملصق"], ["Split block", "مقسوم"],
    ["Side band", "شريط جانبي"], ["Medallion", "ميدالية"], ["Editorial rows", "تحريري"], ["Ticket", "تذكرة"],
    ["Big numeral", "رقم كبير"], ["Monogram", "مونوغرام"], ["Photo", "صورة"], ["Oval window", "نافذة بيضاوية"],
    ["Geometric pattern", "نقوش هندسية"], ["Minimal", "بسيط"], ["Bold poster", "ملصق جريء"], ["Card in card", "بطاقة داخل بطاقة"],
    ["Botanical", "نباتي"], ["Diagonal ribbon", "شريط مائل"], ["Calendar", "تقويم"], ["Envelope", "مغلّف"],
  ].map(([en, ar]) => ({ en, ar })),
  modern: [
    ["Bauhaus shapes", "باوهاوس"], ["Swiss grid", "شبكة سويسرية"], ["Constructivist", "بنائية"], ["Cropped big type", "خط مقصوص"],
    ["Mondrian blocks", "كتل موندريان"], ["Concentric target", "دوائر متحدة"], ["Outline type stack", "حروف مفرّغة"], ["Timeline", "خط زمني"],
    ["Sunrise", "شروق"], ["Op-art stripes", "خطوط بصرية"], ["Mesh gradient + glass", "تدرّج وزجاج"], ["Neural network", "شبكة عصبية"],
    ["Neon horizon", "أفق نيون"], ["Holographic", "هولوغرام"], ["Terminal prompt", "موجّه الأوامر"], ["Waveform", "موجة صوتية"],
    ["Orbit", "مدارات"], ["Dot matrix", "مصفوفة نقاط"], ["Stacked glass cards", "بطاقات زجاجية"], ["Organic blob", "شكل عضوي"],
  ].map(([en, ar]) => ({ en, ar })),
};

export interface Palette {
  bg: string;
  ink: string;
  muted: string;
  accent: string;
  on: string;
  soft: string;
  line: string;
  a2?: string;
  a3?: string;
}

const P = (bg: string, ink: string, muted: string, accent: string, on: string, soft: string, line: string, a2?: string, a3?: string): Palette => ({
  bg, ink, muted, accent, on, soft, line, ...(a2 ? { a2, a3 } : {}),
});

// Classic: five palettes per category.
const CLASSIC_PALETTES: Record<DesignCategory, Palette[]> = {
  wedding: [P("#f6f0e4", "#2b2418", "#6b5a3c", "#8a6a2f", "#fffaf0", "#fffaf0", "#c9b07c"), P("#0f2a24", "#f3ead6", "#a9c4b8", "#e2c27d", "#0f2a24", "#163a32", "#3f6a5c"), P("#f4e1dc", "#3d1f22", "#7a4c50", "#8c3a46", "#fff4f2", "#fbefec", "#d8a9a9"), P("#18213d", "#f2ead8", "#b3b8cc", "#d6b46a", "#18213d", "#222d52", "#3d4a75"), P("#ecebe7", "#1e1e1e", "#5a5a5a", "#6b5b45", "#ffffff", "#f7f6f3", "#c4c0b6")],
  engagement: [P("#dfe6da", "#1f2a22", "#4b5d4f", "#3f5444", "#f2f5ef", "#eef2eb", "#9fb19f"), P("#e9dde6", "#2e1f2b", "#6a5466", "#6e3b62", "#fbf3f8", "#f5eef3", "#c6aec0"), P("#2a1a2e", "#f3e7ef", "#c3aebd", "#e7b7c8", "#2a1a2e", "#3a2640", "#5c4262"), P("#f3e9d8", "#2d2416", "#6d5e45", "#8a6630", "#fffaf0", "#fbf5ea", "#d6c29b"), P("#dde3ec", "#1c2433", "#4e5a70", "#34507a", "#f5f8fc", "#edf1f6", "#a8b5c9")],
  henna: [P("#f7e3d4", "#4a1f14", "#8a4a35", "#9a3b22", "#fff6ee", "#fbefe5", "#e3b9a3"), P("#4a1414", "#f8e6d6", "#d9b3a0", "#e8b04e", "#4a1414", "#5c1d1b", "#7a3a33"), P("#e8e4cc", "#2e2e16", "#5d5d36", "#55652a", "#fafae8", "#f4f1df", "#b9b48a"), P("#f6d99a", "#3d2208", "#6e4a1e", "#8a3d12", "#fff4dc", "#fae6bb", "#d9a858"), P("#3b1030", "#fbe7f2", "#dbb2c9", "#f2a93b", "#3b1030", "#4d1840", "#6e3360")],
  birthday: [P("#ffe066", "#2a1a00", "#5c4300", "#b8300f", "#ffffff", "#fff3b8", "#e6c440"), P("#ffd3e2", "#3a0f23", "#7a3a55", "#a8155f", "#ffffff", "#ffe7ef", "#f19ec0"), P("#c9f0e1", "#0e3328", "#2f6152", "#0c6b50", "#ffffff", "#e3f8f0", "#8fd4bb"), P("#2b1d5c", "#fff6e0", "#c8bff0", "#ffcf3f", "#2b1d5c", "#3a2a78", "#5a4aa0"), P("#cfe7ff", "#0f2240", "#3c5577", "#1d57ad", "#ffffff", "#e6f2ff", "#93bce8")],
  graduation: [P("#142347", "#f4f1ea", "#c9d1e6", "#f2b544", "#142347", "#1d3166", "#33498a"), P("#5a1426", "#f7ece2", "#e0c2c5", "#f0c66b", "#5a1426", "#6d1d31", "#8a3a4e"), P("#f2f4f8", "#0f1c33", "#4a5670", "#1e4fa3", "#ffffff", "#ffffff", "#c4cede"), P("#111111", "#f2ede2", "#b5ad9c", "#d9b44a", "#111111", "#1d1d1d", "#3a3a3a"), P("#0f3b3f", "#eef7f4", "#a9cdc8", "#7fe0c8", "#0f3b3f", "#164a4f", "#2e6a6e")],
  baby: [P("#cfe3f2", "#22354a", "#4f657d", "#2f5f86", "#ffffff", "#ffffff", "#a9c6de"), P("#f6d9d6", "#4a2224", "#7d5254", "#a3474e", "#ffffff", "#fff3f1", "#e2aeae"), P("#dcefd9", "#1f3a24", "#4d6a50", "#356d3d", "#ffffff", "#f2faf0", "#a9cfa8"), P("#f4ead0", "#3a2f12", "#6d5f38", "#8a5f12", "#ffffff", "#fbf6e8", "#d9c690"), P("#e4dcf3", "#2a2140", "#5c5076", "#5b46a0", "#ffffff", "#f4f0fb", "#b8aada")],
  gathering: [P("#1f2430", "#f1ebe1", "#b8b2a7", "#e0a96d", "#1f2430", "#2a3040", "#454d60"), P("#efe8dc", "#2a241c", "#665b4b", "#7a4f2a", "#fffaf2", "#f8f3ea", "#cdbfa8"), P("#2c3020", "#f0ecdc", "#bfbb9f", "#cdbb6a", "#2c3020", "#383d29", "#555a40"), P("#e7d2c2", "#3a2318", "#6d4c3c", "#8b4a2b", "#fff6ef", "#f3e6dc", "#c9a48c"), P("#1a2a3a", "#eef2f5", "#aebccb", "#9cc6e8", "#1a2a3a", "#23384d", "#3d5470")],
  corporate: [P("#f4f2ee", "#111111", "#555555", "#8a6d22", "#ffffff", "#ffffff", "#cfcbc2"), P("#111111", "#f4f2ee", "#a8a49c", "#c8a24a", "#111111", "#1c1c1c", "#3a3a3a"), P("#0d2a52", "#f2f6fb", "#b3c3da", "#5fb3ff", "#0d2a52", "#143a6e", "#2c5288"), P("#eef3f2", "#10302c", "#4a625e", "#1d6f62", "#ffffff", "#ffffff", "#b8cbc7"), P("#2a0f17", "#f5ece6", "#c7b0b4", "#d9a35b", "#2a0f17", "#3a1822", "#5a2f3a")],
};

// Modern: layouts 1–10 use the modernist set, 11–20 the "AI-inspired" set (10 each).
const MODERNIST: Palette[] = [
  P("#f1ece1", "#151515", "#4d4d4d", "#d62f1f", "#ffffff", "#e6dfcf", "#151515", "#1f4fa8", "#f2b705"),
  P("#ffffff", "#111111", "#555555", "#e3001b", "#ffffff", "#f2f2f2", "#111111", "#111111", "#e3001b"),
  P("#0a1ccf", "#ffffff", "#c5cbff", "#ffffff", "#0a1ccf", "#1b2de0", "#4c5cff", "#ffd400", "#ff6b3d"),
  P("#d9d6d0", "#1a1a1a", "#545250", "#1a1a1a", "#d9d6d0", "#e8e6e1", "#1a1a1a", "#ff5a1f", "#8f8b84"),
  P("#e8d9c6", "#2b1a10", "#5e4535", "#b44a25", "#ffffff", "#f3e9dc", "#2b1a10", "#2f4a3a", "#e3a33b"),
  P("#000000", "#ffffff", "#9a9a9a", "#ffffff", "#000000", "#111111", "#333333", "#ff3b1f", "#555555"),
  P("#d7f5e6", "#0d2b1f", "#3d5d50", "#0a7a51", "#ffffff", "#effcf5", "#0d2b1f", "#ff7a59", "#ffd23f"),
  P("#f4efe7", "#1f1b16", "#6b6258", "#1f1b16", "#f4efe7", "#ebe4d8", "#cfc5b6", "#b08a5a", "#8a8075"),
  P("#ff5b14", "#1a0a00", "#4a1d00", "#1a0a00", "#ff5b14", "#ff7a40", "#1a0a00", "#ffffff", "#2238ff"),
  P("#f7d6d9", "#3a0d15", "#73404a", "#a8123a", "#ffffff", "#fbe8ea", "#3a0d15", "#3a0d15", "#e88a9a"),
];
const AI_INSPIRED: Palette[] = [
  P("#0b0b1a", "#f2f2ff", "#a6a6c8", "#7c5cff", "#ffffff", "#16163a", "#2c2c5a", "#00e0c6", "#ff4fd8"),
  P("#0e0e0e", "#f4f4f4", "#a3a3a3", "#c6ff3d", "#0e0e0e", "#1a1a1a", "#333333", "#3dd9ff", "#8a8a8a"),
  P("#fff1ea", "#2a1410", "#6b4a40", "#d9481c", "#ffffff", "#ffffff", "#f1c9b8", "#ff9ccd", "#ffd36e"),
  P("#071a1f", "#eafff9", "#9cc7bd", "#39f2c2", "#071a1f", "#0e2a31", "#1f4a52", "#4d7cff", "#b14dff"),
  P("#e9e4ff", "#1d1640", "#574d86", "#5b3df5", "#ffffff", "#f6f3ff", "#c9bff5", "#ff8fd0", "#7fd7ff"),
  P("#121018", "#f6f2ff", "#b3aac8", "#ff7ad9", "#121018", "#1e1a28", "#3a334a", "#7af0ff", "#c9ff7a"),
  P("#1a0b2e", "#fbe9ff", "#c9a8d9", "#ff8a5c", "#1a0b2e", "#2a1745", "#4a2e6b", "#ff3d8b", "#ffd36e"),
  P("#eaf3ff", "#0c1b33", "#47597a", "#2563eb", "#ffffff", "#ffffff", "#c4d6f2", "#22d3ee", "#a78bfa"),
  P("#10091f", "#fff3ea", "#c7b4c9", "#ff6a3d", "#10091f", "#1c1233", "#3a2a55", "#ff2e88", "#ffc53d"),
  P("#1b1c1f", "#ece7dc", "#a5a094", "#c9a45c", "#1b1c1f", "#26272b", "#3b3c41", "#7ec8c0", "#e6dccb"),
];
const CATEGORY_INDEX: Record<DesignCategory, number> = {
  wedding: 0, engagement: 1, henna: 2, birthday: 3, graduation: 4, baby: 5, gathering: 6, corporate: 7,
};

export function palettesFor(style: DesignStyle, category: DesignCategory, layout: number): Palette[] {
  if (style === "classic") return CLASSIC_PALETTES[category];
  return layout <= 10 ? MODERNIST : AI_INSPIRED;
}

// The palette a layout uses when none is chosen — matches the canvas's "auto".
export function defaultPaletteIndex(style: DesignStyle, category: DesignCategory, layout: number): number {
  if (style === "classic") return (layout - 1) % 5;
  return ((layout - 1) % 10 + CATEGORY_INDEX[category] * 3) % 10;
}

export function categoryIndex(category: DesignCategory) {
  return CATEGORY_INDEX[category];
}

// [display font, body font] per classic layout; [display, weight, body] per modern layout.
export const CLASSIC_FONTS: [string, string][] = [
  ["'Aref Ruqaa', serif", "'Amiri', serif"], ["'Reem Kufi', sans-serif", "'Amiri', serif"], ["'Lalezar', sans-serif", "'Tajawal', sans-serif"], ["'El Messiri', sans-serif", "'El Messiri', sans-serif"], ["'Rakkas', serif", "'Tajawal', sans-serif"],
  ["'Aref Ruqaa', serif", "'IBM Plex Sans Arabic', sans-serif"], ["'IBM Plex Sans Arabic', sans-serif", "'IBM Plex Sans Arabic', sans-serif"], ["'Changa', sans-serif", "'Changa', sans-serif"], ["'Cairo', sans-serif", "'Cairo', sans-serif"], ["'Amiri', serif", "'Amiri', serif"],
  ["'Marhey', sans-serif", "'Tajawal', sans-serif"], ["'Scheherazade New', serif", "'Amiri', serif"], ["'Reem Kufi', sans-serif", "'IBM Plex Sans Arabic', sans-serif"], ["'IBM Plex Sans Arabic', sans-serif", "'IBM Plex Sans Arabic', sans-serif"], ["'Lalezar', sans-serif", "'Cairo', sans-serif"],
  ["'El Messiri', sans-serif", "'Tajawal', sans-serif"], ["'Aref Ruqaa', serif", "'El Messiri', sans-serif"], ["'Lemonada', sans-serif", "'Tajawal', sans-serif"], ["'Readex Pro', sans-serif", "'Readex Pro', sans-serif"], ["'Amiri', serif", "'Amiri', serif"],
];
export const MODERN_FONTS: [string, number, string][] = [
  ["'Rubik', sans-serif", 900, "'Rubik', sans-serif"], ["'Cairo', sans-serif", 900, "'Cairo', sans-serif"], ["'Kufam', sans-serif", 800, "'Almarai', sans-serif"], ["'Alexandria', sans-serif", 800, "'Alexandria', sans-serif"], ["'Noto Kufi Arabic', sans-serif", 900, "'IBM Plex Sans Arabic', sans-serif"],
  ["'Readex Pro', sans-serif", 700, "'Readex Pro', sans-serif"], ["'Rubik', sans-serif", 900, "'Almarai', sans-serif"], ["'Alexandria', sans-serif", 500, "'IBM Plex Sans Arabic', sans-serif"], ["'Almarai', sans-serif", 800, "'Almarai', sans-serif"], ["'Kufam', sans-serif", 800, "'Readex Pro', sans-serif"],
  ["'Alexandria', sans-serif", 300, "'Readex Pro', sans-serif"], ["'Handjet', sans-serif", 700, "'Readex Pro', sans-serif"], ["'Handjet', sans-serif", 700, "'Alexandria', sans-serif"], ["'Alexandria', sans-serif", 800, "'IBM Plex Sans Arabic', sans-serif"], ["'Readex Pro', sans-serif", 500, "'Readex Pro', sans-serif"],
  ["'Noto Kufi Arabic', sans-serif", 700, "'Readex Pro', sans-serif"], ["'Alexandria', sans-serif", 500, "'Alexandria', sans-serif"], ["'Cairo', sans-serif", 900, "'Cairo', sans-serif"], ["'Readex Pro', sans-serif", 700, "'IBM Plex Sans Arabic', sans-serif"], ["'Rubik', sans-serif", 600, "'Rubik', sans-serif"],
];

// The words on a card. Date and venue come from the event; the rest is editable.
export interface DesignFields {
  nameA: string;
  nameB: string;
  kicker: string;
  title: string;
  body: string;
  time: string;
  city: string;
  note: string;
  cta: string;
  en: string;
}
export const FIELD_KEYS: (keyof DesignFields)[] = ["nameA", "nameB", "kicker", "title", "body", "time", "city", "note", "cta", "en"];

// Sample wording per category (from the canvas), used for gallery previews and
// as the starting text when a design is applied to an event.
export const SAMPLE: Record<DesignCategory, DesignFields & { venue: string; date: string }> = {
  wedding: { kicker: "بارك الله لهما وبارك عليهما", title: "حفل زفاف", nameA: "فهد", nameB: "نوف", body: "تتشرف الأسرتان الكريمتان بدعوتكم لحضور حفل زفاف ابنيهما", time: "8:00 مساءً", venue: "قاعة نايراه", city: "الرياض", cta: "تأكيد الحضور", en: "THE WEDDING", note: "نتشرف بحضوركم", date: "2026-12-15" },
  engagement: { kicker: "على بركة الله", title: "حفل ملكة", nameA: "سلطان", nameB: "لمى", body: "بقلوب ملؤها الفرح نشارككم عقد قران ابننا وابنتنا", time: "8:30 مساءً", venue: "فندق ريتز كارلتون", city: "جدة", cta: "تأكيد الحضور", en: "ENGAGEMENT", note: "حضوركم يكمل فرحتنا", date: "2027-02-01" },
  henna: { kicker: "على أنغام الفرح", title: "ليلة الحناء", nameA: "جود", nameB: "", body: "يسعدنا دعوتكم لمشاركتنا ليلة حناء العروس", time: "7:30 مساءً", venue: "استراحة الياسمين", city: "جدة", cta: "أكّدي حضورك", en: "HENNA NIGHT", note: "اللباس: جلابيات تراثية", date: "2027-01-20" },
  birthday: { kicker: "شمعة جديدة", title: "عيد ميلاد", nameA: "ليان", nameB: "", body: "تعالوا نحتفل معًا بعيد ميلاد ليان السابع", time: "5:00 مساءً", venue: "حديقة السلام", city: "الرياض", cta: "سأحضر!", en: "BIRTHDAY PARTY", note: "الألعاب والكيك علينا", date: "2026-11-14" },
  graduation: { kicker: "أخيرًا… تخرّجنا", title: "حفل تخرج", nameA: "رغد العمودي", nameB: "", body: "شاركونا فرحة الإنجاز بتخرجها من جامعة الملك عبدالعزيز", time: "8:00 مساءً", venue: "مطعم سنابل", city: "جدة", cta: "أكّد حضورك", en: "CLASS OF 2027", note: "دفعة 2027", date: "2027-06-12" },
  baby: { kicker: "وصل نجمنا الصغير", title: "استقبال مولود", nameA: "يوسف", nameB: "", body: "يسعد والداه محمد وهند بدعوتكم لمشاركتهم فرحة استقبال مولودهم", time: "بعد صلاة العصر", venue: "منزل الجد · حي الروضة", city: "جدة", cta: "سنكون معكم", en: "WELCOME BABY", note: "حضوركم فرحتنا", date: "2027-03-05" },
  gathering: { kicker: "جمعة أحباب", title: "عشاء خاص", nameA: "عائلة العمودي", nameB: "", body: "يسعدنا اجتماعكم على مائدة عشاء في أمسية هادئة", time: "9:00 مساءً", venue: "مزرعة النخيل", city: "الطائف", cta: "تأكيد الحضور", en: "PRIVATE DINNER", note: "عدد المقاعد محدود", date: "2026-11-26" },
  corporate: { kicker: "دعوة رسمية", title: "الحفل السنوي", nameA: "للشركاء", nameB: "", body: "يتشرف مجلس الإدارة بدعوتكم لحضور الحفل السنوي وتكريم شركاء النجاح", time: "7:00 مساءً", venue: "فندق فيرمونت", city: "الرياض", cta: "تسجيل الحضور", en: "PARTNERS GALA", note: "اللباس: رسمي", date: "2026-12-16" },
};

// A category's sample wording, without the venue/date (those come from the event).
export function sampleFields(category: DesignCategory): DesignFields {
  return Object.fromEntries(FIELD_KEYS.map((k) => [k, SAMPLE[category][k]])) as unknown as DesignFields;
}

export function isDesignCategory(v: unknown): v is DesignCategory {
  return typeof v === "string" && (DESIGN_CATEGORIES as readonly string[]).includes(v);
}
