import { Show, createEffect, createSignal, onCleanup } from "solid-js";
import { Portal } from "solid-js/web";

import { styled } from "styled-system/jsx";

import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { soundsPlaying, stopAllSounds } from "./stopSounds";

/** Only show up for sounds that keep going, not for short alerts */
const SHOW_AFTER_MS = 1500;

/**
 * A "Stop sound" button at the bottom of the window while a longer Ferret
 * sound plays (a preview, a long custom alert, your soundboard clip).
 */
export function StopSoundsButton() {
  const [visible, setVisible] = createSignal(false);

  createEffect(() => {
    if (!soundsPlaying()) return setVisible(false);
    const timer = setTimeout(() => setVisible(true), SHOW_AFTER_MS);
    onCleanup(() => clearTimeout(timer));
  });

  return (
    <Show when={visible()}>
      <Portal>
        <Button type="button" onClick={stopAllSounds}>
          <Symbol size={18}>stop_circle</Symbol>
          Stop sound
        </Button>
      </Portal>
    </Show>
  );
}

const Button = styled("button", {
  base: {
    position: "fixed",
    left: "50%",
    bottom: "24px",
    transform: "translateX(-50%)",
    // above settings and dialogs
    zIndex: 2000,
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 16px",
    border: "none",
    borderRadius: "999px",
    cursor: "pointer",
    fontWeight: 600,
    color: "var(--md-sys-color-on-error-container)",
    background: "var(--md-sys-color-error-container)",
    boxShadow: "0 6px 18px rgba(0, 0, 0, 0.35)",
  },
});
