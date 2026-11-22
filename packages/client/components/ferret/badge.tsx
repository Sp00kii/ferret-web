import { createEffect, onCleanup } from "solid-js";

import { useClient } from "@revolt/client";
import { useState } from "@revolt/state";

/**
 * Taskbar badge with the number of things waiting for you (stoatchat/
 * for-desktop#213): mentions, plus unread DMs and groups. Muted channels
 * don't count. The desktop app already had the badge icons; nothing ever
 * sent it a number. Renders nothing.
 */
export function FerretBadge() {
  // exposed by the desktop preload (src/world/window.ts)
  const setBadge = (
    window.native as unknown as
      | { setBadgeCount?: (count: number) => void }
      | undefined
  )?.setBadgeCount;
  if (!window.ferret || typeof setBadge !== "function") return null;

  const client = useClient();
  const state = useState();

  let timer: ReturnType<typeof setTimeout> | undefined;
  let last = -1;

  createEffect(() => {
    const current = client();
    let count = 0;
    if (current?.ready?.()) {
      for (const channel of current.channels.values()) {
        if (channel.type === "SavedMessages") continue;
        const mentions = channel.mentions?.size ?? 0;
        const isDm =
          channel.type === "DirectMessage" || channel.type === "Group";
        if (!mentions && !(isDm && channel.unread)) continue;
        if (state.notifications.isMuted(channel)) continue;
        count += isDm ? Math.max(mentions, channel.unread ? 1 : 0) : mentions;
      }
    }

    // unread state changes in bursts (e.g. on connect); settle first
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (count === last) return;
      last = count;
      setBadge(count);
    }, 400);
  });

  onCleanup(() => {
    clearTimeout(timer);
    setBadge(0);
  });

  return null;
}
