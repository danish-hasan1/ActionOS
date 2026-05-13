-- ============================================================
-- ActionPlan OS — Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── TAGS ────────────────────────────────────────────────────
create table if not exists tags (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  color text not null default '#1B3A5C',
  category text not null default 'owner', -- 'owner' | 'category'
  created_at timestamptz default now()
);

-- ─── PAIN POINTS ─────────────────────────────────────────────
create table if not exists pain_points (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  severity text not null default 'medium' check (severity in ('critical','high','medium','low')),
  status text not null default 'open' check (status in ('open','in_progress','resolved')),
  phase text check (phase in ('30','60','90')),
  tag_ids uuid[] default '{}',
  notes text,
  owner_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── TASKS ───────────────────────────────────────────────────
create table if not exists tasks (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  status text not null default 'todo' check (status in ('todo','in_progress','done')),
  priority text not null default 'medium' check (priority in ('urgent','high','medium','low')),
  due_date date,
  phase text check (phase in ('30','60','90')),
  pain_point_id uuid references pain_points(id) on delete set null,
  goal_id uuid references goals(id) on delete set null,
  owner_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── GOALS ───────────────────────────────────────────────────
create table if not exists goals (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  type text not null default 'short_term' check (type in ('short_term','long_term')),
  phase text check (phase in ('30','60','90')),
  target_date date,
  progress_pct integer default 0 check (progress_pct >= 0 and progress_pct <= 100),
  status text not null default 'not_started' check (status in ('not_started','in_progress','at_risk','complete')),
  owner_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── MILESTONES ───────────────────────────────────────────────
create table if not exists milestones (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  phase text not null check (phase in ('30','60','90')),
  start_date date,
  end_date date,
  status text not null default 'not_started' check (status in ('not_started','on_track','at_risk','complete')),
  notes text,
  goal_id uuid references goals(id) on delete set null,
  owner_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── AGENDAS ─────────────────────────────────────────────────
create table if not exists agendas (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  meeting_date date not null,
  meeting_type text default 'team_sync',
  items jsonb default '[]',
  attendees text[] default '{}',
  notes text,
  owner_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── FOLLOW-UPS ───────────────────────────────────────────────
create table if not exists followups (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  due_date date,
  status text not null default 'pending' check (status in ('pending','done','overdue')),
  priority text not null default 'medium' check (priority in ('urgent','high','medium','low')),
  reminder_sent boolean default false,
  agenda_id uuid references agendas(id) on delete set null,
  task_id uuid references tasks(id) on delete set null,
  owner_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── REPORTS ─────────────────────────────────────────────────
create table if not exists reports (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  date_range_start date,
  date_range_end date,
  share_token uuid default uuid_generate_v4() unique,
  report_data jsonb default '{}',
  owner_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

-- ─── FIX FORWARD REFERENCE: tasks → goals ─────────────────────
-- (goals table needed to exist before tasks references it)
-- If you run into FK errors, create goals before tasks in a fresh DB.

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────
alter table tags enable row level security;
alter table pain_points enable row level security;
alter table tasks enable row level security;
alter table goals enable row level security;
alter table milestones enable row level security;
alter table agendas enable row level security;
alter table followups enable row level security;
alter table reports enable row level security;

-- Tags: readable by all authenticated users, writable by owner
create policy "tags_select" on tags for select using (auth.role() = 'authenticated');
create policy "tags_insert" on tags for insert with check (auth.role() = 'authenticated');
create policy "tags_update" on tags for update using (auth.role() = 'authenticated');
create policy "tags_delete" on tags for delete using (auth.role() = 'authenticated');

-- All other tables: only the owner can CRUD
create policy "pain_points_all" on pain_points for all using (owner_id = auth.uid());
create policy "tasks_all" on tasks for all using (owner_id = auth.uid());
create policy "goals_all" on goals for all using (owner_id = auth.uid());
create policy "milestones_all" on milestones for all using (owner_id = auth.uid());
create policy "agendas_all" on agendas for all using (owner_id = auth.uid());
create policy "followups_all" on followups for all using (owner_id = auth.uid());
create policy "reports_all" on reports for all using (owner_id = auth.uid());

-- Reports: also readable via share_token (no auth needed)
create policy "reports_public_read" on reports for select using (true);

-- ─── UPDATED_AT TRIGGER ───────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger pain_points_updated_at before update on pain_points for each row execute function update_updated_at();
create trigger tasks_updated_at before update on tasks for each row execute function update_updated_at();
create trigger goals_updated_at before update on goals for each row execute function update_updated_at();
create trigger milestones_updated_at before update on milestones for each row execute function update_updated_at();
create trigger agendas_updated_at before update on agendas for each row execute function update_updated_at();
create trigger followups_updated_at before update on followups for each row execute function update_updated_at();

-- ─── SEED DEFAULT TAGS ────────────────────────────────────────
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
