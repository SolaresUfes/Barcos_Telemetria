import { supabase } from "../lib/supabase";

const BUCKET = "componentes";
const LADO_MAXIMO = 1000;

/** Reduz a imagem (lado maior ≤ 1000px) e converte para JPEG, para não encher o storage. */
async function reduzir(arquivo: File): Promise<Blob> {
  const bitmap = await createImageBitmap(arquivo);
  const escala = Math.min(1, LADO_MAXIMO / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * escala);
  canvas.height = Math.round(bitmap.height * escala);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Não foi possível processar a imagem.");
  ctx.fillStyle = "#ffffff"; // PNG transparente vira fundo branco
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Falha ao converter a imagem."))), "image/jpeg", 0.85),
  );
}

/** Envia a imagem para o Supabase Storage e devolve a URL pública. */
export async function enviarImagem(arquivo: File): Promise<string> {
  if (!arquivo.type.startsWith("image/")) throw new Error("Escolha um arquivo de imagem.");
  const blob = await reduzir(arquivo);
  const caminho = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const { error } = await supabase.storage.from(BUCKET).upload(caminho, blob, { contentType: "image/jpeg" });
  if (error) throw new Error(error.message);
  return supabase.storage.from(BUCKET).getPublicUrl(caminho).data.publicUrl;
}

/** Apaga do storage uma imagem que foi enviada pelo site (URLs externas são ignoradas). */
export async function apagarImagem(url: string | null | undefined): Promise<void> {
  if (!url) return;
  const marcador = `/object/public/${BUCKET}/`;
  const i = url.indexOf(marcador);
  if (i === -1) return;
  const caminho = decodeURIComponent(url.slice(i + marcador.length).split("?")[0]);
  await supabase.storage.from(BUCKET).remove([caminho]);
}
