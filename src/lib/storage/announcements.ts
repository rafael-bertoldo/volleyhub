import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "announcements";
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function uploadAnnouncementImage(file: File): Promise<string> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Formato inválido. Use JPG, PNG, WebP ou GIF.");
  }

  if (file.size > MAX_BYTES) {
    throw new Error("Imagem muito grande. Máximo: 5 MB.");
  }

  const ext = EXT_BY_TYPE[file.type] ?? "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const supabase = createAdminClient();
  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: file.type,
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    console.error("Erro no upload:", error);
    throw new Error("Falha ao enviar imagem. Verifique se o bucket 'announcements' existe no Supabase.");
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
