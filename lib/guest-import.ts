// Turns a spreadsheet (Excel or CSV, already read into rows of cells) into
// guest rows. Used by the browser for uploads and by the API for raw CSV, so
// both accept the same files.
//
// Header row is optional and matched loosely, in English or Arabic. Without a
// recognizable header, column A is the name and column B the phone.

export interface GuestRow {
  name: string;
  phone: string;
}

type Cell = string | number | boolean | Date | null | undefined | object;

const NAME_HEADERS = ["name", "guest", "guest name", "full name", "الاسم", "اسم", "اسم الضيف", "الاسم الكامل"];
const PHONE_HEADERS = [
  "phone",
  "mobile",
  "phone number",
  "mobile number",
  "whatsapp",
  "whatsapp number",
  "number",
  "الجوال",
  "جوال",
  "رقم الجوال",
  "الهاتف",
  "رقم الهاتف",
  "واتساب",
  "رقم الواتساب",
];

const norm = (cell: Cell) => cellText(cell).toLowerCase().replace(/[_*:]/g, " ").replace(/\s+/g, " ").trim();

function cellText(cell: Cell): string {
  if (cell === null || cell === undefined) return "";
  // Excel stores phone numbers typed without a leading 0 or + as numbers.
  if (typeof cell === "number") return Number.isInteger(cell) ? cell.toFixed(0) : String(cell);
  if (cell instanceof Date) return "";
  return String(cell).trim();
}

export function extractGuestRows(table: Cell[][]): { rows: GuestRow[]; skipped: number } {
  const nonEmpty = table.filter((r) => r.some((c) => cellText(c) !== ""));
  if (nonEmpty.length === 0) return { rows: [], skipped: 0 };

  const header = nonEmpty[0].map(norm);
  let nameCol = header.findIndex((h) => NAME_HEADERS.includes(h));
  let phoneCol = header.findIndex((h) => PHONE_HEADERS.includes(h));
  const hasHeader = nameCol !== -1 || phoneCol !== -1;
  if (nameCol === -1) nameCol = phoneCol === 0 ? 1 : 0;
  if (phoneCol === -1) phoneCol = nameCol === 1 ? 0 : 1;

  const rows: GuestRow[] = [];
  let skipped = 0;
  for (const row of hasHeader ? nonEmpty.slice(1) : nonEmpty) {
    const name = cellText(row[nameCol]);
    const phone = cellText(row[phoneCol]);
    if (name && phone) rows.push({ name, phone });
    else skipped++;
  }
  return { rows, skipped };
}
