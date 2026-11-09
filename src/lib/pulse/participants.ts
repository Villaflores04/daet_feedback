import type { Pulse } from "@/lib/pulse/types";

/** "Visitor" (the default) is shared by everyone, so it cannot identify a person. */
function realName(p: Pulse) {
  const name = (p.callsign || "").trim().toLowerCase();
  return name && name !== "visitor" ? name : undefined;
}

/**
 * True when a reply was written by the same person as the story. New feedback carries an anonymous device id; older feedback has
 * none, so the nickname is used instead (a reply that only says "Visitor" cannot be matched and is not marked).
 */
export function isAuthorReply(root: Pulse, reply: Pulse) {
  if (!reply.parentId) return false;
  if (root.authorKey && reply.authorKey) return root.authorKey === reply.authorKey;
  const name = realName(root);
  return !!name && name === realName(reply);
}
