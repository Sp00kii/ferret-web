import {
  For,
  Show,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
} from "solid-js";
import { Portal } from "solid-js/web";

import { useNavigate } from "@solidjs/router";
import type { Channel, Server } from "stoat.js";
import { styled } from "styled-system/jsx";

import { useClient } from "@revolt/client";
import { Avatar, Symbol } from "@revolt/ui";

type Entry = {
  id: string;
  kind: "dm" | "group" | "text" | "voice" | "server";
  name: string;
  detail?: string;
  icon?: string;
  path: string;
  unread: boolean;
  lastActive: number;
};

const MAX_RESULTS = 9;

const KIND_SYMBOL: Record<Entry["kind"], string> = {
  dm: "alternate_email",
  group: "group",
  text: "tag",
  voice: "volume_up",
  server: "dns",
};

function channelEntry(channel: Channel): Entry | undefined {
  const common = {
    id: channel.id,
    path: channel.path,
    unread: channel.unread || !!channel.mentions?.size,
    lastActive: channel.updatedAt?.getTime?.() ?? 0,
  };
  switch (channel.type) {
    case "DirectMessage": {
      const user = channel.recipient;
      if (!user) return;
      return {
        ...common,
        kind: "dm",
        name: user.displayName,
        detail: `@${user.username}`,
        icon: user.avatarURL,
      };
    }
    case "Group":
      return {
        ...common,
        kind: "group",
        name: channel.name,
        icon: channel.iconURL,
      };
    case "TextChannel":
      return {
        ...common,
        kind: channel.isVoice ? "voice" : "text",
        name: channel.name,
        detail: channel.server?.name,
      };
    default:
      return;
  }
}

function serverEntry(server: Server): Entry {
  return {
    id: server.id,
    kind: "server",
    name: server.name,
    detail: "Server",
    icon: server.iconURL,
    path: `/server/${server.id}`,
    unread: false,
    lastActive: 0,
  };
}

/** Higher is better; -1 means no match */
function score(entry: Entry, query: string) {
  const name = entry.name.toLowerCase();
  const detail = entry.detail?.toLowerCase() ?? "";
  let value = -1;
  if (name === query) value = 100;
  else if (name.startsWith(query)) value = 80;
  else if (name.split(/[\s\-_]+/).some((word) => word.startsWith(query)))
    value = 60;
  else if (name.includes(query)) value = 40;
  else if (detail.includes(query)) value = 20;
  if (value < 0) return value;
  if (entry.kind === "dm" || entry.kind === "group") value += 8;
  if (entry.unread) value += 5;
  return value;
}

/**
 * Ctrl+K: jump to any DM, group, channel or server by typing part of its
 * name (stoatchat/for-desktop#61). Desktop app only.
 */
export function QuickSwitcher() {
  if (!window.ferret) return null;

  const client = useClient();
  const navigate = useNavigate();
  const [open, setOpen] = createSignal(false);
  const [query, setQuery] = createSignal("");
  const [active, setActive] = createSignal(0);
  let input: HTMLInputElement | undefined;

  const entries = createMemo(() => {
    if (!open()) return [];
    const current = client();
    const list: Entry[] = [];
    for (const channel of current.channels.values()) {
      const entry = channelEntry(channel);
      if (entry) list.push(entry);
    }
    for (const server of current.servers.values())
      list.push(serverEntry(server));
    return list;
  });

  const results = createMemo(() => {
    const text = query().trim().toLowerCase().replace(/^[#@]/, "");
    if (!text) {
      // nothing typed: recent conversations, unread first
      return entries()
        .filter((entry) => entry.kind !== "server" && entry.lastActive)
        .sort(
          (a, b) =>
            Number(b.unread) - Number(a.unread) || b.lastActive - a.lastActive,
        )
        .slice(0, MAX_RESULTS);
    }
    return entries()
      .map((entry) => ({ entry, value: score(entry, text) }))
      .filter((item) => item.value >= 0)
      .sort(
        (a, b) => b.value - a.value || b.entry.lastActive - a.entry.lastActive,
      )
      .slice(0, MAX_RESULTS)
      .map((item) => item.entry);
  });

  createEffect(() => {
    results();
    setActive(0);
  });

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  const go = (entry: Entry | undefined) => {
    if (!entry) return;
    close();
    navigate(entry.path);
  };

  const onKey = (event: KeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      event.stopPropagation();
      if (open()) close();
      else {
        setOpen(true);
        queueMicrotask(() => input?.focus());
      }
    }
  };
  window.addEventListener("keydown", onKey, true);
  onCleanup(() => window.removeEventListener("keydown", onKey, true));

  const onInputKey = (event: KeyboardEvent) => {
    const count = results().length;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => (count ? (i + 1) % count : 0));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => (count ? (i - 1 + count) % count : 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      go(results()[active()]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      close();
    }
  };

  return (
    <Show when={open()}>
      <Portal>
        <Backdrop onClick={close}>
          <Box
            role="dialog"
            aria-label="Quick switcher"
            onClick={(event) => event.stopPropagation()}
          >
            <input
              ref={input}
              value={query()}
              onInput={(event) => setQuery(event.currentTarget.value)}
              onKeyDown={onInputKey}
              placeholder="Where to? Type a friend, channel or server…"
              aria-label="Search conversations, channels and servers"
              aria-controls="ferret-switcher-results"
              aria-activedescendant={
                results()[active()]
                  ? `ferret-switch-${results()[active()].id}`
                  : undefined
              }
              autocomplete="off"
              spellcheck={false}
            />
            <ul id="ferret-switcher-results" role="listbox">
              <For
                each={results()}
                fallback={<li class="empty">Nothing matches that name.</li>}
              >
                {(entry, index) => (
                  <li
                    id={`ferret-switch-${entry.id}`}
                    role="option"
                    aria-selected={index() === active()}
                    data-active={index() === active() ? "" : undefined}
                    onMouseMove={() => setActive(index())}
                    onClick={() => go(entry)}
                  >
                    <Show
                      when={entry.icon}
                      fallback={
                        <span class="glyph">
                          <Symbol size={18}>{KIND_SYMBOL[entry.kind]}</Symbol>
                        </span>
                      }
                    >
                      <Avatar
                        size={28}
                        src={entry.icon}
                        fallback={entry.name}
                      />
                    </Show>
                    <span class="name">
                      {entry.kind === "text" ? `#${entry.name}` : entry.name}
                    </span>
                    <Show when={entry.detail}>
                      <span class="detail">{entry.detail}</span>
                    </Show>
                    <Show when={entry.unread}>
                      <span class="dot" aria-label="unread" />
                    </Show>
                  </li>
                )}
              </For>
            </ul>
            <footer>↑ ↓ to move, Enter to open, Esc to close</footer>
          </Box>
        </Backdrop>
      </Portal>
    </Show>
  );
}

const Backdrop = styled("div", {
  base: {
    position: "fixed",
    inset: 0,
    zIndex: 9998,
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    paddingTop: "14vh",
    background: "rgba(0, 0, 0, 0.5)",
  },
});

const Box = styled("div", {
  base: {
    width: "min(560px, calc(100vw - 32px))",
    borderRadius: "var(--borderRadius-xl, 16px)",
    background: "var(--md-sys-color-surface-container-high)",
    color: "var(--md-sys-color-on-surface)",
    boxShadow: "0 16px 48px rgba(0, 0, 0, 0.45)",
    overflow: "hidden",
    "& input": {
      width: "100%",
      padding: "18px 20px",
      border: "none",
      borderBottom: "1px solid var(--md-sys-color-outline-variant)",
      background: "transparent",
      color: "inherit",
      font: "inherit",
      fontSize: "17px",
      outline: "none",
    },
    "& ul": {
      listStyle: "none",
      margin: 0,
      padding: "6px",
      maxHeight: "50vh",
      overflowY: "auto",
    },
    "& li": {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      padding: "8px 12px",
      borderRadius: "10px",
      cursor: "pointer",
    },
    "& li[data-active]": {
      background: "var(--md-sys-color-secondary-container)",
    },
    "& li.empty": {
      cursor: "default",
      color: "var(--md-sys-color-on-surface-variant)",
    },
    "& .glyph": {
      width: "28px",
      height: "28px",
      display: "grid",
      placeItems: "center",
      borderRadius: "8px",
      background: "var(--md-sys-color-surface-container-highest)",
    },
    "& .name": {
      fontWeight: 600,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
    "& .detail": {
      color: "var(--md-sys-color-on-surface-variant)",
      fontSize: "13px",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
    "& .dot": {
      marginLeft: "auto",
      width: "8px",
      height: "8px",
      flex: "none",
      borderRadius: "50%",
      background: "var(--md-sys-color-primary)",
    },
    "& footer": {
      padding: "8px 16px",
      fontSize: "12px",
      color: "var(--md-sys-color-on-surface-variant)",
      borderTop: "1px solid var(--md-sys-color-outline-variant)",
    },
  },
});
