import { onMount } from "solid-js";

import { useNavigate } from "@solidjs/router";

import { useClient } from "@revolt/client";
import { useModals } from "@revolt/modal";

type NativeNavigation = {
  native?: { onNavigate?: (callback: (path: string) => void) => void };
};

/** Friend links: ferret://add-friend/<username>/<1234> */
const FRIEND_LINK = /^\/add-friend\/([^/?#\s]{1,32})\/(\d{4})\/?$/;

/** Your own friend link, to share */
export const friendLink = (username: string, discriminator: string) =>
  `ferret://add-friend/${encodeURIComponent(username)}/${discriminator}`;

/**
 * Follows navigation requests from the desktop app: ferret:// links, and
 * in-app links opened with a middle-click. The desktop app had them ready,
 * but the page never asked for them, so those links only brought the window
 * forward. Friend links open "Add a new friend" with the name filled in;
 * nothing is sent until you press Send Request. Renders nothing.
 */
export function FerretNavigation() {
  const native = (window as NativeNavigation).native;
  if (!native?.onNavigate) return null;

  const navigate = useNavigate();
  const client = useClient();
  const { openModal } = useModals();

  onMount(() =>
    native.onNavigate!((path) => {
      // only paths inside the app
      if (!path.startsWith("/") || path.startsWith("//")) return;

      const friend = path.match(FRIEND_LINK);
      if (friend) {
        let username: string;
        try {
          username = decodeURIComponent(friend[1]);
        } catch {
          return;
        }
        openModal({
          type: "add_friend",
          client: client(),
          username: `${username}#${friend[2]}`,
        });
        return;
      }

      navigate(path);
    }),
  );
  return null;
}
