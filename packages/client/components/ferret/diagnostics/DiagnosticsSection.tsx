import { For, Show, createResource, createSignal } from "solid-js";

import { styled } from "styled-system/jsx";

import { useClient, useClientLifecycle } from "@revolt/client";
import { useVoice } from "@revolt/rtc";
import { Button, Column, Symbol, Text } from "@revolt/ui";

import {
  clearDiagnostics,
  diagnosticEntries,
  diagnosticsReport,
  eventCounts,
  lastEvents,
} from "./recorder";

const STORAGE_KEY = "ferret:diagnostics";
const SOCKET_STATES = ["idle", "connecting", "connected", "disconnected"];

function readUnlocked() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

const [unlocked, setUnlockedSignal] = createSignal(readUnlocked());

function setUnlocked(value: boolean) {
  setUnlockedSignal(value);
  try {
    if (value) localStorage.setItem(STORAGE_KEY, "1");
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // not saved, still works for this session
  }
}

let taps: number[] = [];
/** Five quick taps on the Ferret logo show the panel */
export function tapToUnlockDiagnostics() {
  const now = Date.now();
  taps = [...taps.filter((at) => now - at < 2000), now];
  if (taps.length >= 5) {
    taps = [];
    setUnlocked(!unlocked());
  }
}

const time = (at: number) => new Date(at).toLocaleTimeString();

export function DiagnosticsSection() {
  const client = useClient();
  const lifecycle = useClientLifecycle().lifecycle;
  const voice = useVoice();
  const [facts, { refetch }] = createResource(() =>
    window.ferret!.diagnostics(),
  );
  const [copied, setCopied] = createSignal(false);

  const live = () => {
    const events = client()?.events;
    const ping = events?.ping?.() ?? -1;
    return {
      Connection: lifecycle.state(),
      Websocket: events ? (SOCKET_STATES[events.state()] ?? "?") : "none",
      Ping: ping >= 0 ? `${ping} ms` : "unknown",
      Voice: voice.state().toLowerCase(),
      Online: navigator.onLine ? "yes" : "no",
    };
  };

  const copy = async () => {
    await refetch();
    const report = diagnosticsReport({ ...live(), ...(facts() ?? {}) });
    await navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Show when={unlocked()}>
      <Column gap="md">
        <Text class="title" size="large">
          Diagnostics
        </Text>
        <Text class="label">
          For troubleshooting. Only connection states and event types are
          recorded, never messages, names or ids, and nothing is sent anywhere.
          "Copy logs" puts it on your clipboard so you can paste it in a bug
          report.
        </Text>

        <Facts>
          <For each={Object.entries(live())}>
            {([key, value]) => (
              <>
                <dt>{key}</dt>
                <dd>{value}</dd>
              </>
            )}
          </For>
          <For each={Object.entries(facts() ?? {})}>
            {([key, value]) => (
              <>
                <dt>{key}</dt>
                <dd>{String(value)}</dd>
              </>
            )}
          </For>
        </Facts>

        <Buttons>
          <Button variant="filled" onPress={() => void copy()}>
            <Symbol>content_copy</Symbol> {copied() ? "Copied!" : "Copy logs"}
          </Button>
          <Button variant="tonal" onPress={() => lifecycle.resync("manual")}>
            <Symbol>sync</Symbol> Resync now
          </Button>
          <Button variant="tonal" onPress={clearDiagnostics}>
            <Symbol>delete_sweep</Symbol> Clear
          </Button>
          <Button variant="tonal" onPress={() => setUnlocked(false)}>
            <Symbol>visibility_off</Symbol> Hide
          </Button>
        </Buttons>

        <Text class="label">Connection log</Text>
        <Log>
          <For
            each={[...diagnosticEntries()].reverse().slice(0, 150)}
            fallback={<div>Nothing yet.</div>}
          >
            {(entry) => (
              <div>
                <time>{time(entry.at)}</time>
                <b>{entry.category}</b> {entry.text}
              </div>
            )}
          </For>
        </Log>

        <Text class="label">Last websocket events (types only)</Text>
        <Log>
          <For
            each={[...lastEvents()].reverse().slice(0, 30)}
            fallback={<div>Nothing yet.</div>}
          >
            {(event) => (
              <div>
                <time>{time(event.at)}</time> {event.type}
              </div>
            )}
          </For>
        </Log>
        <Text class="label">
          Totals:{" "}
          {Object.entries(eventCounts())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 12)
            .map(([type, count]) => `${type} ${count}`)
            .join(" · ") || "none"}
        </Text>
      </Column>
    </Show>
  );
}

const Facts = styled("dl", {
  base: {
    display: "grid",
    gridTemplateColumns: "max-content 1fr",
    gap: "4px 16px",
    margin: 0,
    fontSize: "13px",
    "& dt": { color: "var(--md-sys-color-outline)" },
    "& dd": { margin: 0, wordBreak: "break-word" },
  },
});

const Buttons = styled("div", {
  base: { display: "flex", flexWrap: "wrap", gap: "var(--gap-md)" },
});

const Log = styled("div", {
  base: {
    maxHeight: "220px",
    overflowY: "auto",
    padding: "8px 10px",
    borderRadius: "var(--borderRadius-md, 8px)",
    background: "var(--md-sys-color-surface-container-highest)",
    fontFamily: "ui-monospace, Consolas, monospace",
    fontSize: "12px",
    lineHeight: 1.5,
    userSelect: "text",
    "& time": { color: "var(--md-sys-color-outline)", marginRight: "8px" },
    "& b": { fontWeight: 600, marginRight: "6px" },
  },
});
