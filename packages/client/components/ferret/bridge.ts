/**
 * Types for `window.ferret`, exposed by the Ferret desktop preload
 * (src/world/ferret.ts in the desktop repo). Undefined in a normal browser,
 * so every Ferret feature checks for it and stays inert on the web.
 */
export type FerretSettings = {
  ringtone: {
    enabled: boolean;
    /** Built-in sound id from ringtones.ts, or "custom" for the user's file */
    preset: string;
    /** 0-100 */
    volume: number;
    customFile: string | null;
    customFileName: string | null;
    ringWhenHidden: boolean;
  };
  watchedVoiceChannels: string[];
  showConnectionQuality: boolean;
  /** Ferret's navy/copper look; off = stock Stoat theming */
  ferretStyle: boolean;
  /** Per-sound choices; missing slots use Ferret's own sound */
  sounds: Partial<Record<string, FerretSoundChoice>>;
  voice: FerretVoiceSettings;
  /** The user's own soundboard clips */
  soundboard: { id: string; name: string; file: string }[];
};

export type PttBinding = { kind: "key" | "mouse"; code: number; label: string };

export type FerretVoiceSettings = {
  pushToTalk: boolean;
  /** Captured by the desktop app; the page can only clear it */
  pttBinding: PttBinding | null;
  /** Keep the mic open this long after letting go (ms) */
  pttReleaseMs: number;
  noiseGate: boolean;
  /** Mic level (dBFS) needed to open the gate, -90 to -10 */
  noiseGateDb: number;
  /** Electron accelerators like "Ctrl+Shift+M" */
  muteHotkey: string | null;
  deafenHotkey: string | null;
  /** 0-100 */
  soundboardVolume: number;
  /** Small always-on-top window while in a call and Ferret isn't focused */
  compactCallWindow: boolean;
};

export type MiniCallState = {
  inCall: boolean;
  callId: string;
  channelName?: string;
  serverName?: string;
  startedAt?: number;
  muted?: boolean;
  deafened?: boolean;
  participants?: {
    name: string;
    avatar?: string;
    speaking?: boolean;
    muted?: boolean;
    deafened?: boolean;
  }[];
};

export type FerretSoundChoice = {
  /** "ferret", a soundLibrary.ts id, or "custom" */
  choice: string;
  customFile: string | null;
  customFileName: string | null;
};

export type FerretSettingsPatch = {
  ringtone?: Partial<
    Omit<FerretSettings["ringtone"], "customFile" | "customFileName">
  >;
  watchedVoiceChannels?: string[];
  showConnectionQuality?: boolean;
  ferretStyle?: boolean;
  sounds?: Partial<Record<string, { choice: string }>>;
  voice?: Partial<Omit<FerretVoiceSettings, "pttBinding">> & {
    pttBinding?: null;
  };
};

export type UpdateCheckResult =
  | { status: "up-to-date"; version: string }
  | { status: "available"; version: string }
  | { status: "downloading"; version: string }
  | { status: "error"; message: string };

export interface FerretBridge {
  version: string;
  unofficialNotice: string;
  repository: string;

  getSettings(): Promise<FerretSettings>;
  setSettings(patch: FerretSettingsPatch): Promise<FerretSettings>;
  onSettingsChanged(callback: (settings: FerretSettings) => void): () => void;

  pickRingtone(): Promise<FerretSettings>;
  clearRingtone(): Promise<FerretSettings>;

  pickSound(slot: string): Promise<FerretSettings>;
  clearSound(slot: string): Promise<FerretSettings>;
  resetSounds(): Promise<FerretSettings>;

  addSoundboardClip(): Promise<FerretSettings>;
  removeSoundboardClip(id: string): Promise<FerretSettings>;
  renameSoundboardClip(id: string, name: string): Promise<FerretSettings>;

  showIncomingCall(call: {
    title: string;
    body: string;
    channelId: string;
  }): void;
  dismissIncomingCall(): void;
  onIncomingCallAction(
    callback: (action: { action: "open"; channelId: string }) => void,
  ): () => void;

  onResync(callback: (reason: string) => void): () => void;

  checkForUpdates(): Promise<UpdateCheckResult>;

  /** Waits (max 10 s) for a key or side mouse button; Escape cancels */
  capturePttBinding(): Promise<FerretSettings | null>;
  /** Whether the mute / deafen hotkeys could be registered */
  hotkeyStatus(): Promise<{ mute: boolean; deafen: boolean } | null>;
  onPushToTalk(callback: (held: boolean) => void): () => void;
  onHotkey(
    callback: (action: "toggleMute" | "toggleDeafen") => void,
  ): () => void;

  mini: {
    update(state: MiniCallState): void;
    onCommand(
      callback: (command: "toggleMute" | "toggleDeafen" | "disconnect") => void,
    ): () => void;
    onRender(callback: (state: MiniCallState) => void): () => void;
    command(command: string): void;
    resize(height: number): void;
  };
}

declare global {
  interface Window {
    ferret?: FerretBridge;
  }
}
