export const dynamic = "force-dynamic";

import { getAdminUser } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { APP_NAME } from "@/lib/constants";
import { AppShell } from "@/components/layout/app-shell";
import { IconCalendar, IconFeed, IconLink, IconTrophy, IconUsers } from "@/components/layout/icons";
import { LogoutButton } from "../logout-button";

interface LayoutProps {
  children: React.ReactNode;
}

export default async function AdminDashboardLayout({ children }: LayoutProps) {
  const admin = await getAdminUser();
  const supabase = createAdminClient();

  const { data: players } = await supabase.from("players").select("membership_type, membership_status");

  const pending = (players ?? []).filter(
    (a) => a.membership_type !== "A" && a.membership_status === "pending",
  ).length;

  return (
    <AppShell
      brand={APP_NAME}
      subtitle={admin?.email ?? "Administração"}
      headerActions={<LogoutButton />}
      navItems={[
        { href: "/admin/announcements", label: "Anúncios", icon: <IconFeed className="w-5 h-5" /> },
        {
          href: "/admin/trainings",
          label: "Treinos",
          icon: <IconCalendar className="w-5 h-5" />,
        },
        {
          href: "/admin/games",
          label: "Jogos",
          icon: <IconTrophy className="w-5 h-5" />,
        },
        {
          href: "/admin/players",
          label: "Atletas",
          icon: <IconUsers className="w-5 h-5" />,
          badge: pending || undefined,
        },
        { href: "/admin/invites", label: "Convites", icon: <IconLink className="w-5 h-5" /> },
      ]}
    >
      {children}
    </AppShell>
  );
}
