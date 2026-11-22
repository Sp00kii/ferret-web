import { For, Show, createMemo, createSignal, onCleanup } from "solid-js";

import { styled } from "styled-system/jsx";

import { VoiceInputOptions } from "@revolt/app/interface/settings/user/voice/VoiceInputOptions";
import { VoiceProcessingOptions } from "@revolt/app/interface/settings/user/voice/VoiceProcessingOptions";
import { useClient, useClientLifecycle } from "@revolt/client";
import {
  Button,
  CategoryButton,
  Checkbox,
  Column,
  Slider,
  Symbol,
  Text,
} from "@revolt/ui";

import { FERRET_LOGO } from "./Branding";
import type {
  FerretSettings as FerretSettingsType,
  UpdateCheckResult,
} from "./bridge";
import {
  DiagnosticsSection,
  tapToUnlockDiagnostics,
} from "./diagnostics/DiagnosticsSection";
import { FERRET_DONATE_URL } from "./links";
import { PeopleSounds } from "./PeopleSounds";
import { RINGTONES, ringtoneSource } from "./ringtones";
import {
  applyFerretSettings,
  updateFerretSettings,
  useFerretSettings,
} from "./settings";
import { SOUND_LIBRARY, SOUND_SLOTS, soundSource } from "./soundLibrary";
import { LookPicker } from "./theme/LookPicker";
import { MicTest } from "./voice/MicTest";
import { VoiceExtrasSettings } from "./voice/VoiceExtrasSettings";

/**
 * "Ferret" page in user settings: everything the mod adds, in one place.
 */
export function FerretSettings() {
  const settings = useFerretSettings();

  return (
    <Show
      when={window.ferret && settings()}
      fallback={
        <Text>These settings are only available in the Ferret app.</Text>
      }
    >
      {(config) => (
        <Column gap="lg">
          <Notice>
            <img
              src={FERRET_LOGO}
              alt=""
              width={40}
              height={40}
              onClick={tapToUnlockDiagnostics}
            />
            <span>{window.ferret!.unofficialNotice}</span>
          </Notice>

          <Section title="Appearance">
            <CategoryButton.Group>
              <Toggle
                icon="palette"
                checked={config().ferretStyle}
                onToggle={(ferretStyle) =>
                  updateFerretSettings({ ferretStyle })
                }
                title="Ferret style"
                description="Ferret's own themes and accent colours. Turn off for Stoat's normal theme and layout; your Appearance settings then apply as usual."
              />
              <Toggle
                icon="chat_bubble"
                checked={config().notificationPopups}
                onToggle={(notificationPopups) =>
                  updateFerretSettings({ notificationPopups })
                }
                title="Ferret notification pop-ups"
                description="Show new messages in a Ferret pop-up in the corner where you can reply straight away. Turn off to use normal Windows notifications. Which messages notify is still set in Settings → Notifications."
              />
            </CategoryButton.Group>
            <Show when={config().ferretStyle}>
              <LookPicker settings={config()} />
            </Show>
          </Section>

          <Section title="Incoming calls">
            <CategoryButton.Group>
              <Toggle
                icon="ring_volume"
                checked={config().ringtone.enabled}
                onToggle={(enabled) =>
                  updateFerretSettings({ ringtone: { enabled } })
                }
                title="Ring for incoming calls"
                description="Loop a ringtone and show a Windows notification when someone starts a call in a DM or group, or in a voice channel you watch below."
              />
              <Toggle
                icon="minimize"
                checked={config().ringtone.ringWhenHidden}
                onToggle={(ringWhenHidden) =>
                  updateFerretSettings({ ringtone: { ringWhenHidden } })
                }
                title="Ring while minimised or in the tray"
                description="Turn off to only ring while the Ferret window is on screen."
              />
            </CategoryButton.Group>

            <Text class="label">Ringtone volume</Text>
            <Slider
              min={0}
              max={100}
              step={5}
              value={config().ringtone.volume}
              onChange={(event) =>
                updateFerretSettings({
                  ringtone: { volume: event.currentTarget.value },
                })
              }
              labelFormatter={(value) => `${value}%`}
            />

            <RingtonePicker ringtone={config().ringtone} />
          </Section>

          <WatchedChannels watched={config().watchedVoiceChannels} />

          <SoundsSection settings={config()} />

          <PeopleSounds settings={config()} />

          <Section title="Voice">
            <VoiceInputOptions />
            <MicTest />
            <VoiceProcessingOptions />
            <VoiceExtrasSettings
              voice={config().voice}
              soundboard={config().soundboard}
            />
            <CategoryButton.Group>
              <Toggle
                icon="network_check"
                checked={config().showConnectionQuality}
                onToggle={(showConnectionQuality) =>
                  updateFerretSettings({ showConnectionQuality })
                }
                title="Show connection quality in calls"
                description="Ping and packet loss next to the call status."
              />
            </CategoryButton.Group>
          </Section>

          <ConnectionSection />
          <UpdatesSection />
          <DiagnosticsSection />
        </Column>
      )}
    </Show>
  );
}

function Section(props: { title: string; children: unknown }) {
  return (
    <Column gap="md">
      <Text class="title" size="large">
        {props.title}
      </Text>
      {props.children as never}
    </Column>
  );
}

function Toggle(props: {
  icon: string;
  checked: boolean;
  onToggle: (value: boolean) => void;
  title: string;
  description: string;
}) {
  return (
    <CategoryButton
      action={<Checkbox checked={props.checked} />}
      onClick={() => props.onToggle(!props.checked)}
      icon={<Symbol>{props.icon}</Symbol>}
      description={props.description}
    >
      {props.title}
    </CategoryButton>
  );
}

function RingtonePicker(props: { ringtone: FerretSettingsType["ringtone"] }) {
  const [error, setError] = createSignal<string>();
  let preview: HTMLAudioElement | undefined;
  let previewTimer: ReturnType<typeof setTimeout> | undefined;

  const stopPreview = () => {
    clearTimeout(previewTimer);
    preview?.pause();
    preview = undefined;
  };
  onCleanup(stopPreview);

  const playPreview = (ringtone = props.ringtone) => {
    stopPreview();
    setError(undefined);
    const src = ringtoneSource(ringtone);
    // custom files keep the same URL, so bust the cache after a re-pick
    preview = new Audio(
      ringtone.preset === "custom" ? `${src}&t=${Date.now()}` : src,
    );
    preview.volume = ringtone.volume / 100;
    void preview.play().catch(() => setError("Couldn't play this sound file."));
    previewTimer = setTimeout(stopPreview, 5000);
  };

  const pick = async () => {
    setError(undefined);
    try {
      const next = await window.ferret!.pickRingtone();
      applyFerretSettings(next);
      if (next?.ringtone.preset === "custom") playPreview(next.ringtone);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const options = createMemo(() => {
    const entries: Record<string, { title: string }> = {};
    for (const tone of RINGTONES) entries[tone.id] = { title: tone.name };
    entries.custom = {
      title: props.ringtone.customFileName
        ? `Your file: ${props.ringtone.customFileName}`
        : "Your own file…",
    };
    return entries;
  });

  const select = async (id: string) => {
    if (id === "custom" && !props.ringtone.customFileName) return pick();
    await updateFerretSettings({ ringtone: { preset: id } });
    playPreview({ ...props.ringtone, preset: id });
  };

  return (
    <Column gap="sm">
      <CategoryButton.Group>
        <CategoryButton.Select
          icon={<Symbol>music_note</Symbol>}
          title="Ringtone"
          value={
            props.ringtone.preset === "custom" && !props.ringtone.customFileName
              ? RINGTONES[0].id
              : props.ringtone.preset
          }
          options={options()}
          onUpdate={(id) => void select(id)}
        />
      </CategoryButton.Group>
      <Buttons>
        <Button variant="tonal" onPress={() => playPreview()}>
          <Symbol>play_arrow</Symbol> Preview
        </Button>
        <Button variant="tonal" onPress={pick}>
          <Symbol>upload_file</Symbol> Use my own file…
        </Button>
        <Show when={props.ringtone.customFileName}>
          <Button
            variant="tonal"
            onPress={async () =>
              applyFerretSettings(await window.ferret!.clearRingtone())
            }
          >
            Remove my file
          </Button>
        </Show>
      </Buttons>
      <Show when={error()}>
        <Text class="label">{error()}</Text>
      </Show>
    </Column>
  );
}

let soundPreview: HTMLAudioElement | undefined;

function previewSound(src: string) {
  soundPreview?.pause();
  soundPreview = new Audio(src);
  void soundPreview.play().catch(() => {});
}

function SoundsSection(props: { settings: FerretSettingsType }) {
  const [error, setError] = createSignal<string>();
  const latestSettings = useFerretSettings();

  const options = (slot: string) => {
    const pick = props.settings.sounds[slot];
    const entries: Record<string, { title: string }> = {
      ferret: { title: "Ferret (default)" },
    };
    for (const sound of SOUND_LIBRARY)
      entries[sound.id] = { title: sound.name };
    entries.custom = {
      title: pick?.customFileName
        ? `Your file: ${pick.customFileName}`
        : "Your own file…",
    };
    return entries;
  };

  const select = async (
    slot: (typeof SOUND_SLOTS)[number]["slot"],
    id: string,
  ) => {
    setError(undefined);
    try {
      if (id === "custom" && !props.settings.sounds[slot]?.customFileName) {
        // a cancelled file picker leaves the previous choice selected
        applyFerretSettings(await window.ferret!.pickSound(slot));
      } else {
        await updateFerretSettings({ sounds: { [slot]: { choice: id } } });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return;
    }

    const latest = latestSettings();
    if ((latest?.sounds[slot]?.choice ?? "ferret") === id) {
      previewSound(soundSource(slot, latest));
    }
  };

  return (
    <Section title="Sounds">
      <Text class="label">
        Pick the sound for each event, or use your own file. Turning sounds on
        or off is in Settings → Notifications.
      </Text>
      <CategoryButton.Group>
        <For each={SOUND_SLOTS}>
          {(entry) => (
            <CategoryButton.Select
              icon={<Symbol>volume_up</Symbol>}
              title={entry.label}
              value={props.settings.sounds[entry.slot]?.choice ?? "ferret"}
              options={options(entry.slot)}
              onUpdate={(id) => void select(entry.slot, id)}
            />
          )}
        </For>
      </CategoryButton.Group>
      <Buttons>
        <Button
          variant="tonal"
          onPress={async () =>
            applyFerretSettings(await window.ferret!.resetSounds())
          }
        >
          <Symbol>restart_alt</Symbol> Reset all to Ferret
        </Button>
      </Buttons>
      <Show when={error()}>
        <Text class="label">{error()}</Text>
      </Show>
    </Section>
  );
}

function WatchedChannels(props: { watched: string[] }) {
  const client = useClient();

  const servers = createMemo(() =>
    client()
      .servers.toList()
      .map((server) => ({
        server,
        channels: server.channels.filter((channel) => channel.isVoice),
      }))
      .filter((entry) => entry.channels.length > 0),
  );

  const toggle = (id: string, watch: boolean) =>
    updateFerretSettings({
      watchedVoiceChannels: watch
        ? [...props.watched, id]
        : props.watched.filter((other) => other !== id),
    });

  return (
    <Section title="Watched voice channels">
      <Text class="label">
        Ring when a call starts in these server voice channels (when the first
        person joins). DMs and groups always ring.
      </Text>
      <Show
        when={servers().length}
        fallback={
          <Text class="label">
            You're not in any server with voice channels.
          </Text>
        }
      >
        <For each={servers()}>
          {(entry) => (
            <Column gap="sm">
              <Text class="label">{entry.server.name}</Text>
              <CategoryButton.Group>
                <For each={entry.channels}>
                  {(channel) => (
                    <Toggle
                      icon="volume_up"
                      checked={props.watched.includes(channel.id)}
                      onToggle={(watch) => toggle(channel.id, watch)}
                      title={channel.name}
                      description="Ring when a call starts here"
                    />
                  )}
                </For>
              </CategoryButton.Group>
            </Column>
          )}
        </For>
      </Show>
    </Section>
  );
}

function ConnectionSection() {
  const lifecycle = useClientLifecycle().lifecycle;

  return (
    <Section title="Connection">
      <CategoryButton
        icon={<Symbol>sync</Symbol>}
        description={`Status: ${lifecycle.state()}. Ferret reconnects by itself after sleep, unlock or a network drop; use this if something still looks out of date.`}
        onClick={() => lifecycle.resync("manual")}
      >
        Resync now
      </CategoryButton>
    </Section>
  );
}

function UpdatesSection() {
  const [checking, setChecking] = createSignal(false);
  const [result, setResult] = createSignal<UpdateCheckResult>();

  const check = async () => {
    setChecking(true);
    try {
      setResult(await window.ferret!.checkForUpdates());
    } finally {
      setChecking(false);
    }
  };

  const describe = (value: UpdateCheckResult) => {
    switch (value.status) {
      case "up-to-date":
        return "You're on the latest version.";
      case "available":
        return `Version ${value.version} is available.`;
      case "downloading":
        return `Downloading ${value.version}. Ferret will ask before restarting.`;
      case "error":
        return `Couldn't check for updates: ${value.message}`;
    }
  };

  return (
    <Section title="About Ferret">
      <CategoryButton
        icon={<Symbol>system_update</Symbol>}
        description={
          checking()
            ? "Checking…"
            : result()
              ? describe(result()!)
              : `Version ${window.ferret!.version}`
        }
        onClick={() => !checking() && void check()}
      >
        Check for updates
      </CategoryButton>
      <CategoryButton
        icon={<Symbol>code</Symbol>}
        description="Source code, releases and the list of changes (AGPL-3.0)"
        onClick={() => window.open(window.ferret!.repository, "_blank")}
      >
        Ferret on GitHub
      </CategoryButton>
      <CategoryButton
        icon={<Symbol>favorite</Symbol>}
        description="Support Ferret's development on Ko-fi - thank you!"
        onClick={() => window.open(FERRET_DONATE_URL, "_blank")}
      >
        Donate to Ferret
      </CategoryButton>
    </Section>
  );
}

const Notice = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "var(--gap-md)",
    padding: "var(--gap-md) var(--gap-lg)",
    borderRadius: "var(--borderRadius-lg)",
    background: "var(--md-sys-color-secondary-container)",
    color: "var(--md-sys-color-on-secondary-container)",
    "& img": {
      flexShrink: 0,
      borderRadius: "var(--borderRadius-sm)",
    },
  },
});

const Buttons = styled("div", {
  base: {
    display: "flex",
    flexWrap: "wrap",
    gap: "var(--gap-sm)",
  },
});
