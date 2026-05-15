'use server'

import { createAdminClient } from '@/lib/supabase/admin'

type ActionResult<T = unknown> = { data: T; error: null } | { data: null; error: string }

// ─── Goals ────────────────────────────────────────────────────
export async function upsertGoal(payload: Record<string, unknown>, id?: string): Promise<ActionResult> {
  const db = createAdminClient()
  const q = id
    ? db.from('goals').update(payload).eq('id', id).select().single()
    : db.from('goals').insert(payload).select().single()
  const { data, error } = await q
  return error ? { data: null, error: error.message } : { data, error: null }
}

export async function deleteGoal(id: string): Promise<ActionResult> {
  const db = createAdminClient()
  const { error } = await db.from('goals').delete().eq('id', id)
  return error ? { data: null, error: error.message } : { data: null, error: null }
}

// ─── Tasks ────────────────────────────────────────────────────
export async function upsertTask(payload: Record<string, unknown>, id?: string): Promise<ActionResult> {
  const db = createAdminClient()
  const q = id
    ? db.from('tasks').update(payload).eq('id', id).select().single()
    : db.from('tasks').insert(payload).select().single()
  const { data, error } = await q
  return error ? { data: null, error: error.message } : { data, error: null }
}

export async function updateTaskStatus(id: string, status: string): Promise<ActionResult> {
  const db = createAdminClient()
  const { data, error } = await db.from('tasks').update({ status }).eq('id', id).select().single()
  return error ? { data: null, error: error.message } : { data, error: null }
}

export async function deleteTask(id: string): Promise<ActionResult> {
  const db = createAdminClient()
  const { error } = await db.from('tasks').delete().eq('id', id)
  return error ? { data: null, error: error.message } : { data: null, error: null }
}

// ─── Pain Points ──────────────────────────────────────────────
export async function upsertPainPoint(payload: Record<string, unknown>, id?: string): Promise<ActionResult> {
  const db = createAdminClient()
  const q = id
    ? db.from('pain_points').update(payload).eq('id', id).select().single()
    : db.from('pain_points').insert(payload).select().single()
  const { data, error } = await q
  return error ? { data: null, error: error.message } : { data, error: null }
}

export async function deletePainPoint(id: string): Promise<ActionResult> {
  const db = createAdminClient()
  const { error } = await db.from('pain_points').delete().eq('id', id)
  return error ? { data: null, error: error.message } : { data: null, error: null }
}

// ─── Milestones ───────────────────────────────────────────────
export async function upsertMilestone(payload: Record<string, unknown>, id?: string): Promise<ActionResult> {
  const db = createAdminClient()
  const q = id
    ? db.from('milestones').update(payload).eq('id', id).select().single()
    : db.from('milestones').insert(payload).select().single()
  const { data, error } = await q
  return error ? { data: null, error: error.message } : { data, error: null }
}

export async function updateMilestoneStatus(id: string, status: string): Promise<ActionResult> {
  const db = createAdminClient()
  const { data, error } = await db.from('milestones').update({ status }).eq('id', id).select().single()
  return error ? { data: null, error: error.message } : { data, error: null }
}

export async function deleteMilestone(id: string): Promise<ActionResult> {
  const db = createAdminClient()
  const { error } = await db.from('milestones').delete().eq('id', id)
  return error ? { data: null, error: error.message } : { data: null, error: null }
}

// ─── Agendas ──────────────────────────────────────────────────
export async function upsertAgenda(payload: Record<string, unknown>, id?: string): Promise<ActionResult> {
  const db = createAdminClient()
  const q = id
    ? db.from('agendas').update(payload).eq('id', id).select().single()
    : db.from('agendas').insert(payload).select().single()
  const { data, error } = await q
  return error ? { data: null, error: error.message } : { data, error: null }
}

export async function updateAgendaItems(id: string, items: unknown[]): Promise<ActionResult> {
  const db = createAdminClient()
  const { data, error } = await db.from('agendas').update({ items }).eq('id', id).select().single()
  return error ? { data: null, error: error.message } : { data, error: null }
}

export async function deleteAgenda(id: string): Promise<ActionResult> {
  const db = createAdminClient()
  const { error } = await db.from('agendas').delete().eq('id', id)
  return error ? { data: null, error: error.message } : { data: null, error: null }
}

// ─── Follow-ups ───────────────────────────────────────────────
export async function upsertFollowup(payload: Record<string, unknown>, id?: string): Promise<ActionResult> {
  const db = createAdminClient()
  const q = id
    ? db.from('followups').update(payload).eq('id', id).select().single()
    : db.from('followups').insert(payload).select().single()
  const { data, error } = await q
  return error ? { data: null, error: error.message } : { data, error: null }
}

export async function deleteFollowup(id: string): Promise<ActionResult> {
  const db = createAdminClient()
  const { error } = await db.from('followups').delete().eq('id', id)
  return error ? { data: null, error: error.message } : { data: null, error: null }
}

// ─── Reports ──────────────────────────────────────────────────
export async function upsertReport(payload: Record<string, unknown>, id?: string): Promise<ActionResult> {
  const db = createAdminClient()
  const q = id
    ? db.from('reports').update(payload).eq('id', id).select().single()
    : db.from('reports').insert(payload).select().single()
  const { data, error } = await q
  return error ? { data: null, error: error.message } : { data, error: null }
}

export async function deleteReport(id: string): Promise<ActionResult> {
  const db = createAdminClient()
  const { error } = await db.from('reports').delete().eq('id', id)
  return error ? { data: null, error: error.message } : { data: null, error: null }
}

// ─── User Settings ────────────────────────────────────────────
export async function saveUserSettings(payload: Record<string, unknown>, existingId?: string): Promise<ActionResult> {
  const db = createAdminClient()
  const q = existingId
    ? db.from('user_settings').update(payload).eq('id', existingId).select().single()
    : db.from('user_settings').insert(payload).select().single()
  const { data, error } = await q
  return error ? { data: null, error: error.message } : { data, error: null }
}

// ─── Tags ─────────────────────────────────────────────────────
export async function insertTag(name: string, color: string, category: string): Promise<ActionResult> {
  const db = createAdminClient()
  const { data, error } = await db.from('tags').insert({ name, color, category }).select().single()
  return error ? { data: null, error: error.message } : { data, error: null }
}

export async function updateTag(id: string, name: string, color: string): Promise<ActionResult> {
  const db = createAdminClient()
  const { error } = await db.from('tags').update({ name, color }).eq('id', id)
  return error ? { data: null, error: error.message } : { data: null, error: null }
}

export async function deleteTag(id: string): Promise<ActionResult> {
  const db = createAdminClient()
  const { error } = await db.from('tags').delete().eq('id', id)
  return error ? { data: null, error: error.message } : { data: null, error: null }
}

// ─── Quick Add ────────────────────────────────────────────────
export async function quickInsert(table: string, payload: Record<string, unknown>): Promise<ActionResult> {
  const db = createAdminClient()
  const { data, error } = await db.from(table).insert(payload).select().single()
  return error ? { data: null, error: error.message } : { data, error: null }
}
