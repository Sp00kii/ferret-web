import { createSignal } from "solid-js";

/**
 * Keeps track of Ferret sounds that are playing (previews, alerts, soundboard
 * clips) so they can be cut off after a while and stopped with one button.
 * A long custom file used to play to the end with no way to stop it.
 */

type Playing = { stop: () => void };

const playing = new Set<Playing>();
const [count, setCount] = createSignal(0);

/** Whether any tracked sound is playing right now */
export const soundsPlaying = () => count() > 0;

function remember(entry: Playing) {
  playing.add(entry);
  setCount(playing.size);
}

function forget(entry: Playing) {
  if (playing.delete(entry)) setCount(playing.size);
}

/**
 * Track something that's playing; it's stopped after `seconds` (if given) or
 * with stopAllSounds(). Call the returned function once it ends by itself.
 */
export function trackPlaying(stop: () => void, seconds?: number) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const entry: Playing = {
    stop() {
      clearTimeout(timer);
      forget(entry);
      stop();
    },
  };
  remember(entry);
  if (seconds) timer = setTimeout(entry.stop, seconds * 1000);
  return () => {
    clearTimeout(timer);
    forget(entry);
  };
}

/** Track an <audio> element: stops it after `seconds`, forgets it when done */
export function trackAudio(element: HTMLAudioElement, seconds?: number) {
  const ended = trackPlaying(() => element.pause(), seconds);
  element.addEventListener("ended", ended, { once: true });
  element.addEventListener("pause", ended, { once: true });
  element.addEventListener("error", ended, { once: true });
  return element;
}

/** Stop every tracked sound */
export function stopAllSounds() {
  for (const entry of [...playing]) entry.stop();
}
