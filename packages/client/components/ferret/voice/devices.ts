import { Room, RoomEvent } from "livekit-client";

type PreferredDevices = {
  preferredAudioInputDevice?: string;
  preferredAudioOutputDevice?: string;
};

const KINDS = [
  ["audioinput", "preferredAudioInputDevice"],
  ["audiooutput", "preferredAudioOutputDevice"],
] as const;

/**
 * Keep the call on the user's chosen mic/output across unplug and replug:
 * if the active device disappears, fall back to the system default; when the
 * preferred device comes back (headset replugged), switch back to it.
 */
export function followPreferredDevices(room: Room, settings: PreferredDevices) {
  let syncing = false;

  const sync = async () => {
    if (syncing) return;
    syncing = true;
    try {
      for (const [kind, key] of KINDS) {
        const available = new Set(
          (await Room.getLocalDevices(kind, false)).map((d) => d.deviceId),
        );
        const preferred = settings[key] ?? "default";
        const active = room.getActiveDevice(kind) ?? "default";

        if (available.has(preferred)) {
          if (active !== preferred) {
            await room.switchActiveDevice(kind, preferred);
          }
        } else if (!available.has(active)) {
          await room.switchActiveDevice(kind, "default");
        }
      }
    } catch (error) {
      console.warn("[ferret] couldn't switch audio device", error);
    } finally {
      syncing = false;
    }
  };

  room.on(RoomEvent.MediaDevicesChanged, sync);
}
