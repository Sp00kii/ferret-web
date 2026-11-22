import { For } from "solid-js";

import { styled } from "styled-system/jsx";

import { CategoryButton, Symbol, Text } from "@revolt/ui";

import type { FerretSettings } from "../bridge";
import { updateFerretSettings } from "../settings";

import {
  type FerretThemeName,
  ACCENTS,
  FERRET_ACCENTS,
  FERRET_THEMES,
  isLightTheme,
  THEME_LABELS,
} from "./looks";

/** Theme + accent colour, shown while the Ferret style is on */
export function LookPicker(props: { settings: FerretSettings }) {
  const options = Object.fromEntries(
    FERRET_THEMES.map((theme) => [theme, { title: THEME_LABELS[theme] }]),
  ) as Record<FerretThemeName, { title: string }>;

  return (
    <>
      <CategoryButton.Group>
        <CategoryButton.Select
          icon={<Symbol>contrast</Symbol>}
          title="Theme"
          value={props.settings.ferretTheme}
          options={options}
          onUpdate={(ferretTheme) =>
            void updateFerretSettings({
              ferretTheme: ferretTheme as FerretThemeName,
            })
          }
        />
      </CategoryButton.Group>
      <Text class="label">Accent colour</Text>
      <Swatches role="radiogroup" aria-label="Accent colour">
        <For each={FERRET_ACCENTS}>
          {(name) => {
            const accent = ACCENTS[name];
            const colour = () =>
              isLightTheme(props.settings.ferretTheme)
                ? accent.light.primary
                : accent.dark.primary;
            return (
              <button
                type="button"
                role="radio"
                aria-checked={props.settings.ferretAccent === name}
                title={accent.label}
                data-active={
                  props.settings.ferretAccent === name ? "" : undefined
                }
                onClick={() =>
                  void updateFerretSettings({ ferretAccent: name })
                }
              >
                <span style={{ background: colour() }} />
                {accent.label}
              </button>
            );
          }}
        </For>
      </Swatches>
    </>
  );
}

const Swatches = styled("div", {
  base: {
    display: "flex",
    flexWrap: "wrap",
    gap: "var(--gap-md)",
    "& button": {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "6px 12px 6px 6px",
      border: "2px solid transparent",
      borderRadius: "999px",
      background: "var(--md-sys-color-surface-container-highest)",
      color: "var(--md-sys-color-on-surface)",
      font: "inherit",
      cursor: "pointer",
    },
    "& button[data-active]": {
      borderColor: "var(--md-sys-color-primary)",
    },
    "& span": {
      width: "22px",
      height: "22px",
      borderRadius: "50%",
    },
  },
});
