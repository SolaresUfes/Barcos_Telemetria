export function formatarData(iso: string | null | undefined): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("pt-BR");
}

export function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function gerarNomeDoEmail(email: string): string {
  return email
    .split("@")[0]
    .split(".")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

export function avatarPorEmail(email: string): string {
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`;
}

/** plural(1, "bom", "bons") → "1 bom" · plural(2, "bom", "bons") → "2 bons" */
export function plural(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}
