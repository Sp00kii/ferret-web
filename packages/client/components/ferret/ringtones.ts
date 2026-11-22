import type { FerretSettings } from "./bridge";
import { FERRET_NOISES } from "./noises";
import { FERRET_SOUNDS } from "./sounds";

const builtIn = (file: string) =>
  `${import.meta.env.BASE_URL}ferret/ringtones/${file}`;

/**
 * Ringtones that ship with Ferret (files in public/ferret/ringtones).
 * The first one is the default. All of them are Ferret originals.
 */
export const RINGTONES = [
  { id: "dook-ring", name: "Dook Ring", src: builtIn("dook-ring.ogg") },
  { id: "arcade", name: "Arcade", src: builtIn("arcade.ogg") },
  {
    id: "marimba-bounce",
    name: "Marimba Bounce",
    src: builtIn("marimba-bounce.ogg"),
  },
  { id: "retro-phone", name: "Retro Phone", src: builtIn("retro-phone.ogg") },
  { id: "synthwave", name: "Synthwave", src: builtIn("synthwave.ogg") },
  // id kept as "classic" so existing settings keep working
  { id: "classic", name: "Ferret Chime", src: FERRET_SOUNDS.ringtoneIncoming },
  {
    id: "dook-party",
    name: "Dook Party (ferret noises)",
    src: FERRET_NOISES.ringtoneIncoming,
  },
];

/** Played if the chosen sound can't be loaded */
export const FALLBACK_RINGTONE = FERRET_SOUNDS.ringtoneIncoming;

export function ringtoneSource(ringtone: FerretSettings["ringtone"]) {
  if (ringtone.preset === "custom" && ringtone.customFileName) {
    return `/__ferret/ringtone?v=${encodeURIComponent(ringtone.customFileName)}`;
  }
  return (RINGTONES.find((r) => r.id === ringtone.preset) ?? RINGTONES[0]).src;
}
