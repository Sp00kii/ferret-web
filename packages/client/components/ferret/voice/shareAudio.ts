import {
  type LocalTrackPublication,
  type Room,
  AudioPresets,
  ParticipantEvent,
  Track,
} from "livekit-client";

/**
 * Screen share sound captured by Ferret's Windows helper ("only this app"
 * or "everything except Ferret"). The desktop app streams raw 48 kHz 16-bit
 * stereo sound here; it's played into a track that's added to the share as
 * its sound, just like Stoat's own "share audio".
 */

export const SHARE_AUDIO_TRACK = "ferret-share-audio";

/** Plays the incoming sound chunks, with a small buffer against hiccups */
const WORKLET = `
class FerretPcm extends AudioWorkletProcessor {
  constructor() {
    super();
    this.queue = [];
    this.offset = 0;
    this.queued = 0;
    this.playing = false;
    this.port.onmessage = (event) => {
      const chunk = new Int16Array(event.data);
      this.queue.push(chunk);
      this.queued += chunk.length / 2;
      // never fall more than half a second behind
      while (this.queued > 24000 && this.queue.length > 1) {
        const old = this.queue.shift();
        this.queued -= (old.length - this.offset) / 2;
        this.offset = 0;
      }
    };
  }
  process(inputs, outputs) {
    const left = outputs[0][0];
    const right = outputs[0][1] || left;
    // wait for ~40 ms of sound before starting again after a gap
    if (!this.playing && this.queued >= 1920) this.playing = true;
    for (let i = 0; i < left.length; i++) {
      if (!this.playing || !this.queue.length) {
        this.playing = false;
        left[i] = 0;
        right[i] = 0;
        continue;
      }
      const chunk = this.queue[0];
      left[i] = chunk[this.offset] / 32768;
      right[i] = chunk[this.offset + 1] / 32768;
      this.offset += 2;
      this.queued -= 1;
      if (this.offset >= chunk.length) {
        this.queue.shift();
        this.offset = 0;
      }
    }
    return true;
  }
}
registerProcessor("ferret-pcm", FerretPcm);
`;

type Session = {
  context: AudioContext;
  node?: AudioWorkletNode;
  publication?: LocalTrackPublication;
  closed: boolean;
};

let session: Session | undefined;

async function close() {
  const current = session;
  session = undefined;
  if (!current || current.closed) return;
  current.closed = true;
  await current.context.close().catch(() => {});
}

async function begin(room: Room) {
  await close();
  const context = new AudioContext({ sampleRate: 48000 });
  const current: Session = { context, closed: false };
  session = current;

  const url = URL.createObjectURL(
    new Blob([WORKLET], { type: "application/javascript" }),
  );
  try {
    await context.audioWorklet.addModule(url);
  } finally {
    URL.revokeObjectURL(url);
  }
  if (current.closed) return;

  const node = new AudioWorkletNode(context, "ferret-pcm", {
    numberOfInputs: 0,
    outputChannelCount: [2],
  });
  const destination = context.createMediaStreamDestination();
  node.connect(destination);
  current.node = node;

  try {
    current.publication = await room.localParticipant.publishTrack(
      destination.stream.getAudioTracks()[0],
      {
        name: SHARE_AUDIO_TRACK,
        source: Track.Source.ScreenShareAudio,
        audioPreset: AudioPresets.musicHighQualityStereo,
        forceStereo: true,
        dtx: false,
        red: false,
      },
    );
  } catch (error) {
    // e.g. no permission to stream in this channel
    console.warn("[ferret] screen share sound not allowed", error);
    window.ferret?.shareAudio.stop();
    await close();
  }
}

/**
 * Follow the desktop app's screen share sound for the call. Returns a
 * cleanup function.
 */
export function followShareAudio(room: () => Room | undefined) {
  const bridge = window.ferret?.shareAudio;
  if (!bridge) return () => {};

  const stopAll = () => {
    bridge.stop();
    void close();
  };

  // the share ended (Stoat removes its sound track with it): stop capturing
  const onUnpublished = (publication: LocalTrackPublication) => {
    if (publication.trackName === SHARE_AUDIO_TRACK) stopAll();
  };
  let watched: Room | undefined;
  const watch = (current: Room | undefined) => {
    if (watched === current) return;
    watched?.localParticipant.off(
      ParticipantEvent.LocalTrackUnpublished,
      onUnpublished,
    );
    watched = current;
    current?.localParticipant.on(
      ParticipantEvent.LocalTrackUnpublished,
      onUnpublished,
    );
  };

  const unsubscribers = [
    bridge.onStart(() => {
      const current = room();
      if (!current) return bridge.stop();
      watch(current);
      void begin(current);
    }),
    bridge.onData((data) => {
      const node = session?.node;
      if (!node) return;
      // copy into its own buffer so it can be handed over without copying
      const copy = data.slice().buffer;
      node.port.postMessage(copy, [copy]);
    }),
    bridge.onEnd(() => {
      const publication = session?.publication;
      const current = room();
      if (publication?.track && current)
        void current.localParticipant
          .unpublishTrack(publication.track)
          .catch(() => {});
      void close();
    }),
  ];

  return () => {
    unsubscribers.forEach((unsubscribe) => unsubscribe());
    watch(undefined);
    stopAll();
  };
}
