import { For, Show, createSignal, onCleanup } from "solid-js";
import { Portal } from "solid-js/web";

import { styled } from "styled-system/jsx";

import { useVoice } from "@revolt/rtc";
import { useState } from "@revolt/state";
import { IconButton, Slider } from "@revolt/ui/components/design";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import {
  applyFerretSettings,
  updateFerretSettings,
  useFerretSettings,
} from "../settings";

import {
  SOUNDBOARD,
  clipPlaying,
  coolingDown,
  customClips,
  playSoundboard,
  setPlayingVolume,
  stopSoundboard,
} from "./soundboard";

/**
 * Soundboard in the call controls (desktop app only). Clips go into your
 * own mic stream, so everyone in the call hears them.
 */
export function SoundboardButton(props: { size: "xs" | "sm" }) {
  if (!window.ferret) return null;

  const voice = useVoice();
  const state = useState();
  const [open, setOpen] = createSignal(false);
  // where the panel goes: above the button, kept inside the window
  const [spot, setSpot] = createSignal({ left: 0, bottom: 0 });
  let wrapper: HTMLDivElement | undefined;
  let panel: HTMLDivElement | undefined;

  /**
   * The panel is drawn at page level (a portal) and placed above the
   * button: the call bar hides anything that sticks out of it, which made
   * the panel invisible (the button lit up but nothing appeared).
   */
  const place = () => {
    if (!wrapper) return;
    const rect = wrapper.getBoundingClientRect();
    const left = rect.left + rect.width / 2 - PANEL_WIDTH / 2;
    setSpot({
      left: Math.max(8, Math.min(left, window.innerWidth - PANEL_WIDTH - 8)),
      bottom: window.innerHeight - rect.top + 10,
    });
  };

  const toggle = () => {
    if (!open()) place();
    setOpen((value) => !value);
  };

  const onPointerDown = (event: PointerEvent) => {
    const target = event.target as Node;
    if (open() && !wrapper?.contains(target) && !panel?.contains(target)) {
      setOpen(false);
    }
  };
  const onResize = () => open() && place();
  document.addEventListener("pointerdown", onPointerDown, true);
  window.addEventListener("resize", onResize);
  onCleanup(() => {
    document.removeEventListener("pointerdown", onPointerDown, true);
    window.removeEventListener("resize", onResize);
  });

  const muted = () => !voice.microphone();
  const settings = useFerretSettings();
  const volume = () => settings()?.voice.soundboardVolume ?? 60;
  const othersVolume = () => settings()?.voice.othersSoundboardVolume ?? 100;
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
      onClick={() =>
        void playSoundboard(
          clip.src,
          voice.room(),
          state.voice.preferredAudioOutputDevice,
        )
      }
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
        onPress={toggle}
        isDisabled={!voice.speakingPermission}
        use:floating={{
          tooltip: { placement: "top", content: "Soundboard" },
        }}
      >
        <Symbol>graphic_eq</Symbol>
      </IconButton>
      <Show when={open()}>
        <Portal>
          <Panel
            ref={panel}
            style={{
              left: `${spot().left}px`,
              bottom: `${spot().bottom}px`,
            }}
          >
            <Heading>
              Soundboard
              <Show when={muted()}>
                <small>Unmute so others can hear it</small>
              </Show>
              <Show when={clipPlaying()}>
                <StopButton type="button" onClick={stopSoundboard}>
                  <Symbol size={16}>stop</Symbol> Stop
                </StopButton>
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
            <VolumeRow title="Volume of your clips, for everyone">
              <span>Yours</span>
              <Slider
                min={0}
                max={100}
                step={5}
                value={volume()}
                onInput={(event) => setPlayingVolume(event.currentTarget.value)}
                onChange={(event) =>
                  void updateFerretSettings({
                    voice: { soundboardVolume: event.currentTarget.value },
                  })
                }
                labelFormatter={(value) => `${value}%`}
              />
            </VolumeRow>
            <VolumeRow title="Volume of other people's clips, just for you">
              <span>Others</span>
              <Slider
                min={0}
                max={100}
                step={5}
                value={othersVolume()}
                onChange={(event) =>
                  void updateFerretSettings({
                    voice: {
                      othersSoundboardVolume: event.currentTarget.value,
                    },
                  })
                }
                labelFormatter={(value) => `${value}%`}
              />
            </VolumeRow>
            <Show when={error()}>
              <ErrorText>{error()}</ErrorText>
            </Show>
          </Panel>
        </Portal>
      </Show>
    </Wrapper>
  );
}

const Wrapper = styled("div", {
  base: { position: "relative", display: "flex" },
});

const PANEL_WIDTH = 300;

const Panel = styled("div", {
  base: {
    position: "fixed",
    width: `${PANEL_WIDTH}px`,
    maxHeight: "min(460px, 70vh)",
    overflowY: "auto",
    padding: "10px",
    borderRadius: "16px",
    // above the call window and the rest of the page
    zIndex: 1000,
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

/** Your clips' volume and other people's, same as in settings */
const VolumeRow = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    paddingTop: "4px",
    paddingInline: "4px",
    fontSize: "12px",
    "& span": { width: "44px", flexShrink: 0 },
    "& mdui-slider": { flexGrow: 1 },
  },
});

const StopButton = styled("button", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "2px",
    marginInlineStart: "auto",
    padding: "2px 10px",
    border: "none",
    borderRadius: "999px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: 600,
    color: "var(--md-sys-color-on-error-container)",
    background: "var(--md-sys-color-error-container)",
  },
});

const ErrorText = styled("div", {
  base: {
    paddingTop: "8px",
    fontSize: "12px",
    color: "var(--md-sys-color-error)",
  },
});
