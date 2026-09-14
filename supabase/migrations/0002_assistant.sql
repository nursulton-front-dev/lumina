-- Ассистент: переписка, история правок расписания, учёт расхода токенов.
-- Плюс разовые копии дня у блоков (правки «только на сегодня»).

alter table public.blocks add column if not exists date text not null default '';
alter table public.blocks add column if not exists weekdays integer[] not null default '{}';
create index if not exists blocks_user_date_idx on public.blocks (user_id, date);

-- ─── Переписка с ассистентом ──────────────────────────────────────────────
create table if not exists public.messages (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  role text not null check (role in ('user', 'assistant', 'tool')),
  content text not null default '',
  tool_name text,
  created_at timestamptz not null default now(),
  deleted boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

-- ─── История правок расписания: нужна для отмены ──────────────────────────
create table if not exists public.changes (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  created_at timestamptz not null default now(),
  summary text not null default '',
  scope jsonb not null default '{}'::jsonb,
  day_type text not null,
  date text not null default '',
  before_blocks jsonb not null default '[]'::jsonb,
  after_blocks jsonb not null default '[]'::jsonb,
  applied boolean not null default false,
  undone boolean not null default false,
  deleted boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists messages_user_updated_idx on public.messages (user_id, updated_at);
create index if not exists changes_user_updated_idx on public.changes (user_id, updated_at);

-- ─── Расход запросов и токенов: лимит в час и счётчик за месяц ────────────
create table if not exists public.ai_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  bucket text not null,
  requests integer not null default 0,
  prompt_tokens integer not null default 0,
  completion_tokens integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, bucket)
);

alter table public.messages enable row level security;
alter table public.changes enable row level security;
alter table public.ai_usage enable row level security;

do $$
declare
  target text;
begin
  foreach target in array array['messages', 'changes', 'ai_usage']
  loop
    execute format('drop policy if exists "%s are private" on public.%I', target, target);
    execute format(
      'create policy "%s are private" on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id)',
      target,
      target
    );
  end loop;
end
$$;

do $$
declare
  target text;
begin
  foreach target in array array['messages', 'changes']
  loop
    execute format('drop trigger if exists keep_latest_trigger on public.%I', target);
    execute format(
      'create trigger keep_latest_trigger before update on public.%I for each row execute function public.keep_latest()',
      target
    );
  end loop;
end
$$;

-- Счётчик запросов увеличивается атомарно: лимит должен держаться и при гонке.
create or replace function public.bump_ai_usage(
  target_user uuid,
  hour_bucket text,
  month_bucket text,
  prompt integer,
  completion integer
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  hour_requests integer;
begin
  insert into public.ai_usage (user_id, bucket, requests, prompt_tokens, completion_tokens)
  values (target_user, hour_bucket, 1, prompt, completion)
  on conflict (user_id, bucket) do update
    set requests = public.ai_usage.requests + 1,
        prompt_tokens = public.ai_usage.prompt_tokens + excluded.prompt_tokens,
        completion_tokens = public.ai_usage.completion_tokens + excluded.completion_tokens,
        updated_at = now()
  returning requests into hour_requests;

  insert into public.ai_usage (user_id, bucket, requests, prompt_tokens, completion_tokens)
  values (target_user, month_bucket, 1, prompt, completion)
  on conflict (user_id, bucket) do update
    set requests = public.ai_usage.requests + 1,
        prompt_tokens = public.ai_usage.prompt_tokens + excluded.prompt_tokens,
        completion_tokens = public.ai_usage.completion_tokens + excluded.completion_tokens,
        updated_at = now();

  return hour_requests;
end;
$$;

-- Токены дописываются отдельно от счётчика запросов, иначе один запрос считался бы дважды.
create or replace function public.add_ai_tokens(
  target_user uuid,
  hour_bucket text,
  month_bucket text,
  prompt integer,
  completion integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_bucket text;
begin
  foreach target_bucket in array array[hour_bucket, month_bucket]
  loop
    insert into public.ai_usage (user_id, bucket, requests, prompt_tokens, completion_tokens)
    values (target_user, target_bucket, 0, prompt, completion)
    on conflict (user_id, bucket) do update
      set prompt_tokens = public.ai_usage.prompt_tokens + excluded.prompt_tokens,
          completion_tokens = public.ai_usage.completion_tokens + excluded.completion_tokens,
          updated_at = now();
  end loop;
end;
$$;
