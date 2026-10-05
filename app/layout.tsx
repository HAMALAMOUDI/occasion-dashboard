import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";

const display = Fraunces({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const body = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-body", display: "swap" });

export const metadata: Metadata = {
  title: "Occasion — organizer dashboard",
  description: "Manage WhatsApp invitations, RSVPs, and reminders for your events",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="bg-paper text-ink">
        <div className="md:flex min-h-screen">
          <Nav />
          <main className="flex-1 min-w-0 px-4 pt-6 pb-28 sm:px-8 md:px-12 md:py-12">
            <div className="mx-auto max-w-5xl">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
