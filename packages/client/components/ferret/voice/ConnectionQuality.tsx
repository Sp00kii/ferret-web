import { Show, createEffect, createSignal, onCleanup } from "solid-js";

import { ConnectionQuality, Room, Track } from "livekit-client";
import { styled } from "styled-system/jsx";

import { useVoice } from "@revolt/rtc";

import { useFerretSettings } from "../settings";

type Stats = { quality: ConnectionQuality; ping?: number; loss?: number };

type Counters = { lost: number; received: number };

async function firstReport(room: Room) {
  const mic = room.localParticipant.getTrackPublication(
    Track.Source.Microphone,
  )?.track;
  const own = await mic?.getRTCStatsReport();
  if (own) return { report: own, outbound: true };

  for (const participant of room.remoteParticipants.values()) {
    for (const publication of participant.audioTrackPublications.values()) {
      const report = await publication.track?.getRTCStatsReport();
      if (report) return { report, outbound: false };
    }
  }
  return undefined;
}

/**
 * Ping comes from the active ICE candidate pair. Loss is what the server
 * reports for our mic, or (when not sending) the share of packets we lost
 * receiving since the previous sample.
 */
async function sample(room: Room, previous: Counters): Promise<Stats> {
  const stats: Stats = { quality: room.localParticipant.connectionQuality };
  const found = await firstReport(room);
  if (!found) return stats;

  let lost = 0;
  let received = 0;
  found.report.forEach((entry) => {
    if (
      entry.type === "candidate-pair" &&
      entry.nominated &&
      entry.state === "succeeded" &&
      typeof entry.currentRoundTripTime === "number"
    ) {
      stats.ping = Math.round(entry.currentRoundTripTime * 1000);
    }
    if (
      found.outbound &&
      entry.type === "remote-inbound-rtp" &&
      typeof entry.fractionLost === "number"
    ) {
      stats.loss = entry.fractionLost * 100;
    }
    if (!found.outbound && entry.type === "inbound-rtp") {
      lost += entry.packetsLost ?? 0;
      received += entry.packetsReceived ?? 0;
    }
  });

  if (!found.outbound) {
    const dLost = Math.max(0, lost - previous.lost);
    const dReceived = Math.max(0, received - previous.received);
    if (dLost + dReceived > 0) stats.loss = (dLost / (dLost + dReceived)) * 100;
    previous.lost = lost;
    previous.received = received;
  }

  return stats;
}

const LABELS: Record<ConnectionQuality, string> = {
  [ConnectionQuality.Excellent]: "Excellent connection",
  [ConnectionQuality.Good]: "Good connection",
  [ConnectionQuality.Poor]: "Poor connection",
  [ConnectionQuality.Lost]: "Connection lost",
  [ConnectionQuality.Unknown]: "Measuring connection",
};

/**
 * Small "● 42 ms · 0.0% loss" badge shown in the voice call card.
 */
export function ConnectionQualityBadge() {
  const voice = useVoice();
  const settings = useFerretSettings();
  const [stats, setStats] = createSignal<Stats>();

  createEffect(() => {
    const room = voice.room();
    if (!room || voice.state() !== "CONNECTED") {
      setStats(undefined);
      return;
    }

    const counters: Counters = { lost: 0, received: 0 };
    let alive = true;
    const update = () =>
      sample(room, counters)
        .then((next) => alive && setStats(next))
        .catch(() => {});

    void update();
    const timer = setInterval(update, 2000);
    onCleanup(() => {
      alive = false;
      clearInterval(timer);
    });
  });

  const visible = () => settings()?.showConnectionQuality ?? true;

  return (
    <Show when={visible() && stats()}>
      {(current) => (
        <Badge quality={current().quality} title={LABELS[current().quality]}>
          <Dot />
          <span>
            {current().ping !== undefined ? `${current().ping} ms` : "– ms"}
            <Show when={current().loss !== undefined}>
              {` · ${current().loss!.toFixed(1)}% loss`}
            </Show>
          </span>
        </Badge>
      )}
    </Show>
  );
}

const Dot = styled("span", {
  base: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "currentColor",
    flexShrink: 0,
  },
});

const Badge = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
    whiteSpace: "nowrap",
    paddingInline: "var(--gap-md)",
    fontVariantNumeric: "tabular-nums",
  },
  variants: {
    quality: {
      excellent: { color: "#4ade80" },
      good: { color: "#facc15" },
      poor: { color: "#f87171" },
      lost: { color: "#f87171" },
      unknown: { color: "var(--md-sys-color-outline)" },
    },
  },
});
