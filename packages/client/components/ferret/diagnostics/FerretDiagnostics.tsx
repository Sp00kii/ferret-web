import { createEffect, on, onCleanup } from "solid-js";

import { useClient, useClientLifecycle } from "@revolt/client";
import { useVoice } from "@revolt/rtc";

import {
  installGlobalDiagnostics,
  logDiagnostic,
  recordEvent,
} from "./recorder";

const SOCKET_STATES = ["idle", "connecting", "connected", "disconnected"];

/**
 * Feeds the diagnostics log (desktop app only). Renders nothing.
 */
export function FerretDiagnostics() {
  if (!window.ferret) return null;

  const client = useClient();
  const lifecycle = useClientLifecycle().lifecycle;
  const voice = useVoice();

  installGlobalDiagnostics();

  createEffect(
    on(lifecycle.state, (state) => logDiagnostic("lifecycle", state)),
  );

  createEffect(
    on(voice.state, (state) => logDiagnostic("voice", state.toLowerCase())),
  );

  // follow whichever client is current (it is replaced on log in / out)
  createEffect(() => {
    const current = client();
    if (!current?.events) return;
    const events = current.events;

    const onState = (state: number) =>
      logDiagnostic("socket", SOCKET_STATES[state] ?? String(state));
    const onEvent = (event: { type?: unknown }) => recordEvent(event?.type);
    const onError = (error: unknown) =>
      logDiagnostic(
        "socket",
        `error: ${error instanceof Error ? error.message : typeof error === "object" ? JSON.stringify(error) : String(error)}`,
      );

    events.on("state", onState as never);
    events.on("event", onEvent as never);
    events.on("error", onError as never);
    onCleanup(() => {
      events.off("state", onState as never);
      events.off("event", onEvent as never);
      events.off("error", onError as never);
    });
  });

  return null;
}
