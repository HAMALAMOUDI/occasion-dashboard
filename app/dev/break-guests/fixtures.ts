import type { Guest, GuestStatus, Stats } from "@/lib/types";

// Worst-case fixtures for GuestTable and StatsGrid (dev-only, see page.tsx).
// Every value is something a real organizer's spreadsheet can contain: names
// and phones are unbounded `text` in the database, and uploads allow 5,000 rows.

type Row = Pick<Guest, "name" | "phone" | "status"> & Partial<Pick<Guest, "barcodeValue" | "lastError">>;

function guests(rows: Row[]): Guest[] {
  return rows.map((r, i) => ({
    id: `g${i + 1}`,
    eventId: "dev",
    inviteSentAt: r.status === "pending" ? null : "2026-10-10T12:00:00Z",
    respondedAt: r.status === "accepted" || r.status === "declined" ? "2026-10-11T09:30:00Z" : null,
    checkedInAt: null,
    barcodeValue: null,
    lastError: null,
    ...r,
  }));
}

export function statsOf(list: Guest[]): Stats {
  const count = (...s: GuestStatus[]) => list.filter((g) => s.includes(g.status)).length;
  return {
    total: list.length,
    accepted: count("accepted"),
    declined: count("declined"),
    pending: count("pending", "no_response"),
    notSent: count("pending"),
    invalid: count("invalid"),
  };
}

export const DEMO = guests([
  { name: "سارة القحطاني", phone: "+966501234567", status: "accepted", barcodeValue: "INV-4C21E0A97B3D6F18" },
  { name: "Omar Haddad", phone: "+966551112233", status: "no_response" },
  { name: "نورة العتيبي", phone: "+966509998877", status: "declined" },
  { name: "Lina Farouk", phone: "+966534445566", status: "pending" },
  { name: "فهد الدوسري", phone: "0501", status: "invalid", lastError: "invalid_number" },
]);

// Different failures spread across the first rows, as real data mixes them.
export const WORST = guests([
  {
    // Full nasab, as people write it on wedding lists.
    name: "عبد الرحمن بن عبد العزيز بن عبد الله بن محمد بن إبراهيم العبد اللطيف",
    phone: "٠٥٠١٢٣٤٥٦٧", // Arabic-Indic digits from an Arabic keyboard
    status: "invalid",
    lastError: "invalid_number",
  },
  {
    // Title, slash and a role in parentheses, pasted from an office list.
    name: "معالي الدكتور/ عبدالله بن محمد بن سليمان الغامدي (وكيل الوزارة للشؤون التعليمية)",
    phone: "+966501234567",
    status: "accepted",
    barcodeValue: "INV-9F3A61C0B2D47E58",
  },
  {
    name: "Dr. Mohammed Abdulrahman Al-Qahtani",
    phone: "+966501234567,+966559876543", // two numbers in one Excel cell, no space
    status: "invalid",
    lastError: "invalid_number",
  },
  { name: "ع", phone: "+966551112233", status: "no_response" },
  { name: "فَاطِمَة الزَّهْرَاء", phone: "+966509998877", status: "pending", lastError: "template_error" },
  { name: "أم خالد 🌸", phone: "لا يوجد", status: "invalid", lastError: "invalid_number" },
  { name: "محمد\nالعتيبي", phone: "+966534445566", status: "declined" }, // Alt+Enter inside an Excel cell
  { name: "إبراهيم", phone: "+966535556677", status: "no_response", lastError: "reminder_failed" },
  { name: "Aleksandra Wiśniewska-Kowalczyk", phone: "+48601234567", status: "accepted", barcodeValue: "INV-07D2B1E94A6C3F50" },
  { name: "أحمد الزهراني", phone: "+966 50 123 4567 / 0559876543", status: "invalid", lastError: "invalid_number" },
]);

export const ONE = guests([{ name: "سارة القحطاني", phone: "+966501234567", status: "accepted", barcodeValue: "INV-4C21E0A97B3D6F18" }]);

const FIRST = ["عبد الله", "محمد", "فاطمة", "نورة", "عبد الرحمن", "سارة", "خالد", "ريم", "Omar", "Lina", "تركي", "هيا"];
const LAST = ["القحطاني", "العتيبي", "الغامدي", "الدوسري", "الزهراني", "الشمري", "Haddad", "العبد اللطيف", "المطيري"];
const SPREAD: GuestStatus[] = ["accepted", "accepted", "accepted", "no_response", "no_response", "declined", "pending", "invalid"];

// 2,000 rows, unpaginated: a large wedding list in one upload.
export const HUGE = guests(
  Array.from({ length: 2000 }, (_, i) => {
    const status = SPREAD[(i * 7) % SPREAD.length];
    return {
      name: `${FIRST[i % FIRST.length]} ${LAST[(i * 5) % LAST.length]}`,
      phone: status === "invalid" ? `05${String(i).padStart(4, "0")}` : `+9665${String(10000000 + i * 37).slice(0, 8)}`,
      status,
      barcodeValue: status === "accepted" ? `INV-${(0x9f3a61c0 + i * 7919).toString(16).toUpperCase()}${String(i).padStart(8, "0")}` : null,
      lastError: status === "invalid" ? "invalid_number" : null,
    };
  }),
);

export const FIXTURES = { demo: DEMO, worst: WORST, empty: [] as Guest[], one: ONE, huge: HUGE };
export type FixtureName = keyof typeof FIXTURES;
