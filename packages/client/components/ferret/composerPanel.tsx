import { type Accessor, type Setter, onCleanup } from "solid-js";

import { styled } from "styled-system/jsx";

/**
 * Shared look of Ferret's small menus above the message box (personas,
 * times): drawn at page level and placed above their button.
 */

export const PANEL_WIDTH = 300;

/** Close the menu when clicking anywhere outside it or its button */
export function useOutsideClose(
  open: Accessor<boolean>,
  setOpen: Setter<boolean>,
  inside: () => (Element | undefined)[],
) {
  const onPointerDown = (event: PointerEvent) => {
    const target = event.target as Node;
    if (open() && !inside().some((element) => element?.contains(target)))
      setOpen(false);
  };
  document.addEventListener("pointerdown", onPointerDown, true);
  onCleanup(() =>
    document.removeEventListener("pointerdown", onPointerDown, true),
  );
}

export const Panel = styled("div", {
  base: {
    position: "fixed",
    zIndex: 1000,
    width: `${PANEL_WIDTH}px`,
    maxHeight: "min(520px, 75vh)",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    padding: "10px",
    borderRadius: "16px",
    color: "var(--md-sys-color-on-surface)",
    background: "var(--md-sys-color-surface-container-high)",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.35)",
  },
});

export const Heading = styled("div", {
  base: { fontWeight: 600, padding: "6px 4px 2px" },
});

export const Input = styled("input", {
  base: {
    width: "100%",
    padding: "8px 10px",
    border: "none",
    borderRadius: "10px",
    fontSize: "13px",
    color: "var(--md-sys-color-on-surface)",
    background: "var(--md-sys-color-surface-container-highest)",
    outline: "none",
    "&:focus": { boxShadow: "0 0 0 2px var(--md-sys-color-primary)" },
  },
});

export const Hint = styled("div", {
  base: {
    paddingTop: "6px",
    fontSize: "11px",
    color: "var(--md-sys-color-outline)",
  },
});

export const ErrorText = styled("div", {
  base: { fontSize: "12px", color: "var(--md-sys-color-error)" },
});
