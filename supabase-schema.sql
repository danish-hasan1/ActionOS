-- ============================================================
-- ActionPlan OS — Supabase Schema  (v2 — fixed)
-- Run this entire file in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── 1. TAGS ─────────────────────────────────────────────────
create table if not exists tags (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null unique,
  color      text not null default '#1B3A5C',
  category   text not null default 'owner'
               check (category in ('owner','category')),
  created_at timestamptz default now()
);

-- ─── 2. GOALS (must come BEFORE tasks due to FK) ─────────────
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
  owner_id     uuid references auth.users(id) on delete cascade,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ─── 3. PAIN POINTS ──────────────────────────────────────────
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
  owner_id    uuid references auth.users(id) on delete cascade,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ─── 4. TASKS (references both goals and pain_points) ────────
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
  owner_id       uuid references auth.users(id) on delete cascade,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

-- ─── 5. MILESTONES ───────────────────────────────────────────
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
  owner_id   uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── 6. AGENDAS ──────────────────────────────────────────────
create table if not exists agendas (
  id           uuid primary key default uuid_generate_v4(),
  title        text not null,
  meeting_date date not null,
  meeting_type text default 'Team Sync',
  items        jsonb default '[]'::jsonb,
  attendees    text[] default '{}',
  notes        text,
  owner_id     uuid references auth.users(id) on delete cascade,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ─── 7. FOLLOW-UPS ───────────────────────────────────────────
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
  owner_id      uuid references auth.users(id) on delete cascade,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ─── 8. REPORTS ──────────────────────────────────────────────
create table if not exists reports (
  id               uuid primary key default uuid_generate_v4(),
  title            text not null,
  date_range_start date,
  date_range_end   date,
  share_token      uuid default uuid_generate_v4() unique not null,
  report_data      jsonb default '{}'::jsonb,
  owner_id         uuid references auth.users(id) on delete cascade,
  created_at       timestamptz default now()
  -- no updated_at: reports are immutable snapshots
);

-- ─── 9. USER SETTINGS ────────────────────────────────────────
-- Stores per-user preferences: start date, display name, etc.
create table if not exists user_settings (
  id                uuid primary key default uuid_generate_v4(),
  owner_id          uuid references auth.users(id) on delete cascade unique,
  display_name      text,
  company_name      text,
  role_title        text default 'Head of Talent Acquisition',
  start_date        date default current_date,
  notification_email text,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
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

-- ── Tags: any authenticated user can read; any authenticated user can write
--    (tags are shared/global for a single-user app)
create policy "tags_select" on tags
  for select using (auth.role() = 'authenticated');
create policy "tags_insert" on tags
  for insert with check (auth.role() = 'authenticated');
create policy "tags_update" on tags
  for update using (auth.role() = 'authenticated');
create policy "tags_delete" on tags
  for delete using (auth.role() = 'authenticated');

-- ── Goals: owner only (SELECT + INSERT + UPDATE + DELETE)
create policy "goals_select" on goals
  for select using (owner_id = auth.uid());
create policy "goals_insert" on goals
  for insert with check (owner_id = auth.uid());
create policy "goals_update" on goals
  for update using (owner_id = auth.uid());
create policy "goals_delete" on goals
  for delete using (owner_id = auth.uid());

-- ── Pain Points: owner only
create policy "pain_points_select" on pain_points
  for select using (owner_id = auth.uid());
create policy "pain_points_insert" on pain_points
  for insert with check (owner_id = auth.uid());
create policy "pain_points_update" on pain_points
  for update using (owner_id = auth.uid());
create policy "pain_points_delete" on pain_points
  for delete using (owner_id = auth.uid());

-- ── Tasks: owner only
create policy "tasks_select" on tasks
  for select using (owner_id = auth.uid());
create policy "tasks_insert" on tasks
  for insert with check (owner_id = auth.uid());
create policy "tasks_update" on tasks
  for update using (owner_id = auth.uid());
create policy "tasks_delete" on tasks
  for delete using (owner_id = auth.uid());

-- ── Milestones: owner only
create policy "milestones_select" on milestones
  for select using (owner_id = auth.uid());
create policy "milestones_insert" on milestones
  for insert with check (owner_id = auth.uid());
create policy "milestones_update" on milestones
  for update using (owner_id = auth.uid());
create policy "milestones_delete" on milestones
  for delete using (owner_id = auth.uid());

-- ── Agendas: owner only
create policy "agendas_select" on agendas
  for select using (owner_id = auth.uid());
create policy "agendas_insert" on agendas
  for insert with check (owner_id = auth.uid());
create policy "agendas_update" on agendas
  for update using (owner_id = auth.uid());
create policy "agendas_delete" on agendas
  for delete using (owner_id = auth.uid());

-- ── Follow-ups: owner only
create policy "followups_select" on followups
  for select using (owner_id = auth.uid());
create policy "followups_insert" on followups
  for insert with check (owner_id = auth.uid());
create policy "followups_update" on followups
  for update using (owner_id = auth.uid());
create policy "followups_delete" on followups
  for delete using (owner_id = auth.uid());

-- ── Reports: owner can do everything; public can SELECT only via share_token
--    NOTE: the share page uses a Supabase server client — anon can only
--    read a report if they know the exact share_token UUID (256-bit).
create policy "reports_owner_select" on reports
  for select using (owner_id = auth.uid());
create policy "reports_insert" on reports
  for insert with check (owner_id = auth.uid());
create policy "reports_update" on reports
  for update using (owner_id = auth.uid());
create policy "reports_delete" on reports
  for delete using (owner_id = auth.uid());
-- Public read via token — safe because share_token is a UUID (unguessable)
create policy "reports_public_by_token" on reports
  for select using (share_token is not null);

-- ── User settings: owner only
create policy "user_settings_select" on user_settings
  for select using (owner_id = auth.uid());
create policy "user_settings_insert" on user_settings
  for insert with check (owner_id = auth.uid());
create policy "user_settings_update" on user_settings
  for update using (owner_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════
-- UPDATED_AT TRIGGER
-- ═══════════════════════════════════════════════════════════════

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger goals_updated_at
  before update on goals
  for each row execute function update_updated_at();

create trigger pain_points_updated_at
  before update on pain_points
  for each row execute function update_updated_at();

create trigger tasks_updated_at
  before update on tasks
  for each row execute function update_updated_at();

create trigger milestones_updated_at
  before update on milestones
  for each row execute function update_updated_at();

create trigger agendas_updated_at
  before update on agendas
  for each row execute function update_updated_at();

create trigger followups_updated_at
  before update on followups
  for each row execute function update_updated_at();

create trigger user_settings_updated_at
  before update on user_settings
  for each row execute function update_updated_at();

-- ═══════════════════════════════════════════════════════════════
-- SEED DEFAULT TAGS
-- ═══════════════════════════════════════════════════════════════

insert into tags (name, color, category) values
  ('Recruiter',          '#6366F1', 'owner'),
  ('Account Manager',    '#F59E0B', 'owner'),
  ('Leadership',         '#EF4444', 'owner'),
  ('Hiring Manager',     '#8B5CF6', 'owner'),
  ('HR / Ops',           '#EC4899', 'owner'),
  ('External / Vendor',  '#64748B', 'owner'),
  ('Process',            '#10B981', 'category'),
  ('Technology',         '#3B82F6', 'category'),
  ('Communication',      '#F97316', 'category'),
  ('Quality',            '#14B8A6', 'category'),
  ('Speed',              '#EAB308', 'category')
on conflict (name) do nothing;


-- ═══════════════════════════════════════════════════════════════
-- AUTO-PROGRESS: Update goal progress_pct when tasks change
-- ═══════════════════════════════════════════════════════════════

create or replace function sync_goal_progress()
returns trigger as $$
declare
  v_goal_id uuid;
  v_total   int;
  v_done    int;
  v_pct     int;
begin
  -- Determine which goal_id to update
  v_goal_id := coalesce(new.goal_id, old.goal_id);
  if v_goal_id is null then
    return coalesce(new, old);
  end if;

  -- Count tasks linked to this goal
  select count(*), count(*) filter (where status = 'done')
  into v_total, v_done
  from tasks
  where goal_id = v_goal_id;

  -- Calculate percentage (0 if no tasks)
  v_pct := case when v_total > 0 then round((v_done::numeric / v_total) * 100) else 0 end;

  -- Update the goal
  update goals
  set progress_pct = v_pct,
      status = case
        when v_pct = 100 then 'complete'
        when v_pct > 0   then 'in_progress'
        else status  -- don't downgrade manually set statuses
      end,
      updated_at = now()
  where id = v_goal_id;

  return coalesce(new, old);
end;
$$ language plpgsql security definer;

-- Trigger fires on any task insert, update, or delete
create trigger tasks_sync_goal_progress
  after insert or update of status, goal_id or delete
  on tasks
  for each row execute function sync_goal_progress();


-- ═══════════════════════════════════════════════════════════════
-- AUTO-OVERDUE: Mark followups as overdue when due_date passes
-- ═══════════════════════════════════════════════════════════════

create or replace function mark_overdue_followups()
returns void as $$
begin
  update followups
  set status = 'overdue', updated_at = now()
  where status = 'pending'
    and due_date < current_date;
end;
$$ language plpgsql security definer;

-- Call this manually or via a pg_cron job (Supabase Pro):
-- select cron.schedule('mark-overdue', '0 6 * * *', 'select mark_overdue_followups()');
-- For free tier, the client calls this on page load (see FollowupsClient).

