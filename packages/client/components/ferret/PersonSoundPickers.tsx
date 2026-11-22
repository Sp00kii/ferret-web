import { Show, createSignal } from "solid-js";

import { styled } from "styled-system/jsx";

import { CategoryButton, Checkbox, Slider, Symbol, Text } from "@revolt/ui";

import { nicknameFor } from "./nicknames";
import { NOISES_ID, NOISES_LABEL } from "./noises";
import {
  type PersonSoundKind,
  personMessageSource,
  personRingtoneSource,
} from "./people";
import { RINGTONES } from "./ringtones";
import {
  applyFerretSettings,
  updateFerretSettings,
  useFerretSettings,
} from "./settings";
import { SOUND_LIBRARY } from "./soundLibrary";
import { trackAudio } from "./stopSounds";

let preview: HTMLAudioElement | undefined;
function play(src: string | undefined) {
  if (!src) return;
  preview?.pause();
  preview = trackAudio(new Audio(src), 5);
  void preview.play().catch(() => {});
}

/**
 * Private nickname, ringtone + message sound pickers and soundboard volume
 * for one person. Used in Settings -> Ferret and on the person's profile. Picking a sound for someone who isn't
 * in the list yet adds them.
 */
export function PersonSoundPickers(props: { userId: string; name: string }) {
  const settings = useFerretSettings();
  const [error, setError] = createSignal<string>();

  const person = () => settings()?.people[props.userId];

  const options = (kind: PersonSoundKind) => {
    const entries: Record<string, { title: string }> = {
      default:
        kind === "ringtone"
          ? { title: "Normal ringtone" }
          : { title: "Normal message sound" },
    };
    if (kind === "ringtone") {
      for (const tone of RINGTONES) entries[tone.id] = { title: tone.name };
    } else {
      entries.ferret = { title: "Ferret" };
      entries[NOISES_ID] = { title: NOISES_LABEL };
      for (const sound of SOUND_LIBRARY)
        entries[sound.id] = { title: sound.name };
    }
    const file = person()?.[kind]?.customFileName;
    entries.custom = { title: file ? `Your file: ${file}` : "Your own file…" };
    return entries;
  };

  const choose = async (kind: PersonSoundKind, choice: string) => {
    setError(undefined);
    const id = props.userId;
    try {
      if (choice === "default") {
        if (person()) {
          await updateFerretSettings({ people: { [id]: { [kind]: null } } });
        }
        return;
      }
      if (choice === "custom" && !person()?.[kind]?.customFileName) {
        applyFerretSettings(await window.ferret!.pickPersonSound(id, kind));
        if (person() && !person()!.name) {
          await updateFerretSettings({
            people: { [id]: { name: props.name } },
          });
        }
      } else {
        await updateFerretSettings({
          people: { [id]: { name: props.name, [kind]: { choice } } },
        });
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message.replace(/^.*Error: /, "") : String(e),
      );
      return;
    }
    play(
      kind === "ringtone"
        ? personRingtoneSource(settings(), id)
        : personMessageSource(settings(), id),
    );
  };

  const toggleSoundboard = async () => {
    setError(undefined);
    try {
      await updateFerretSettings({
        people: {
          [props.userId]: {
            name: props.name,
            muteSoundboard: !person()?.muteSoundboard,
          },
        },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <>
      <NicknameField userId={props.userId} />
      <CategoryButton.Group>
        <CategoryButton.Select
          icon={<Symbol>ring_volume</Symbol>}
          title="Ringtone"
          value={person()?.ringtone?.choice ?? "default"}
          options={options("ringtone")}
          onUpdate={(choice) => void choose("ringtone", choice)}
        />
        <CategoryButton.Select
          icon={<Symbol>notifications</Symbol>}
          title="Message sound"
          value={person()?.message?.choice ?? "default"}
          options={options("message")}
          onUpdate={(choice) => void choose("message", choice)}
        />
        <CategoryButton
          icon={<Symbol>volume_off</Symbol>}
          action={<Checkbox checked={!!person()?.muteSoundboard} />}
          onClick={() => void toggleSoundboard()}
          description="Don't play their soundboard clips (you still hear their voice)"
        >
          Mute their soundboard
        </CategoryButton>
      </CategoryButton.Group>
      <Show when={!person()?.muteSoundboard}>
        <Text class="label">Their soundboard volume (just for you)</Text>
        <Slider
          min={0}
          max={100}
          step={5}
          value={person()?.soundboardVolume ?? 100}
          onChange={(event) =>
            void updateFerretSettings({
              people: {
                [props.userId]: {
                  name: props.name,
                  soundboardVolume: event.currentTarget.value,
                },
              },
            })
          }
          labelFormatter={(value) => `${value}%`}
        />
      </Show>
      <Show when={error()}>
        <Text class="label">{error()}</Text>
      </Show>
    </>
  );
}

/** A name for this person that only you see, everywhere in Ferret */
function NicknameField(props: { userId: string }) {
  const [error, setError] = createSignal<string>();

  const save = async (value: string) => {
    setError(undefined);
    try {
      await updateFerretSettings({
        nicknames: { [props.userId]: value.trim() || null },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <>
      <Input
        value={nicknameFor(props.userId) ?? ""}
        placeholder="Nickname (only you see it)"
        maxLength={32}
        aria-label="Private nickname"
        onChange={(event) => void save(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
        }}
      />
      <Show when={error()}>
        <Text class="label">{error()}</Text>
      </Show>
    </>
  );
}

const Input = styled("input", {
  base: {
    width: "100%",
    padding: "10px 12px",
    border: "none",
    borderRadius: "var(--borderRadius-md)",
    fontSize: "14px",
    color: "var(--md-sys-color-on-surface)",
    background: "var(--md-sys-color-surface-container-high)",
    outline: "none",
    "&:focus": {
      boxShadow: "0 0 0 2px var(--md-sys-color-primary)",
    },
  },
});
