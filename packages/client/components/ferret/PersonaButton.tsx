import { For, Show, createSignal } from "solid-js";
import { Portal } from "solid-js/web";

import type { Channel } from "stoat.js";
import { styled } from "styled-system/jsx";

import { IconButton } from "@revolt/ui/components/design";
import { MessageBox } from "@revolt/ui/components/features/messaging/composition/MessageBox";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import {
  ErrorText,
  Heading,
  Hint,
  Input,
  PANEL_WIDTH,
  Panel,
  useOutsideClose,
} from "./composerPanel";
import {
  MAX_PERSONAS,
  canMasquerade,
  newPersonaId,
  personaFor,
  personas,
  pickPersona,
  savePersonas,
} from "./personas";

/**
 * Mask button in the message box: post as one of your personas (another
 * name and picture) in this channel, using Stoat's masquerade. Only shown
 * where the server lets you.
 */
export function PersonaButton(props: { channel: Channel }) {
  return (
    <Show when={canMasquerade(props.channel)}>
      <PersonaMenu channel={props.channel} />
    </Show>
  );
}

function PersonaMenu(props: { channel: Channel }) {
  const [open, setOpen] = createSignal(false);
  const [spot, setSpot] = createSignal({ left: 0, bottom: 0 });
  const [error, setError] = createSignal<string>();
  let wrapper: HTMLDivElement | undefined;
  let panel: HTMLDivElement | undefined;

  const active = () => personaFor(props.channel.id);

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

  useOutsideClose(open, setOpen, () => [wrapper, panel]);

  const run = async (work: () => Promise<unknown>) => {
    setError(undefined);
    try {
      await work();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const choose = (personaId: string | null) =>
    run(async () => {
      await pickPersona(props.channel.id, personaId);
      setOpen(false);
    });

  const remove = (personaId: string) =>
    run(() =>
      savePersonas(personas().filter((persona) => persona.id !== personaId)),
    );

  let nameInput: HTMLInputElement | undefined;
  let avatarInput: HTMLInputElement | undefined;
  let colourInput: HTMLInputElement | undefined;
  const [useColour, setUseColour] = createSignal(false);

  const add = () =>
    run(async () => {
      const name = nameInput?.value.trim() ?? "";
      if (!name) return setError("Give the persona a name.");
      const id = newPersonaId();
      await savePersonas([
        ...personas(),
        {
          id,
          name,
          avatar: avatarInput?.value.trim() || null,
          colour: useColour() ? (colourInput?.value ?? null) : null,
        },
      ]);
      if (!personas().some((persona) => persona.id === id))
        return setError(
          "Couldn't save it. Picture links must start with https://.",
        );
      await pickPersona(props.channel.id, id);
      if (nameInput) nameInput.value = "";
      if (avatarInput) avatarInput.value = "";
      setOpen(false);
    });

  return (
    <div ref={wrapper} style={{ display: "flex" }}>
      <MessageBox.InlineIcon>
        <IconButton
          variant={active() ? "filled" : "standard"}
          onPress={() => {
            if (!open()) place();
            setOpen((value) => !value);
          }}
          use:floating={{
            tooltip: {
              placement: "top",
              content: active()
                ? `Posting as ${active()!.name}`
                : "Post as a persona",
            },
          }}
        >
          <Symbol>theater_comedy</Symbol>
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
            <Heading>Post as…</Heading>
            <Choice
              type="button"
              data-active={!active() || undefined}
              onClick={() => void choose(null)}
            >
              <Symbol size={20}>person</Symbol>
              <span>Yourself</span>
            </Choice>
            <For each={personas()}>
              {(persona) => (
                <Row>
                  <Choice
                    type="button"
                    data-active={active()?.id === persona.id || undefined}
                    onClick={() => void choose(persona.id)}
                  >
                    <Show
                      when={persona.avatar}
                      fallback={<Symbol size={20}>theater_comedy</Symbol>}
                    >
                      <img
                        src={persona.avatar!}
                        alt=""
                        referrerpolicy="no-referrer"
                      />
                    </Show>
                    <span style={{ color: persona.colour ?? undefined }}>
                      {persona.name}
                    </span>
                  </Choice>
                  <Remove
                    type="button"
                    title={`Remove ${persona.name}`}
                    onClick={() => void remove(persona.id)}
                  >
                    <Symbol size={16}>close</Symbol>
                  </Remove>
                </Row>
              )}
            </For>

            <Show when={personas().length < MAX_PERSONAS}>
              <Heading>New persona</Heading>
              <Input ref={nameInput} placeholder="Name" maxLength={32} />
              <Input
                ref={avatarInput}
                placeholder="Picture link (https://…, optional)"
                maxLength={256}
              />
              <ColourRow>
                <label>
                  <input
                    type="checkbox"
                    checked={useColour()}
                    onChange={(event) =>
                      setUseColour(event.currentTarget.checked)
                    }
                  />
                  Name colour
                </label>
                <input
                  ref={colourInput}
                  type="color"
                  value="#f07835"
                  disabled={!useColour()}
                />
              </ColourRow>
              <AddButton type="button" onClick={() => void add()}>
                Add and use here
              </AddButton>
            </Show>
            <Hint>
              Only for this channel. Everyone sees the persona's name, and Stoat
              still shows it's you. A name colour needs Manage Roles.
            </Hint>
            <Show when={error()}>
              <ErrorText>{error()}</ErrorText>
            </Show>
          </Panel>
        </Portal>
      </Show>
    </div>
  );
}

const Row = styled("div", {
  base: { display: "flex", alignItems: "center", gap: "4px" },
});

const Choice = styled("button", {
  base: {
    flexGrow: 1,
    minWidth: 0,
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 8px",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    textAlign: "start",
    color: "inherit",
    background: "transparent",
    "& img": {
      width: "24px",
      height: "24px",
      borderRadius: "50%",
      objectFit: "cover",
    },
    "& span": {
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
    "&:hover": { background: "var(--md-sys-color-surface-container-highest)" },
    "&[data-active]": {
      background: "var(--md-sys-color-secondary-container)",
      color: "var(--md-sys-color-on-secondary-container)",
    },
  },
});

const Remove = styled("button", {
  base: {
    display: "grid",
    placeItems: "center",
    width: "28px",
    height: "28px",
    border: "none",
    borderRadius: "50%",
    cursor: "pointer",
    color: "inherit",
    background: "transparent",
    "&:hover": { background: "var(--md-sys-color-surface-container-highest)" },
  },
});

const ColourRow = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontSize: "13px",
    padding: "2px 4px",
    "& label": { display: "flex", alignItems: "center", gap: "6px" },
    "& input[type=color]": {
      width: "36px",
      height: "24px",
      border: "none",
      background: "none",
    },
  },
});

const AddButton = styled("button", {
  base: {
    marginTop: "4px",
    padding: "8px",
    border: "none",
    borderRadius: "999px",
    cursor: "pointer",
    fontWeight: 600,
    color: "var(--md-sys-color-on-primary)",
    background: "var(--md-sys-color-primary)",
  },
});
