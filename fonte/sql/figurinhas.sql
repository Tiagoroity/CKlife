-- =====================================================================
-- CK Life · FIGURINHAS: catálogo único (Stories, chat, comentários, comunidade, reações)
-- Só ADICIONA. Pode rodar mais de uma vez.
-- =====================================================================
create table if not exists public.figurinhas_catalogo (
  id text primary key check (id ~ '^[a-z0-9-]{2,60}$'),
  nome text not null check (char_length(nome) between 1 and 80),
  categoria text not null,
  tags text[] not null default '{}',
  arquivo text not null,
  mini text,
  ativa boolean not null default true,
  destaque boolean not null default false,
  ordem int not null default 1000,
  em_stories boolean not null default true,
  em_chat boolean not null default true,
  em_comentarios boolean not null default true,
  em_comunidade boolean not null default true,
  em_reacoes boolean not null default false,
  criado timestamptz not null default now(),
  atualizado timestamptz not null default now()
);
create index if not exists figcat_ordem_idx on public.figurinhas_catalogo (ordem);
alter table public.figurinhas_catalogo enable row level security;
drop policy if exists fc_ler on public.figurinhas_catalogo;
create policy fc_ler on public.figurinhas_catalogo for select using (ativa or admin_ve('figurinhas'));
drop policy if exists fc_criar on public.figurinhas_catalogo;
create policy fc_criar on public.figurinhas_catalogo for insert to authenticated with check (admin_pode('figurinhas'));
drop policy if exists fc_mudar on public.figurinhas_catalogo;
create policy fc_mudar on public.figurinhas_catalogo for update to authenticated using (admin_pode('figurinhas')) with check (admin_pode('figurinhas'));
create or replace function public.figcat_atualizado() returns trigger language plpgsql as $$ begin new.atualizado := now(); return new; end $$;
drop trigger if exists figcat_atualizado on public.figurinhas_catalogo;
create trigger figcat_atualizado before update on public.figurinhas_catalogo for each row execute function public.figcat_atualizado();

-- uso (só contagem por dia e lugar; nunca quem usou nem o texto da conversa)
create table if not exists public.figurinha_uso (
  figurinha_id text not null,
  onde text not null check (onde in ('story','chat','comentario','comunidade','reacao')),
  dia date not null default current_date,
  n int not null default 0,
  primary key (figurinha_id, onde, dia)
);
alter table public.figurinha_uso enable row level security;
drop policy if exists fu_ler on public.figurinha_uso;
create policy fu_ler on public.figurinha_uso for select to authenticated using (admin_ve('figurinhas'));
create or replace function public.registra_figurinha(p_id text, p_onde text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or p_onde not in ('story','chat','comentario','comunidade','reacao') or not exists (select 1 from figurinhas_catalogo where id = p_id) then return; end if;
  insert into figurinha_uso (figurinha_id, onde, n) values (p_id, p_onde, 1) on conflict (figurinha_id, onde, dia) do update set n = figurinha_uso.n + 1;
end $$;
grant execute on function public.registra_figurinha(text, text) to authenticated;

-- figurinha em comentários e publicações (o arquivo é público do catálogo; nada privado)
alter table public.comentarios add column if not exists figurinha text;
alter table public.posts add column if not exists figurinha text;
alter table public.comentarios drop constraint if exists comentarios_texto_check;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'comentarios_texto_ok') then
    alter table public.comentarios add constraint comentarios_texto_ok check (char_length(texto) <= 500 and (char_length(texto) >= 1 or figurinha is not null));
  end if;
end $$;

-- as 100 figurinhas oficiais (cartelas CK LIFE STICKERS — PACK 1 a 5)
insert into public.figurinhas_catalogo (id, nome, categoria, tags, arquivo, mini, destaque, ordem, em_reacoes) values
('hoje-no-meu-ritmo','Hoje no meu ritmo','autocuidado',array['ciclo','acolhimento']::text[],'img/figurinhas/app/ck-autocuidado-001.webp','img/figurinhas/mini/ck-autocuidado-001.webp',false,10,false),
('tudo-bem-desacelerar','Tudo bem desacelerar','autocuidado',array['ciclo','acolhimento']::text[],'img/figurinhas/app/ck-autocuidado-002.webp','img/figurinhas/mini/ck-autocuidado-002.webp',false,20,false),
('dia-de-me-acolher','Dia de me acolher','autocuidado',array['ciclo','acolhimento']::text[],'img/figurinhas/app/ck-autocuidado-003.webp','img/figurinhas/mini/ck-autocuidado-003.webp',false,30,false),
('respeitando-meu-corpo','Respeitando meu corpo','autocuidado',array['ciclo']::text[],'img/figurinhas/app/ck-autocuidado-004.webp','img/figurinhas/mini/ck-autocuidado-004.webp',false,40,false),
('meu-ritmo-importa','Meu ritmo importa','autocuidado',array['ciclo']::text[],'img/figurinhas/app/ck-autocuidado-005.webp','img/figurinhas/mini/ck-autocuidado-005.webp',false,50,false),
('autocuidado-primeiro','Autocuidado primeiro','autocuidado',array[]::text[],'img/figurinhas/app/ck-autocuidado-006.webp','img/figurinhas/mini/ck-autocuidado-006.webp',false,60,false),
('sem-culpa-com-amor','Sem culpa, com amor','autocuidado',array['ciclo','acolhimento']::text[],'img/figurinhas/app/ck-autocuidado-007.webp','img/figurinhas/mini/ck-autocuidado-007.webp',false,70,false),
('treino-leve-coracao-em-paz','Treino leve, coração em paz','autocuidado',array['treino','ciclo']::text[],'img/figurinhas/app/ck-autocuidado-008.webp','img/figurinhas/mini/ck-autocuidado-008.webp',false,80,false),
('corpo-pedindo-carinho','Corpo pedindo carinho','ciclo',array['autocuidado','acolhimento']::text[],'img/figurinhas/app/ck-ciclo-001.webp','img/figurinhas/mini/ck-ciclo-001.webp',false,90,false),
('to-de-boas-hoje','Tô de boas hoje','ciclo',array['humor','reacoes']::text[],'img/figurinhas/app/ck-ciclo-002.webp','img/figurinhas/mini/ck-ciclo-002.webp',false,100,false),
('sua-vida-seu-corpo','Sua vida. Seu corpo.','ck',array['autocuidado']::text[],'img/figurinhas/app/ck-ck-001.webp','img/figurinhas/mini/ck-ck-001.webp',false,110,false),
('seu-ritmo-sua-evolucao','Seu ritmo. Sua evolução.','ck',array['constancia']::text[],'img/figurinhas/app/ck-ck-002.webp','img/figurinhas/mini/ck-ck-002.webp',false,120,false),
('crie-sua-jornada','Crie sua jornada','ck',array['motivacao']::text[],'img/figurinhas/app/ck-ck-003.webp','img/figurinhas/mini/ck-ck-003.webp',false,130,false),
('construa-constancia','Construa constância','constancia',array['motivacao']::text[],'img/figurinhas/app/ck-constancia-001.webp','img/figurinhas/mini/ck-constancia-001.webp',false,140,false),
('viva-sua-evolucao','Viva sua evolução','ck',array['motivacao']::text[],'img/figurinhas/app/ck-ck-004.webp','img/figurinhas/mini/ck-ck-004.webp',false,150,false),
('ck-life-vibes','CK Life vibes','ck',array[]::text[],'img/figurinhas/app/ck-ck-005.webp','img/figurinhas/mini/ck-ck-005.webp',false,160,false),
('wellness-mood','Wellness mood','autocuidado',array['ciclo']::text[],'img/figurinhas/app/ck-autocuidado-009.webp','img/figurinhas/mini/ck-autocuidado-009.webp',false,170,false),
('energia-de-recomeco','Energia de recomeço','motivacao',array['ciclo']::text[],'img/figurinhas/app/ck-motivacao-001.webp','img/figurinhas/mini/ck-motivacao-001.webp',false,180,false),
('leveza-tambem-e-forca','Leveza também é força','autocuidado',array['motivacao','ciclo']::text[],'img/figurinhas/app/ck-autocuidado-010.webp','img/figurinhas/mini/ck-autocuidado-010.webp',false,190,false),
('voce-ta-florescendo','Você tá florescendo','autocuidado',array['comunidade','apoio']::text[],'img/figurinhas/app/ck-autocuidado-011.webp','img/figurinhas/mini/ck-autocuidado-011.webp',false,200,false),
('concluido','Concluído','treino',array['conquistas','pos-treino']::text[],'img/figurinhas/app/ck-treino-001.webp','img/figurinhas/mini/ck-treino-001.webp',false,210,false),
('meta-do-dia-feita','Meta do dia feita','conquistas',array['pos-treino']::text[],'img/figurinhas/app/ck-conquistas-001.webp','img/figurinhas/mini/ck-conquistas-001.webp',false,220,false),
('mais-um-check','Mais um check','treino',array['constancia','pos-treino']::text[],'img/figurinhas/app/ck-treino-002.webp','img/figurinhas/mini/ck-treino-002.webp',false,230,false),
('hoje-eu-venci','Hoje eu venci','conquistas',array['pos-treino']::text[],'img/figurinhas/app/ck-conquistas-002.webp','img/figurinhas/mini/ck-conquistas-002.webp',false,240,false),
('constancia-on','Constância on','constancia',array['pos-treino']::text[],'img/figurinhas/app/ck-constancia-002.webp','img/figurinhas/mini/ck-constancia-002.webp',false,250,false),
('missao-cumprida','Missão cumprida','conquistas',array['pos-treino']::text[],'img/figurinhas/app/ck-conquistas-003.webp','img/figurinhas/mini/ck-conquistas-003.webp',false,260,false),
('voce-apareceu-por-voce','Você apareceu por você','constancia',array['motivacao','pos-treino']::text[],'img/figurinhas/app/ck-constancia-003.webp','img/figurinhas/mini/ck-constancia-003.webp',true,270,false),
('mais-um-passo','Mais um passo','treino',array['constancia']::text[],'img/figurinhas/app/ck-treino-003.webp','img/figurinhas/mini/ck-treino-003.webp',false,280,false),
('7-dias-de-constancia','7 dias de constância','conquistas',array['constancia','dado:sequencia:7']::text[],'img/figurinhas/app/ck-conquistas-004.webp','img/figurinhas/mini/ck-conquistas-004.webp',false,290,false),
('keep-going','KEEP GOING','motivacao',array['ck','pos-treino']::text[],'img/figurinhas/app/ck-motivacao-002.webp','img/figurinhas/mini/ck-motivacao-002.webp',false,300,false),
('30-dias','30 dias!','conquistas',array['constancia','dado:sequencia:30']::text[],'img/figurinhas/app/ck-conquistas-005.webp','img/figurinhas/mini/ck-conquistas-005.webp',false,310,false),
('constancia-construida','Constância construída','constancia',array['conquistas']::text[],'img/figurinhas/app/ck-constancia-004.webp','img/figurinhas/mini/ck-constancia-004.webp',false,320,false),
('progresso-salvo','Progresso salvo','conquistas',array['pos-treino']::text[],'img/figurinhas/app/ck-conquistas-006.webp','img/figurinhas/mini/ck-conquistas-006.webp',false,330,false),
('streak-ativada','Streak ativada','constancia',array['dado:sequencia:2']::text[],'img/figurinhas/app/ck-constancia-005.webp','img/figurinhas/mini/ck-constancia-005.webp',false,340,false),
('nova-meta-criada','Nova meta criada','conquistas',array['motivacao']::text[],'img/figurinhas/app/ck-conquistas-007.webp','img/figurinhas/mini/ck-conquistas-007.webp',false,350,false),
('bora-pra-proxima','Bora pra próxima','treino',array['motivacao']::text[],'img/figurinhas/app/ck-treino-004.webp','img/figurinhas/mini/ck-treino-004.webp',false,360,false),
('evolucao-real','Evolução real','conquistas',array['constancia']::text[],'img/figurinhas/app/ck-conquistas-008.webp','img/figurinhas/mini/ck-conquistas-008.webp',false,370,false),
('ck-conquista','CK conquista','ck',array['conquistas','pos-treino']::text[],'img/figurinhas/app/ck-ck-006.webp','img/figurinhas/mini/ck-ck-006.webp',false,380,false),
('treino-concluido','Treino concluído','treino',array['conquistas','pos-treino']::text[],'img/figurinhas/app/ck-treino-005.webp','img/figurinhas/mini/ck-treino-005.webp',true,390,false),
('create-keep-live','Create. Keep. Live.','ck',array['pos-treino']::text[],'img/figurinhas/app/ck-ck-007.webp','img/figurinhas/mini/ck-ck-007.webp',true,400,false),
('to-feliz','Tô feliz','reacoes',array['humor']::text[],'img/figurinhas/app/ck-reacoes-001.webp','img/figurinhas/mini/ck-reacoes-001.webp',false,410,false),
('orgulho-de-mim','Orgulho de mim','conquistas',array['reacoes']::text[],'img/figurinhas/app/ck-conquistas-009.webp','img/figurinhas/mini/ck-conquistas-009.webp',false,420,false),
('to-cansada','Tô cansada','humor',array['reacoes','ciclo']::text[],'img/figurinhas/app/ck-humor-001.webp','img/figurinhas/mini/ck-humor-001.webp',false,430,false),
('respira-e-vai','Respira e vai','motivacao',array['apoio']::text[],'img/figurinhas/app/ck-motivacao-003.webp','img/figurinhas/mini/ck-motivacao-003.webp',false,440,false),
('ai-amiga','Ai amiga','reacoes',array['humor','chat']::text[],'img/figurinhas/app/ck-reacoes-002.webp','img/figurinhas/mini/ck-reacoes-002.webp',false,450,false),
('amei','Amei!','reacoes',array[]::text[],'img/figurinhas/app/ck-reacoes-003.webp','img/figurinhas/mini/ck-reacoes-003.webp',true,460,true),
('que-tudooo','Que tudooo','reacoes',array[]::text[],'img/figurinhas/app/ck-reacoes-004.webp','img/figurinhas/mini/ck-reacoes-004.webp',false,470,true),
('partiu','Partiu','treino',array['reacoes','chat']::text[],'img/figurinhas/app/ck-treino-006.webp','img/figurinhas/mini/ck-treino-006.webp',false,480,false),
('voce-nao-ta-sozinha','Você não tá sozinha','comunidade',array['apoio','acolhimento']::text[],'img/figurinhas/app/ck-comunidade-001.webp','img/figurinhas/mini/ck-comunidade-001.webp',false,490,false),
('to-com-voce','Tô com você','comunidade',array['apoio']::text[],'img/figurinhas/app/ck-comunidade-002.webp','img/figurinhas/mini/ck-comunidade-002.webp',false,500,true),
('bora-juntas','Bora juntas','comunidade',array['apoio']::text[],'img/figurinhas/app/ck-comunidade-003.webp','img/figurinhas/mini/ck-comunidade-003.webp',true,510,true),
('orgulho-de-voce','Orgulho de você','comunidade',array['apoio','reacoes']::text[],'img/figurinhas/app/ck-comunidade-004.webp','img/figurinhas/mini/ck-comunidade-004.webp',true,520,true),
('uma-puxa-a-outra','Uma puxa a outra','comunidade',array['apoio']::text[],'img/figurinhas/app/ck-comunidade-005.webp','img/figurinhas/mini/ck-comunidade-005.webp',false,530,false),
('seguimos-juntas','Seguimos juntas','comunidade',array['apoio']::text[],'img/figurinhas/app/ck-comunidade-006.webp','img/figurinhas/mini/ck-comunidade-006.webp',false,540,false),
('voce-inspira','Você inspira','comunidade',array['apoio','reacoes']::text[],'img/figurinhas/app/ck-comunidade-007.webp','img/figurinhas/mini/ck-comunidade-007.webp',false,550,true),
('isso-ai-mulher','Isso aí, mulher!','reacoes',array['apoio']::text[],'img/figurinhas/app/ck-reacoes-005.webp','img/figurinhas/mini/ck-reacoes-005.webp',false,560,true),
('bom-diaaa','Bom diaaa','reacoes',array['chat']::text[],'img/figurinhas/app/ck-reacoes-006.webp','img/figurinhas/mini/ck-reacoes-006.webp',false,570,false),
('socorro-amiga','Socorro! amiga','humor',array['chat']::text[],'img/figurinhas/app/ck-humor-002.webp','img/figurinhas/mini/ck-humor-002.webp',false,580,false),
('me-chama','Me chama','comunidade',array['chat']::text[],'img/figurinhas/app/ck-comunidade-008.webp','img/figurinhas/mini/ck-comunidade-008.webp',false,590,false),
('bora','Bora?','comunidade',array['treino','chat']::text[],'img/figurinhas/app/ck-comunidade-009.webp','img/figurinhas/mini/ck-comunidade-009.webp',false,600,false),
('treinei-por-milagre','Treinei por milagre','humor',array['treino','pos-treino']::text[],'img/figurinhas/app/ck-humor-003.webp','img/figurinhas/mini/ck-humor-003.webp',false,610,false),
('quase-desisti-mas-fui','Quase desisti, mas fui','humor',array['treino','pos-treino']::text[],'img/figurinhas/app/ck-humor-004.webp','img/figurinhas/mini/ck-humor-004.webp',false,620,false),
('fingindo-equilibrio-emocional','Fingindo equilíbrio emocional','humor',array[]::text[],'img/figurinhas/app/ck-humor-005.webp','img/figurinhas/mini/ck-humor-005.webp',false,630,false),
('treinei-e-agora-posso-reclamar','Treinei e agora posso reclamar','humor',array['treino','pos-treino']::text[],'img/figurinhas/app/ck-humor-006.webp','img/figurinhas/mini/ck-humor-006.webp',false,640,false),
('modo-sofrida-fitness','Modo sofrida fitness','humor',array['treino']::text[],'img/figurinhas/app/ck-humor-007.webp','img/figurinhas/mini/ck-humor-007.webp',false,650,false),
('hoje-foi-na-forca-do-odio','Hoje foi na força do ódio','humor',array['treino','pos-treino']::text[],'img/figurinhas/app/ck-humor-008.webp','img/figurinhas/mini/ck-humor-008.webp',false,660,false),
('a-diva-venceu','A diva venceu','humor',array['conquistas']::text[],'img/figurinhas/app/ck-humor-009.webp','img/figurinhas/mini/ck-humor-009.webp',false,670,false),
('morri-mas-passo-bem','Morri, mas passo bem','humor',array['treino','pos-treino']::text[],'img/figurinhas/app/ck-humor-010.webp','img/figurinhas/mini/ck-humor-010.webp',false,680,false),
('era-preguica-agora-e-orgulho','Era preguiça, agora é orgulho','humor',array['conquistas','pos-treino']::text[],'img/figurinhas/app/ck-humor-011.webp','img/figurinhas/mini/ck-humor-011.webp',false,690,false),
('acordei-sem-vontade-e-fui-assim-mesmo','Acordei sem vontade e fui assim mesmo','humor',array['treino']::text[],'img/figurinhas/app/ck-humor-012.webp','img/figurinhas/mini/ck-humor-012.webp',false,700,false),
('tomei-coragem','Tomei coragem','humor',array['motivacao']::text[],'img/figurinhas/app/ck-humor-013.webp','img/figurinhas/mini/ck-humor-013.webp',false,710,false),
('suando-mas-linda','Suando, mas linda','humor',array['treino']::text[],'img/figurinhas/app/ck-humor-014.webp','img/figurinhas/mini/ck-humor-014.webp',false,720,false),
('treino-pago','Treino pago','treino',array['humor','pos-treino']::text[],'img/figurinhas/app/ck-treino-007.webp','img/figurinhas/mini/ck-treino-007.webp',false,730,false),
('bora-fingir-naturalidade','Bora fingir naturalidade','humor',array[]::text[],'img/figurinhas/app/ck-humor-015.webp','img/figurinhas/mini/ck-humor-015.webp',false,740,false),
('zero-vontade-cem-por-cento-presenca','Zero vontade, cem por cento presença','humor',array['constancia']::text[],'img/figurinhas/app/ck-humor-016.webp','img/figurinhas/mini/ck-humor-016.webp',false,750,false),
('missao-sofrida','Missão sofrida','humor',array['treino']::text[],'img/figurinhas/app/ck-humor-017.webp','img/figurinhas/mini/ck-humor-017.webp',false,760,false),
('sobrevivi-ao-treino','Sobrevivi ao treino','treino',array['humor','pos-treino']::text[],'img/figurinhas/app/ck-treino-008.webp','img/figurinhas/mini/ck-treino-008.webp',false,770,false),
('a-gata-foi','A gata foi','treino',array['humor','pos-treino']::text[],'img/figurinhas/app/ck-treino-009.webp','img/figurinhas/mini/ck-treino-009.webp',true,780,false),
('cade-meu-premio','Cadê meu prêmio?','humor',array['conquistas']::text[],'img/figurinhas/app/ck-humor-018.webp','img/figurinhas/mini/ck-humor-018.webp',false,790,false),
('fui-sem-vontade-e-voltei-poderosa','Fui sem vontade e voltei poderosa','humor',array['treino','pos-treino']::text[],'img/figurinhas/app/ck-humor-019.webp','img/figurinhas/mini/ck-humor-019.webp',false,800,false),
('vai-com-tudo','Vai com tudo!','motivacao',array['apoio']::text[],'img/figurinhas/app/ck-motivacao-004.webp','img/figurinhas/mini/ck-motivacao-004.webp',false,810,false),
('voce-consegue','Você consegue!','motivacao',array['apoio']::text[],'img/figurinhas/app/ck-motivacao-005.webp','img/figurinhas/mini/ck-motivacao-005.webp',false,820,false),
('constancia-perfeicao','Constância > perfeição','constancia',array['motivacao']::text[],'img/figurinhas/app/ck-constancia-006.webp','img/figurinhas/mini/ck-constancia-006.webp',false,830,false),
('um-passo-de-cada-vez','Um passo de cada vez','motivacao',array['constancia']::text[],'img/figurinhas/app/ck-motivacao-006.webp','img/figurinhas/mini/ck-motivacao-006.webp',false,840,false),
('hoje-teve','Hoje teve!','treino',array['conquistas','pos-treino']::text[],'img/figurinhas/app/ck-treino-010.webp','img/figurinhas/mini/ck-treino-010.webp',true,850,false),
('feito-e-melhor-que-perfeito','Feito é melhor que perfeito','motivacao',array[]::text[],'img/figurinhas/app/ck-motivacao-007.webp','img/figurinhas/mini/ck-motivacao-007.webp',false,860,false),
('bora-manter','Bora manter','constancia',array['treino']::text[],'img/figurinhas/app/ck-constancia-007.webp','img/figurinhas/mini/ck-constancia-007.webp',false,870,false),
('voce-ta-indo-bem','Você tá indo bem','motivacao',array['apoio']::text[],'img/figurinhas/app/ck-motivacao-008.webp','img/figurinhas/mini/ck-motivacao-008.webp',false,880,false),
('disciplina-gata','Disciplina, gata','motivacao',array['humor']::text[],'img/figurinhas/app/ck-motivacao-009.webp','img/figurinhas/mini/ck-motivacao-009.webp',false,890,false),
('create','Create','ck',array[]::text[],'img/figurinhas/app/ck-ck-008.webp','img/figurinhas/mini/ck-ck-008.webp',false,900,false),
('keep','Keep','ck',array[]::text[],'img/figurinhas/app/ck-ck-009.webp','img/figurinhas/mini/ck-ck-009.webp',false,910,false),
('live','Live','ck',array[]::text[],'img/figurinhas/app/ck-ck-010.webp','img/figurinhas/mini/ck-ck-010.webp',false,920,false),
('ck-girl','CK girl','ck',array[]::text[],'img/figurinhas/app/ck-ck-011.webp','img/figurinhas/mini/ck-ck-011.webp',true,930,false),
('ck-mood','CK mood','ck',array['reacoes']::text[],'img/figurinhas/app/ck-ck-012.webp','img/figurinhas/mini/ck-ck-012.webp',false,940,false),
('crie-mantenha-viva','Crie. Mantenha. Viva.','ck',array[]::text[],'img/figurinhas/app/ck-ck-013.webp','img/figurinhas/mini/ck-ck-013.webp',false,950,false),
('sua-vida-seu-ritmo','Sua vida. Seu ritmo.','ck',array['autocuidado']::text[],'img/figurinhas/app/ck-ck-014.webp','img/figurinhas/mini/ck-ck-014.webp',false,960,false),
('sua-evolucao','Sua evolução.','ck',array['conquistas']::text[],'img/figurinhas/app/ck-ck-015.webp','img/figurinhas/mini/ck-ck-015.webp',false,970,false),
('keep-going-2','Keep going','motivacao',array['ck','pos-treino']::text[],'img/figurinhas/app/ck-motivacao-010.webp','img/figurinhas/mini/ck-motivacao-010.webp',false,980,false),
('create-keep-live-2','Create. Keep. Live.','ck',array['pos-treino']::text[],'img/figurinhas/app/ck-ck-016.webp','img/figurinhas/mini/ck-ck-016.webp',true,990,false),
('constancia-linda','Constância linda','constancia',array['pos-treino']::text[],'img/figurinhas/app/ck-constancia-008.webp','img/figurinhas/mini/ck-constancia-008.webp',true,1000,false)
on conflict (id) do nothing;
select 'Figurinhas prontas: ' || count(*) as status from public.figurinhas_catalogo;
