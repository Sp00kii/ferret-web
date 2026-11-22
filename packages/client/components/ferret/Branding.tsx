import { styled } from "styled-system/jsx";

import logo from "./assets/ferret-logo.png";

import { useFerretSettings } from "./settings";

export const FERRET_LOGO = logo;

const settings = useFerretSettings();

/** The logo in the chosen app icon colour (Settings -> Ferret -> App icon) */
export function ferretLogo() {
  const id = settings()?.appIcon;
  return id && id !== "classic"
    ? `${import.meta.env.BASE_URL}ferret/icons/${id}.png`
    : logo;
}

/**
 * Ferret mascot + name; replaces the placeholder wordmark in the titlebar,
 * on the home page and on the login screen.
 * @param size Logo height in px (text scales with it)
 */
export function FerretWordmark(props: { size?: number }) {
  const size = () => props.size ?? 18;

  return (
    <Mark
      style={{
        height: `${size()}px`,
        gap: `${Math.round(size() / 3)}px`,
        "font-size": `${Math.round(size() * 0.72)}px`,
      }}
    >
      <img
        src={ferretLogo()}
        alt=""
        draggable={false}
        style={{
          width: `${size()}px`,
          height: `${size()}px`,
          "border-radius": `${Math.max(4, Math.round(size() * 0.22))}px`,
        }}
      />
      <span>Ferret</span>
    </Mark>
  );
}

const Mark = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    flexShrink: 0,
    "& span": {
      fontWeight: 700,
      letterSpacing: "0.02em",
      lineHeight: 1,
      // inherit, so it is white on the login panel and normal elsewhere
      color: "inherit",
    },
  },
});
