import { createAdminClient } from "@/lib/supabase/admin";
import type { Atleta } from "@/lib/types";

export async function getAtletaByToken(token: string): Promise<Atleta | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("atletas")
    .select("*")
    .eq("access_token", token)
    .eq("ativo", true)
    .single();

  return data as Atleta | null;
}
