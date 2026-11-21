import type { TypeSounds } from "@revolt/state";

import deafen from "./sounds/deafen.ogg";
import message from "./sounds/message_sound.ogg";
import mute from "./sounds/mute.ogg";
import ringtoneIncoming from "./sounds/ringtone_incoming.ogg";
import ringtoneOutgoing from "./sounds/ringtone_outgoing.ogg";
import streamEnd from "./sounds/stream_end.ogg";
import streamStart from "./sounds/stream_start.ogg";
import streamViewerJoin from "./sounds/stream_viewer_join.ogg";
import streamViewerLeave from "./sounds/stream_viewer_leave.ogg";
import undeafen from "./sounds/undeafen.ogg";
import unmute from "./sounds/unmute.ogg";
import userJoinVoice from "./sounds/user_join_voice.ogg";
import userLeaveVoice from "./sounds/user_leave_voice.ogg";
import userMoved from "./sounds/user_moved.ogg";

/**
 * Ferret's own sound pack (original, synthesised). Stoat's real sounds live
 * in a private brand-asset repo; the open-source fallbacks are silent
 * placeholders apart from a click for messages.
 */
export const FERRET_SOUNDS: Record<keyof TypeSounds, string> = {
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
