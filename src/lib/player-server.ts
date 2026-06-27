import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Player } from "@/lib/types";

export async function getCurrentPlayer(): Promise<Player | null> {
  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) return null;

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("players")
    .select("*")
    .eq("auth_user_id", user.id)
    .eq("active", true)
    .single();

  return data as Player | null;
}
