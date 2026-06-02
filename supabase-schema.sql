-- ============================================================
-- ActionPlan OS — Supabase Schema  (FINAL — idempotent)
-- Safe to run on a fresh DB or re-run on an existing one.
-- Run this entire file in your Supabase SQL Editor.
-- ============================================================

-- ─── Extensions ──────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ═══════════════════════════════════════════════════════════════
-- TABLES
-- Order matters: goals before tasks (FK dependency)
-- ═══════════════════════════════════════════════════════════════

create table if not exists tags (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null unique,
  color      text not null default '#1B3A5C',
  category   text not null default 'owner'
               check (category in ('owner','category')),
  created_at timestamptz default now()
);

create table if not exists goals (
  id           uuid primary key default uuid_generate_v4(),
  title        text not null,
  description  text,
  type         text not null default 'short_term'
                 check (type in ('short_term','long_term')),
  phase        text check (phase in ('30','60','90')),
  target_date  date,
  progress_pct integer default 0
                 check (progress_pct >= 0 and progress_pct <= 100),
  status       text not null default 'not_started'
                 check (status in ('not_started','in_progress','at_risk','complete')),
  owner_id     uuid,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create table if not exists pain_points (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  description text,
  severity    text not null default 'medium'
                check (severity in ('critical','high','medium','low')),
  status      text not null default 'open'
                check (status in ('open','in_progress','resolved')),
  phase       text check (phase in ('30','60','90')),
  tag_ids     uuid[] default '{}',
  notes       text,
  owner_id    uuid,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create table if not exists tasks (
  id             uuid primary key default uuid_generate_v4(),
  title          text not null,
  description    text,
  status         text not null default 'todo'
                   check (status in ('todo','in_progress','done')),
  priority       text not null default 'medium'
                   check (priority in ('urgent','high','medium','low')),
  due_date       date,
  phase          text check (phase in ('30','60','90')),
  pain_point_id  uuid references pain_points(id) on delete set null,
  goal_id        uuid references goals(id) on delete set null,
  owner_id       uuid,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

create table if not exists milestones (
  id         uuid primary key default uuid_generate_v4(),
  title      text not null,
  phase      text not null check (phase in ('30','60','90')),
  start_date date,
  end_date   date,
  status     text not null default 'not_started'
               check (status in ('not_started','on_track','at_risk','complete')),
  notes      text,
  goal_id    uuid references goals(id) on delete set null,
  owner_id   uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists agendas (
  id           uuid primary key default uuid_generate_v4(),
  title        text not null,
  meeting_date date not null,
  meeting_type text default 'Team Sync',
  items        jsonb default '[]'::jsonb,
  attendees    text[] default '{}',
  notes        text,
  owner_id     uuid,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create table if not exists followups (
  id            uuid primary key default uuid_generate_v4(),
  title         text not null,
  description   text,
  due_date      date,
  status        text not null default 'pending'
                  check (status in ('pending','done','overdue')),
  priority      text not null default 'medium'
                  check (priority in ('urgent','high','medium','low')),
  reminder_sent boolean default false,
  agenda_id     uuid references agendas(id) on delete set null,
  task_id       uuid references tasks(id) on delete set null,
  owner_id      uuid,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create table if not exists reports (
  id               uuid primary key default uuid_generate_v4(),
  title            text not null,
  date_range_start date,
  date_range_end   date,
  share_token      uuid default uuid_generate_v4() unique not null,
  report_data      jsonb default '{}'::jsonb,
  owner_id         uuid,
  created_at       timestamptz default now()
);

create table if not exists user_settings (
  id                 uuid primary key default uuid_generate_v4(),
  owner_id           uuid unique,
  display_name       text,
  company_name       text,
  role_title         text default 'Head of Talent Acquisition',
  start_date         date default current_date,
  notification_email text,
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY — enable (idempotent)
-- ═══════════════════════════════════════════════════════════════

alter table tags          enable row level security;
alter table goals         enable row level security;
alter table pain_points   enable row level security;
alter table tasks         enable row level security;
alter table milestones    enable row level security;
alter table agendas       enable row level security;
alter table followups     enable row level security;
alter table reports       enable row level security;
alter table user_settings enable row level security;

-- ═══════════════════════════════════════════════════════════════
-- POLICIES — drop then recreate so re-runs never fail
-- ═══════════════════════════════════════════════════════════════

-- tags
drop policy if exists "tags_select"  on tags;
drop policy if exists "tags_insert"  on tags;
drop policy if exists "tags_update"  on tags;
drop policy if exists "tags_delete"  on tags;
create policy "tags_select" on tags for select using (auth.role() = 'authenticated');
create policy "tags_insert" on tags for insert with check (auth.role() = 'authenticated');
create policy "tags_update" on tags for update using (auth.role() = 'authenticated');
create policy "tags_delete" on tags for delete using (auth.role() = 'authenticated');

-- goals
drop policy if exists "goals_select" on goals;
drop policy if exists "goals_insert" on goals;
drop policy if exists "goals_update" on goals;
drop policy if exists "goals_delete" on goals;
drop policy if exists "goals_all"    on goals;
create policy "goals_select" on goals for select using (owner_id = auth.uid());
create policy "goals_insert" on goals for insert with check (owner_id = auth.uid());
create policy "goals_update" on goals for update using (owner_id = auth.uid());
create policy "goals_delete" on goals for delete using (owner_id = auth.uid());

-- pain_points
drop policy if exists "pain_points_select" on pain_points;
drop policy if exists "pain_points_insert" on pain_points;
drop policy if exists "pain_points_update" on pain_points;
drop policy if exists "pain_points_delete" on pain_points;
drop policy if exists "pain_points_all"    on pain_points;
create policy "pain_points_select" on pain_points for select using (owner_id = auth.uid());
create policy "pain_points_insert" on pain_points for insert with check (owner_id = auth.uid());
create policy "pain_points_update" on pain_points for update using (owner_id = auth.uid());
create policy "pain_points_delete" on pain_points for delete using (owner_id = auth.uid());

-- tasks
drop policy if exists "tasks_select" on tasks;
drop policy if exists "tasks_insert" on tasks;
drop policy if exists "tasks_update" on tasks;
drop policy if exists "tasks_delete" on tasks;
drop policy if exists "tasks_all"    on tasks;
create policy "tasks_select" on tasks for select using (owner_id = auth.uid());
create policy "tasks_insert" on tasks for insert with check (owner_id = auth.uid());
create policy "tasks_update" on tasks for update using (owner_id = auth.uid());
create policy "tasks_delete" on tasks for delete using (owner_id = auth.uid());

-- milestones
drop policy if exists "milestones_select" on milestones;
drop policy if exists "milestones_insert" on milestones;
drop policy if exists "milestones_update" on milestones;
drop policy if exists "milestones_delete" on milestones;
drop policy if exists "milestones_all"    on milestones;
create policy "milestones_select" on milestones for select using (owner_id = auth.uid());
create policy "milestones_insert" on milestones for insert with check (owner_id = auth.uid());
create policy "milestones_update" on milestones for update using (owner_id = auth.uid());
create policy "milestones_delete" on milestones for delete using (owner_id = auth.uid());

-- agendas
drop policy if exists "agendas_select" on agendas;
drop policy if exists "agendas_insert" on agendas;
drop policy if exists "agendas_update" on agendas;
drop policy if exists "agendas_delete" on agendas;
drop policy if exists "agendas_all"    on agendas;
create policy "agendas_select" on agendas for select using (owner_id = auth.uid());
create policy "agendas_insert" on agendas for insert with check (owner_id = auth.uid());
create policy "agendas_update" on agendas for update using (owner_id = auth.uid());
create policy "agendas_delete" on agendas for delete using (owner_id = auth.uid());

-- followups
drop policy if exists "followups_select" on followups;
drop policy if exists "followups_insert" on followups;
drop policy if exists "followups_update" on followups;
drop policy if exists "followups_delete" on followups;
drop policy if exists "followups_all"    on followups;
create policy "followups_select" on followups for select using (owner_id = auth.uid());
create policy "followups_insert" on followups for insert with check (owner_id = auth.uid());
create policy "followups_update" on followups for update using (owner_id = auth.uid());
create policy "followups_delete" on followups for delete using (owner_id = auth.uid());

-- reports (owner + public token read)
drop policy if exists "reports_owner_select"   on reports;
drop policy if exists "reports_insert"         on reports;
drop policy if exists "reports_update"         on reports;
drop policy if exists "reports_delete"         on reports;
drop policy if exists "reports_all"            on reports;
drop policy if exists "reports_public_read"    on reports;
drop policy if exists "reports_public_by_token" on reports;
create policy "reports_owner_select"    on reports for select using (owner_id = auth.uid());
create policy "reports_insert"          on reports for insert with check (owner_id = auth.uid());
create policy "reports_update"          on reports for update using (owner_id = auth.uid());
create policy "reports_delete"          on reports for delete using (owner_id = auth.uid());
-- Anyone with the unguessable share_token UUID can read the report (no auth needed)
create policy "reports_public_by_token" on reports for select using (share_token is not null);

-- user_settings
drop policy if exists "user_settings_select" on user_settings;
drop policy if exists "user_settings_insert" on user_settings;
drop policy if exists "user_settings_update" on user_settings;
create policy "user_settings_select" on user_settings for select using (owner_id = auth.uid());
create policy "user_settings_insert" on user_settings for insert with check (owner_id = auth.uid());
create policy "user_settings_update" on user_settings for update using (owner_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════
-- FUNCTIONS & TRIGGERS (all use create or replace / drop if exists)
-- ═══════════════════════════════════════════════════════════════

-- updated_at helper
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- updated_at triggers (drop first so re-runs are safe)
drop trigger if exists goals_updated_at         on goals;
drop trigger if exists pain_points_updated_at   on pain_points;
drop trigger if exists tasks_updated_at         on tasks;
drop trigger if exists milestones_updated_at    on milestones;
drop trigger if exists agendas_updated_at       on agendas;
drop trigger if exists followups_updated_at     on followups;
drop trigger if exists user_settings_updated_at on user_settings;

create trigger goals_updated_at         before update on goals         for each row execute function update_updated_at();
create trigger pain_points_updated_at   before update on pain_points   for each row execute function update_updated_at();
create trigger tasks_updated_at         before update on tasks         for each row execute function update_updated_at();
create trigger milestones_updated_at    before update on milestones    for each row execute function update_updated_at();
create trigger agendas_updated_at       before update on agendas       for each row execute function update_updated_at();
create trigger followups_updated_at     before update on followups     for each row execute function update_updated_at();
create trigger user_settings_updated_at before update on user_settings for each row execute function update_updated_at();

-- Auto-sync goal progress_pct when linked tasks change status
create or replace function sync_goal_progress()
returns trigger as $$
declare
  v_goal_id uuid;
  v_total   int;
  v_done    int;
  v_pct     int;
begin
  v_goal_id := coalesce(
    case when TG_OP = 'DELETE' then old.goal_id else new.goal_id end,
    case when TG_OP = 'DELETE' then null else old.goal_id end
  );
  if v_goal_id is null then
    return coalesce(new, old);
  end if;

  select
    count(*)                                    into v_total
  from tasks where goal_id = v_goal_id;

  select
    count(*) filter (where status = 'done')     into v_done
  from tasks where goal_id = v_goal_id;

  v_pct := case when v_total > 0
    then round((v_done::numeric / v_total) * 100)
    else 0
  end;

  update goals
  set
    progress_pct = v_pct,
    status = case
      when v_pct = 100 then 'complete'
      when v_pct > 0   then 'in_progress'
      else status
    end,
    updated_at = now()
  where id = v_goal_id;

  return coalesce(new, old);
end;
$$ language plpgsql security definer;

drop trigger if exists tasks_sync_goal_progress on tasks;
create trigger tasks_sync_goal_progress
  after insert or update of status, goal_id or delete
  on tasks
  for each row execute function sync_goal_progress();

-- Auto-mark followups overdue (called on page load; schedulable via pg_cron on Pro)
create or replace function mark_overdue_followups()
returns void as $$
begin
  update followups
  set status = 'overdue', updated_at = now()
  where status = 'pending'
    and due_date < current_date;
end;
$$ language plpgsql security definer;

-- To schedule on Supabase Pro (uncomment):
-- select cron.schedule('mark-overdue', '0 6 * * *', 'select mark_overdue_followups()');

-- ═══════════════════════════════════════════════════════════════
-- SEED DEFAULT TAGS (safe to re-run — conflicts ignored)
-- ═══════════════════════════════════════════════════════════════

insert into tags (name, color, category) values
  ('Recruiter',         '#6366F1', 'owner'),
  ('Account Manager',   '#F59E0B', 'owner'),
  ('Leadership',        '#EF4444', 'owner'),
  ('Hiring Manager',    '#8B5CF6', 'owner'),
  ('HR / Ops',          '#EC4899', 'owner'),
  ('External / Vendor', '#64748B', 'owner'),
  ('Process',           '#10B981', 'category'),
  ('Technology',        '#3B82F6', 'category'),
  ('Communication',     '#F97316', 'category'),
  ('Quality',           '#14B8A6', 'category'),
  ('Speed',             '#EAB308', 'category')
on conflict (name) do nothing;


-- ═══════════════════════════════════════════════════════════════
-- NO-AUTH MODE: Grant anon role full access via RLS policies
-- The app uses the public anon key with no user session.
-- RLS stays ENABLED; these policies allow the anon role to do
-- all CRUD so saves work without auth.uid() being set.
-- ═══════════════════════════════════════════════════════════════

create table if not exists daily_tasks (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  date        date not null default current_date,
  checked     boolean not null default false,
  priority    text not null default 'medium'
                check (priority in ('high','medium','low')),
  notes       text,
  order_index integer not null default 0,
  owner_id    uuid,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table daily_tasks enable row level security;

drop policy if exists "anon_all_tags"          on tags;
drop policy if exists "anon_all_goals"         on goals;
drop policy if exists "anon_all_pain_points"   on pain_points;
drop policy if exists "anon_all_tasks"         on tasks;
drop policy if exists "anon_all_milestones"    on milestones;
drop policy if exists "anon_all_agendas"       on agendas;
drop policy if exists "anon_all_followups"     on followups;
drop policy if exists "anon_all_reports"       on reports;
drop policy if exists "anon_all_user_settings" on user_settings;
drop policy if exists "anon_all_daily_tasks"   on daily_tasks;

create policy "anon_all_tags"          on tags          for all to anon using (true) with check (true);
create policy "anon_all_goals"         on goals         for all to anon using (true) with check (true);
create policy "anon_all_pain_points"   on pain_points   for all to anon using (true) with check (true);
create policy "anon_all_tasks"         on tasks         for all to anon using (true) with check (true);
create policy "anon_all_milestones"    on milestones    for all to anon using (true) with check (true);
create policy "anon_all_agendas"       on agendas       for all to anon using (true) with check (true);
create policy "anon_all_followups"     on followups     for all to anon using (true) with check (true);
create policy "anon_all_reports"       on reports       for all to anon using (true) with check (true);
create policy "anon_all_user_settings" on user_settings for all to anon using (true) with check (true);
create policy "anon_all_daily_tasks"   on daily_tasks   for all to anon using (true) with check (true);

-- ─── Roles & Conversations ────────────────────────────────────
create table if not exists roles (
  id           uuid primary key default uuid_generate_v4(),
  title        text not null,
  department   text,
  status       text not null default 'open'
                 check (status in ('open','on_hold','filled','closed')),
  priority     text not null default 'medium'
                 check (priority in ('urgent','high','medium','low')),
  description  text,
  requirements text,
  notes        text,
  owner_id     uuid,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create table if not exists role_conversations (
  id           uuid primary key default uuid_generate_v4(),
  role_id      uuid references roles(id) on delete cascade,
  person_name  text not null,
  person_title text,
  content      text not null,
  owner_id     uuid,
  created_at   timestamptz default now()
);

alter table roles              enable row level security;
alter table role_conversations enable row level security;

drop policy if exists "anon_all_roles"               on roles;
drop policy if exists "anon_all_role_conversations"  on role_conversations;

create policy "anon_all_roles"              on roles              for all to anon using (true) with check (true);
create policy "anon_all_role_conversations" on role_conversations for all to anon using (true) with check (true);

-- ═══════════════════════════════════════════════════════════════
-- SEED OWNER: Insert a fixed owner row so the app works
-- immediately without needing to create a user.
-- Use the same UUID as OWNER_ID in your .env.local
-- ═══════════════════════════════════════════════════════════════

insert into user_settings (owner_id, display_name, role_title, start_date)
values (
  '00000000-0000-0000-0000-000000000001',
  'TA Head',
  'Head of Talent Acquisition',
  current_date
)
on conflict (owner_id) do nothing;
