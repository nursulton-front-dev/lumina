-- Тетрадь фокуса: схема личных данных одного пользователя.
-- Каждая таблица закрыта RLS: строки видит только их владелец.

create extension if not exists "pgcrypto";

-- ─── Профиль ──────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  lang text not null default 'ru',
  theme text not null default 'system',
  height_cm integer not null default 178,
  weight_kg integer not null default 70,
  wake_time text not null default '06:00',
  sleep_target text not null default '23:00',
  sleep_target_shifted_on date,
  school_start text not null default '08:30',
  school_end text not null default '14:45',
  commute_minutes integer not null default 50,
  english_mode text not null default 'parity',
  english_days integer[] not null default '{1,3,5}',
  equipment text[] not null default '{bar,bodyweight}',
  has_ball boolean not null default false,
  goals text not null default '',
  max_pullups integer not null default 2,
  max_pushups integer not null default 25,
  voice_name text,
  season_start date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Расписание ───────────────────────────────────────────────────────────
create table if not exists public.blocks (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  day_type text not null check (day_type in ('odd', 'even', 'fri', 'sat', 'sun')),
  start_min integer not null check (start_min between 0 and 1440),
  end_min integer not null check (end_min between 0 and 1440),
  title_key text,
  title text,
  category text not null,
  protocol_id text,
  is_core boolean not null default false,
  is_focus boolean not null default false,
  sort_order integer not null default 0,
  deleted boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

-- ─── День, отметки, сессии, замеры, журнал ────────────────────────────────
create table if not exists public.days (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  date date not null,
  type_override text check (type_override in ('odd', 'even', 'fri', 'sat', 'sun')),
  min_done boolean not null default false,
  bedtime_actual text,
  deleted boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  unique (user_id, date)
);

create table if not exists public.checks (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  date date not null,
  block_id text not null,
  done_at timestamptz not null default now(),
  deleted boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.sessions (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  date date not null,
  block_id text,
  kind text not null check (kind in ('pomodoro', 'protocol')),
  minutes integer not null default 0,
  exits integer not null default 0,
  broken boolean not null default false,
  started_at timestamptz not null default now(),
  deleted boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.measures (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  date date not null,
  metric text not null,
  value numeric not null,
  note text,
  deleted boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.logs (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  date date not null,
  kind text not null,
  payload jsonb not null default '{}'::jsonb,
  deleted boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

-- ─── Индексы под выборку «что изменилось после метки времени» ─────────────
create index if not exists blocks_user_updated_idx on public.blocks (user_id, updated_at);
create index if not exists days_user_updated_idx on public.days (user_id, updated_at);
create index if not exists checks_user_updated_idx on public.checks (user_id, updated_at);
create index if not exists checks_user_date_idx on public.checks (user_id, date);
create index if not exists sessions_user_updated_idx on public.sessions (user_id, updated_at);
create index if not exists sessions_user_date_idx on public.sessions (user_id, date);
create index if not exists measures_user_updated_idx on public.measures (user_id, updated_at);
create index if not exists measures_user_metric_idx on public.measures (user_id, metric, date);
create index if not exists logs_user_updated_idx on public.logs (user_id, updated_at);
create index if not exists logs_user_date_idx on public.logs (user_id, date);

-- ─── RLS: пользователь видит и меняет только свои строки ──────────────────
alter table public.profiles enable row level security;
alter table public.blocks enable row level security;
alter table public.days enable row level security;
alter table public.checks enable row level security;
alter table public.sessions enable row level security;
alter table public.measures enable row level security;
alter table public.logs enable row level security;

drop policy if exists "profiles are private" on public.profiles;
create policy "profiles are private" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

do $$
declare
  target text;
begin
  foreach target in array array['blocks', 'days', 'checks', 'sessions', 'measures', 'logs']
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

-- ─── Профиль создаётся вместе с пользователем ─────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Защита от гонки: более старая запись не затирает более свежую ────────
-- Клиент синхронизируется в порядке «сначала забрать, потом отправить», но
-- два устройства могут писать одновременно. Триггер оставляет строку как есть,
-- если пришедшее обновление старше сохранённого.
create or replace function public.keep_latest()
returns trigger
language plpgsql
as $$
begin
  if new.updated_at < old.updated_at then
    return old;
  end if;
  return new;
end;
$$;

do $$
declare
  target text;
begin
  foreach target in array array['profiles', 'blocks', 'days', 'checks', 'sessions', 'measures', 'logs']
  loop
    execute format('drop trigger if exists keep_latest_trigger on public.%I', target);
    execute format(
      'create trigger keep_latest_trigger before update on public.%I for each row execute function public.keep_latest()',
      target
    );
  end loop;
end
$$;
