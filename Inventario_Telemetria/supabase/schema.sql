-- =====================================================================
--     TABELAS
-- =====================================================================

-- Usuários cadastrados no inventario
create table if not exists public.usuarios_autorizados (
  id bigint generated always as identity primary key,
  email text unique not null,
  tipo_acesso text not null default '',      -- '', 'Trainee' ou 'Membro'
  eh_moderador boolean not null default false,
  created_at timestamptz not null default now()
);

-- Componentes cadastrados
create table if not exists public.componentes (
  id bigint generated always as identity primary key,
  nome text not null,
  tipo text not null default 'Outro',
  quantidade integer not null default 0 check (quantidade >= 0),
  quantidade_minima integer not null default 0 check (quantidade_minima >= 0),
  localizacao text,
  descricao text,
  created_at timestamptz not null default now()
);

-- Diário de bordo para anotações ("caderno de registro")
create table if not exists public.diario (
  id bigint generated always as identity primary key,
  titulo text not null,
  texto text not null,
  tipo text not null default 'observacao',   -- 'falha' | 'perda' | 'observacao'
  componente_id bigint references public.componentes(id) on delete set null,
  componente_nome text,
  quantidade_afetada integer not null default 0,
  autor_nome text,
  autor_email text,
  autor_foto text,
  created_at timestamptz not null default now()
);

-- Uma tabela orçamentária pra comprar novos equipamentos
create table if not exists public.orcamentos (
  id bigint generated always as identity primary key,
  nome text not null,
  tipo text not null default 'Outro',
  quantidade integer not null default 1 check (quantidade > 0),
  preco_unitario numeric(12,2) not null default 0,
  fornecedor text,
  link text,
  status text not null default 'pendente',   -- 'pendente' | 'aprovado' | 'comprado' | 'recusado'
  estocado boolean not null default false,   -- já foi dado entrada no estoque?
  solicitante_nome text,
  created_at timestamptz not null default now()
);



-- =====================================================================
--     FUNÇÕES DE PERMISSÃO
-- =====================================================================
-- CONCEITOS
-- jwt: jason web token. É um pacote de informações sobre a sessão do usuário
-- token: dado que um sistema fornece para representar ou comprovar alguma informação
-- security definer: evita recursão infinita nas policies

-- FUNÇÃO VERIFICAÇÃO DE AUTORIZAÇÃO DE USUÁRIO
-- Procura dentro da lista de usuários autorizados se o gmmail da requisição de login está na lista dos que podem acessar o site
-- ao tentar fazer login com o google, o supabase faz a autentificação e fornece um token que representa a sessão do usuário
-- desse token, é olhado qual o gmail dele com auth.jwt() ->> 'email'. O gmmail é deixaido todo em minúsculas com o lower()
-- então da lista de usuários autorizados, selecionamos aqueles que possuem esse email extraido do token
-- caso o gmail não exista na lista, o select exists() retorna FALSE, indicando que o usuário não pertece a equipe
create or replace function public.is_autorizado()
returns boolean           -- a função retorna um tipo booleano
language sql              -- a função é escrita em linguagem sql
security definer          -- a função utiliza as permissões do criador, não de quem chama a função
set search_path = public  -- a função é procurada na origem "public"
stable                    -- a função não deve sofrer alterações por causa de instabilidade do banco de dados
as $$
  select exists (
    select 1 from public.usuarios_autorizados
    where lower(email) = lower(auth.jwt() ->> 'email')
  );
$$;

-- FUNÇÃO DE VERIFICAÇÃO DE STATUS DE MODERADOR DO USUÁRIO
-- Semelhante à função anterior, verifica se email que tentou entrar está cadastrado como autorizado
-- contudo, verifica, além disso, se o usuário é moderador do site
-- tipo, "olha na tabela de gente autorizada, na coluna dos emails quem tem o email x. Depois olha se é moderador também. Se encontrar o email E for moderador, dá TRUE"
create or replace function public.is_moderador()
returns boolean 
language sql 
security definer
set search_path = public 
stable 
as $$
  select exists (
    select 1 from public.usuarios_autorizados
    where lower(email) = lower(auth.jwt() ->> 'email') and eh_moderador
  );
$$;

-- FUNÇÃO PARA VERIFICAÇÃO DE PODER DE EDIÇÃO
-- Mesma coisa dos anteriores também, mas olha se o dono do gmail é autorizado a entrar no site E se ele pode EDTIAR as coisas
-- em coalesce(tipo_acesso, ''), isso retorna o valor do tipo_acesso se houver valor válido ou ou vazio, '', se for NULL
create or replace function public.pode_editar()
returns boolean 
language sql 
security definer 
set search_path = public 
stable 
as $$
  select exists (
    select 1 from public.usuarios_autorizados
    where lower(email) = lower(auth.jwt() ->> 'email')
      and (eh_moderador or coalesce(tipo_acesso, '') not in ('', 'Trainee')) -- nessa parte, ele olha se o membro é moderador ou se ele não é trainee
  );
$$;



-- =====================================================================
--     POLICYS & SECURITY
-- =====================================================================
-- CONCEITOS
-- policy: é uma regra de segurança que o PostgreSQL aplica quando alguém tenta acessar ou alterar os dados de uma tabela. Podemos escolher quais regras queremos usar pra cada caso
-- row level security: é um mecanismo que permite controlar quais linhas uma pessoa pode acessar ou modificar, de acordo com as policies configuradas.

-- Habilitação de usar o rls nas seguintes tabelas:
alter table public.usuarios_autorizados enable row level security;
alter table public.componentes          enable row level security;
alter table public.diario               enable row level security;
alter table public.orcamentos           enable row level security;


-- usuarios_autorizados: cada um enxerga a própria linha (necessário no login);
-- quem já é autorizado enxerga a equipe toda; só moderador altera.

-- Cria uma policy chamada "usuarios_select" em que apenas moderadores podem alterar a tabela de usuários cadastrados
create policy "usuarios_select" on public.usuarios_autorizados
  for select to authenticated
  using (lower(email) = lower(auth.jwt() ->> 'email') or public.is_autorizado());
create policy "usuarios_insert" on public.usuarios_autorizados
  for insert to authenticated with check (public.is_moderador());
create policy "usuarios_update" on public.usuarios_autorizados
  for update to authenticated using (public.is_moderador());
create policy "usuarios_delete" on public.usuarios_autorizados
  for delete to authenticated using (public.is_moderador());

-- Cria uma policy chamada "componentes_select" em que apenas usuários autenticados podem alterar a tabela de componentes
create policy "componentes_select" on public.componentes
  for select to authenticated using (public.is_autorizado());
create policy "componentes_insert" on public.componentes
  for insert to authenticated with check (public.pode_editar());
create policy "componentes_update" on public.componentes
  for update to authenticated using (public.pode_editar());
create policy "componentes_delete" on public.componentes
  for delete to authenticated using (public.is_moderador());

-- Cria uma policy chamada "diario_select" em que apenas usuários autenticados podem alterar a tabela que guarda as anotações
create policy "diario_select" on public.diario
  for select to authenticated using (public.is_autorizado());
create policy "diario_insert" on public.diario
  for insert to authenticated with check (public.pode_editar());
create policy "diario_delete" on public.diario
  for delete to authenticated
  using (public.is_moderador() or lower(autor_email) = lower(auth.jwt() ->> 'email'));

-- Cria uma policy chamada "orcamentos_select" em que apenas usuários autenticados podem alterar a tabela orçamentária
create policy "orcamentos_select" on public.orcamentos
  for select to authenticated using (public.is_autorizado());
create policy "orcamentos_insert" on public.orcamentos
  for insert to authenticated with check (public.pode_editar());
create policy "orcamentos_update" on public.orcamentos
  for update to authenticated using (public.pode_editar());
create policy "orcamentos_delete" on public.orcamentos
  for delete to authenticated using (public.is_moderador());



-- =====================================================================
--     INCLUINDO PRIMEIRO MODERADOR
-- =====================================================================
-- eu, lógico
insert into public.usuarios_autorizados (email, tipo_acesso, eh_moderador)
values ('myufdrive7@gmail.com', 'Membro', true)
on conflict (email) do nothing;
