"use client";

import { useRouter } from "next/navigation";
import { Languages } from "lucide-react";
import { LOCALE_COOKIE } from "@/lib/i18n";
import { useLocale, useT } from "./I18nProvider";

export default function LanguageToggle({ className = "" }: { className?: string }) {
  const router = useRouter();
  const locale = useLocale();
  const t = useT();

  function toggle() {
    const next = locale === "ar" ? "en" : "ar";
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={toggle}
      lang={locale === "ar" ? "en" : "ar"}
      className={`inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-muted hover:text-ink ${className}`}
      aria-label={t.language.label}
    >
      <Languages size={14} /> {t.language.switchTo}
    </button>
  );
}
