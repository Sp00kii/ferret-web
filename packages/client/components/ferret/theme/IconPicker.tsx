import { For } from "solid-js";

import { styled } from "styled-system/jsx";

import { Text } from "@revolt/ui";

import type { FerretSettings } from "../bridge";
import { updateFerretSettings } from "../settings";

/** Alternative app icons; the files ship with the desktop app */
const ICONS = [
  { id: "classic", name: "Classic" },
  { id: "cream", name: "Cream" },
  { id: "black", name: "Black" },
  { id: "chocolate", name: "Chocolate" },
  { id: "blue", name: "Blue" },
  { id: "purple", name: "Purple" },
  { id: "pink", name: "Pink" },
  { id: "green", name: "Green" },
  { id: "albino", name: "Albino ferret" },
  { id: "silver", name: "Silver ferret" },
];

const preview = (id: string) =>
  `${import.meta.env.BASE_URL}ferret/icons/${id}.png`;

export function IconPicker(props: { settings: FerretSettings }) {
  return (
    <>
      <Text class="label">
        App icon (window and tray; the Start menu shortcut keeps the normal one)
      </Text>
      <Grid role="radiogroup" aria-label="App icon">
        <For each={ICONS}>
          {(icon) => (
            <button
              type="button"
              role="radio"
              aria-checked={props.settings.appIcon === icon.id}
              data-active={props.settings.appIcon === icon.id ? "" : undefined}
              title={icon.name}
              onClick={() => void updateFerretSettings({ appIcon: icon.id })}
            >
              <img src={preview(icon.id)} alt="" width={48} height={48} />
              <span>{icon.name}</span>
            </button>
          )}
        </For>
      </Grid>
    </>
  );
}

const Grid = styled("div", {
  base: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(84px, 1fr))",
    gap: "var(--gap-md)",
    "& button": {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "6px",
      padding: "10px 4px 8px",
      border: "2px solid transparent",
      borderRadius: "12px",
      background: "var(--md-sys-color-surface-container-highest)",
      color: "var(--md-sys-color-on-surface)",
      font: "inherit",
      fontSize: "12px",
      cursor: "pointer",
    },
    "& button:hover": {
      background: "var(--md-sys-color-secondary-container)",
    },
    "& button[data-active]": {
      borderColor: "var(--md-sys-color-primary)",
    },
    "& img": { borderRadius: "11px" },
  },
});
