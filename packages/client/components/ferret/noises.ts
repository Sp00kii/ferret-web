import type { TypeSounds } from "@revolt/state";

import deafen from "./sounds/noises/deafen.ogg";
import message from "./sounds/noises/message.ogg";
import mute from "./sounds/noises/mute.ogg";
import ringtoneIncoming from "./sounds/noises/ringtone_incoming.ogg";
import ringtoneOutgoing from "./sounds/noises/ringtone_outgoing.ogg";
import streamEnd from "./sounds/noises/stream_end.ogg";
import streamStart from "./sounds/noises/stream_start.ogg";
import streamViewerJoin from "./sounds/noises/stream_viewer_join.ogg";
import streamViewerLeave from "./sounds/noises/stream_viewer_leave.ogg";
import undeafen from "./sounds/noises/undeafen.ogg";
import unmute from "./sounds/noises/unmute.ogg";
import userJoinVoice from "./sounds/noises/user_join_voice.ogg";
import userLeaveVoice from "./sounds/noises/user_leave_voice.ogg";
import userMoved from "./sounds/noises/user_moved.ogg";

/** Choice id for the ferret-noises pack in any sound slot */
export const NOISES_ID = "noises";
export const NOISES_LABEL = "Ferret noises (dooks)";

/**
 * Ferret-noise pack: the Dook chirp in a different pattern for every event
 * (e.g. a double dook for messages, rising dooks when someone joins).
 * Synthesised for Ferret by scripts/make-sounds.mjs, no recordings.
 */
export const FERRET_NOISES: Record<keyof TypeSounds, string> = {
  deafen,
  message,
  mute,
  ringtoneIncoming,
  ringtoneOutgoing,
  streamEnd,
  streamStart,
  streamViewerJoin,
  streamViewerLeave,
  undeafen,
  unmute,
  userJoinVoice,
  userLeaveVoice,
  userMoved,
};

/** What each sound in the pack is, shown in the sound pickers */
export const FERRET_NOISE_NAMES: Record<keyof TypeSounds, string> = {
  deafen: "two low chirps down",
  message: "dook-dook",
  mute: "low chirp",
  ringtoneIncoming: "Dook Party",
  ringtoneOutgoing: "calm dooks",
  streamEnd: "winding down",
  streamStart: "excited chatter",
  streamViewerJoin: "tiny chirp up",
  streamViewerLeave: "tiny chirp down",
  undeafen: "two chirps up",
  unmute: "springy chirp",
  userJoinVoice: "dooks going up",
  userLeaveVoice: "dooks going down",
  userMoved: "dook... dook-dook",
};
