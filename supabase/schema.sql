-- PANJI · skema Supabase. Jalankan sekali di SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  name text not null default '',
  role text not null default 'juri' check (role in ('admin','juri')),
  contests text[] not null default '{}',          -- kosong = boleh menilai semua lomba
  created_at timestamptz not null default now()
);
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  no int unique not null,
  name text not null,
  pangkalan text not null default '',
  gudep text not null default '',
  dq boolean not null default false,
  tie_order int,
  created_at timestamptz not null default now()
);
create table if not exists public.scores (
  team_id uuid not null references public.teams(id) on delete cascade,
  contest text not null,
  data jsonb not null default '{}'::jsonb,
  dq boolean not null default false,
  note text not null default '',
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  primary key (team_id, contest)
);
create table if not exists public.settings (
  key text primary key, value jsonb not null, updated_at timestamptz not null default now()
);
create table if not exists public.snapshot (
  id int primary key default 1 check (id = 1), data jsonb not null, published_at timestamptz not null default now()
);
create table if not exists public.score_log (
  id bigserial primary key, at timestamptz not null default now(),
  who uuid, team_id uuid, contest text, action text, old jsonb, new jsonb
);

-- helper peran
create or replace function public.is_admin() returns boolean
language sql security definer stable set search_path = public as
$$ select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') $$;

create or replace function public.can_score(c text) returns boolean
language sql security definer stable set search_path = public as
$$ select exists (select 1 from public.profiles p where p.id = auth.uid()
   and (p.role = 'admin' or cardinality(p.contests) = 0 or c = any(p.contests))) $$;

-- akun pertama otomatis menjadi admin
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare uname text; rl text;
begin
  uname := coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1));
  rl := case when exists (select 1 from public.profiles where role = 'admin') then 'juri' else 'admin' end;
  insert into public.profiles (id, username, name, role)
  values (new.id, lower(uname), coalesce(new.raw_user_meta_data->>'name', uname), rl)
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- jejak audit nilai
create or replace function public.scores_audit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    insert into public.score_log (who, team_id, contest, action, old) values (auth.uid(), old.team_id, old.contest, 'hapus', to_jsonb(old));
    return old;
  end if;
  new.updated_by := auth.uid(); new.updated_at := now();
  insert into public.score_log (who, team_id, contest, action, old, new)
  values (auth.uid(), new.team_id, new.contest, case when tg_op = 'INSERT' then 'input' else 'ubah' end,
          case when tg_op = 'UPDATE' then to_jsonb(old) end, to_jsonb(new));
  return new;
end $$;
drop trigger if exists scores_audit_ins on public.scores;
drop trigger if exists scores_audit_upd on public.scores;
drop trigger if exists scores_audit_del on public.scores;
create trigger scores_audit_ins before insert on public.scores for each row execute function public.scores_audit();
create trigger scores_audit_upd before update on public.scores for each row execute function public.scores_audit();
create trigger scores_audit_del after delete on public.scores for each row execute function public.scores_audit();

-- RLS
alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.scores enable row level security;
alter table public.settings enable row level security;
alter table public.snapshot enable row level security;
alter table public.score_log enable row level security;

drop policy if exists p_profiles_read on public.profiles;
drop policy if exists p_profiles_write on public.profiles;
create policy p_profiles_read on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());
create policy p_profiles_write on public.profiles for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists p_teams_read on public.teams;
drop policy if exists p_teams_write on public.teams;
create policy p_teams_read on public.teams for select to authenticated using (true);
create policy p_teams_write on public.teams for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists p_scores_read on public.scores;
drop policy if exists p_scores_ins on public.scores;
drop policy if exists p_scores_upd on public.scores;
drop policy if exists p_scores_del on public.scores;
create policy p_scores_read on public.scores for select to authenticated using (true);
create policy p_scores_ins on public.scores for insert to authenticated with check (public.can_score(contest));
create policy p_scores_upd on public.scores for update to authenticated using (public.can_score(contest)) with check (public.can_score(contest));
create policy p_scores_del on public.scores for delete to authenticated using (public.is_admin());

drop policy if exists p_settings_read on public.settings;
drop policy if exists p_settings_write on public.settings;
create policy p_settings_read on public.settings for select to authenticated using (true);
create policy p_settings_write on public.settings for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists p_snap_read on public.snapshot;
drop policy if exists p_snap_write on public.snapshot;
create policy p_snap_read on public.snapshot for select to anon, authenticated using (true);
create policy p_snap_write on public.snapshot for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists p_log_read on public.score_log;
create policy p_log_read on public.score_log for select to authenticated using (public.is_admin());

-- realtime
do $$ begin
  begin alter publication supabase_realtime add table public.scores; exception when others then null; end;
  begin alter publication supabase_realtime add table public.teams; exception when others then null; end;
  begin alter publication supabase_realtime add table public.settings; exception when others then null; end;
  begin alter publication supabase_realtime add table public.profiles; exception when others then null; end;
end $$;
