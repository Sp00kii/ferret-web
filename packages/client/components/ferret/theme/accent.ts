import type { FerretSettings } from "../bridge";

import type { FerretAccent } from "./looks";

/** The accent in use: a preset name, or the custom colour */
export function chosenAccent(
  settings: FerretSettings | undefined,
): FerretAccent {
  if (!settings) return "copper";
  return settings.ferretAccent === "custom"
    ? settings.ferretAccentCustom || "#F07835"
    : settings.ferretAccent;
}
