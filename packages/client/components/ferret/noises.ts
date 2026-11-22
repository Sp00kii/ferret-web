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
 * Ferret-noise pack: dooks, hisses and squeaks, one per event (e.g. a
 * double dook for messages, rising dooks when someone joins). Synthesised
 * for Ferret, no recordings.
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
