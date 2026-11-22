import { createSignal } from "solid-js";

/**
 * A small in-memory log for troubleshooting ("my friends show offline",
 * "voice keeps dropping"). Only states and event *types* are recorded:
 * never message text, names, ids or tokens. Nothing leaves the computer
 * unless the user copies it.
 */

export type DiagnosticEntry = { at: number; category: string; text: string };

const MAX_ENTRIES = 400;
const MAX_TEXT = 240;

const [entries, setEntries] = createSignal<DiagnosticEntry[]>([]);
const [eventCounts, setEventCounts] = createSignal<Record<string, number>>({});
const [lastEvents, setLastEvents] = createSignal<
  { at: number; type: string }[]
>([]);

export { entries as diagnosticEntries, eventCounts, lastEvents };

const startedAt = Date.now();
export const recorderStartedAt = startedAt;

/** Ids (users, channels, messages) and anything token-like are hidden */
const scrub = (text: string) =>
  text
    .replace(/\b[0-9A-HJKMNP-TV-Z]{26}\b/g, "<id>")
    .replace(/(token|session|authorization)["':= ]+[^\s"',}]+/gi, "$1=<hidden>")
    .slice(0, MAX_TEXT);

export function logDiagnostic(category: string, text: string) {
  const entry = { at: Date.now(), category, text: scrub(text) };
  setEntries((list) =>
    list.length >= MAX_ENTRIES
      ? [...list.slice(list.length - MAX_ENTRIES + 1), entry]
      : [...list, entry],
  );
}

/** Websocket event seen: only its type is kept */
export function recordEvent(type: unknown) {
  const name = typeof type === "string" ? type.slice(0, 40) : "unknown";
  setEventCounts((counts) => ({ ...counts, [name]: (counts[name] ?? 0) + 1 }));
  // Ready / Pong are frequent but useful; keep the latest 60 of everything
  setLastEvents((list) => [...list.slice(-59), { at: Date.now(), type: name }]);
}

export function clearDiagnostics() {
  setEntries([]);
  setEventCounts({});
  setLastEvents([]);
}

let globalHandlersInstalled = false;

/** Page-wide errors and network changes, installed once */
export function installGlobalDiagnostics() {
  if (globalHandlersInstalled) return;
  globalHandlersInstalled = true;

  window.addEventListener("error", (event) =>
    logDiagnostic(
      "error",
      `${event.message}${event.filename ? ` (${event.filename.split("/").pop()}:${event.lineno})` : ""}`,
    ),
  );
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    logDiagnostic(
      "error",
      `Unhandled: ${reason instanceof Error ? reason.message : String(reason)}`,
    );
  });
  window.addEventListener("online", () => logDiagnostic("network", "online"));
  window.addEventListener("offline", () => logDiagnostic("network", "offline"));
  document.addEventListener("visibilitychange", () =>
    logDiagnostic("window", document.hidden ? "hidden" : "visible"),
  );
  logDiagnostic("app", `started, ${navigator.onLine ? "online" : "offline"}`);
}

const time = (at: number) => new Date(at).toISOString().slice(11, 23);

/** Plain-text report for "Copy logs" */
export function diagnosticsReport(extra: Record<string, unknown>) {
  const lines = [
    "Ferret diagnostics",
    `Generated: ${new Date().toISOString()}`,
    `Recording since: ${new Date(startedAt).toISOString()}`,
    "",
    ...Object.entries(extra).map(([key, value]) => `${key}: ${String(value)}`),
    "",
    "== Log ==",
    ...entries().map(
      (entry) => `${time(entry.at)} [${entry.category}] ${entry.text}`,
    ),
    "",
    "== Event counts ==",
    ...Object.entries(eventCounts())
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => `${type}: ${count}`),
    "",
    "== Last events ==",
    ...lastEvents().map((event) => `${time(event.at)} ${event.type}`),
  ];
  return lines.join("\n");
}
