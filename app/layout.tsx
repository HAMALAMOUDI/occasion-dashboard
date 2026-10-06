import type { Metadata } from "next";
import { Amiri, Fraunces, IBM_Plex_Sans_Arabic, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/components/I18nProvider";
import { dir } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";

const display = Fraunces({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const body = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-body", display: "swap" });
// Arabic glyphs fall through to these, so mixed English/Arabic text renders well in either language.
const displayAr = Amiri({ subsets: ["arabic"], weight: ["400", "700"], variable: "--font-display-ar", display: "swap" });
const bodyAr = IBM_Plex_Sans_Arabic({ subsets: ["arabic"], weight: ["400", "500", "600", "700"], variable: "--font-body-ar", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  return (await getLocale()) === "ar"
    ? { title: "مناسبة — لوحة المنظم", description: "أدر دعوات واتساب والردود والتذكيرات لمناسباتك" }
    : { title: "Occasion — organizer dashboard", description: "Manage WhatsApp invitations, RSVPs, and reminders for your events" };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} dir={dir(locale)} className={`${display.variable} ${body.variable} ${displayAr.variable} ${bodyAr.variable}`}>
      <body className="bg-paper text-ink">
        <I18nProvider locale={locale}>{children}</I18nProvider>
      </body>
    </html>
  );
}
