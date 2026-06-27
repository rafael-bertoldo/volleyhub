export const dynamic = "force-dynamic";

import { createAdminClient } from "@/lib/supabase/admin";
import { AnnouncementForm } from "../../anuncio-form";
import { AnnouncementsList } from "../../announcements-list";
import type { Announcement } from "@/lib/types";

export default async function AnnouncementsPage() {
  const supabase = createAdminClient();
  const { data: announcements } = await supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Anúncios</h1>
        <p className="text-sm text-gray-500 mt-1">
          Publica no feed dos atletas e copie para o WhatsApp.
        </p>
      </div>

      <section className="card">
        <h2 className="section-title">Novo anúncio</h2>
        <AnnouncementForm />
      </section>

      <section className="card">
        <h2 className="section-title">Publicados</h2>
        <AnnouncementsList announcements={(announcements ?? []) as Announcement[]} />
      </section>
    </div>
  );
}
