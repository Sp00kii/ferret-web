import { For, Show, createSignal, onCleanup } from "solid-js";

import { styled } from "styled-system/jsx";

import { useVoice } from "@revolt/rtc";
import { IconButton } from "@revolt/ui/components/design";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { applyFerretSettings } from "../settings";

import {
  SOUNDBOARD,
  coolingDown,
  customClips,
  playSoundboard,
} from "./soundboard";

/**
 * Soundboard in the call controls (desktop app only). Clips go into your
 * own mic stream, so everyone in the call hears them.
 */
export function SoundboardButton(props: { size: "xs" | "sm" }) {
  if (!window.ferret) return null;

  const voice = useVoice();
  const [open, setOpen] = createSignal(false);
  let wrapper: HTMLDivElement | undefined;

  const onPointerDown = (event: PointerEvent) => {
    if (open() && wrapper && !wrapper.contains(event.target as Node)) {
      setOpen(false);
    }
  };
  document.addEventListener("pointerdown", onPointerDown, true);
  onCleanup(() =>
    document.removeEventListener("pointerdown", onPointerDown, true),
  );

  const muted = () => !voice.microphone();
  const [error, setError] = createSignal<string>();

  const addClip = async () => {
    setError(undefined);
    try {
      applyFerretSettings(await window.ferret!.addSoundboardClip());
    } catch (e) {
      setError(
        e instanceof Error ? e.message.replace(/^.*Error: /, "") : String(e),
      );
    }
  };

  const clipButton = (clip: { name: string; emoji: string; src: string }) => (
    <Clip
      type="button"
      title={clip.name}
      disabled={coolingDown()}
      onClick={() => void playSoundboard(clip.src)}
    >
      <span>{clip.emoji}</span>
      {clip.name}
    </Clip>
  );

  return (
    <Wrapper ref={wrapper}>
      <IconButton
        size={props.size}
        variant={open() ? "filled" : "tonal"}
        onPress={() => setOpen((value) => !value)}
        isDisabled={!voice.speakingPermission}
        use:floating={{
          tooltip: { placement: "top", content: "Soundboard" },
        }}
      >
        <Symbol>graphic_eq</Symbol>
      </IconButton>
      <Show when={open()}>
        <Panel>
          <Heading>
            Soundboard
            <Show when={muted()}>
              <small>Unmute so others can hear it</small>
            </Show>
          </Heading>
          <Grid>
            <For each={SOUNDBOARD}>{clipButton}</For>
          </Grid>
          <Heading>
            Your sounds
            <small class="hint">Rename or remove in Settings → Ferret</small>
          </Heading>
          <Grid>
            <For each={customClips()}>{clipButton}</For>
            <Clip type="button" title="Add your own sound" onClick={addClip}>
              <span>➕</span>
              Add sound
            </Clip>
          </Grid>
          <Show when={error()}>
            <ErrorText>{error()}</ErrorText>
          </Show>
        </Panel>
      </Show>
    </Wrapper>
  );
}

const Wrapper = styled("div", {
  base: { position: "relative", display: "flex" },
});

const Panel = styled("div", {
  base: {
    position: "absolute",
    bottom: "calc(100% + 10px)",
    left: "50%",
    transform: "translateX(-50%)",
    width: "300px",
    maxHeight: "min(460px, 70vh)",
    overflowY: "auto",
    padding: "10px",
    borderRadius: "16px",
    zIndex: 10,
    background: "var(--md-sys-color-surface-container-high)",
    color: "var(--md-sys-color-on-surface)",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.35)",
  },
});

const Heading = styled("div", {
  base: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: "8px",
    fontWeight: 600,
    padding: "8px 4px",
    "& small": {
      fontWeight: 400,
      fontSize: "11px",
      color: "var(--md-sys-color-error)",
    },
    "& small.hint": { color: "var(--md-sys-color-outline)" },
  },
});

const Grid = styled("div", {
  base: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "6px",
  },
});

const Clip = styled("button", {
  base: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "2px",
    padding: "8px 4px",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "11px",
    lineHeight: 1.2,
    textAlign: "center",
    color: "inherit",
    background: "var(--md-sys-color-surface-container-highest)",
    transition: "background 0.1s, opacity 0.2s",
    "& span": { fontSize: "20px" },
    "&:hover:not(:disabled)": {
      background: "var(--md-sys-color-secondary-container)",
    },
    "&:disabled": { opacity: 0.5, cursor: "default" },
  },
});

const ErrorText = styled("div", {
  base: {
    paddingTop: "8px",
    fontSize: "12px",
    color: "var(--md-sys-color-error)",
  },
});
