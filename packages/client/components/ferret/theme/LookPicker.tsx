import { For } from "solid-js";

import { styled } from "styled-system/jsx";

import { CategoryButton, Symbol, Text } from "@revolt/ui";

import type { FerretSettings } from "../bridge";
import { updateFerretSettings } from "../settings";

import {
  type FerretThemeName,
  accentFor,
  ACCENTS,
  FERRET_ACCENTS,
  FERRET_THEMES,
  isLightTheme,
  THEME_LABELS,
} from "./looks";

// colour pickers fire on every drag; save at most a few times a second
let pending: ReturnType<typeof setTimeout> | undefined;
function saveCustom(colour: string) {
  clearTimeout(pending);
  pending = setTimeout(
    () =>
      void updateFerretSettings({
        ferretAccent: "custom",
        ferretAccentCustom: colour,
      }),
    120,
  );
}

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
        {/* any colour: shades for each theme are worked out automatically */}
        <label
          class="custom"
          title="Pick any colour"
          data-active={
            props.settings.ferretAccent === "custom" ? "" : undefined
          }
        >
          <span
            style={{
              background:
                props.settings.ferretAccent === "custom"
                  ? accentFor(props.settings.ferretAccentCustom)[
                      isLightTheme(props.settings.ferretTheme)
                        ? "light"
                        : "dark"
                    ].primary
                  : "conic-gradient(#f07835, #ff6fae, #a77bff, #4c9aff, #3ecf8e, #f07835)",
            }}
          />
          Custom
          <input
            type="color"
            aria-label="Custom accent colour"
            value={props.settings.ferretAccentCustom}
            onClick={() =>
              props.settings.ferretAccent !== "custom" &&
              void updateFerretSettings({ ferretAccent: "custom" })
            }
            onInput={(event) => saveCustom(event.currentTarget.value)}
          />
        </label>
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
    "& .custom": {
      position: "relative",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "6px 12px 6px 6px",
      border: "2px solid transparent",
      borderRadius: "999px",
      background: "var(--md-sys-color-surface-container-highest)",
      color: "var(--md-sys-color-on-surface)",
      cursor: "pointer",
    },
    "& .custom[data-active]": {
      borderColor: "var(--md-sys-color-primary)",
    },
    "& .custom input": {
      position: "absolute",
      inset: 0,
      opacity: 0,
      cursor: "pointer",
      width: "100%",
      height: "100%",
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
