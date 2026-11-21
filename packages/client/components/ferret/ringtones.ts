import type { FerretSettings } from "./bridge";
import { FERRET_SOUNDS } from "./sounds";

const builtIn = (file: string) =>
  `${import.meta.env.BASE_URL}ferret/ringtones/${file}`;

/**
 * Ringtones that ship with Ferret (files in public/ferret/ringtones).
 * The first one is the default.
 */
export const RINGTONES = [
  { id: "franklin", name: "Franklin", src: builtIn("franklin.mp3") },
  {
    id: "discord-halloween",
    name: "Discord Halloween",
    src: builtIn("discord-halloween.mp3"),
  },
  { id: "omori", name: "OMORI", src: builtIn("omori.mp3") },
  {
    id: "starburst-candy",
    name: "Starburst Candy",
    src: builtIn("starburst-candy.mp3"),
  },
  { id: "my-phone", name: "My Phone", src: builtIn("my-phone.mp3") },
  { id: "ringtone-231", name: "231", src: builtIn("ringtone-231.mp3") },
  // id kept as "classic" so existing settings keep working
  { id: "classic", name: "Ferret Chime", src: FERRET_SOUNDS.ringtoneIncoming },
];

/** Played if the chosen sound can't be loaded */
export const FALLBACK_RINGTONE = FERRET_SOUNDS.ringtoneIncoming;

export function ringtoneSource(ringtone: FerretSettings["ringtone"]) {
  if (ringtone.preset === "custom" && ringtone.customFileName) {
    return `/__ferret/ringtone?v=${encodeURIComponent(ringtone.customFileName)}`;
  }
  return (RINGTONES.find((r) => r.id === ringtone.preset) ?? RINGTONES[0]).src;
}
