import { createEffect, createMemo } from "solid-js";

import { useClientLifecycle } from "@revolt/client";
import { State } from "@revolt/client/Controller";
// Ferret mod
import { useFerretSettings } from "@revolt/ferret/settings";
import { ferretThemeVariables } from "@revolt/ferret/theme/ferretTheme";
import { useState } from "@revolt/state";

import {
  createMaterialColourVariables,
  createMduiColourTriplets,
  createStoatWebVariables,
} from ".";
import { SlideState } from "../components/navigation/SlideDrawer";
import { Masks } from "./Masks";
import { FONTS, MONOSPACE_FONTS } from "./fonts";
import { legacyThemeUnsetShim } from "./legacyThemeGeneratorCode";

/**
 * Component for loading theme variables into root
 */
export function LoadTheme() {
  const state = useState();
  const { lifecycle } = useClientLifecycle();

  const bannerShown = createMemo(() =>
    [
      State.Connecting,
      State.Disconnected,
      State.Reconnecting,
      State.Offline,
    ].includes(lifecycle.state()),
  );

  // Ferret mod: Ferret style is on unless switched off in Ferret settings
  const ferretSettings = useFerretSettings();
  const ferretStyle = () =>
    !!window.ferret && (ferretSettings()?.ferretStyle ?? true);

  const ferretLook = () => ({
    theme: ferretSettings()?.ferretTheme ?? "midnight",
    accent: ferretSettings()?.ferretAccent ?? "copper",
  });

  createEffect(() => {
    if (ferretStyle())
      document.body.setAttribute("data-ferret-style", ferretLook().theme);
    else document.body.removeAttribute("data-ferret-style");
  });

  const getCssProps = createMemo(() => {
    const activeTheme = state.theme.activeTheme;

    return {
      // create unset variables to indicate where colours need replacing
      ...Object.keys(legacyThemeUnsetShim().colours).reduce(
        (d, k) => ({
          ...d,
          [`--colours-${k}`]: k.includes("background")
            ? "var(--unset-bg)"
            : "var(--unset-fg)",
        }),
        {},
      ),
      // mount Stoat for Web variables
      ...createStoatWebVariables(activeTheme),
      // mount --md-sys-color variables
      ...createMaterialColourVariables(activeTheme, "--md-sys-color-"),
      // mount --mdui-color triplet variables
      ...createMduiColourTriplets(activeTheme, "--mdui-color-"),
      // Ferret mod: Ferret palette + radii on top of the stock theme
      ...(ferretStyle()
        ? ferretThemeVariables(ferretLook().theme, ferretLook().accent)
        : {}),
    };
  });

  // Ferret mod: variables set last time, so ones that disappear get removed
  let appliedProps = new Set<string>();

  //Load fonts & update CSS props on body
  createEffect(() => {
    FONTS[state.theme.interfaceFont].load();
    MONOSPACE_FONTS[state.theme.monospaceFont].load();

    const cssProps = getCssProps();
    for (const key of appliedProps)
      if (!(key in cssProps)) document.body.style.removeProperty(key);
    appliedProps = new Set(Object.keys(cssProps));

    for (const [key, value] of Object.entries(cssProps))
      document.body.style.setProperty(key, value);
  });

  //Set PWA theme color
  createEffect(() => {
    const drawerShown =
      state.appDrawer()?.state === SlideState.SHOWN ||
      state.diagDrawer()?.state === SlideState.SHOWN;

    const color =
      getCssProps()[
        bannerShown()
          ? "--md-sys-color-primary-container"
          : drawerShown
            ? "--md-sys-color-surface-container-low"
            : "--md-sys-color-surface-container-high"
      ];

    for (const meta of document.head.querySelectorAll("meta[name=theme-color]"))
      (meta as HTMLMetaElement).content = color;

    // Shows behind the status bar and home indicator, so match the app's top
    // and bottom edges (the chat when open, otherwise the sidebar)
    const props = getCssProps();
    const top =
      props[
        drawerShown
          ? "--md-sys-color-surface-container-low"
          : "--md-sys-color-surface-container-high"
      ];
    const bottom =
      props[
        drawerShown
          ? "--md-sys-color-surface-container-lowest"
          : "--md-sys-color-surface-container-high"
      ];
    document.documentElement.style.background =
      document.body.style.background = `linear-gradient(${top} 50%, ${bottom} 50%)`;
  });

  //Match system UI (keyboard, form controls) to the theme
  createEffect(() => {
    // Ferret mod: follow the Ferret theme while the Ferret style is on
    const dark = ferretStyle()
      ? ferretLook().theme !== "cream"
      : state.theme.activeTheme.darkMode;
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
  });

  return <Masks />;
}
