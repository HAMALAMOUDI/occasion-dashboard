import { notFound } from "next/navigation";
import Bench from "./Bench";

// Dev-only: times every frame of an animated card at the player's real canvas size.
// /dev/clip-bench?style=palace
export default async function ClipBenchPage({ searchParams }: { searchParams: Promise<{ style?: string; noshadow?: string; at?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { style = "palace", noshadow, at } = await searchParams;
  return <Bench style={style} noShadow={noshadow === "1"} at={at === undefined ? undefined : Number(at)} />;
}
