import { createEffect, createSignal, onCleanup } from "solid-js";

import { useFerretSettings } from "../settings";

import { setPauseAnimations } from "./stillImages";

const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const [systemReduce, setSystemReduce] = createSignal(reduceQuery.matches);

/** Whether GIFs / animated emoji wait for a hover (setting, else Windows) */
export function pauseAnimationsActive(value: boolean | null | undefined) {
  return value ?? systemReduce();
}

/** Applies "Pause GIFs and animated emoji until hovered". Renders nothing. */
export function FerretMotion() {
  if (!window.ferret) return null;
  const settings = useFerretSettings();

  const onChange = () => setSystemReduce(reduceQuery.matches);
  reduceQuery.addEventListener("change", onChange);
  onCleanup(() => reduceQuery.removeEventListener("change", onChange));

  createEffect(() =>
    setPauseAnimations(pauseAnimationsActive(settings()?.pauseAnimations)),
  );
  onCleanup(() => setPauseAnimations(false));

  return null;
}
