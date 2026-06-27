import type { Player } from "./types";

export function formatPlayerName(player: Pick<Player, "name" | "nickname">) {
  const nickname = player.nickname?.trim();
  return nickname ? `${player.name} (${nickname})` : player.name;
}
