/**
 * Colours for the embedded Discover page (stt.gg). It turns every key of
 * the theme it's sent into a CSS variable (--key) and uses both Stoat's
 * older names (accent, foreground, ...) and the newer --md-sys-color-*
 * ones. Stoat sends an empty theme, so it always looked like Stoat; Ferret
 * sends the colours of whatever theme you're using.
 */

const MD_COLOURS = [
  "primary",
  "on-primary",
  "primary-container",
  "on-primary-container",
  "secondary-container",
  "on-secondary-container",
  "surface",
  "on-surface",
  "surface-container-lowest",
  "surface-container-low",
  "surface-container",
  "surface-container-high",
  "surface-container-highest",
  "outline",
  "outline-variant",
];

export function discoverTheme(): Record<string, string> {
  const style = getComputedStyle(document.body);
  const read = (name: string) => style.getPropertyValue(name).trim();
  const md = (name: string) => read(`--md-sys-color-${name}`);

  const theme: Record<string, string> = {};
  for (const name of MD_COLOURS) {
    const value = md(name);
    if (value) theme[`md-sys-color-${name}`] = value;
  }

  // Stoat's older names, used by most of the Discover page
  const older: Record<string, string> = {
    accent: md("primary"),
    foreground: md("on-surface"),
    "secondary-foreground": md("outline"),
    "primary-background": md("surface"),
    "secondary-background": md("surface-container"),
    "tertiary-background": md("surface-container-high"),
    hover: md("surface-container-highest"),
  };
  for (const [key, value] of Object.entries(older))
    if (value) theme[key] = value;

  return theme;
}
