import { Show, createEffect, createSignal, onCleanup } from "solid-js";

import { useNavigate } from "@solidjs/router";
import type { Channel } from "stoat.js";
import { styled } from "styled-system/jsx";

import { useClient } from "@revolt/client";
import { useVoice } from "@revolt/rtc";
import { useState } from "@revolt/state";
import { Avatar, Button, Symbol, Text } from "@revolt/ui";

import { personRingtoneSource } from "./people";
import { FALLBACK_RINGTONE, ringtoneSource } from "./ringtones";
import { useFerretSettings } from "./settings";

const RING_TIMEOUT_MS = 30_000;

type Ringing = { channel: Channel; callerId: string };

/**
 * Rings for new calls in DMs / groups and in voice channels the user chose to
 * watch. A "new call" is the first participant joining an empty channel.
 * Stops when we join, decline, the call ends, or after 30 seconds.
 */
export function IncomingCalls() {
  const client = useClient();
  const voice = useVoice();
  const state = useState();
  const navigate = useNavigate();
  const settings = useFerretSettings();

  const [ringing, setRinging] = createSignal<Ringing>();
  let audio: HTMLAudioElement | undefined;
  let timeout: ReturnType<typeof setTimeout> | undefined;

  function stop() {
    clearTimeout(timeout);
    timeout = undefined;
    audio?.pause();
    audio = undefined;
    if (ringing()) window.ferret?.dismissIncomingCall();
    setRinging(undefined);
  }

  function shouldRing(channel: Channel, userId: string) {
    const config = settings();
    if (!window.ferret || !config?.ringtone.enabled) return false;
    if (userId === client().user?.id) return false;
    // already busy in a call
    if (voice.channel()) return false;
    // someone joined a call that was already running
    if (channel.voiceParticipants.size !== 1) return false;
    if (document.hidden && !config.ringtone.ringWhenHidden) return false;
    if (state.notifications.isMuted(channel)) return false;

    const isCall = channel.type === "DirectMessage" || channel.type === "Group";
    return isCall || config.watchedVoiceChannels.includes(channel.id);
  }

  function describe(channel: Channel, callerId: string) {
    const caller = client().users.get(callerId);
    const name = caller?.displayName ?? caller?.username ?? "Someone";

    switch (channel.type) {
      case "DirectMessage":
        return { title: `${name} is calling you`, body: "Incoming call" };
      case "Group":
        return {
          title: `${name} started a call`,
          body: channel.name ?? "Group call",
        };
      default:
        return {
          title: `Call started in #${channel.name}`,
          body: `${name}${channel.server ? ` · ${channel.server.name}` : ""}`,
        };
    }
  }

  function playRingtone(callerId: string) {
    const config = settings()!;
    const element = new Audio(
      personRingtoneSource(config, callerId) ?? ringtoneSource(config.ringtone),
    );
    element.loop = true;
    element.volume = config.ringtone.volume / 100;

    // fall back to the classic sound if the chosen file won't play
    element.addEventListener(
      "error",
      () => {
        element.src = FALLBACK_RINGTONE;
        void element.play().catch(() => {});
      },
      { once: true },
    );

    const sink = state.voice.preferredAudioOutputDevice;
    if (sink && "setSinkId" in element) {
      void element.setSinkId(sink).catch(() => {});
    }

    void element.play().catch(() => {});
    audio = element;
  }

  function start(channel: Channel, callerId: string) {
    stop();
    setRinging({ channel, callerId });
    playRingtone(callerId);
    timeout = setTimeout(stop, RING_TIMEOUT_MS);
    window.ferret?.showIncomingCall({
      ...describe(channel, callerId),
      channelId: channel.id,
    });
  }

  function openCall(channel: Channel) {
    navigate(channel.path);
  }

  function join() {
    const call = ringing();
    if (!call) return;
    stop();
    openCall(call.channel);
    void voice.connect(call.channel);
  }

  createEffect(() => {
    const current = client();

    const onJoin = (channel: Channel, userId: string) => {
      if (userId === current.user?.id) {
        if (ringing()?.channel.id === channel.id) stop();
        return;
      }
      if (shouldRing(channel, userId)) start(channel, userId);
    };

    const onLeave = (channel: Channel) => {
      if (
        ringing()?.channel.id === channel.id &&
        channel.voiceParticipants.size === 0
      ) {
        stop();
      }
    };

    current.on("voiceChannelJoin", onJoin);
    current.on("voiceChannelLeave", onLeave);
    onCleanup(() => {
      current.off("voiceChannelJoin", onJoin);
      current.off("voiceChannelLeave", onLeave);
      stop();
    });
  });

  // joining any call (e.g. from the channel header) stops the ringing
  createEffect(() => {
    if (voice.channel() && ringing()) stop();
  });

  const offAction = window.ferret?.onIncomingCallAction(({ channelId }) => {
    const channel = client().channels.get(channelId);
    if (channel) openCall(channel);
  });
  onCleanup(() => offAction?.());

  return (
    <Show when={ringing()}>
      {(call) => {
        const caller = () => client().users.get(call().callerId);
        const text = () => describe(call().channel, call().callerId);

        return (
          <Card role="alertdialog" aria-label={text().title}>
            <Avatar src={caller()?.avatarURL} size={48} />
            <Details>
              <Text class="title" size="medium">
                {text().title}
              </Text>
              <Text class="label">{text().body}</Text>
            </Details>
            <Actions>
              <Button variant="filled" onPress={join}>
                <Symbol>call</Symbol> Join
              </Button>
              <Button variant="tonal" onPress={stop}>
                <Symbol>call_end</Symbol> Decline
              </Button>
            </Actions>
          </Card>
        );
      }}
    </Show>
  );
}

const Card = styled("div", {
  base: {
    position: "fixed",
    right: "var(--gap-lg)",
    bottom: "var(--gap-lg)",
    zIndex: 1000,
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "var(--gap-md)",
    maxWidth: "min(380px, calc(100vw - 2 * var(--gap-lg)))",
    padding: "var(--gap-lg)",
    borderRadius: "var(--borderRadius-xl)",
    background: "var(--md-sys-color-surface-container-high)",
    color: "var(--md-sys-color-on-surface)",
    boxShadow: "0 8px 24px #0006",
    border: "2px solid var(--md-sys-color-primary)",
  },
});

const Details = styled("div", {
  base: {
    flex: "1 1 160px",
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
});

const Actions = styled("div", {
  base: {
    flexBasis: "100%",
    display: "flex",
    justifyContent: "flex-end",
    gap: "var(--gap-sm)",
  },
});
