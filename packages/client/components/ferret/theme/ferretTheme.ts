import "./ferret-style.css";
import {
  ACCENTS,
  type FerretAccentName,
  type FerretThemeName,
  lookColours,
} from "./looks";

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
export function ferretThemeVariables(
  theme: FerretThemeName,
  accent: FerretAccentName,
) {
  const colours = lookColours(theme, accent);

  const variables: Record<string, string> = {};
  for (const [key, value] of Object.entries(colours)) {
    variables[`--md-sys-color-${key}`] = value;
    variables[`--mdui-color-${key}`] = triplet(value);
  }
  for (const [key, value] of Object.entries(RADIUS)) {
    variables[`--borderRadius-${key}`] = value;
  }

  // for Ferret's own CSS (selection, focus ring, scrollbars)
  variables["--ferret-accent"] = colours.primary;
  variables["--ferret-accent-rgb"] = triplet(colours.primary);
  variables["--ferret-scrollbar"] = colours["outline-variant"];
  variables["--ferret-scrollbar-hover"] = colours.outline;

  // login screen panel (its text is white, so it stays dark in Cream too):
  // a soft glow of the accent instead of Stoat purple
  variables["--ferret-hero-bg"] =
    theme === "cream"
      ? `radial-gradient(120% 90% at 0% 100%, rgba(${triplet(colours.primary)}, 0.45) 0%, transparent 58%), linear-gradient(145deg, #5A3426 0%, #44271E 60%, #351E17 100%)`
      : theme === "contrast"
        ? "#000000"
        : `radial-gradient(120% 90% at 0% 100%, rgba(${triplet(colours.primary)}, 0.38) 0%, transparent 58%), linear-gradient(145deg, #1d2440 0%, #151b30 60%, #101426 100%)`;
  // the panel is dark in every theme, so use the bright accent on it
  variables["--ferret-hero-accent"] = (ACCENTS[accent] ?? ACCENTS.copper).dark.primary;

  return variables;
}
