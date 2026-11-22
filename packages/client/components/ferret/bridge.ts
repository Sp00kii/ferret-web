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
  /** Ferret pop-ups with a reply box instead of Windows notifications */
  notificationPopups: boolean;
  /** Per-sound choices; missing slots use Ferret's own sound */
  sounds: Partial<Record<string, FerretSoundChoice>>;
  voice: FerretVoiceSettings;
  /** The user's own soundboard clips */
  soundboard: { id: string; name: string; file: string }[];
  /** Per-person ringtone / message sound, keyed by user id */
  people: Record<string, FerretPersonSounds>;
};

export type FerretPersonSounds = {
  name: string;
  /** null = the normal ringtone / message sound */
  ringtone: FerretSoundChoice | null;
  message: FerretSoundChoice | null;
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
  notificationPopups?: boolean;
  sounds?: Partial<Record<string, { choice: string }>>;
  /** null removes the person; a null sound goes back to the normal one */
  people?: Record<
    string,
    {
      name?: string;
      ringtone?: { choice: string } | null;
      message?: { choice: string } | null;
    } | null
  >;
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

  pickPersonSound(
    userId: string,
    kind: "ringtone" | "message",
  ): Promise<FerretSettings>;

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

  /** App facts for the diagnostics panel (no paths or account info) */
  diagnostics(): Promise<Record<string, string | number> | null>;

  /** Waits (max 10 s) for a key or side mouse button; Escape cancels */
  capturePttBinding(): Promise<FerretSettings | null>;
  /** Whether the mute / deafen hotkeys could be registered */
  hotkeyStatus(): Promise<{ mute: boolean; deafen: boolean } | null>;
  onPushToTalk(callback: (held: boolean) => void): () => void;
  onHotkey(
    callback: (action: "toggleMute" | "toggleDeafen") => void,
  ): () => void;

  toast: {
    show(toast: {
      id: string;
      title: string;
      subtitle?: string;
      body: string;
      icon?: string;
      channelId: string;
      messageId?: string;
      canReply: boolean;
    }): void;
    onAction(
      callback: (
        action:
          | { type: "open"; channelId: string; messageId?: string }
          | {
              type: "reply";
              id: string;
              channelId: string;
              messageId?: string;
              text: string;
            },
      ) => void,
    ): () => void;
    replyResult(result: { id: string; ok: boolean; error?: string }): void;
  };

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
