import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Occasion — organizer dashboard",
  description: "Manage WhatsApp invitations, RSVPs, and reminders for your events",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-paper text-ink">
        <div className="flex min-h-screen">
          <aside className="w-56 shrink-0 border-r border-line px-5 py-6 hidden md:block">
            <Link href="/" className="block mb-8">
              <span className="font-serif text-xl">Occasion</span>
            </Link>
            <nav className="flex flex-col gap-1 text-sm">
              <Link href="/" className="px-3 py-2 rounded-md hover:bg-line/40">
                Events
              </Link>
              <Link href="/events/new" className="px-3 py-2 rounded-md hover:bg-line/40">
                New event
              </Link>
              <Link href="/billing" className="px-3 py-2 rounded-md hover:bg-line/40">
                Billing
              </Link>
            </nav>
          </aside>
          <main className="flex-1 px-6 py-8 md:px-10 md:py-10 max-w-5xl">{children}</main>
        </div>
      </body>
    </html>
  );
}
