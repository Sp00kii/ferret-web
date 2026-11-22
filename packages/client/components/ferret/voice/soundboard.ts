import { createSignal } from "solid-js";

import { useFerretSettings } from "../settings";
import { SOUND_LIBRARY } from "../soundLibrary";
import airhorn from "../sounds/board/airhorn.ogg";
import boing from "../sounds/board/boing.ogg";
import crickets from "../sounds/board/crickets.ogg";
import drumroll from "../sounds/board/drumroll.ogg";
import happyDook from "../sounds/board/happy-dook.ogg";
import rimshot from "../sounds/board/rimshot.ogg";
import sadTrombone from "../sounds/board/sad-trombone.ogg";
import tada from "../sounds/board/tada.ogg";

import { MAX_CLIP_SECONDS, playIntoCall } from "./micChain";

const settings = useFerretSettings();

/** Clips everyone in the call hears. All synthesized by Ferret. */
export const SOUNDBOARD = [
  { id: "rimshot", name: "Ba-dum-tss", emoji: "🥁", src: rimshot },
  { id: "airhorn", name: "Air horn", emoji: "📯", src: airhorn },
  { id: "sad-trombone", name: "Sad trombone", emoji: "🎺", src: sadTrombone },
  { id: "tada", name: "Ta-da!", emoji: "🎉", src: tada },
  { id: "drumroll", name: "Drumroll", emoji: "🪘", src: drumroll },
  { id: "crickets", name: "Crickets", emoji: "🦗", src: crickets },
  { id: "boing", name: "Boing", emoji: "🌀", src: boing },
  { id: "happy-dook", name: "Happy dook", emoji: "🐾", src: happyDook },
  ...(
    [
      ["squeak", "🧸"],
      ["boop", "👃"],
      ["clicker", "👆"],
      ["bell", "🔔"],
    ] as const
  ).flatMap(([id, emoji]) =>
    SOUND_LIBRARY.filter((sound) => sound.id === id).map((sound) => ({
      ...sound,
      emoji,
    })),
  ),
];

/** The user's own clips, served by the desktop app */
export function customClips() {
  return (settings()?.soundboard ?? []).map((clip) => ({
    id: clip.id,
    name: clip.name,
    emoji: "🎵",
    src: `/__ferret/soundboard/${clip.id}`,
  }));
}

/** Stop people from spamming everyone's ears */
const COOLDOWN_MS = 2500;
const [coolingDown, setCoolingDown] = createSignal(false);
export { coolingDown };

/** Play a clip into the call and locally so you hear it too */
export async function playSoundboard(src: string) {
  if (coolingDown()) return false;
  setCoolingDown(true);
  setTimeout(() => setCoolingDown(false), COOLDOWN_MS);

  const volume = (settings()?.voice.soundboardVolume ?? 60) / 100;
  const local = new Audio(src);
  local.volume = volume;
  void local.play().catch(() => {});
  setTimeout(() => local.pause(), MAX_CLIP_SECONDS * 1000);

  try {
    return await playIntoCall(src, volume);
  } catch (error) {
    console.error("[ferret] soundboard clip failed", error);
    return false;
  }
}
