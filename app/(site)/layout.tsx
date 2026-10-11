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

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${cormorant.variable} ${jost.variable} ${ruqaa.variable} min-h-screen bg-ivory font-clean text-ink-deep antialiased`}>
      {children}
    </div>
  );
}
