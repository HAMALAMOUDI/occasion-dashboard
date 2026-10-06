"use client";

import { createContext, useContext } from "react";
import type { Locale } from "@/lib/i18n";
import { messages } from "@/lib/messages";

const LocaleContext = createContext<Locale>("en");

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export const useLocale = () => useContext(LocaleContext);
export const useT = () => messages[useContext(LocaleContext)];
