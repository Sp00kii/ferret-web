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
};

export type FerretSettingsPatch = {
  ringtone?: Partial<
    Omit<FerretSettings["ringtone"], "customFile" | "customFileName">
  >;
  watchedVoiceChannels?: string[];
  showConnectionQuality?: boolean;
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
}

declare global {
  interface Window {
    ferret?: FerretBridge;
  }
}
