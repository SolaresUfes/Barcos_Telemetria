-- =====================================================================
--     Novidades:
--       - componentes: descrição completa, datasheet, imagem, tipos extras (ex: "Básico"),
--         características padrão e contagem de unidades duvidosas/ruins
--       - unidades: unidades específicas de um componente (estado + características próprias)
--       - emprestimos: solicitações, empréstimos e histórico
--       - melhores_precos: onde cada componente já foi comprado mais barato
--       - storage: bucket público "componentes" para as imagens
-- =====================================================================


-- =====================================================================
--     COMPONENTES: novas colunas
-- =====================================================================
alter table public.componentes add column if not exists descricao_completa text;
alter table public.componentes add column if not exists datasheet_url text;
alter table public.componentes add column if not exists imagem_url text;
-- Outros tipos além do principal (ex: um LED que também é "Básico")
alter table public.componentes add column if not exists outros_tipos text[] not null default '{}';
-- Características padrão: lista de {"chave": "Conector", "valor": "USB-C"}
alter table public.componentes add column if not exists caracteristicas jsonb not null default '[]'::jsonb;
-- Das unidades PADRÃO (as que não têm linha própria em "unidades"), quantas estão duvidosas / ruins.
-- As boas são calculadas: padrão - duvidosas - ruins.
alter table public.componentes add column if not exists qtd_duvidoso integer not null default 0 check (qtd_duvidoso >= 0);
alter table public.componentes add column if not exists qtd_ruim integer not null default 0 check (qtd_ruim >= 0);


-- =====================================================================
--     UNIDADES ESPECÍFICAS
--     Unidades padrão = componentes.quantidade - (quantas linhas existem aqui)
-- =====================================================================
create table if not exists public.unidades (
  id bigint generated always as identity primary key,
  componente_id bigint not null references public.componentes(id) on delete cascade,
  rotulo text not null,                                  -- ex: "#1", número de série...
  estado text not null default 'bom',                    -- 'bom' | 'duvidoso' | 'ruim'
  caracteristicas jsonb not null default '[]'::jsonb,    -- [{"chave": "...", "valor": "..."}]
  observacao text,
  created_at timestamptz not null default now()
);
create index if not exists unidades_componente_idx on public.unidades(componente_id);


-- =====================================================================
--     EMPRÉSTIMOS
-- =====================================================================
create table if not exists public.emprestimos (
  id bigint generated always as identity primary key,
  componente_id bigint references public.componentes(id) on delete set null,
  componente_nome text not null,
  quantidade integer not null default 1 check (quantidade > 0),
  unidade_ids bigint[] not null default '{}',            -- unidades específicas emprestadas (se houver)
  pessoa_nome text not null,                             -- quem está com o item / quem quer pegar
  solicitante_nome text,                                 -- quem registrou o pedido
  solicitante_email text,
  observacao text,
  status text not null default 'solicitado',             -- 'solicitado' | 'emprestado' | 'devolvido' | 'recusado'
  previsao_devolucao date,
  emprestado_em timestamptz,
  devolvido_em timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists emprestimos_componente_idx on public.emprestimos(componente_id);


-- =====================================================================
--     MELHORES PREÇOS (onde já comprou mais barato)
-- =====================================================================
create table if not exists public.melhores_precos (
  id bigint generated always as identity primary key,
  componente_nome text not null,
  loja text not null,
  preco_unitario numeric(12,2) not null default 0,
  link text,
  data_compra date,
  observacao text,
  autor_nome text,
  created_at timestamptz not null default now()
);


-- =====================================================================
--     PERMISSÕES (RLS)
-- =====================================================================
alter table public.unidades        enable row level security;
alter table public.emprestimos     enable row level security;
alter table public.melhores_precos enable row level security;

-- unidades: todos autorizados veem; quem edita (Membro/Moderador) cria, altera e apaga
drop policy if exists "unidades_select" on public.unidades;
drop policy if exists "unidades_insert" on public.unidades;
drop policy if exists "unidades_update" on public.unidades;
drop policy if exists "unidades_delete" on public.unidades;
create policy "unidades_select" on public.unidades
  for select to authenticated using (public.is_autorizado());
create policy "unidades_insert" on public.unidades
  for insert to authenticated with check (public.pode_editar());
create policy "unidades_update" on public.unidades
  for update to authenticated using (public.pode_editar());
create policy "unidades_delete" on public.unidades
  for delete to authenticated using (public.pode_editar());

-- emprestimos: qualquer autorizado (inclusive Trainee) pode PEDIR emprestado em seu próprio nome.
-- Só quem edita registra entrega/devolução diretamente.
drop policy if exists "emprestimos_select" on public.emprestimos;
drop policy if exists "emprestimos_insert" on public.emprestimos;
drop policy if exists "emprestimos_update" on public.emprestimos;
drop policy if exists "emprestimos_delete" on public.emprestimos;
create policy "emprestimos_select" on public.emprestimos
  for select to authenticated using (public.is_autorizado());
create policy "emprestimos_insert" on public.emprestimos
  for insert to authenticated
  with check (
    public.pode_editar()
    or (public.is_autorizado()
        and status = 'solicitado'
        and lower(solicitante_email) = lower(auth.jwt() ->> 'email'))
  );
create policy "emprestimos_update" on public.emprestimos
  for update to authenticated using (public.pode_editar());
-- apagar: moderador, ou o próprio solicitante enquanto o pedido ainda é só uma solicitação (cancelar pedido)
create policy "emprestimos_delete" on public.emprestimos
  for delete to authenticated
  using (
    public.is_moderador()
    or (status = 'solicitado' and lower(solicitante_email) = lower(auth.jwt() ->> 'email'))
  );

-- melhores_precos: mesma regra do orçamento
drop policy if exists "precos_select" on public.melhores_precos;
drop policy if exists "precos_insert" on public.melhores_precos;
drop policy if exists "precos_update" on public.melhores_precos;
drop policy if exists "precos_delete" on public.melhores_precos;
create policy "precos_select" on public.melhores_precos
  for select to authenticated using (public.is_autorizado());
create policy "precos_insert" on public.melhores_precos
  for insert to authenticated with check (public.pode_editar());
create policy "precos_update" on public.melhores_precos
  for update to authenticated using (public.pode_editar());
create policy "precos_delete" on public.melhores_precos
  for delete to authenticated using (public.is_moderador());


-- =====================================================================
--     STORAGE: bucket das imagens dos componentes
--     Público para leitura (a URL da imagem funciona no <img>); só quem edita envia/troca/apaga.
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('componentes', 'componentes', true)
on conflict (id) do nothing;

drop policy if exists "componentes_img_insert" on storage.objects;
drop policy if exists "componentes_img_update" on storage.objects;
drop policy if exists "componentes_img_delete" on storage.objects;
create policy "componentes_img_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'componentes' and public.pode_editar());
create policy "componentes_img_update" on storage.objects
  for update to authenticated using (bucket_id = 'componentes' and public.pode_editar());
create policy "componentes_img_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'componentes' and public.pode_editar());
