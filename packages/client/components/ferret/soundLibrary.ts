import type { TypeSounds } from "@revolt/state";

import type { FerretSettings } from "./bridge";
import { personMessageSource } from "./people";
import { useFerretSettings } from "./settings";
import { FERRET_SOUNDS } from "./sounds";
import bell from "./sounds/library/bell.ogg";
import blip from "./sounds/library/blip.ogg";
import boop from "./sounds/library/boop.ogg";
import clicker from "./sounds/library/clicker.ogg";
import dook from "./sounds/library/dook.ogg";
import pop from "./sounds/library/pop.ogg";
import squeak from "./sounds/library/squeak.ogg";

/** Sounds that can be picked for any slot instead of Ferret's own */
export const SOUND_LIBRARY = [
  { id: "clicker", name: "Clicker", src: clicker },
  { id: "pop", name: "Pop", src: pop },
  { id: "bell", name: "Bell", src: bell },
  { id: "blip", name: "Blip", src: blip },
  { id: "squeak", name: "Squeak", src: squeak },
  { id: "boop", name: "Boop", src: boop },
  { id: "dook", name: "Dook (ferret chirp)", src: dook },
];

type Slot = keyof TypeSounds;

/** Customisable sounds, in settings order (the call ringtone has its own picker) */
export const SOUND_SLOTS: { slot: Slot; label: string }[] = [
  { slot: "message", label: "New message" },
  { slot: "mute", label: "Mute" },
  { slot: "unmute", label: "Unmute" },
  { slot: "deafen", label: "Deafen" },
  { slot: "undeafen", label: "Undeafen" },
  { slot: "userJoinVoice", label: "Someone joins voice" },
  { slot: "userLeaveVoice", label: "Someone leaves voice" },
  { slot: "userMoved", label: "Moved to another channel" },
  { slot: "streamStart", label: "Stream starts" },
  { slot: "streamEnd", label: "Stream ends" },
  { slot: "streamViewerJoin", label: "Viewer joins your stream" },
  { slot: "streamViewerLeave", label: "Viewer leaves your stream" },
  { slot: "ringtoneOutgoing", label: "Calling someone (ring-back)" },
];

export function soundSource(
  slot: Slot,
  settings: FerretSettings | undefined,
): string {
  const pick = settings?.sounds?.[slot];
  if (pick?.choice === "custom" && pick.customFileName) {
    return `/__ferret/sound/${slot}?v=${encodeURIComponent(pick.customFileName)}`;
  }
  const library = SOUND_LIBRARY.find((sound) => sound.id === pick?.choice);
  return library?.src ?? FERRET_SOUNDS[slot];
}

const settings = useFerretSettings();

/**
 * The file to play for a sound right now, following the user's choices.
 * `from` is who caused it, for per-person message sounds.
 */
export function currentSoundSource(slot: Slot, from?: string) {
  const config = settings();
  return (
    (slot === "message" && personMessageSource(config, from)) ||
    soundSource(slot, config)
  );
}
