import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { IconCalendar, IconFeed, IconTrophy, IconUser } from "@/components/layout/icons";
import { APP_NAME } from "@/lib/constants";
import { getCurrentPlayer } from "@/lib/player-server";
import { countJogosAceitosPlayer } from "@/lib/jogos-server";
import { PlayerNavSync } from "./player-nav-sync";
import { LogoutButton } from "./logout-button";

export default async function PlayerLayout({ children }: { children: React.ReactNode }) {
  const player = await getCurrentPlayer();

  if (!player) {
    redirect("/login");
  }

  const primeiroNome = player.name.split(" ")[0];
  const jogosAceitos = await countJogosAceitosPlayer(player.id);

  const navItems = [
    { href: "/a", label: "Feed", icon: <IconFeed /> },
    { href: "/a/treinos", label: "Treinos", icon: <IconCalendar /> },
    ...(jogosAceitos > 0
      ? [{ href: "/a/jogos", label: "Jogos", icon: <IconTrophy /> }]
      : []),
    { href: "/a/perfil", label: "Perfil", icon: <IconUser /> },
  ];

  return (
    <>
      <PlayerNavSync playerId={player.id} />
      <AppShell
        brand={APP_NAME}
        subtitle={`Olá, ${primeiroNome}!`}
        navItems={navItems}
        headerActions={<LogoutButton />}
      >
        {children}
      </AppShell>
    </>
  );
}
