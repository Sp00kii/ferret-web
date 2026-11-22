import { onMount } from "solid-js";

import { useNavigate } from "@solidjs/router";

type NativeNavigation = {
  native?: { onNavigate?: (callback: (path: string) => void) => void };
};

/**
 * Follows navigation requests from the desktop app: ferret:// links, and
 * in-app links opened with a middle-click. The desktop app had them ready,
 * but the page never asked for them, so those links only brought the window
 * forward. Renders nothing.
 */
export function FerretNavigation() {
  const native = (window as NativeNavigation).native;
  if (!native?.onNavigate) return null;

  const navigate = useNavigate();
  onMount(() =>
    native.onNavigate!((path) => {
      // only paths inside the app
      if (path.startsWith("/") && !path.startsWith("//")) navigate(path);
    }),
  );
  return null;
}
