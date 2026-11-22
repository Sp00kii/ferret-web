import type { SelectedTheme } from "@revolt/state/stores/Theme";
import { createMaterialColourVariables } from "@revolt/ui/themes/materialTheme";

import "./ferret-style.css";

/**
 * Ferret's dark palette, from the Ferret design system: navy surfaces,
 * copper accent, cream / deep-brown highlights.
 */
const DARK: Record<string, string> = {
  primary: "#F07835",
  "on-primary": "#2A1207",
  "primary-container": "#542C27",
  "on-primary-container": "#FFE4C7",
  // cards / list rows stay navy-slate; brown is kept for selection
  // (primary-container) so it reads as a highlight, not the whole UI
  secondary: "#FFE4C7",
  "on-secondary": "#3A2516",
  "secondary-container": "#222A40",
  "on-secondary-container": "#F5F2EF",
  tertiary: "#FF914D",
  "on-tertiary": "#2A1207",
  "tertiary-container": "#2A3147",
  "on-tertiary-container": "#FFE4C7",
  error: "#D64545",
  "on-error": "#FFFFFF",
  "error-container": "#4A1D24",
  "on-error-container": "#FFB4AB",

  "primary-fixed": "#FFDBC8",
  "primary-fixed-dim": "#FFB68E",
  "on-primary-fixed": "#341100",
  "on-primary-fixed-variant": "#7A3410",
  "secondary-fixed": "#FFE4C7",
  "secondary-fixed-dim": "#E8C9A8",
  "on-secondary-fixed": "#2A1A0C",
  "on-secondary-fixed-variant": "#5A4330",
  "tertiary-fixed": "#FFDCC4",
  "tertiary-fixed-dim": "#FFB688",
  "on-tertiary-fixed": "#311300",
  "on-tertiary-fixed-variant": "#713613",

  // server rail < channel list < chat < cards/inputs
  "surface-dim": "#0B0F1D",
  surface: "#101426",
  "surface-bright": "#2A3350",
  "surface-container-lowest": "#0B0F1D",
  "surface-container-low": "#101426",
  "surface-container": "#141A2D",
  "surface-container-high": "#171D31",
  "surface-container-highest": "#222A40",

  "on-surface": "#F5F2EF",
  "on-surface-variant": "#A5AABD",
  outline: "#5A6380",
  "outline-variant": "#343D55",

  "inverse-surface": "#F5F2EF",
  "inverse-on-surface": "#171D31",
  "inverse-primary": "#B4521C",

  scrim: "#000000",
  shadow: "#000000",
};

/** Tighter corners: controls 6px, buttons 8px, cards 12px, dialogs 14px */
const RADIUS: Record<string, string> = {
  xs: "4px",
  sm: "6px",
  md: "8px",
  lg: "12px",
  li: "14px",
  xl: "14px",
  xli: "16px",
  xxl: "24px",
};

const triplet = (hex: string) => {
  const [, r, g, b] = /#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(hex)!;
  return `${parseInt(r, 16)}, ${parseInt(g, 16)}, ${parseInt(b, 16)}`;
};

/**
 * CSS variables that turn the app into the Ferret style. LoadTheme removes
 * any that disappear, so switching back restores Stoat exactly.
 */
export function ferretThemeVariables(theme: SelectedTheme) {
  // light mode: a warm scheme generated from Ferret copper
  const colours = theme.darkMode
    ? DARK
    : Object.fromEntries(
        Object.entries(
          createMaterialColourVariables(
            {
              ...theme,
              preset: "you",
              accent: "#F07835",
              variant: "fidelity",
            },
            "",
          ),
        ).map(([key, value]) => [key, value as string]),
      );

  const variables: Record<string, string> = {};
  for (const [key, value] of Object.entries(colours)) {
    variables[`--md-sys-color-${key}`] = value;
    variables[`--mdui-color-${key}`] = triplet(value);
  }
  for (const [key, value] of Object.entries(RADIUS)) {
    variables[`--borderRadius-${key}`] = value;
  }

  // login screen panel: navy with a warm copper glow instead of Stoat purple
  variables["--ferret-hero-bg"] =
    "radial-gradient(120% 90% at 0% 100%, rgb(240 120 53 / 0.38) 0%, transparent 58%), linear-gradient(145deg, #1d2440 0%, #151b30 60%, #101426 100%)";
  variables["--ferret-hero-accent"] = "#F07835";

  return variables;
}
