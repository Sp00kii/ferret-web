import { Show } from "solid-js";

import type { User } from "stoat.js";
import { styled } from "styled-system/jsx";

import { Text } from "@revolt/ui";

import { PersonSoundPickers } from "./PersonSoundPickers";

/**
 * Ferret card on someone's profile: a private nickname, their own ringtone
 * and message sound, and their soundboard volume. Desktop app only; not
 * for yourself or bots.
 */
export function ProfileSounds(props: { user: User }) {
  return (
    <Show when={window.ferret && !props.user.self && !props.user.bot}>
      <Card>
        <Text class="label">Just for you (Ferret)</Text>
        <PersonSoundPickers
          userId={props.user.id}
          name={props.user.displayName}
        />
      </Card>
    </Show>
  );
}

const Card = styled("div", {
  base: {
    gridColumn: "1 / -1",
    display: "flex",
    flexDirection: "column",
    gap: "var(--gap-sm)",
  },
});
