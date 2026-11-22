import { createEffect, onCleanup } from "solid-js";

import { useClient } from "@revolt/client";
import { useVoice } from "@revolt/rtc";

import type { MiniCallState } from "../bridge";
import { popupLook } from "../notifications/toasts";
import { useFerretSettings } from "../settings";

import { setMicChainConfig, setPushToTalkHeld } from "./micChain";

const MINI_UPDATE_MS = 400;

/**
 * Glue between the desktop app and the call: feeds push-to-talk / noise
 * gate settings into the mic stage, runs the global mute / deafen hotkeys,
 * and keeps the compact call window up to date. Renders nothing.
 */
export function FerretVoice() {
  const bridge = window.ferret;
  if (!bridge) return null;

  const client = useClient();
  const voice = useVoice();
  const settings = useFerretSettings();

  createEffect(() => setMicChainConfig(settings()?.voice));

  const unsubscribers = [
    bridge.onPushToTalk((held) => setPushToTalkHeld(held)),
    bridge.onHotkey((action) => {
      if (!voice.room()) return;
      if (action === "toggleMute") void voice.toggleMute();
      if (action === "toggleDeafen") void voice.toggleDeafen();
    }),
    bridge.mini.onCommand((command) => {
      if (!voice.room()) return;
      if (command === "toggleMute") void voice.toggleMute();
      if (command === "toggleDeafen") void voice.toggleDeafen();
      if (command === "disconnect") voice.disconnect();
    }),
  ];

  let joinedAt = 0;
  let lastSent = "";

  function snapshot(): MiniCallState {
    const channel = voice.channel();
    const room = voice.room();
    if (!channel || !room) return { inCall: false, callId: "" };

    const participants = [...channel.voiceParticipants.values()].map(
      (participant) => {
        const user = client().users.get(participant.userId);
        const member = channel.server?.getMember(participant.userId);
        const live =
          participant.userId === room.localParticipant.identity
            ? room.localParticipant
            : room.getParticipantByIdentity(participant.userId);
        return {
          name: member?.displayName ?? user?.displayName ?? "Someone",
          avatar: member?.avatarURL ?? user?.avatarURL,
          speaking: !!live?.isSpeaking,
          muted: !participant.isPublishing(),
          deafened: !participant.isReceiving(),
        };
      },
    );

    return {
      inCall: true,
      callId: channel.id,
      channelName: channel.displayName ?? channel.name ?? "Voice",
      serverName: channel.server?.name,
      startedAt: joinedAt,
      muted: !voice.microphone(),
      deafened: voice.deafen(),
      participants,
      look: popupLook(),
    };
  }

  function push() {
    const next = snapshot();
    const key = JSON.stringify(next);
    if (key === lastSent) return;
    lastSent = key;
    bridge!.mini.update(next);
  }

  // start the call timer when joining, report leaving straight away
  createEffect(() => {
    const room = voice.room();
    joinedAt = room ? Date.now() : 0;
    push();
  });

  // speaking indicators change too fast for signals, so poll while in a call
  const timer = setInterval(() => {
    if (voice.room() || lastSent.includes('"inCall":true')) push();
  }, MINI_UPDATE_MS);

  onCleanup(() => {
    clearInterval(timer);
    for (const unsubscribe of unsubscribers) unsubscribe();
    bridge.mini.update({ inCall: false, callId: "" });
  });

  return null;
}
