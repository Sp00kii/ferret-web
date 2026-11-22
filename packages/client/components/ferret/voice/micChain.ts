import { createSignal } from "solid-js";

import type { FerretVoiceSettings } from "../bridge";

/**
 * Ferret's extra mic stage, inserted by VoiceProcessor between the input
 * volume and what goes to LiveKit:
 *
 *   input gain ──► gate ──► mix ──► LiveKit
 *        └──► analyser            ▲
 *                     soundboard ─┘
 *
 * The gate closes for push-to-talk (key not held) and the noise gate (mic
 * quieter than the threshold). The analyser feeds the level meter in
 * settings. Everything happens locally in the browser audio graph.
 */

type Chain = {
  context: AudioContext;
  analyser: AnalyserNode;
  gate: GainNode;
  mix: GainNode;
  buffer: Float32Array<ArrayBuffer>;
  open: boolean;
};

const chains = new Set<Chain>();

let config: FerretVoiceSettings | undefined;
let pttHeld = false;
let pttReleasedAt = 0;
let lastLoud = 0;
let timer: ReturnType<typeof setInterval> | undefined;

/** How long the noise gate stays open after the last loud moment */
const GATE_HOLD_MS = 220;
const TICK_MS = 20;

const [micLevel, setMicLevel] = createSignal(-100);
const [transmitting, setTransmitting] = createSignal(true);

/** Current mic level in dBFS (about -100 = silence, 0 = max) */
export { micLevel };
/** Whether the gate currently lets the mic through */
export { transmitting };

export function setMicChainConfig(next: FerretVoiceSettings | undefined) {
  config = next;
}

export function setPushToTalkHeld(held: boolean) {
  if (pttHeld && !held) pttReleasedAt = performance.now();
  pttHeld = held;
  tick();
}

/** Push-to-talk is only in effect once a key or button has been bound */
export const pushToTalkActive = () =>
  !!config?.pushToTalk && !!config.pttBinding;

function levelOf(chain: Chain) {
  chain.analyser.getFloatTimeDomainData(chain.buffer);
  let sum = 0;
  for (const sample of chain.buffer) sum += sample * sample;
  const rms = Math.sqrt(sum / chain.buffer.length);
  return rms > 0 ? Math.max(-100, 20 * Math.log10(rms)) : -100;
}

function tick() {
  const now = performance.now();
  let level = -100;
  for (const chain of chains) level = Math.max(level, levelOf(chain));
  setMicLevel(level);

  if (config?.noiseGate && level > config.noiseGateDb) lastLoud = now;

  const pttOpen =
    !pushToTalkActive() ||
    pttHeld ||
    now - pttReleasedAt < (config?.pttReleaseMs ?? 0);
  const gateOpen = !config?.noiseGate || now - lastLoud < GATE_HOLD_MS;
  const open = pttOpen && gateOpen;
  setTransmitting(open);

  for (const chain of chains) {
    if (chain.open === open) continue;
    chain.open = open;
    // quick fade so opening/closing doesn't click
    chain.gate.gain.setTargetAtTime(
      open ? 1 : 0,
      chain.context.currentTime,
      open ? 0.005 : 0.03,
    );
  }
}

/**
 * Build the stage. `source` is the node that used to feed the destination,
 * the returned node is what should feed it now.
 */
export function attachMicChain(context: AudioContext, source: AudioNode) {
  const analyser = context.createAnalyser();
  analyser.fftSize = 1024;
  const gate = context.createGain();
  const mix = context.createGain();
  source.connect(analyser);
  source.connect(gate);
  gate.connect(mix);

  const chain: Chain = {
    context,
    analyser,
    gate,
    mix,
    buffer: new Float32Array(analyser.fftSize),
    open: true,
  };
  chains.add(chain);
  timer ??= setInterval(tick, TICK_MS);
  tick();

  return {
    output: mix as AudioNode,
    dispose() {
      chains.delete(chain);
      analyser.disconnect();
      gate.disconnect();
      mix.disconnect();
      if (!chains.size && timer) {
        clearInterval(timer);
        timer = undefined;
        setMicLevel(-100);
      }
    },
  };
}

/** Whether there's a live mic stage to play soundboard clips into */
export const canPlayIntoCall = () => chains.size > 0;

const decoded = new WeakMap<AudioContext, Map<string, Promise<AudioBuffer>>>();

function decode(context: AudioContext, src: string) {
  let cache = decoded.get(context);
  if (!cache) decoded.set(context, (cache = new Map()));
  let buffer = cache.get(src);
  if (!buffer) {
    buffer = fetch(src)
      .then((response) => response.arrayBuffer())
      .then((data) => context.decodeAudioData(data));
    buffer.catch(() => cache!.delete(src));
    cache.set(src, buffer);
  }
  return buffer;
}

/**
 * Play a clip into the call (skips the gate, so push-to-talk doesn't need
 * to be held). Returns false if not in a call.
 */
export async function playIntoCall(src: string, volume: number) {
  const played = [...chains].map(async (chain) => {
    const buffer = await decode(chain.context, src);
    const node = chain.context.createBufferSource();
    const gain = chain.context.createGain();
    gain.gain.value = volume;
    node.buffer = buffer;
    node.connect(gain).connect(chain.mix);
    node.onended = () => gain.disconnect();
    node.start();
  });
  await Promise.all(played);
  return played.length > 0;
}
