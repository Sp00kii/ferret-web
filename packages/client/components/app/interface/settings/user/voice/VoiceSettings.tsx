import { Show } from "solid-js";

import { FerretSettingsLink } from "@revolt/ferret/FerretSettingsLink"; // Ferret mod
import { useInstance } from "@revolt/instance";
import { Column } from "@revolt/ui";

import { ScreenShareOptions } from "./ScreenShareOptions";
import { VoiceInputOptions } from "./VoiceInputOptions";
import { VoiceProcessingOptions } from "./VoiceProcessingOptions";

/**
 * Configure voice options
 */
export function VoiceSettings() {
  const { limits } = useInstance();

  return (
    <Column gap="lg">
      {/* Ferret mod */}
      <FerretSettingsLink
        tab="calls"
        title="More voice options in Ferret"
        description="Push to talk, mic sensitivity, mute / deafen shortcuts, soundboard, ringtones and the compact call window."
      />
      <VoiceInputOptions />
      <VoiceProcessingOptions />
      <Show when={limits().video}>
        <ScreenShareOptions />
      </Show>
    </Column>
  );
}
