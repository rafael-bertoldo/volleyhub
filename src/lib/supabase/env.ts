function missingEnvMessage(vars: string[]) {
  return (
    `Variável de ambiente do Supabase ausente. Defina uma destas no .env.local: ${vars.join(" ou ")}. ` +
    `Encontre as chaves em: Supabase Dashboard → Settings → API Keys.`
  );
}

export function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error(missingEnvMessage(["NEXT_PUBLIC_SUPABASE_URL"]));
  }
  return url;
}

/** Chave pública (cliente). Novo formato: sb_publishable_... | Legado: anon key */
export function getSupabasePublishableKey(): string {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!key) {
    throw new Error(
      missingEnvMessage([
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      ]),
    );
  }
  return key;
}

/** Chave secreta (servidor). Novo formato: sb_secret_... | Legado: service_role key */
export function getSupabaseSecretKey(): string {
  const key =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!key) {
    throw new Error(
      missingEnvMessage(["SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY"]),
    );
  }
  return key;
}
