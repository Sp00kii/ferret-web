import { createEffect, createSignal, onCleanup } from "solid-js";

import { useFerretSettings } from "../settings";

import { setPauseAnimations } from "./stillImages";

const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const [systemReduce, setSystemReduce] = createSignal(reduceQuery.matches);

/** Whether GIFs / animated emoji wait for a hover (setting, else Windows) */
export function pauseAnimationsActive(value: boolean | null | undefined) {
  return value ?? systemReduce();
}

/** Whether animations are turned off (setting, else Windows) */
export const reduceMotionActive = pauseAnimationsActive;

const ROOT = document.documentElement;
let reduceMotion = false;

// animations made by scripts (sliding panels, pop-ups) skip straight to
// the end too, not only CSS ones
const animate = Element.prototype.animate;
Element.prototype.animate = function (
  this: Element,
  keyframes: Keyframe[] | PropertyIndexedKeyframes | null,
  options?: number | KeyframeAnimationOptions,
) {
  if (reduceMotion)
    options =
      typeof options === "number"
        ? 0.001
        : { ...options, duration: 0.001, delay: 0 };
  return animate.call(this, keyframes, options);
};

/** CSS for the accessibility switches (added once) */
const style = document.createElement("style");
style.textContent = `
html[data-ferret-underline-links] a[target="_blank"],
html[data-ferret-underline-links] a[href^="http"] {
  text-decoration: underline !important;
  text-underline-offset: 2px;
}
html[data-ferret-reduce-motion] *,
html[data-ferret-reduce-motion] *::before,
html[data-ferret-reduce-motion] *::after {
  animation-duration: 0.001ms !important;
  animation-delay: 0s !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.001ms !important;
  transition-delay: 0s !important;
  scroll-behavior: auto !important;
}
`;

const setFlag = (name: string, on: boolean) =>
  on ? ROOT.setAttribute(name, "") : ROOT.removeAttribute(name);

/**
 * Applies "Pause GIFs and animated emoji until hovered", "Reduce motion"
 * and "Underline links". Renders nothing.
 */
export function FerretMotion() {
  if (!window.ferret) return null;
  const settings = useFerretSettings();
  if (!style.isConnected) document.head.append(style);

  const onChange = () => setSystemReduce(reduceQuery.matches);
  reduceQuery.addEventListener("change", onChange);
  onCleanup(() => reduceQuery.removeEventListener("change", onChange));

  createEffect(() =>
    setPauseAnimations(pauseAnimationsActive(settings()?.pauseAnimations)),
  );
  onCleanup(() => setPauseAnimations(false));

  createEffect(() => {
    reduceMotion = reduceMotionActive(settings()?.reduceMotion);
    setFlag("data-ferret-reduce-motion", reduceMotion);
  });
  createEffect(() =>
    setFlag("data-ferret-underline-links", !!settings()?.underlineLinks),
  );
  onCleanup(() => {
    reduceMotion = false;
    setFlag("data-ferret-reduce-motion", false);
    setFlag("data-ferret-underline-links", false);
  });

  return null;
}
