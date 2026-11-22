import { createEffect, createMemo } from "solid-js";
import { AudioTrack, useTracks } from "solid-livekit-components";

import { getTrackReferenceId, isLocal } from "@livekit/components-core";
import { Key } from "@solid-primitives/keyed";
import { RemoteTrackPublication, Track } from "livekit-client";

import {
  incomingSoundboard,
  isSoundboardTrack,
} from "@revolt/ferret/voice/soundboard"; // Ferret mod
import { useState } from "@revolt/state";

import { useVoice } from "../state";

export function RoomAudioManager() {
  const voice = useVoice();
  const state = useState();

  const tracks = useTracks(
    [
      Track.Source.Microphone,
      Track.Source.ScreenShareAudio,
      Track.Source.Unknown,
    ],
    {
      updateOnlyOn: [],
      onlySubscribed: false,
    },
  );

  const filteredTracks = createMemo(() =>
    tracks().filter(
      (track) =>
        !isLocal(track.participant) &&
        track.publication.kind === Track.Kind.Audio,
    ),
  );

  createEffect(() => {
    const tracks = filteredTracks();
    console.info("[rtc] filtered tracks", filteredTracks());
    for (const track of tracks) {
      (track.publication as RemoteTrackPublication).setSubscribed(true);
      console.info(track.publication);
    }
  });

  return (
    <div style={{ display: "none" }}>
      <Key each={filteredTracks()} by={(item) => getTrackReferenceId(item)}>
        {(track) => {
          // Ferret mod: soundboard clips sent by Ferret on their own track
          // follow your soundboard settings (volume, off, per person)
          const board = () =>
            isSoundboardTrack(track().publication)
              ? incomingSoundboard(track().participant.identity)
              : undefined;
          return (
            <AudioTrack
              trackRef={track()}
              volume={
                state.voice.outputVolume *
                (track().source === Track.Source.ScreenShareAudio
                  ? state.voice.getScreenShareVolume(
                      track().participant.identity,
                    )
                  : state.voice.getUserVolume(track().participant.identity)) *
                (board()?.volume ?? 1)
              }
              muted={
                (track().source === Track.Source.ScreenShareAudio
                  ? state.voice.getScreenShareMuted(
                      track().participant.identity,
                    )
                  : state.voice.getUserMuted(track().participant.identity)) ||
                voice.deafen() ||
                !!board()?.muted
              }
              enableBoosting
            />
          );
        }}
      </Key>
    </div>
  );
}
