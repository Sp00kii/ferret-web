import { Show, createSignal } from "solid-js";

import { CategoryButton, Checkbox, Symbol, Text } from "@revolt/ui";

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
 * Ringtone + message sound pickers for one person. Used in Settings ->
 * Ferret and on the person's profile. Picking a sound for someone who isn't
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
      <Show when={error()}>
        <Text class="label">{error()}</Text>
      </Show>
    </>
  );
}
