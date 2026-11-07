// A phone around a card, so a design reads as what the guest sees on their own screen.
// The earpiece sits in the bezel above the screen, so it never covers the card.
// Purely decorative: the card inside carries the content.
export default function PhoneFrame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative rounded-[2.4rem] bg-[#1f1e1b] px-[0.5rem] pb-[0.9rem] pt-[1.35rem] shadow-[0_24px_60px_-20px_rgb(31_30_27/0.45)] ring-1 ring-black/10 ${className}`}>
      <span aria-hidden="true" className="absolute left-1/2 top-[0.5rem] h-[0.35rem] w-[22%] -translate-x-1/2 rounded-full bg-white/15" />
      <div className="overflow-hidden rounded-[1.6rem]">{children}</div>
    </div>
  );
}
