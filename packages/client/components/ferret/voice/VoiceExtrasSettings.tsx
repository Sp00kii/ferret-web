import { For, Show, createResource, createSignal, onCleanup } from "solid-js";

import { styled } from "styled-system/jsx";

import {
  Button,
  CategoryButton,
  Checkbox,
  Slider,
  Symbol,
  Text,
} from "@revolt/ui";

import type { FerretSettings, FerretVoiceSettings } from "../bridge";
import { applyFerretSettings, updateFerretSettings } from "../settings";

import {
  MAX_CLIP_SECONDS,
  canPlayIntoCall,
  micLevel,
  transmitting,
} from "./micChain";

const voicePatch = (
  patch: Parameters<typeof updateFerretSettings>[0]["voice"],
) => updateFerretSettings({ voice: patch });

/** Turn a keydown into an Electron accelerator, or undefined if it can't be one */
function toAccelerator(event: KeyboardEvent) {
  let key: string | undefined;
  if (/^Key[A-Z]$/.test(event.code)) key = event.code.slice(3);
  else if (/^Digit[0-9]$/.test(event.code)) key = event.code.slice(5);
  else if (/^F([1-9]|1[0-9]|2[0-4])$/.test(event.code)) key = event.code;
  if (!key) return;

  const parts = [
    event.ctrlKey && "Ctrl",
    event.altKey && "Alt",
    event.shiftKey && "Shift",
    event.metaKey && "Super",
  ].filter(Boolean);
  // plain letters/numbers would fire while typing in any app
  if (!parts.length && !key.startsWith("F")) return;
  return [...parts, key].join("+");
}

export function VoiceExtrasSettings(props: {
  voice: FerretVoiceSettings;
  soundboard: FerretSettings["soundboard"];
}) {
  return (
    <>
      <PushToTalk voice={props.voice} />
      <NoiseGate voice={props.voice} />
      <Hotkeys voice={props.voice} />

      <Text class="label">Soundboard volume</Text>
      <Slider
        min={0}
        max={100}
        step={5}
        value={props.voice.soundboardVolume}
        onChange={(event) =>
          voicePatch({ soundboardVolume: event.currentTarget.value })
        }
        labelFormatter={(value) => `${value}%`}
      />
      <MySounds clips={props.soundboard} />

      <CategoryButton.Group>
        <CategoryButton
          action={<Checkbox checked={props.voice.compactCallWindow} />}
          onClick={() =>
            voicePatch({ compactCallWindow: !props.voice.compactCallWindow })
          }
          icon={<Symbol>picture_in_picture_alt</Symbol>}
          description="While you're in a call and Ferret isn't focused, show a small always-on-top window with who's talking and mute / deafen / hang up. Drag it anywhere, or close it for the current call."
        >
          Compact call window
        </CategoryButton>
      </CategoryButton.Group>
    </>
  );
}

function PushToTalk(props: { voice: FerretVoiceSettings }) {
  const [capturing, setCapturing] = createSignal(false);

  const capture = async () => {
    setCapturing(true);
    try {
      applyFerretSettings(await window.ferret!.capturePttBinding());
    } finally {
      setCapturing(false);
    }
  };

  return (
    <>
      <CategoryButton.Group>
        <CategoryButton
          action={<Checkbox checked={props.voice.pushToTalk} />}
          onClick={() => voicePatch({ pushToTalk: !props.voice.pushToTalk })}
          icon={<Symbol>keyboard_voice</Symbol>}
          description="Your mic only sends while you hold a key or mouse button, even when Ferret is in the background. Ferret only watches the one key you pick."
        >
          Push to talk
        </CategoryButton>
        <Show when={props.voice.pushToTalk}>
          <CategoryButton
            action={
              <Text class="label">
                {capturing()
                  ? "Press a key or side mouse button… (Esc cancels)"
                  : (props.voice.pttBinding?.label ?? "Not set")}
              </Text>
            }
            onClick={() => !capturing() && void capture()}
            icon={<Symbol>touch_app</Symbol>}
            description={
              props.voice.pttBinding
                ? "Click to change."
                : "Click, then press the key or mouse button you want to hold. Until you do, your mic works normally."
            }
          >
            Push-to-talk key
          </CategoryButton>
        </Show>
      </CategoryButton.Group>
      <Show when={props.voice.pushToTalk}>
        <Text class="label">Keep sending after letting go</Text>
        <Slider
          min={0}
          max={1000}
          step={50}
          value={props.voice.pttReleaseMs}
          onChange={(event) =>
            voicePatch({ pttReleaseMs: event.currentTarget.value })
          }
          labelFormatter={(value) => `${value} ms`}
        />
      </Show>
    </>
  );
}

function NoiseGate(props: { voice: FerretVoiceSettings }) {
  // meter position: -90 dB at the left, -10 dB at the right
  const percent = (db: number) =>
    `${Math.min(100, Math.max(0, ((db + 90) / 80) * 100))}%`;

  return (
    <>
      <CategoryButton.Group>
        <CategoryButton
          action={<Checkbox checked={props.voice.noiseGate} />}
          onClick={() => voicePatch({ noiseGate: !props.voice.noiseGate })}
          icon={<Symbol>graphic_eq</Symbol>}
          description="Only send your mic when it's louder than the sensitivity below, so keyboard clicks and fans stay out."
        >
          Mic sensitivity (noise gate)
        </CategoryButton>
      </CategoryButton.Group>
      <Show when={props.voice.noiseGate}>
        <Text class="label">Sensitivity: {props.voice.noiseGateDb} dB</Text>
        <Slider
          min={-90}
          max={-10}
          step={1}
          value={props.voice.noiseGateDb}
          onChange={(event) =>
            voicePatch({ noiseGateDb: event.currentTarget.value })
          }
          labelFormatter={(value) => `${value} dB`}
        />
        <Show
          when={canPlayIntoCall()}
          fallback={
            <Text class="label">Join a call to see your mic level here.</Text>
          }
        >
          <Meter>
            <div
              class="level"
              data-open={transmitting() ? "" : undefined}
              style={{ width: percent(micLevel()) }}
            />
            <div
              class="mark"
              style={{ left: percent(props.voice.noiseGateDb) }}
            />
          </Meter>
          <Text class="label">
            {transmitting() ? "Sending your mic" : "Gate closed (not sending)"}
          </Text>
        </Show>
      </Show>
    </>
  );
}

function Hotkeys(props: { voice: FerretVoiceSettings }) {
  const [listening, setListening] = createSignal<"mute" | "deafen">();
  const [status, { refetch }] = createResource(() =>
    window.ferret!.hotkeyStatus(),
  );

  let stopListening: (() => void) | undefined;
  onCleanup(() => stopListening?.());

  const listen = (which: "mute" | "deafen") => {
    stopListening?.();
    setListening(which);
    const onKey = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (event.key === "Escape") return done();
      const accelerator = toAccelerator(event);
      if (!accelerator) return;
      void voicePatch(
        which === "mute"
          ? { muteHotkey: accelerator }
          : { deafenHotkey: accelerator },
      ).then(() => refetch());
      done();
    };
    const done = () => {
      window.removeEventListener("keydown", onKey, true);
      setListening(undefined);
      stopListening = undefined;
    };
    window.addEventListener("keydown", onKey, true);
    stopListening = done;
  };

  const clear = (which: "mute" | "deafen") =>
    void voicePatch(
      which === "mute" ? { muteHotkey: null } : { deafenHotkey: null },
    ).then(() => refetch());

  const row = (which: "mute" | "deafen", label: string, icon: string) => {
    const value = () =>
      which === "mute" ? props.voice.muteHotkey : props.voice.deafenHotkey;
    const failed = () => !!value() && status()?.[which] === false;
    return (
      <CategoryButton
        action={
          <Text class="label">
            {listening() === which
              ? "Press a shortcut… (Esc cancels)"
              : (value() ?? "Not set")}
          </Text>
        }
        onClick={() => listen(which)}
        icon={<Symbol>{icon}</Symbol>}
        description={
          failed()
            ? "Another app already uses this shortcut. Pick a different one."
            : "Works everywhere, even in games. Use Ctrl, Alt or Shift with a letter or number, or an F key."
        }
      >
        {label}
      </CategoryButton>
    );
  };

  return (
    <>
      <CategoryButton.Group>
        {row("mute", "Mute shortcut", "mic_off")}
        {row("deafen", "Deafen shortcut", "headset_off")}
      </CategoryButton.Group>
      <Show when={props.voice.muteHotkey || props.voice.deafenHotkey}>
        <Buttons>
          <Show when={props.voice.muteHotkey}>
            <Button variant="tonal" onPress={() => clear("mute")}>
              Remove mute shortcut
            </Button>
          </Show>
          <Show when={props.voice.deafenHotkey}>
            <Button variant="tonal" onPress={() => clear("deafen")}>
              Remove deafen shortcut
            </Button>
          </Show>
        </Buttons>
      </Show>
    </>
  );
}

let preview: HTMLAudioElement | undefined;

function MySounds(props: { clips: FerretSettings["soundboard"] }) {
  const [error, setError] = createSignal<string>();

  const run = async (action: () => Promise<FerretSettings>) => {
    setError(undefined);
    try {
      applyFerretSettings(await action());
    } catch (e) {
      setError(
        e instanceof Error ? e.message.replace(/^.*Error: /, "") : String(e),
      );
    }
  };

  const play = (id: string) => {
    preview?.pause();
    preview = new Audio(`/__ferret/soundboard/${id}`);
    void preview.play().catch(() => setError("Couldn't play this file."));
    const current = preview;
    setTimeout(() => current.pause(), MAX_CLIP_SECONDS * 1000);
  };
  onCleanup(() => preview?.pause());

  return (
    <>
      <Text class="label">
        Your soundboard sounds (up to 24, max 10 MB each; only the first{" "}
        {MAX_CLIP_SECONDS} seconds play)
      </Text>
      <For each={props.clips}>
        {(clip) => (
          <ClipRow>
            <Button variant="tonal" onPress={() => play(clip.id)}>
              <Symbol>play_arrow</Symbol>
            </Button>
            <input
              value={clip.name}
              maxLength={32}
              aria-label="Sound name"
              onChange={(event) =>
                void run(() =>
                  window.ferret!.renameSoundboardClip(
                    clip.id,
                    event.currentTarget.value,
                  ),
                )
              }
            />
            <Button
              variant="tonal"
              onPress={() =>
                void run(() => window.ferret!.removeSoundboardClip(clip.id))
              }
            >
              <Symbol>delete</Symbol>
            </Button>
          </ClipRow>
        )}
      </For>
      <Buttons>
        <Button
          variant="tonal"
          onPress={() => void run(() => window.ferret!.addSoundboardClip())}
        >
          <Symbol>upload_file</Symbol> Add a sound…
        </Button>
      </Buttons>
      <Show when={error()}>
        <Text class="label">{error()}</Text>
      </Show>
    </>
  );
}

const ClipRow = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "var(--gap-md)",
    "& input": {
      flex: 1,
      minWidth: 0,
      padding: "8px 12px",
      borderRadius: "var(--borderRadius-md, 8px)",
      border: "1px solid var(--md-sys-color-outline-variant)",
      background: "var(--md-sys-color-surface-container-highest)",
      color: "var(--md-sys-color-on-surface)",
      font: "inherit",
    },
  },
});

const Buttons = styled("div", {
  base: { display: "flex", flexWrap: "wrap", gap: "var(--gap-md)" },
});

const Meter = styled("div", {
  base: {
    position: "relative",
    height: "10px",
    borderRadius: "999px",
    overflow: "hidden",
    background: "var(--md-sys-color-surface-container-highest)",
    "& .level": {
      height: "100%",
      background: "var(--md-sys-color-outline)",
      transition: "width 60ms linear",
    },
    "& .level[data-open]": { background: "var(--md-sys-color-primary)" },
    "& .mark": {
      position: "absolute",
      top: 0,
      bottom: 0,
      width: "2px",
      background: "var(--md-sys-color-on-surface)",
    },
  },
});
