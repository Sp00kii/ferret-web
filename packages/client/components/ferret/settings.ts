import { createSignal } from "solid-js";

import type { FerretSettings, FerretSettingsPatch } from "./bridge";

// One shared copy for every component; the desktop pushes changes back.
const [settings, setSettings] = createSignal<FerretSettings>();
let subscribed = false;

/**
 * Ferret settings stored by the desktop app, or undefined until loaded
 * (and always undefined outside the desktop app).
 */
export function useFerretSettings() {
  if (!subscribed && window.ferret) {
    subscribed = true;
    window.ferret.getSettings().then((value) => value && setSettings(value));
    window.ferret.onSettingsChanged(setSettings);
  }
  return settings;
}

export async function updateFerretSettings(patch: FerretSettingsPatch) {
  const next = await window.ferret?.setSettings(patch);
  if (next) setSettings(next);
}

export function applyFerretSettings(next: FerretSettings | null | undefined) {
  if (next) setSettings(next);
}
