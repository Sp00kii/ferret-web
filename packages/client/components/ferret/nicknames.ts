import { Message, ServerMember, User } from "stoat.js";

import { useFerretSettings } from "./settings";

/**
 * Private nicknames: a name you pick for someone, shown instead of theirs
 * everywhere in Ferret (messages, member lists, DMs, friends). Only you see
 * it; nothing is sent to Stoat.
 */

const settings = useFerretSettings();

/** Your nickname for this person, if you set one */
export const nicknameFor = (userId: string | undefined) =>
  userId ? settings()?.nicknames?.[userId] : undefined;

/** Wrap a getter so a nickname comes first */
function override<T extends object>(
  target: T,
  key: string,
  pick: (self: T, original: () => unknown) => unknown,
) {
  const descriptor = Object.getOwnPropertyDescriptor(target, key);
  const get = descriptor?.get;
  if (!get) return;
  Object.defineProperty(target, key, {
    ...descriptor,
    get(this: T) {
      return pick(this, () => get.call(this));
    },
  });
}

let installed = false;

export function installNicknames() {
  if (installed || !window.ferret) return;
  installed = true;

  override(
    User.prototype,
    "displayName",
    (user, original) => nicknameFor(user.id) ?? original(),
  );
  // in servers too, over their server nickname (like Discord)
  override(
    ServerMember.prototype,
    "displayName",
    (member, original) => nicknameFor(member.id.user) ?? original(),
  );
  // message author names, except masquerades and webhooks (not the person)
  override(Message.prototype, "username", (message, original) =>
    message.masquerade?.name || message.webhook
      ? original()
      : (nicknameFor(message.authorId) ?? original()),
  );
}
