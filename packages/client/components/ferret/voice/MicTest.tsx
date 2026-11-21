import { Show, createSignal, onCleanup } from "solid-js";

import { styled } from "styled-system/jsx";

import { useState } from "@revolt/state";
import { Button, Column, Symbol, Text } from "@revolt/ui";

/**
 * Live input level from the selected microphone, using the same browser
 * processing (echo cancellation / noise suppression) as calls.
 */
export function MicTest() {
  const state = useState();
  const [level, setLevel] = createSignal(0);
  const [running, setRunning] = createSignal(false);
  const [error, setError] = createSignal<string>();

  let stream: MediaStream | undefined;
  let context: AudioContext | undefined;
  let frame = 0;

  function stopTest() {
    cancelAnimationFrame(frame);
    stream?.getTracks().forEach((track) => track.stop());
    void context?.close().catch(() => {});
    stream = undefined;
    context = undefined;
    setRunning(false);
    setLevel(0);
  }

  async function startTest() {
    stopTest();
    setError(undefined);

    try {
      const deviceId = state.voice.preferredAudioInputDevice;
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          echoCancellation: state.voice.echoCancellation,
          noiseSuppression: state.voice.noiseSupression === "browser",
          autoGainControl: state.voice.autoGainControl,
        },
      });

      context = new AudioContext();
      const analyser = context.createAnalyser();
      analyser.fftSize = 1024;
      context.createMediaStreamSource(stream).connect(analyser);
      const samples = new Float32Array(analyser.fftSize);

      const tick = () => {
        analyser.getFloatTimeDomainData(samples);
        let sum = 0;
        for (const value of samples) sum += value * value;
        const db = 20 * Math.log10(Math.sqrt(sum / samples.length) || 1e-8);
        // map -60 dB .. 0 dB onto the meter
        setLevel(Math.min(1, Math.max(0, (db + 60) / 60)));
        frame = requestAnimationFrame(tick);
      };

      tick();
      setRunning(true);
    } catch (e) {
      setError(
        e instanceof Error && e.name === "NotFoundError"
          ? "That microphone isn't connected."
          : e instanceof Error && e.name === "NotAllowedError"
            ? "Microphone access was blocked."
            : String(e),
      );
      stopTest();
    }
  }

  onCleanup(stopTest);

  return (
    <Column gap="sm">
      <Row>
        <Button
          variant={running() ? "tonal" : "filled"}
          onPress={() => (running() ? stopTest() : void startTest())}
        >
          <Symbol>{running() ? "mic_off" : "mic"}</Symbol>
          {running() ? " Stop test" : " Test microphone"}
        </Button>
        <Meter aria-label="Microphone level" role="meter">
          <Fill
            style={{
              width: `${Math.round(level() * 100)}%`,
              background:
                level() > 0.85
                  ? "#f87171"
                  : level() > 0.6
                    ? "#facc15"
                    : "#4ade80",
            }}
          />
        </Meter>
      </Row>
      <Show when={error()}>
        <Text class="label">{error()}</Text>
      </Show>
      <Text class="label">
        Talk normally: the bar should move into the green/yellow range. Enhanced
        (RNNoise) suppression only applies inside calls.
      </Text>
    </Column>
  );
}

const Row = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "var(--gap-md)",
    flexWrap: "wrap",
  },
});

const Meter = styled("div", {
  base: {
    flex: "1 1 160px",
    height: "10px",
    borderRadius: "5px",
    overflow: "hidden",
    background: "var(--md-sys-color-surface-container-highest)",
  },
});

const Fill = styled("div", {
  base: {
    height: "100%",
    transition: "width 60ms linear",
  },
});
