import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import { currentUser, showDemoCodes } from "@/lib/auth";
import { getMessages } from "@/lib/i18n-server";

// Everything inside (portal) requires a signed-in organizer. proxy.ts already
// redirects visitors without a session cookie; this also catches expired or
// signed-out sessions. API routes check ownership independently.
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const t = await getMessages();

  return (
    <div className="md:flex min-h-screen">
      <Nav phone={user.phone} isAdmin={user.isAdmin} />
      <main className="flex-1 min-w-0 px-4 pt-6 pb-28 sm:px-8 md:px-12 md:py-12">
        <div className="mx-auto max-w-5xl">
          {showDemoCodes && (
            <p className="mb-6 rounded-xl bg-pending-bg px-4 py-2.5 text-xs text-pending">
              <span className="font-semibold">{t.demoBanner.strong}</span> {t.demoBanner.body}
            </p>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
