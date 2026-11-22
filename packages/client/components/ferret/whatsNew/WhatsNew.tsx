import { For, Show, createSignal, onCleanup, onMount } from "solid-js";
import { Portal } from "solid-js/web";

import { styled } from "styled-system/jsx";

import { Button } from "@revolt/ui";

import { ferretLogo } from "../Branding";

import { type WhatsNewItem, latestNotes, notesFor } from "./notes";

type Shown = { version: string; items: WhatsNewItem[] };

const [shown, setShown] = createSignal<Shown>();

/** Open the pop-up with the latest notes (About → What's new) */
export function showWhatsNew() {
  const latest = latestNotes();
  if (latest) setShown(latest);
}

/**
 * "What's new in Ferret": shown once after an update. Renders nothing
 * until there's something to show.
 */
export function WhatsNew() {
  const bridge = window.ferret;
  if (!bridge) return null;

  let timer: ReturnType<typeof setTimeout> | undefined;
  onMount(async () => {
    const result = await bridge.whatsNew().catch(() => null);
    if (!result?.show) return;
    const notes = notesFor(result.version);
    // no notes for this version: nothing to say, just remember it
    if (!notes) return void bridge.whatsNewSeen();
    // let the app settle first
    timer = setTimeout(() => setShown(notes), 1500);
  });
  onCleanup(() => clearTimeout(timer));

  const close = () => {
    setShown(undefined);
    void bridge.whatsNewSeen();
  };

  const onKey = (event: KeyboardEvent) => {
    if (event.key === "Escape" && shown()) close();
  };
  document.addEventListener("keydown", onKey);
  onCleanup(() => document.removeEventListener("keydown", onKey));

  return (
    <Show when={shown()}>
      {(notes) => (
        <Portal>
          <Backdrop onClick={close}>
            <Card
              role="dialog"
              aria-modal="true"
              aria-labelledby="ferret-whats-new-title"
              onClick={(event) => event.stopPropagation()}
            >
              <header>
                <img src={ferretLogo()} alt="" width={48} height={48} />
                <div>
                  <h2 id="ferret-whats-new-title">What's new in Ferret</h2>
                  <span>Version {notes().version}</span>
                </div>
              </header>
              <ul>
                <For each={notes().items}>
                  {(item) => (
                    <li>
                      <span class="icon" aria-hidden="true">
                        {item.icon}
                      </span>
                      <div>
                        <strong>{item.title}</strong>
                        <p>{item.text}</p>
                      </div>
                    </li>
                  )}
                </For>
              </ul>
              <footer>
                <Button
                  variant="tonal"
                  onPress={() =>
                    window.open(
                      `${bridge.repository}/releases/tag/v${notes().version}`,
                      "_blank",
                    )
                  }
                >
                  Full release notes
                </Button>
                <Button variant="filled" onPress={close}>
                  Got it
                </Button>
              </footer>
            </Card>
          </Backdrop>
        </Portal>
      )}
    </Show>
  );
}

const Backdrop = styled("div", {
  base: {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    display: "grid",
    placeItems: "center",
    padding: "24px",
    background: "rgba(0, 0, 0, 0.55)",
  },
});

const Card = styled("div", {
  base: {
    width: "min(520px, 100%)",
    maxHeight: "calc(100vh - 48px)",
    overflowY: "auto",
    padding: "24px",
    borderRadius: "var(--borderRadius-xl, 16px)",
    background: "var(--md-sys-color-surface-container-high)",
    color: "var(--md-sys-color-on-surface)",
    boxShadow: "0 16px 48px rgba(0, 0, 0, 0.45)",
    "& header": {
      display: "flex",
      alignItems: "center",
      gap: "14px",
      marginBottom: "16px",
    },
    "& header img": { borderRadius: "12px" },
    "& h2": { margin: 0, fontSize: "20px", fontWeight: 700 },
    "& header span": {
      color: "var(--md-sys-color-primary)",
      fontSize: "13px",
      fontWeight: 600,
    },
    "& ul": {
      listStyle: "none",
      margin: 0,
      padding: 0,
      display: "flex",
      flexDirection: "column",
      gap: "12px",
    },
    "& li": { display: "flex", gap: "12px", alignItems: "flex-start" },
    "& .icon": {
      flex: "none",
      width: "36px",
      height: "36px",
      display: "grid",
      placeItems: "center",
      borderRadius: "10px",
      fontSize: "18px",
      background: "var(--md-sys-color-surface-container-highest)",
    },
    "& strong": { display: "block", fontSize: "14px" },
    "& p": {
      margin: "2px 0 0",
      fontSize: "13px",
      color: "var(--md-sys-color-on-surface-variant)",
    },
    "& footer": {
      display: "flex",
      justifyContent: "flex-end",
      gap: "var(--gap-md)",
      marginTop: "20px",
    },
  },
});
