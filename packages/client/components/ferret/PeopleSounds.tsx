import { For, Show, createMemo, createSignal } from "solid-js";

import { styled } from "styled-system/jsx";

import { useClient } from "@revolt/client";
import { Avatar, Button, Column, Symbol, Text } from "@revolt/ui";

import { PersonSoundPickers } from "./PersonSoundPickers";
import type { FerretSettings } from "./bridge";
import { updateFerretSettings } from "./settings";

const MAX_MATCHES = 8;

/**
 * Give friends their own ringtone and / or message sound. People can also
 * be added from their right-click menu ("Ferret sounds…").
 */
export function PeopleSounds(props: { settings: FerretSettings }) {
  const client = useClient();
  const [query, setQuery] = createSignal("");

  const people = createMemo(() =>
    Object.entries(props.settings.people).map(([id, person]) => ({
      id,
      person,
      user: client().users.get(id),
    })),
  );

  const matches = createMemo(() => {
    const text = query().trim().toLowerCase();
    if (!text) return [];
    return client()
      .users.filter(
        (user) =>
          !user.self &&
          !user.bot &&
          !props.settings.people[user.id] &&
          (user.relationship === "Friend" ||
            user.relationship === "Outgoing" ||
            user.relationship === "Incoming" ||
            !!client().channels.find(
              (channel) =>
                channel.type === "DirectMessage" &&
                channel.recipientIds?.has(user.id),
            )) &&
          (user.username.toLowerCase().includes(text) ||
            user.displayName.toLowerCase().includes(text)),
      )
      .slice(0, MAX_MATCHES);
  });

  const add = (id: string, name: string) => {
    setQuery("");
    void updateFerretSettings({ people: { [id]: { name } } });
  };

  return (
    <Column gap="md">
      <Text class="title" size="large">
        Sounds for specific people
      </Text>
      <Text class="label">
        Give someone their own ringtone or message sound, so you know who it is
        without looking, or mute their soundboard. You can also right-click
        anyone and pick "Ferret sounds…".
      </Text>

      <For each={people()}>
        {(entry) => {
          const name = () =>
            entry.user?.displayName ?? (entry.person.name || "Unknown user");
          return (
            <Person>
              <header>
                <Avatar
                  size={28}
                  src={entry.user?.avatarURL}
                  fallback={name().slice(0, 1)}
                />
                <strong>{name()}</strong>
                <Button
                  variant="tonal"
                  onPress={() =>
                    void updateFerretSettings({ people: { [entry.id]: null } })
                  }
                >
                  <Symbol>delete</Symbol>
                </Button>
              </header>
              <PersonSoundPickers userId={entry.id} name={name()} />
            </Person>
          );
        }}
      </For>

      <Search
        placeholder="Add someone: type a friend's name…"
        value={query()}
        onInput={(event) => setQuery(event.currentTarget.value)}
      />
      <Show when={query().trim() && !matches().length}>
        <Text class="label">
          No friends or DMs match. Right-click someone in a server to add them.
        </Text>
      </Show>
      <For each={matches()}>
        {(user) => (
          <Match type="button" onClick={() => add(user.id, user.displayName)}>
            <Avatar
              size={24}
              src={user.avatarURL}
              fallback={user.displayName.slice(0, 1)}
            />
            <span>{user.displayName}</span>
            <small>@{user.username}</small>
            <Symbol>add</Symbol>
          </Match>
        )}
      </For>
    </Column>
  );
}

const Person = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "var(--gap-sm)",
    "& header": {
      display: "flex",
      alignItems: "center",
      gap: "var(--gap-md)",
    },
    "& header strong": { flex: 1, minWidth: 0 },
  },
});

const Search = styled("input", {
  base: {
    padding: "10px 14px",
    borderRadius: "var(--borderRadius-md, 8px)",
    border: "1px solid var(--md-sys-color-outline-variant)",
    background: "var(--md-sys-color-surface-container-highest)",
    color: "var(--md-sys-color-on-surface)",
    font: "inherit",
  },
});

const Match = styled("button", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "var(--gap-md)",
    padding: "6px 10px",
    border: "none",
    borderRadius: "var(--borderRadius-md, 8px)",
    background: "var(--md-sys-color-surface-container)",
    color: "var(--md-sys-color-on-surface)",
    cursor: "pointer",
    font: "inherit",
    textAlign: "left",
    "& span": { flex: 1 },
    "& small": { color: "var(--md-sys-color-outline)" },
    "&:hover": { background: "var(--md-sys-color-surface-container-high)" },
  },
});
