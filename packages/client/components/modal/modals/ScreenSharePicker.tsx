import { Trans, useLingui } from "@lingui/solid/macro";
import { createFormControl, createFormGroup } from "solid-forms";

import { useState } from "@revolt/state";
import { ScreenShareQualityName } from "@revolt/state/stores/Voice";
import { Avatar, Column, Dialog, DialogProps, Form2, Ripple } from "@revolt/ui";

import type { FerretShareAudioMode } from "@revolt/ferret/bridge"; // Ferret mod
import { Show, createEffect, createMemo, createResource } from "solid-js";
import { styled } from "styled-system/jsx";
import { Modals } from "../types";

export function ScreenSharePickerModal(
  props: DialogProps & Modals & { type: "screen_share_picker" },
) {
  const { voice } = useState();
  const { t } = useLingui();

  const group = createFormGroup({
    qualityName: createFormControl<ScreenShareQualityName>(
      voice.screenShareQuality || "low",
    ),
    audio: createFormControl(voice.screenShareAudio),
    idx: createFormControl([0], { required: true }),
  });

  // Ferret mod: choose what sound the share sends ("only this app" and
  // "everything except Ferret" need Windows 11 and Ferret's audio helper)
  const [ferretModes] = createResource(
    async () => (await window.ferret?.shareAudio.modes()) ?? undefined,
  );
  const ferretMode = createFormControl<string>("none");
  createEffect(() => {
    const modes = ferretModes();
    if (!modes) return;
    ferretMode.setValue(
      !voice.screenShareAudio
        ? "none"
        : modes.includes("exceptFerret")
          ? "exceptFerret"
          : "all",
    );
  });
  const selectedIsScreen = () =>
    !!props.sources.find((source) => source.idx === group.controls.idx.value[0])
      ?.isFullScreen;
  // "only this app" needs a window, not a whole screen
  createEffect(() => {
    if (selectedIsScreen() && ferretMode.value === "app")
      ferretMode.setValue("exceptFerret");
  });
  const ferretModeButtons = () =>
    (
      [
        ["none", "No sound"],
        ["all", "All sound"],
        ["app", "Only this app"],
        ["exceptFerret", "All except Ferret"],
      ] as const
    )
      .filter(
        ([mode]) =>
          ferretModes()?.includes(mode) &&
          !(mode === "app" && selectedIsScreen()),
      )
      .map(([value, children]) => ({ value, children }));

  async function onSubmit() {
    let audio = group.controls.audio.value;
    if (ferretModes()) {
      audio = ferretMode.value !== "none";
      await window.ferret!.shareAudio.setMode(
        ferretMode.value as FerretShareAudioMode,
      );
    }
    props.callback(
      group.controls.idx.value[0],
      group.controls.qualityName.value,
      audio,
    );
    props.onClose();
  }

  const submit = Form2.useSubmitHandler(group, onSubmit);

  const sources = createMemo(() =>
    props.sources.map((source) => {
      return { item: source, value: source.idx };
    }),
  );

  return (
    <Dialog
      minWidth={420}
      show={props.show}
      onClose={() => {
        props.onCancel();
        props.onClose();
      }}
      title={t`Pick a Screen to Share`}
      actions={[
        { text: <Trans>Cancel</Trans> },
        {
          text: <Trans>Go</Trans>,
          onClick: () => {
            onSubmit();
            return false;
          },
        },
      ]}
    >
      <form onSubmit={submit}>
        <Column>
          <Form2.VirtualSelect
            control={group.controls.idx}
            items={sources()}
            selectHeight="max(30vh, 200px)"
            isMaxHeight={true}
            itemHeight={60}
          >
            {(val, selected) => (
              <Item selected={selected}>
                <Ripple />
                <Avatar
                  src={val.image}
                  fallback={val.name}
                  size={36}
                  shape="rounded-square"
                />
                <span>{val.name}</span>
              </Item>
            )}
          </Form2.VirtualSelect>
          <Form2.ButtonGroup
            control={group.controls.qualityName}
            buttonDefinitions={props.qualities.map((quality) => {
              return {
                children: quality.fullName,
                value: quality.name,
              };
            })}
          />
          {/* Ferret mod: sound choices instead of on / off */}
          <Show
            when={ferretModes()}
            fallback={
              <Form2.Checkbox control={group.controls.audio}>
                <Trans>Share audio</Trans>
              </Form2.Checkbox>
            }
          >
            <Form2.ButtonGroup
              control={ferretMode}
              buttonDefinitions={ferretModeButtons()}
            />
            <Show when={ferretMode.value === "all"}>
              <small>
                All sound includes the call, so viewers hear themselves.
              </small>
            </Show>
          </Show>
        </Column>
      </form>
    </Dialog>
  );
}

const Item = styled("div", {
  base: {
    height: "60px",
    display: "flex",
    position: "relative",
    alignItems: "center",
    gap: "var(--gap-md)",
    padding: "var(--gap-md)",
    borderRadius: "var(--borderRadius-sm)",
  },
  variants: {
    selected: {
      true: {
        color: "var(--md-sys-color-on-primary)",
        background: "var(--md-sys-color-primary)",
      },
    },
  },
});
