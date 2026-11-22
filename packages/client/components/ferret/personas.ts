import type { API, Channel } from "stoat.js";

import type { FerretPersona } from "./bridge";
import { updateFerretSettings, useFerretSettings } from "./settings";

/**
 * Personas: post with another name (and picture) using Stoat's own
 * masquerade, where the server allows it. Picked per channel.
 */

const settings = useFerretSettings();

/** Same limit as the desktop app keeps */
export const MAX_PERSONAS = 20;

export const personas = () => settings()?.personas ?? [];

/** The persona picked for this channel, if any */
export function personaFor(channelId: string): FerretPersona | undefined {
  const id = settings()?.personaByChannel?.[channelId];
  return id ? personas().find((persona) => persona.id === id) : undefined;
}

/** Whether you may post as a persona in this channel */
export const canMasquerade = (channel: Channel) =>
  !!window.ferret && channel.havePermission("Masquerade");

/** The masquerade to send with a message in this channel, if any */
export function masqueradeFor(
  channel: Channel,
): API.DataMessageSend["masquerade"] | undefined {
  if (!canMasquerade(channel)) return undefined;
  const persona = personaFor(channel.id);
  if (!persona) return undefined;
  return {
    name: persona.name,
    ...(persona.avatar ? { avatar: persona.avatar } : {}),
    // a name colour needs Manage Roles on Stoat
    ...(persona.colour && channel.havePermission("ManageRole")
      ? { colour: persona.colour }
      : {}),
  };
}

export const pickPersona = (channelId: string, personaId: string | null) =>
  updateFerretSettings({ personaByChannel: { [channelId]: personaId } });

export const savePersonas = (list: FerretPersona[]) =>
  updateFerretSettings({ personas: list });

export const newPersonaId = () =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
