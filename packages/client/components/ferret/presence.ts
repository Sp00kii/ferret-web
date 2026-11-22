import { type Accessor, createEffect, onCleanup } from "solid-js";

import type { Server } from "stoat.js";

/** Never ask the same server more often than this */
const MIN_INTERVAL_MS = 30_000;

const lastRefresh = new Map<string, number>();

/**
 * Re-check who is online in a server. Stoat doesn't always send "went
 * offline" events (e.g. when one of its events servers restarts), so the
 * member list could stay stale until a reload. Same request the official
 * client makes when you first open a server, throttled per server.
 */
export function refreshServerPresence(server: Server | undefined) {
  if (!window.ferret || !server) return;

  const now = Date.now();
  if (now - (lastRefresh.get(server.id) ?? 0) < MIN_INTERVAL_MS) return;
  lastRefresh.set(server.id, now);

  server
    .refreshPresence()
    .catch((error) => console.warn("[ferret] presence refresh failed", error));
}

/**
 * Refresh when a server's member list is opened or switched to, and when the
 * user comes back to the window. No timers: nothing runs while you're away.
 */
export function useServerPresenceRefresh(server: Accessor<Server | undefined>) {
  createEffect(() => refreshServerPresence(server()));

  const onReturn = () => {
    if (!document.hidden) refreshServerPresence(server());
  };
  document.addEventListener("visibilitychange", onReturn);
  window.addEventListener("focus", onReturn);
  onCleanup(() => {
    document.removeEventListener("visibilitychange", onReturn);
    window.removeEventListener("focus", onReturn);
  });
}
