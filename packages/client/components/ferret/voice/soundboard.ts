import { createSignal } from "solid-js";

import {
  type LocalTrackPublication,
  type Room,
  type TrackPublication,
  AudioPresets,
  ParticipantEvent,
  RoomEvent,
  Track,
} from "livekit-client";

import { useFerretSettings } from "../settings";
import { SOUND_LIBRARY } from "../soundLibrary";
import airhorn from "../sounds/board/airhorn.ogg";
import boing from "../sounds/board/boing.ogg";
import crickets from "../sounds/board/crickets.ogg";
import drumroll from "../sounds/board/drumroll.ogg";
import happyDook from "../sounds/board/happy-dook.ogg";
import rimshot from "../sounds/board/rimshot.ogg";
import sadTrombone from "../sounds/board/sad-trombone.ogg";
import tada from "../sounds/board/tada.ogg";
import { trackAudio, trackPlaying } from "../stopSounds";

import { type Playback, playClip, playIntoCall } from "./micChain";

const settings = useFerretSettings();

/** Clips everyone in the call hears. All synthesized by Ferret. */
export const SOUNDBOARD = [
  { id: "rimshot", name: "Ba-dum-tss", emoji: "🥁", src: rimshot },
  { id: "airhorn", name: "Air horn", emoji: "📯", src: airhorn },
  { id: "sad-trombone", name: "Sad trombone", emoji: "🎺", src: sadTrombone },
  { id: "tada", name: "Ta-da!", emoji: "🎉", src: tada },
  { id: "drumroll", name: "Drumroll", emoji: "🪘", src: drumroll },
  { id: "crickets", name: "Crickets", emoji: "🦗", src: crickets },
  { id: "boing", name: "Boing", emoji: "🌀", src: boing },
  { id: "happy-dook", name: "Happy dook", emoji: "🐾", src: happyDook },
  ...(
    [
      ["squeak", "🧸"],
      ["boop", "👃"],
      ["clicker", "👆"],
      ["bell", "🔔"],
    ] as const
  ).flatMap(([id, emoji]) =>
    SOUND_LIBRARY.filter((sound) => sound.id === id).map((sound) => ({
      ...sound,
      emoji,
    })),
  ),
];

/** The user's own clips, served by the desktop app */
export function customClips() {
  return (settings()?.soundboard ?? []).map((clip) => ({
    id: clip.id,
    name: clip.name,
    emoji: "🎵",
    src: `/__ferret/soundboard/${clip.id}`,
  }));
}

// ------------------------------------------------- sending into the call

/**
 * Clips go out on their own audio track with this name, next to your mic.
 * Everyone still hears them (Stoat plays every audio track someone sends),
 * and Ferret can turn them down or mute them per person.
 */
export const SOUNDBOARD_TRACK = "ferret-soundboard";

export const isSoundboardTrack = (publication?: TrackPublication) =>
  publication?.trackName === SOUNDBOARD_TRACK;

type Sender = {
  room: Room;
  context: AudioContext;
  destination: MediaStreamAudioDestinationNode;
  /** The published track, or undefined if Stoat didn't allow it */
  ready: Promise<LocalTrackPublication | undefined>;
  cleanup: () => void;
};

let sender: Sender | undefined;

function closeSender() {
  if (!sender) return;
  sender.cleanup();
  void sender.context.close().catch(() => {});
  sender = undefined;
}

/** Your real microphone (not the soundboard track) */
function realMic(room: Room) {
  for (const publication of room.localParticipant.audioTrackPublications.values())
    if (
      publication.source === Track.Source.Microphone &&
      !isSoundboardTrack(publication)
    )
      return publication;
  return undefined;
}

/**
 * Only use the separate track while your real mic is published, on, and
 * the first mic track: Stoat treats the first one as "the mic".
 */
function micIsLive(room: Room) {
  const mic = realMic(room);
  return (
    !!mic &&
    !mic.isMuted &&
    room.localParticipant.getTrackPublication(Track.Source.Microphone) === mic
  );
}

function senderFor(room: Room) {
  if (sender?.room === room) return sender;
  closeSender();

  const context = new AudioContext({ sampleRate: 48000 });
  const destination = context.createMediaStreamDestination();
  const ready = room.localParticipant
    .publishTrack(destination.stream.getAudioTracks()[0], {
      name: SOUNDBOARD_TRACK,
      // the only audio source Stoat allows besides screen share audio
      source: Track.Source.Microphone,
      audioPreset: AudioPresets.music,
      dtx: true,
      red: false,
    })
    .then(
      (publication) => {
        const track = publication.audioTrack;
        if (track) {
          // switching microphones changes every mic-type track, which would
          // turn this one into a second copy of your real mic
          track.setDeviceId = async () => true;
          track.restartTrack = async () => {};
        }
        return publication;
      },
      (error) => {
        console.warn("[ferret] soundboard track not allowed", error);
        return undefined;
      },
    );

  /**
   * Stoat's server sets your "talking" state from mic track events, so this
   * track always follows your real mic: muted together, and gone with it.
   */
  const sync = async () => {
    const publication = await ready;
    if (!publication || sender?.room !== room) return;
    const mic = realMic(room);
    if (!mic) {
      if (publication.track)
        await room.localParticipant
          .unpublishTrack(publication.track)
          .catch(() => {});
      closeSender();
    } else if (mic.isMuted && !publication.isMuted) {
      await publication.mute();
    } else if (!mic.isMuted && publication.isMuted) {
      await publication.unmute();
    }
  };
  const onChange = () => void sync();
  room.localParticipant
    .on(ParticipantEvent.TrackMuted, onChange)
    .on(ParticipantEvent.TrackUnmuted, onChange)
    .on(ParticipantEvent.LocalTrackUnpublished, onChange);
  room.on(RoomEvent.Reconnected, onChange);
  const onDisconnected = () => {
    if (sender?.room === room) closeSender();
  };
  room.once(RoomEvent.Disconnected, onDisconnected);

  sender = {
    room,
    context,
    destination,
    ready,
    cleanup() {
      room.localParticipant
        .off(ParticipantEvent.TrackMuted, onChange)
        .off(ParticipantEvent.TrackUnmuted, onChange)
        .off(ParticipantEvent.LocalTrackUnpublished, onChange);
      room.off(RoomEvent.Reconnected, onChange);
      room.off(RoomEvent.Disconnected, onDisconnected);
    },
  };
  return sender;
}

/** Play into the call; undefined if not in one */
async function sendToCall(
  src: string,
  volume: number,
  room?: Room,
): Promise<Playback | undefined> {
  if (room && room.state === "connected" && micIsLive(room)) {
    const out = senderFor(room);
    const publication = await out.ready;
    if (publication && micIsLive(room)) {
      if (publication.isMuted) await publication.unmute();
      if (out.context.state === "suspended") await out.context.resume();
      return playClip(out.context, out.destination, src, volume);
    }
  }
  // fallback: mixed into the mic, as before (heard but can't be filtered)
  return playIntoCall(src, volume);
}

// ------------------------------------------------------------ playing

/** Stop people from spamming everyone's ears */
const COOLDOWN_MS = 2500;
const [coolingDown, setCoolingDown] = createSignal(false);
export { coolingDown };

const [clipPlaying, setClipPlaying] = createSignal(false);
/** Whether one of your clips is playing (for the Stop button) */
export { clipPlaying };

let stopCurrent: (() => void) | undefined;
let volumeCurrent: ((volume: number) => void) | undefined;

/** Stop your clip, for you and for the call */
export function stopSoundboard() {
  stopCurrent?.();
}

/** Change the volume (0-100) of the clip that's playing, for everyone */
export function setPlayingVolume(percent: number) {
  volumeCurrent?.(Math.min(100, Math.max(0, percent)) / 100);
}

/**
 * Play a clip into the call and locally so you hear it too. A new clip
 * stops the one before. `sinkId` is your chosen output device.
 */
export async function playSoundboard(
  src: string,
  room?: Room,
  sinkId?: string,
) {
  if (coolingDown()) return false;
  setCoolingDown(true);
  setTimeout(() => setCoolingDown(false), COOLDOWN_MS);
  stopSoundboard();

  const volume = (settings()?.voice.soundboardVolume ?? 60) / 100;

  // locally, on the same output device as the call
  const local = new Audio(src);
  local.volume = volume;
  if (sinkId && "setSinkId" in local)
    void local.setSinkId(sinkId).catch(() => {});
  void local.play().catch(() => {});

  let call: Playback | undefined;
  let stopped = false;
  const finished = () => {
    if (stopCurrent === stop) {
      stopCurrent = undefined;
      volumeCurrent = undefined;
      setClipPlaying(false);
    }
  };
  const stop = () => {
    stopped = true;
    local.pause();
    call?.stop();
    forget();
    finished();
  };
  const forget = trackPlaying(stop);
  stopCurrent = stop;
  // the volume slider works while the clip plays
  volumeCurrent = (next) => {
    local.volume = next;
    call?.setVolume(next);
  };
  setClipPlaying(true);
  local.addEventListener("ended", () => {
    forget();
    finished();
  });

  try {
    call = await sendToCall(src, volume, room);
    if (stopped) call?.stop();
    // the slider may have moved while the clip was loading
    else if (call) call.setVolume(local.volume);
    return !!call;
  } catch (error) {
    console.error("[ferret] soundboard clip failed", error);
    return false;
  }
}

/** How to play someone else's soundboard track, from your settings */
export function incomingSoundboard(userId: string) {
  const config = settings();
  const voice = config?.voice;
  return {
    muted:
      voice?.hearSoundboards === false ||
      !!config?.people[userId]?.muteSoundboard,
    volume:
      ((voice?.othersSoundboardVolume ?? 100) / 100) *
      ((config?.people[userId]?.soundboardVolume ?? 100) / 100),
  };
}

// previews of your own clips can be stopped the same way
export const previewClip = (element: HTMLAudioElement) => trackAudio(element);
