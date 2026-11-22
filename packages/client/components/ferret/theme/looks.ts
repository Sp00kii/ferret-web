/**
 * Ferret's themes and accent colours. Pure data, so the desktop app's small
 * pop-up windows can use the same colours.
 */

export const FERRET_THEMES = ["midnight", "cream", "contrast"] as const;
export type FerretThemeName = (typeof FERRET_THEMES)[number];

export const FERRET_ACCENTS = [
  "copper",
  "blue",
  "purple",
  "pink",
  "green",
] as const;
export type FerretAccentName = (typeof FERRET_ACCENTS)[number];

export const THEME_LABELS: Record<FerretThemeName, string> = {
  midnight: "Midnight (navy)",
  cream: "Cream (light)",
  contrast: "High contrast",
};

type Accent = {
  label: string;
  /** on dark backgrounds */
  dark: { primary: string; on: string; container: string; tertiary: string };
  /** on light backgrounds (darker so it stays readable) */
  light: {
    primary: string;
    on: string;
    container: string;
    onContainer: string;
    tertiary: string;
  };
};

export const ACCENTS: Record<FerretAccentName, Accent> = {
  copper: {
    label: "Copper",
    dark: {
      primary: "#F07835",
      on: "#2A1207",
      container: "#542C27",
      tertiary: "#FF914D",
    },
    light: {
      primary: "#B4521C",
      on: "#FFFFFF",
      container: "#FFDBC8",
      onContainer: "#3A1A08",
      tertiary: "#9A4A1E",
    },
  },
  blue: {
    label: "Blue",
    dark: {
      primary: "#4C9AFF",
      on: "#04203F",
      container: "#1E3557",
      tertiary: "#7DB4FF",
    },
    light: {
      primary: "#1F63C6",
      on: "#FFFFFF",
      container: "#D6E6FF",
      onContainer: "#061D3D",
      tertiary: "#2D5B9A",
    },
  },
  purple: {
    label: "Purple",
    dark: {
      primary: "#A77BFF",
      on: "#1F0B4A",
      container: "#3B2A63",
      tertiary: "#C3A3FF",
    },
    light: {
      primary: "#6E3FD8",
      on: "#FFFFFF",
      container: "#E8DDFF",
      onContainer: "#22094F",
      tertiary: "#6A4AA8",
    },
  },
  pink: {
    label: "Pink",
    dark: {
      primary: "#FF6FAE",
      on: "#3F0420",
      container: "#5A2340",
      tertiary: "#FF9AC6",
    },
    light: {
      primary: "#C02C6E",
      on: "#FFFFFF",
      container: "#FFD9E8",
      onContainer: "#3E0420",
      tertiary: "#A13E6A",
    },
  },
  green: {
    label: "Green",
    dark: {
      primary: "#3ECF8E",
      on: "#00281A",
      container: "#1B4536",
      tertiary: "#6FE0AE",
    },
    light: {
      primary: "#17865A",
      on: "#FFFFFF",
      container: "#C9F2DD",
      onContainer: "#002113",
      tertiary: "#2F7A58",
    },
  },
};

/** Midnight: navy surfaces from the Ferret design system */
const MIDNIGHT: Record<string, string> = {
  secondary: "#FFE4C7",
  "on-secondary": "#3A2516",
  "secondary-container": "#222A40",
  "on-secondary-container": "#F5F2EF",
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

  scrim: "#000000",
  shadow: "#000000",
};

/** Cream: warm light theme */
const CREAM: Record<string, string> = {
  secondary: "#6B4F3A",
  "on-secondary": "#FFFFFF",
  "secondary-container": "#F3DCC6",
  "on-secondary-container": "#2A1A0C",
  "tertiary-container": "#EFD9C4",
  "on-tertiary-container": "#2A1A0C",
  error: "#BA1A1A",
  "on-error": "#FFFFFF",
  "error-container": "#FFDAD6",
  "on-error-container": "#410002",

  "primary-fixed": "#FFDBC8",
  "primary-fixed-dim": "#FFB68E",
  "on-primary-fixed": "#341100",
  "on-primary-fixed-variant": "#7A3410",
  "secondary-fixed": "#F3DCC6",
  "secondary-fixed-dim": "#D9C0A8",
  "on-secondary-fixed": "#2A1A0C",
  "on-secondary-fixed-variant": "#5A4330",
  "tertiary-fixed": "#FFDCC4",
  "tertiary-fixed-dim": "#E9BE9E",
  "on-tertiary-fixed": "#311300",
  "on-tertiary-fixed-variant": "#713613",

  "surface-dim": "#E8D6C2",
  surface: "#FFF6EC",
  "surface-bright": "#FFFBF6",
  "surface-container-lowest": "#FFFFFF",
  "surface-container-low": "#FFF2E4",
  "surface-container": "#FAEBDB",
  "surface-container-high": "#F4E3D0",
  "surface-container-highest": "#EDD9C3",

  "on-surface": "#2A1E16",
  "on-surface-variant": "#5C4B3E",
  outline: "#8C7867",
  "outline-variant": "#D9C5B2",

  "inverse-surface": "#362A21",
  "inverse-on-surface": "#FFF1E4",

  scrim: "#000000",
  shadow: "#000000",
};

/** High contrast: black and white with a bright accent and strong outlines */
const CONTRAST: Record<string, string> = {
  secondary: "#FFFFFF",
  "on-secondary": "#000000",
  "secondary-container": "#2A2A2A",
  "on-secondary-container": "#FFFFFF",
  "tertiary-container": "#2A2A2A",
  "on-tertiary-container": "#FFFFFF",
  error: "#FF6B6B",
  "on-error": "#000000",
  "error-container": "#5C0000",
  "on-error-container": "#FFFFFF",

  "primary-fixed": "#FFFFFF",
  "primary-fixed-dim": "#E0E0E0",
  "on-primary-fixed": "#000000",
  "on-primary-fixed-variant": "#000000",
  "secondary-fixed": "#FFFFFF",
  "secondary-fixed-dim": "#E0E0E0",
  "on-secondary-fixed": "#000000",
  "on-secondary-fixed-variant": "#000000",
  "tertiary-fixed": "#FFFFFF",
  "tertiary-fixed-dim": "#E0E0E0",
  "on-tertiary-fixed": "#000000",
  "on-tertiary-fixed-variant": "#000000",

  "surface-dim": "#000000",
  surface: "#000000",
  "surface-bright": "#333333",
  "surface-container-lowest": "#000000",
  "surface-container-low": "#050505",
  "surface-container": "#0D0D0D",
  "surface-container-high": "#161616",
  "surface-container-highest": "#262626",

  "on-surface": "#FFFFFF",
  "on-surface-variant": "#E6E6E6",
  outline: "#C8C8C8",
  "outline-variant": "#9A9A9A",

  "inverse-surface": "#FFFFFF",
  "inverse-on-surface": "#000000",

  scrim: "#000000",
  shadow: "#000000",
};

export const isLightTheme = (theme: FerretThemeName) => theme === "cream";

/** Every Material colour token for a theme + accent */
export function lookColours(
  theme: FerretThemeName,
  accentName: FerretAccentName,
): Record<string, string> {
  const accent = ACCENTS[accentName] ?? ACCENTS.copper;
  if (theme === "cream") {
    const a = accent.light;
    return {
      ...CREAM,
      primary: a.primary,
      "on-primary": a.on,
      "primary-container": a.container,
      "on-primary-container": a.onContainer,
      tertiary: a.tertiary,
      "on-tertiary": "#FFFFFF",
      "inverse-primary": accent.dark.primary,
    };
  }
  const a = accent.dark;
  const contrast = theme === "contrast";
  return {
    ...(contrast ? CONTRAST : MIDNIGHT),
    primary: a.primary,
    "on-primary": a.on,
    "primary-container": contrast ? a.primary : a.container,
    "on-primary-container": contrast ? a.on : "#FFE4C7",
    tertiary: a.tertiary,
    "on-tertiary": a.on,
    "inverse-primary": accent.light.primary,
  };
}

/** The few colours the desktop pop-up windows need */
export function popupColours(
  theme: FerretThemeName,
  accentName: FerretAccentName,
) {
  const c = lookColours(theme, accentName);
  return {
    bg: c["surface-container-low"],
    panel: c["surface-container-highest"],
    line: c["outline-variant"],
    text: c["on-surface"],
    dim: c["on-surface-variant"],
    accent: c.primary,
    onAccent: c["on-primary"],
  };
}
