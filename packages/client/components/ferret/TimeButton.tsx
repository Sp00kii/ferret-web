import { For, Show, createSignal } from "solid-js";
import { Portal } from "solid-js/web";

import { styled } from "styled-system/jsx";

import { dayjs } from "@revolt/i18n/dayjs";
import { formatTimestamp } from "@revolt/markdown/plugins/timestamps";
import { IconButton } from "@revolt/ui/components/design";
import { MessageBox } from "@revolt/ui/components/features/messaging/composition/MessageBox";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import {
  Heading,
  Hint,
  Input,
  PANEL_WIDTH,
  Panel,
  useOutsideClose,
} from "./composerPanel";

/** Stoat's time styles (the letter after the time in <t:…:X>) */
const STYLES = [
  { letter: "t", name: "Time" },
  { letter: "F", name: "Day, date and time" },
  { letter: "D", name: "Date" },
  { letter: "R", name: "Relative" },
] as const;

/** "YYYY-MM-DDTHH:mm" for a datetime-local input, next full hour */
const nextHour = () =>
  dayjs().add(1, "hour").startOf("hour").format("YYYY-MM-DDTHH:mm");

/**
 * Calendar button in the message box: pick a date and time and it adds a
 * time like <t:1700000000:F>, which everyone sees in their own time zone
 * (stoatchat/for-web#1120).
 */
export function TimeButton(props: { onInsert: (text: string) => void }) {
  if (!window.ferret) return null;

  const [open, setOpen] = createSignal(false);
  const [spot, setSpot] = createSignal({ left: 0, bottom: 0 });
  const [when, setWhen] = createSignal(nextHour());
  let wrapper: HTMLDivElement | undefined;
  let panel: HTMLDivElement | undefined;

  useOutsideClose(open, setOpen, () => [wrapper, panel]);

  const place = () => {
    if (!wrapper) return;
    const rect = wrapper.getBoundingClientRect();
    setSpot({
      left: Math.max(
        8,
        Math.min(rect.left, window.innerWidth - PANEL_WIDTH - 8),
      ),
      bottom: window.innerHeight - rect.top + 8,
    });
  };

  const date = () => dayjs(when());
  const valid = () => !!when() && date().isValid();

  const insert = (letter: string) => {
    if (!valid()) return;
    props.onInsert(`<t:${date().unix()}:${letter}> `);
    setOpen(false);
  };

  return (
    <div ref={wrapper} style={{ display: "flex" }}>
      <MessageBox.InlineIcon>
        <IconButton
          onPress={() => {
            if (!open()) {
              setWhen(nextHour());
              place();
            }
            setOpen((value) => !value);
          }}
          use:floating={{
            tooltip: { placement: "top", content: "Add a time" },
          }}
        >
          <Symbol>schedule</Symbol>
        </IconButton>
      </MessageBox.InlineIcon>
      <Show when={open()}>
        <Portal>
          <Panel
            ref={panel}
            style={{
              left: `${spot().left}px`,
              bottom: `${spot().bottom}px`,
            }}
          >
            <Heading>Add a time</Heading>
            <Input
              type="datetime-local"
              value={when()}
              onInput={(event) => setWhen(event.currentTarget.value)}
            />
            <Show when={valid()}>
              <For each={STYLES}>
                {(style) => (
                  <Choice type="button" onClick={() => insert(style.letter)}>
                    <span>{style.name}</span>
                    <small>{formatTimestamp(date(), style.letter)}</small>
                  </Choice>
                )}
              </For>
            </Show>
            <Hint>
              Everyone sees this time in their own time zone. Shown here in
              yours.
            </Hint>
          </Panel>
        </Portal>
      </Show>
    </div>
  );
}

const Choice = styled("button", {
  base: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "2px",
    padding: "6px 8px",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    textAlign: "start",
    color: "inherit",
    background: "transparent",
    "& small": { fontSize: "12px", color: "var(--md-sys-color-outline)" },
    "&:hover": { background: "var(--md-sys-color-surface-container-highest)" },
  },
});
