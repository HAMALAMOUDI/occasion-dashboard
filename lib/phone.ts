// Normalizes guest phone numbers to E.164 (e.g. +966501234567) so the same
// person isn't invited twice under "0501234567" and "+966 50 123 4567", and so
// obviously invalid numbers are caught before we pay for a WhatsApp send.

const DEFAULT_COUNTRY_CODE = process.env.DEFAULT_COUNTRY_CODE || "966"; // Saudi Arabia

export function normalizePhone(raw: string): string | null {
  let digits = raw.trim().replace(/[\s\-().]/g, "");

  if (digits.startsWith("+")) digits = digits.slice(1);
  else if (digits.startsWith("00")) digits = digits.slice(2);
  // Local format: leading trunk 0 (e.g. 0501234567) → country code + rest.
  else if (digits.startsWith("0")) digits = DEFAULT_COUNTRY_CODE + digits.slice(1);
  // Bare national number without trunk prefix (e.g. 501234567).
  else if (digits.length <= 10 && !digits.startsWith(DEFAULT_COUNTRY_CODE)) digits = DEFAULT_COUNTRY_CODE + digits;

  if (!/^[1-9]\d{7,14}$/.test(digits)) return null;
  return `+${digits}`;
}
