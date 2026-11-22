import type { FerretSettings } from "./bridge";
import { RINGTONES } from "./ringtones";
import { SOUND_LIBRARY } from "./soundLibrary";
import { FERRET_SOUNDS } from "./sounds";

export type PersonSoundKind = "ringtone" | "message";

const personFile = (
  userId: string,
  kind: PersonSoundKind,
  fileName: string | null,
) =>
  `/__ferret/person/${userId}/${kind}?v=${encodeURIComponent(fileName ?? "")}`;

/** This person's own ringtone, if one is set */
export function personRingtoneSource(
  settings: FerretSettings | undefined,
  userId: string | undefined,
): string | undefined {
  const pick = userId ? settings?.people?.[userId]?.ringtone : undefined;
  if (!pick || !userId) return;
  if (pick.choice === "custom") {
    return pick.customFileName
      ? personFile(userId, "ringtone", pick.customFileName)
      : undefined;
  }
  return RINGTONES.find((tone) => tone.id === pick.choice)?.src;
}

/** This person's own message sound, if one is set */
export function personMessageSource(
  settings: FerretSettings | undefined,
  userId: string | undefined,
): string | undefined {
  const pick = userId ? settings?.people?.[userId]?.message : undefined;
  if (!pick || !userId) return;
  if (pick.choice === "custom") {
    return pick.customFileName
      ? personFile(userId, "message", pick.customFileName)
      : undefined;
  }
  if (pick.choice === "ferret") return FERRET_SOUNDS.message;
  return SOUND_LIBRARY.find((sound) => sound.id === pick.choice)?.src;
}
