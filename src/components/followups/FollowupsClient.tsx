'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Plus, Bell, CheckCircle2, Clock, AlertCircle, Pencil, Trash2, Calendar, MoreHorizontal } from 'lucide-react'
import type { Followup, FollowupStatus, Priority } from '@/types'
import {
  Badge, EmptyState, Button, Modal, FormField,
  inputCls, selectCls, textareaCls, StatCard
} from '@/components/ui'
import { PRIORITY_CONFIG, formatDate, cn } from '@/lib/utils'

// ─── Modal ────────────────────────────────────────────────────
function FollowupModal({ open, onClose, userId, editing, agendas, tasks, onSaved }: {
  open: boolean
  onClose: () => void
  userId: string
  editing?: Followup | null
  agendas: { id: string; title: string }[]
  tasks: { id: string; title: string }[]
  onSaved: (_: Followup) => void
}) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: editing?.title ?? '',
    description: editing?.description ?? '',
    due_date: editing?.due_date ?? '',
    priority: (editing?.priority ?? 'medium') as Priority,
    status: (editing?.status ?? 'pending') as FollowupStatus,
    agenda_id: editing?.agenda_id ?? '',
    task_id: editing?.task_id ?? '',
  })

  function set<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm(f => ({ ...f, [k]: v }))
  }

  async function save() {
    if (!form.title.trim()) return toast.error('Title is required')
    setLoading(true)
    const payload = {
      title: form.title.trim(),
      description: form.description || null,
      due_date: form.due_date || null,
      priority: form.priority,
      status: form.status,
      agenda_id: form.agenda_id || null,
      task_id: form.task_id || null,
      owner_id: userId,
    }
    let result
    if (editing) {
      result = await supabase.from('followups').update(payload).eq('id', editing.id).select().single()
    } else {
      result = await supabase.from('followups').insert(payload).select().single()
    }
    if (result.error) { toast.error(result.error.message) }
    else {
      toast.success(editing ? 'Follow-up updated' : 'Follow-up created')
      onSaved(result.data as Followup)
      onClose()
    }
    setLoading(false)
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit Follow-up' : 'New Follow-up'}>
      <div className="space-y-4">
        <FormField label="Title" required>
          <input className={inputCls} value={form.title} onChange={e => set('title', e.target.value)} placeholder="What needs following up?" />
        </FormField>
        <FormField label="Description">
          <textarea className={textareaCls} rows={2} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Context or details..." />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Priority">
            <select className={selectCls} value={form.priority} onChange={e => set('priority', e.target.value as Priority)}>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </FormField>
          <FormField label="Due Date">
            <input type="date" className={inputCls} value={form.due_date} onChange={e => set('due_date', e.target.value)} />
          </FormField>
        </div>
        <FormField label="Status">
          <select className={selectCls} value={form.status} onChange={e => set('status', e.target.value as FollowupStatus)}>
            <option value="pending">Pending</option>
            <option value="done">Done</option>
            <option value="overdue">Overdue</option>
          </select>
        </FormField>
        <FormField label="Linked Agenda (optional)">
          <select className={selectCls} value={form.agenda_id} onChange={e => set('agenda_id', e.target.value)}>
            <option value="">None</option>
            {agendas.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
          </select>
        </FormField>
        <FormField label="Linked Task (optional)">
          <select className={selectCls} value={form.task_id} onChange={e => set('task_id', e.target.value)}>
            <option value="">None</option>
            {tasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
        </FormField>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={loading}>{loading ? 'Saving...' : editing ? 'Save Changes' : 'Create Follow-up'}</Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Followup Row ─────────────────────────────────────────────
function FollowupRow({ f, onEdit, onDelete, onMarkDone }: {
  f: Followup
  onEdit: (_f: Followup) => void
  onDelete: (_id: string) => void
  onMarkDone: (_id: string) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const pri = PRIORITY_CONFIG[f.priority]
  const isOverdue = f.due_date && new Date(f.due_date) < new Date() && f.status === 'pending'
  const isDone = f.status === 'done'

  const statusIcon = isDone
    ? <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
    : isOverdue
    ? <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
    : <Clock className="w-5 h-5 text-amber-400 shrink-0" />

  return (
    <div className={cn('flex items-start gap-3 p-4 rounded-xl border transition-all group',
      isDone ? 'bg-slate-50 border-slate-100 opacity-70' : isOverdue ? 'bg-red-50 border-red-200' : 'bg-white border-slate-100 hover:shadow-sm'
    )}>
      <button onClick={() => !isDone && onMarkDone(f.id)} className="mt-0.5 shrink-0" title={isDone ? 'Done' : 'Mark as done'}>
        {statusIcon}
      </button>

      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-semibold', isDone ? 'line-through text-slate-400' : 'text-slate-800')}>
          {f.title}
        </p>
        {f.description && (
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{f.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <Badge label={pri.label} bg={pri.bg} text={pri.text} />
          {f.due_date && (
            <span className={cn('inline-flex items-center gap-1 text-xs font-medium', isOverdue ? 'text-red-600 font-semibold' : 'text-slate-400')}>
              <Calendar className="w-3 h-3" />
              {isOverdue ? 'Overdue · ' : ''}{formatDate(f.due_date)}
            </span>
          )}
          {isDone && <Badge label="Done" bg="bg-green-50" text="text-green-600" border="border-green-200" />}
        </div>
      </div>

      <div className="relative shrink-0">
        <button onClick={() => setMenuOpen(v => !v)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 opacity-0 group-hover:opacity-100 transition-all">
          <MoreHorizontal className="w-4 h-4" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-8 z-10 bg-white rounded-xl shadow-lg border border-slate-100 py-1 w-36" onMouseLeave={() => setMenuOpen(false)}>
            {!isDone && (
              <button onClick={() => { onMarkDone(f.id); setMenuOpen(false) }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-green-600 hover:bg-green-50">
                <CheckCircle2 className="w-3.5 h-3.5" /> Mark Done
              </button>
            )}
            <button onClick={() => { onEdit(f); setMenuOpen(false) }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
            <button onClick={() => { onDelete(f.id); setMenuOpen(false) }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────
export default function FollowupsClient({ initialFollowups, agendas, tasks, userId }: {
  initialFollowups: Followup[]
  agendas: { id: string; title: string }[]
  tasks: { id: string; title: string }[]
  userId: string
}) {
  const supabase = createClient()
  const [followups, setFollowups] = useState<Followup[]>(initialFollowups)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Followup | null>(null)
  const [filterStatus, setFilterStatus] = useState<FollowupStatus | 'all'>('all')

  const today = new Date()
  const pending = followups.filter(f => f.status === 'pending')
  const overdue = followups.filter(f => f.due_date && new Date(f.due_date) < today && f.status === 'pending')
  const done = followups.filter(f => f.status === 'done')

  const filtered = useMemo(() => {
    const now = new Date()
    const overdueList = followups.filter(f => f.due_date && new Date(f.due_date) < now && f.status === 'pending')
    let list = [...followups]
    if (filterStatus !== 'all') {
      if (filterStatus === 'overdue') list = overdueList
      else list = list.filter(f => f.status === filterStatus)
    }
    // Sort: overdue first, then by due_date asc, then no date
    return list.sort((a, b) => {
      const aOver = a.due_date && new Date(a.due_date) < now && a.status === 'pending'
      const bOver = b.due_date && new Date(b.due_date) < now && b.status === 'pending'
      if (aOver && !bOver) return -1
      if (!aOver && bOver) return 1
      if (a.due_date && b.due_date) return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      if (a.due_date) return -1
      if (b.due_date) return 1
      return 0
    })
  }, [followups, filterStatus])

  function openAdd() { setEditing(null); setModalOpen(true) }
  function openEdit(f: Followup) { setEditing(f); setModalOpen(true) }

  function handleSaved(f: Followup) {
    setFollowups(prev => prev.find(p => p.id === f.id) ? prev.map(p => p.id === f.id ? f : p) : [f, ...prev])
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this follow-up?')) return
    const { error } = await supabase.from('followups').delete().eq('id', id)
    if (error) toast.error(error.message)
    else { setFollowups(prev => prev.filter(f => f.id !== id)); toast.success('Deleted') }
  }

  async function handleMarkDone(id: string) {
    const { data, error } = await supabase.from('followups').update({ status: 'done' }).eq('id', id).select().single()
    if (error) toast.error(error.message)
    else { setFollowups(prev => prev.map(f => f.id === id ? data as Followup : f)); toast.success('Marked as done') }
  }

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Pending" value={pending.length} color="#F59E0B" icon={<Clock className="w-4 h-4" />} />
        <StatCard label="Overdue" value={overdue.length} sub="needs immediate attention" color="#EF4444" icon={<AlertCircle className="w-4 h-4" />} />
        <StatCard label="Done" value={done.length} color="#22C55E" icon={<CheckCircle2 className="w-4 h-4" />} />
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
          {([['all', 'All'], ['pending', 'Pending'], ['overdue', 'Overdue'], ['done', 'Done']] as [FollowupStatus | 'all', string][]).map(([val, label]) => (
            <button key={val} onClick={() => setFilterStatus(val)}
              className={cn('px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                filterStatus === val ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
              )}>
              {label}
              {val === 'overdue' && overdue.length > 0 && (
                <span className="ml-1.5 w-4 h-4 inline-flex items-center justify-center rounded-full bg-red-500 text-white text-xs">{overdue.length}</span>
              )}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <Button onClick={openAdd}><Plus className="w-4 h-4" /> New Follow-up</Button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-8 h-8" />}
          title={followups.length === 0 ? 'No follow-ups yet' : 'Nothing here'}
          description={followups.length === 0 ? 'Create follow-ups from meetings, tasks, or ad-hoc commitments. Never let anything slip.' : 'Try a different filter.'}
          action={followups.length === 0 ? <Button onClick={openAdd}><Plus className="w-4 h-4" /> Add Follow-up</Button> : undefined}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map(f => (
            <FollowupRow key={f.id} f={f} onEdit={openEdit} onDelete={handleDelete} onMarkDone={handleMarkDone} />
          ))}
        </div>
      )}

      <FollowupModal
        open={modalOpen} onClose={() => setModalOpen(false)}
        userId={userId} editing={editing}
        agendas={agendas} tasks={tasks}
        onSaved={handleSaved}
      />
    </>
  )
}
