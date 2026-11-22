import {
  For,
  Match,
  Show,
  Switch,
  createMemo,
  createSignal,
  onCleanup,
} from "solid-js";

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

import { ferretLogo } from "./Branding";
import type {
  FerretSettings as FerretSettingsType,
  UpdateCheckResult,
} from "./bridge";
import {
  DiagnosticsSection,
  tapToUnlockDiagnostics,
} from "./diagnostics/DiagnosticsSection";
import { FERRET_DONATE_URL } from "./links";
import { pauseAnimationsActive } from "./motion/FerretMotion";
import { FERRET_NOISES, FERRET_NOISE_NAMES, NOISES_ID } from "./noises";
import { PeopleSounds } from "./PeopleSounds";
import { RINGTONES, ringtoneSource } from "./ringtones";
import {
  applyFerretSettings,
  updateFerretSettings,
  useFerretSettings,
} from "./settings";
import { type FerretTab, ferretTab, setFerretTab } from "./settingsTab";
import { SOUND_LIBRARY, SOUND_SLOTS, soundSource } from "./soundLibrary";
import { trackAudio } from "./stopSounds";
import { IconPicker } from "./theme/IconPicker";
import { LookPicker } from "./theme/LookPicker";
import { MicTest } from "./voice/MicTest";
import {
  CompactWindowToggle,
  SoundboardSettings,
  TalkSettings,
} from "./voice/VoiceExtrasSettings";
import { showWhatsNew } from "./whatsNew/WhatsNew";

const TABS: { id: FerretTab; label: string; icon: string }[] = [
  { id: "look", label: "Appearance", icon: "palette" },
  { id: "calls", label: "Calls & voice", icon: "call" },
  { id: "sounds", label: "Sounds & alerts", icon: "notifications" },
  { id: "app", label: "App", icon: "tune" },
];

const tab = ferretTab;
const setTab = setFerretTab;

/**
 * "Ferret" page in user settings: everything the mod adds, split into tabs
 * so it isn't one endless page.
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
              src={ferretLogo()}
              alt=""
              width={40}
              height={40}
              onClick={tapToUnlockDiagnostics}
            />
            <span>{window.ferret!.unofficialNotice}</span>
          </Notice>

          <Tabs role="tablist" aria-label="Ferret settings">
            <For each={TABS}>
              {(entry) => (
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab() === entry.id}
                  data-active={tab() === entry.id ? "" : undefined}
                  onClick={() => setTab(entry.id)}
                >
                  <Symbol size={18}>{entry.icon}</Symbol>
                  {entry.label}
                </button>
              )}
            </For>
          </Tabs>

          <Switch>
            <Match when={tab() === "look"}>
              <Section title="Look">
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
                </CategoryButton.Group>
                <Show when={config().ferretStyle}>
                  <LookPicker settings={config()} />
                </Show>
              </Section>

              <Section title="App icon">
                <IconPicker settings={config()} />
              </Section>

              <Section title="Size and motion">
                <Text class="label">Zoom</Text>
                <Slider
                  min={50}
                  max={200}
                  step={5}
                  value={config().zoom}
                  onChange={(event) =>
                    updateFerretSettings({ zoom: event.currentTarget.value })
                  }
                  labelFormatter={(value) => `${value}%`}
                />
                <Text class="label">
                  Ctrl + and Ctrl − (or Ctrl + mouse wheel) change it too; Ctrl
                  0 resets to 100%.
                </Text>
                <CategoryButton.Group>
                  <Toggle
                    icon="motion_photos_paused"
                    checked={pauseAnimationsActive(config().pauseAnimations)}
                    onToggle={(pauseAnimations) =>
                      updateFerretSettings({ pauseAnimations })
                    }
                    title="Pause GIFs and animated emoji until hovered"
                    description="Animated pictures, emoji and avatars stay still until you point at them. Starts out following Windows' animation setting."
                  />
                  <Toggle
                    icon="link"
                    checked={config().linkPreviews}
                    onToggle={(linkPreviews) =>
                      updateFerretSettings({ linkPreviews })
                    }
                    title="Previews for every link"
                    description="Some sites block Stoat's link previews. Ferret then fetches the page's title and picture itself, so the site sees your IP address, like when you open the link."
                  />
                </CategoryButton.Group>
                <Text class="label">
                  Tip: press Ctrl+K anywhere to jump to a friend, channel or
                  server.
                </Text>
              </Section>
            </Match>

            <Match when={tab() === "calls"}>
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

              <Section title="Microphone">
                <VoiceInputOptions />
                <MicTest />
                <VoiceProcessingOptions />
              </Section>

              <Section title="Push to talk and shortcuts">
                <TalkSettings voice={config().voice} />
              </Section>

              <Section title="Soundboard">
                <SoundboardSettings
                  voice={config().voice}
                  soundboard={config().soundboard}
                />
              </Section>

              <Section title="During calls">
                <CategoryButton.Group>
                  <CompactWindowToggle voice={config().voice} />
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
            </Match>

            <Match when={tab() === "sounds"}>
              <Section title="Notifications">
                <CategoryButton.Group>
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
              </Section>

              <SoundsSection settings={config()} />

              <PeopleSounds settings={config()} />
            </Match>

            <Match when={tab() === "app"}>
              <ConnectionSection />
              <BackupSection />
              <UpdatesSection />
              <DiagnosticsSection />
            </Match>
          </Switch>
        </Column>
      )}
    </Show>
  );
}

function BackupSection() {
  const [message, setMessage] = createSignal<string>();
  const run = async (action: "export" | "import") => {
    setMessage(undefined);
    const result =
      action === "export"
        ? await window.ferret!.exportSettings()
        : await window.ferret!.importSettings();
    if (!result || result.status === "cancelled") return;
    if (result.status === "error") return setMessage(result.message);
    setMessage(
      result.status === "saved"
        ? `Backup saved, including ${result.files} of your sound files.`
        : `Settings restored, including ${result.files} sound files.`,
    );
  };

  return (
    <Section title="Backup">
      <Text class="label">
        Save all Ferret settings and your own sounds, ringtones and soundboard
        clips to one file, so you can restore them on a new PC or after a
        reinstall. The file holds no passwords or account details.
      </Text>
      <Buttons>
        <Button variant="tonal" onPress={() => void run("export")}>
          <Symbol>download</Symbol> Save backup…
        </Button>
        <Button variant="tonal" onPress={() => void run("import")}>
          <Symbol>upload</Symbol> Restore from backup…
        </Button>
      </Buttons>
      <Show when={message()}>
        <Text class="label">{message()}</Text>
      </Show>
    </Section>
  );
}

const Tabs = styled("div", {
  base: {
    display: "flex",
    flexWrap: "wrap",
    gap: "var(--gap-sm)",
    padding: "4px",
    borderRadius: "999px",
    background: "var(--md-sys-color-surface-container)",
    width: "fit-content",
    "& button": {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      padding: "8px 16px",
      border: "none",
      borderRadius: "999px",
      background: "transparent",
      color: "var(--md-sys-color-on-surface-variant)",
      font: "inherit",
      fontWeight: 600,
      cursor: "pointer",
    },
    "& button:hover": { color: "var(--md-sys-color-on-surface)" },
    "& button[data-active]": {
      background: "var(--md-sys-color-secondary-container)",
      color: "var(--md-sys-color-on-secondary-container)",
    },
  },
});

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
    trackAudio(preview);
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
const PREVIEW_SECONDS = 10;

function previewSound(src: string) {
  soundPreview?.pause();
  // long custom files stop after a while (or with the Stop button)
  soundPreview = trackAudio(new Audio(src), PREVIEW_SECONDS);
  void soundPreview.play().catch(() => {});
}

function SoundsSection(props: { settings: FerretSettingsType }) {
  const [error, setError] = createSignal<string>();
  const latestSettings = useFerretSettings();

  const options = (slot: (typeof SOUND_SLOTS)[number]["slot"]) => {
    const pick = props.settings.sounds[slot];
    const entries: Record<string, { title: string }> = {
      ferret: { title: "Ferret (default)" },
      // each slot has its own ferret sound, so say which one
      [NOISES_ID]: {
        title: `Ferret noises: ${FERRET_NOISE_NAMES[slot]}`,
      },
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
        <Button
          variant="tonal"
          onPress={async () => {
            await updateFerretSettings({
              sounds: Object.fromEntries(
                SOUND_SLOTS.map((entry) => [entry.slot, { choice: NOISES_ID }]),
              ),
            });
            previewSound(FERRET_NOISES.message);
          }}
        >
          <Symbol>pets</Symbol> Use ferret noises for everything
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
        icon={<Symbol>new_releases</Symbol>}
        description="The latest Ferret features at a glance"
        onClick={showWhatsNew}
      >
        What's new
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
