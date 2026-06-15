export const dynamic = "force-dynamic";

import { getAdminUser } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { APP_NAME } from "@/lib/constants";
import { AppShell } from "@/components/layout/app-shell";
import { IconFeed, IconLink, IconUsers } from "@/components/layout/icons";
import { LogoutButton } from "../logout-button";

interface LayoutProps {
  children: React.ReactNode;
}

export default async function AdminDashboardLayout({ children }: LayoutProps) {
  const admin = await getAdminUser();
  const supabase = createAdminClient();

  const { data: atletas } = await supabase.from("atletas").select("modalidade, modalidade_status");

  const pendentes = (atletas ?? []).filter(
    (a) => a.modalidade !== "A" && a.modalidade_status === "pendente",
  ).length;

  return (
    <AppShell
      brand={APP_NAME}
      subtitle={admin?.email ?? "Administração"}
      headerActions={<LogoutButton />}
      navItems={[
        { href: "/admin/anuncios", label: "Anúncios", icon: <IconFeed className="w-5 h-5" /> },
        {
          href: "/admin/atletas",
          label: "Atletas",
          icon: <IconUsers className="w-5 h-5" />,
          badge: pendentes || undefined,
        },
        { href: "/admin/convites", label: "Convites", icon: <IconLink className="w-5 h-5" /> },
      ]}
    >
      {children}
    </AppShell>
  );
}
