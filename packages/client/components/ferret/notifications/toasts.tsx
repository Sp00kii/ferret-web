import { onCleanup } from "solid-js";

import { useNavigate } from "@solidjs/router";
import type { Message } from "stoat.js";

import { useClient } from "@revolt/client";

import { useFerretSettings } from "../settings";

const settings = useFerretSettings();

/**
 * Show a message as a Ferret pop-up instead of a Windows notification.
 * Returns false when pop-ups are off (or outside the desktop app) so the
 * caller falls back to the normal notification.
 */
export function showFerretToast(message: Message, body: string | undefined) {
  const bridge = window.ferret;
  if (!bridge || !settings()?.notificationPopups) return false;

  const channel = message.channel;
  if (!channel) return false;

  const name =
    message.member?.displayName ??
    message.author?.displayName ??
    message.username ??
    "Someone";

  let subtitle: string | undefined;
  switch (channel.type) {
    case "DirectMessage":
      subtitle = "Direct message";
      break;
    case "Group":
      subtitle = channel.name;
      break;
    case "TextChannel":
      subtitle = `#${channel.name}${channel.server ? ` · ${channel.server.name}` : ""}`;
      break;
  }

  const isSystem = !!message.systemMessage;
  const canReply =
    !isSystem &&
    channel.type !== "SavedMessages" &&
    channel.havePermission("SendMessage");

  bridge.toast.show({
    id: message.id,
    title: isSystem ? (channel.name ?? name) : name,
    subtitle,
    body:
      body ||
      (message.attachments?.length
        ? `Sent ${message.attachments.length === 1 ? "an attachment" : `${message.attachments.length} attachments`}`
        : "New message"),
    icon: message.avatarURL,
    channelId: channel.id,
    messageId: message.id,
    canReply,
  });
  return true;
}

/**
 * Handles "Open" and "Reply" from the pop-ups. Renders nothing.
 * A reply is a normal message typed by the user, sent as a reply to the
 * message it came from (like replying in the app).
 */
export function FerretToastActions() {
  const bridge = window.ferret;
  if (!bridge) return null;

  const client = useClient();
  const navigate = useNavigate();

  const unsubscribe = bridge.toast.onAction(async (action) => {
    const channel = client().channels.get(action.channelId);
    if (!channel) {
      if (action.type === "reply")
        bridge.toast.replyResult({
          id: action.id,
          ok: false,
          error: "channel not found",
        });
      return;
    }

    if (action.type === "open") {
      const message = action.messageId
        ? client().messages.get(action.messageId)
        : undefined;
      navigate(message?.path ?? channel.path);
      return;
    }

    try {
      await channel.sendMessage({
        content: action.text,
        replies: action.messageId
          ? [{ id: action.messageId, mention: true }]
          : undefined,
      });
      bridge.toast.replyResult({ id: action.id, ok: true });
    } catch (error) {
      bridge.toast.replyResult({
        id: action.id,
        ok: false,
        error: error instanceof Error ? error.message : "try again",
      });
    }
  });
  onCleanup(unsubscribe);

  return null;
}
