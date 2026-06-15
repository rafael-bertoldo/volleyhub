import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { IconCalendar, IconFeed, IconUser } from "@/components/layout/icons";
import { APP_NAME } from "@/lib/constants";
import { getAtletaByToken } from "@/lib/atleta-server";

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

  return (
    <AppShell
      brand={APP_NAME}
      subtitle={`Olá, ${primeiroNome}!`}
      navItems={[
        { href: base, label: "Feed", icon: <IconFeed /> },
        { href: `${base}/treinos`, label: "Treinos", icon: <IconCalendar /> },
        { href: `${base}/perfil`, label: "Perfil", icon: <IconUser /> },
      ]}
    >
      {children}
    </AppShell>
  );
}
