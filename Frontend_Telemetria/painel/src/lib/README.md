# `lib/` — integrações externas

| Arquivo | O que faz |
|---|---|
| `supabase.ts` | Cria o cliente do Supabase usado em todo o app (login, banco e tempo real). Lê `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` do arquivo `.env.local` |

Importe sempre o `supabase` deste arquivo em vez de criar outro cliente. Use somente a chave **anon**: variáveis `VITE_*` vão para o navegador.
