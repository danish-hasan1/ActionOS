export type Severity = 'critical' | 'high' | 'medium' | 'low'
export type PainPointStatus = 'open' | 'in_progress' | 'resolved'
export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type Priority = 'urgent' | 'high' | 'medium' | 'low'
export type GoalType = 'short_term' | 'long_term'
export type GoalStatus = 'not_started' | 'in_progress' | 'at_risk' | 'complete'
export type MilestoneStatus = 'not_started' | 'on_track' | 'at_risk' | 'complete'
export type Phase = '30' | '60' | '90'
export type FollowupStatus = 'pending' | 'done' | 'overdue'

export interface Tag {
  id: string
  name: string
  color: string
  category: 'owner' | 'category'
  created_at: string
}

export interface PainPoint {
  id: string
  title: string
  description: string | null
  severity: Severity
  status: PainPointStatus
  phase: Phase | null
  tag_ids: string[]
  notes: string | null
  owner_id: string
  created_at: string
  updated_at: string
  // joined
  tags?: Tag[]
}

export interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: Priority
  due_date: string | null
  phase: Phase | null
  pain_point_id: string | null
  goal_id: string | null
  owner_id: string
  created_at: string
  updated_at: string
}

export interface Goal {
  id: string
  title: string
  description: string | null
  type: GoalType
  phase: Phase | null
  target_date: string | null
  progress_pct: number
  status: GoalStatus
  owner_id: string
  created_at: string
  updated_at: string
}

export interface Milestone {
  id: string
  title: string
  phase: Phase
  start_date: string | null
  end_date: string | null
  status: MilestoneStatus
  notes: string | null
  goal_id: string | null
  owner_id: string
  created_at: string
  updated_at: string
}

export interface AgendaItem {
  id: string
  text: string
  checked: boolean
  linked_task_id?: string | null
}

export interface Agenda {
  id: string
  title: string
  meeting_date: string
  meeting_type: string
  items: AgendaItem[]
  attendees: string[]
  notes: string | null
  owner_id: string
  created_at: string
  updated_at: string
}

export interface Followup {
  id: string
  title: string
  description: string | null
  due_date: string | null
  status: FollowupStatus
  priority: Priority
  reminder_sent: boolean
  agenda_id: string | null
  task_id: string | null
  owner_id: string
  created_at: string
  updated_at: string
}

export interface Report {
  id: string
  title: string
  date_range_start: string | null
  date_range_end: string | null
  share_token: string
  report_data: Record<string, unknown>
  owner_id: string
  created_at: string
}
