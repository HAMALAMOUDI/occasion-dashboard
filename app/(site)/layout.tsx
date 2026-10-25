import type { Viewport } from "next";
import { Aref_Ruqaa, Cormorant_Garamond, Jost } from "next/font/google";

// Editorial typefaces for the public landing page only.
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});
const jost = Jost({ subsets: ["latin"], variable: "--font-jost", display: "swap" });
const ruqaa = Aref_Ruqaa({ subsets: ["arabic"], weight: ["400", "700"], variable: "--font-ruqaa", display: "swap" });

// Paint edge to edge under the notch (gutters pad back out with px-safe), and tint
// the browser chrome to the header's ivory. The landing has no dark theme, so one colour.
export const viewport: Viewport = { viewportFit: "cover", themeColor: "#f5f0e6" };

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`site ${cormorant.variable} ${jost.variable} ${ruqaa.variable} min-h-screen bg-ivory font-clean text-ink-deep antialiased`}>
      {/* Without script, revealed content is simply there. */}
      <noscript>
        <style>{`.reveal{opacity:1;transform:none}`}</style>
      </noscript>
      {children}
    </div>
  );
}
