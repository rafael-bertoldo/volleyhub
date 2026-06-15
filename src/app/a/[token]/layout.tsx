import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { IconCalendar, IconFeed, IconTrophy, IconUser } from "@/components/layout/icons";
import { APP_NAME } from "@/lib/constants";
import { getAtletaByToken } from "@/lib/atleta-server";
import { countJogosAceitosAtleta } from "@/lib/jogos-server";
import { AtletaNavSync } from "./atleta-nav-sync";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ token: string }>;
}

export default async function AtletaLayout({ children, params }: LayoutProps) {
  const { token } = await params;
  const atleta = await getAtletaByToken(token);

  if (!atleta) {
    notFound();
  }

  const base = `/a/${token}`;
  const primeiroNome = atleta.nome.split(" ")[0];
  const jogosAceitos = await countJogosAceitosAtleta(atleta.id);

  const navItems = [
    { href: base, label: "Feed", icon: <IconFeed /> },
    { href: `${base}/treinos`, label: "Treinos", icon: <IconCalendar /> },
    ...(jogosAceitos > 0
      ? [{ href: `${base}/jogos`, label: "Jogos", icon: <IconTrophy /> }]
      : []),
    { href: `${base}/perfil`, label: "Perfil", icon: <IconUser /> },
  ];

  return (
    <>
      <AtletaNavSync atletaId={atleta.id} />
      <AppShell
        brand={APP_NAME}
        subtitle={`Olá, ${primeiroNome}!`}
        navItems={navItems}
      >
        {children}
      </AppShell>
    </>
  );
}
