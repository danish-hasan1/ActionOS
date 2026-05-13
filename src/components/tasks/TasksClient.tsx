'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Plus, Search, CheckSquare, LayoutGrid, List, Pencil, Trash2, Calendar, MoreHorizontal, GripVertical } from 'lucide-react'
import type { Task, TaskStatus, Priority, Phase } from '@/types'
import {
  Badge, EmptyState, Button, Modal, FormField,
  inputCls, selectCls, textareaCls, Card, PageHeader
} from '@/components/ui'
import { TASK_STATUS_CONFIG, PRIORITY_CONFIG, PHASE_CONFIG, formatDate, cn } from '@/lib/utils'

type ViewMode = 'list' | 'kanban'

// ─── Task Modal ───────────────────────────────────────────────
function TaskModal({
  open, onClose, userId, editing, painPoints, goals, onSaved
}: {
  open: boolean
  onClose: () => void
  userId: string
  editing?: Task | null
  painPoints: { id: string; title: string }[]
  goals: { id: string; title: string }[]
  onSaved: (t: Task) => void
}) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: editing?.title ?? '',
    description: editing?.description ?? '',
    status: (editing?.status ?? 'todo') as TaskStatus,
    priority: (editing?.priority ?? 'medium') as Priority,
    due_date: editing?.due_date ?? '',
    phase: (editing?.phase ?? '') as Phase | '',
    pain_point_id: editing?.pain_point_id ?? '',
    goal_id: editing?.goal_id ?? '',
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
      status: form.status,
      priority: form.priority,
      due_date: form.due_date || null,
      phase: form.phase || null,
      pain_point_id: form.pain_point_id || null,
      goal_id: form.goal_id || null,
      owner_id: userId,
    }
    let result
    if (editing) {
      result = await supabase.from('tasks').update(payload).eq('id', editing.id).select().single()
    } else {
      result = await supabase.from('tasks').insert(payload).select().single()
    }
    if (result.error) {
      toast.error(result.error.message)
    } else {
      toast.success(editing ? 'Task updated' : 'Task created')
      onSaved(result.data as Task)
      onClose()
    }
    setLoading(false)
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit Task' : 'New Task'}>
      <div className="space-y-4">
        <FormField label="Title" required>
          <input className={inputCls} value={form.title} onChange={e => set('title', e.target.value)} placeholder="What needs to be done?" />
        </FormField>

        <FormField label="Description">
          <textarea className={textareaCls} rows={2} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Additional context..." />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Status">
            <select className={selectCls} value={form.status} onChange={e => set('status', e.target.value as TaskStatus)}>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </FormField>
          <FormField label="Priority">
            <select className={selectCls} value={form.priority} onChange={e => set('priority', e.target.value as Priority)}>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Due Date">
            <input type="date" className={inputCls} value={form.due_date} onChange={e => set('due_date', e.target.value)} />
          </FormField>
          <FormField label="Phase">
            <select className={selectCls} value={form.phase} onChange={e => set('phase', e.target.value as Phase | '')}>
              <option value="">Unassigned</option>
              <option value="30">Phase 1 — Days 1–30</option>
              <option value="60">Phase 2 — Days 31–60</option>
              <option value="90">Phase 3 — Days 61–90</option>
            </select>
          </FormField>
        </div>

        <FormField label="Linked Pain Point">
          <select className={selectCls} value={form.pain_point_id} onChange={e => set('pain_point_id', e.target.value)}>
            <option value="">None</option>
            {painPoints.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </FormField>

        <FormField label="Linked Goal">
          <select className={selectCls} value={form.goal_id} onChange={e => set('goal_id', e.target.value)}>
            <option value="">None</option>
            {goals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
          </select>
        </FormField>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={loading}>
            {loading ? 'Saving...' : editing ? 'Save Changes' : 'Create Task'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Task Card (shared between list + kanban) ─────────────────
function TaskCard({ task, onEdit, onDelete, onStatusChange, compact = false }: {
  task: Task
  onEdit: (t: Task) => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, status: TaskStatus) => void
  compact?: boolean
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const stat = TASK_STATUS_CONFIG[task.status]
  const pri = PRIORITY_CONFIG[task.priority]
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done'

  return (
    <div className={cn(
      'bg-white rounded-xl border border-slate-100 group transition-shadow hover:shadow-md',
      compact ? 'p-3' : 'p-4'
    )}>
      <div className="flex items-start gap-2.5">
        {/* Checkbox */}
        <button
          onClick={() => onStatusChange(task.id, task.status === 'done' ? 'todo' : 'done')}
          className={cn(
            'mt-0.5 w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-all',
            task.status === 'done'
              ? 'bg-green-500 border-green-500'
              : 'border-slate-300 hover:border-[#1B3A5C]'
          )}
        >
          {task.status === 'done' && (
            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10">
              <path d="M1.5 5l2.5 2.5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <p className={cn(
            'text-sm font-medium leading-snug',
            task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-800'
          )}>
            {task.title}
          </p>

          {!compact && task.description && (
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">{task.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <Badge label={pri.label} bg={pri.bg} text={pri.text} />
            {task.phase && (
              <Badge label={PHASE_CONFIG[task.phase].label} bg={PHASE_CONFIG[task.phase].bg} text={PHASE_CONFIG[task.phase].text} />
            )}
            {task.due_date && (
              <span className={cn('inline-flex items-center gap-1 text-xs font-medium', isOverdue ? 'text-red-500' : 'text-slate-400')}>
                <Calendar className="w-3 h-3" />
                {formatDate(task.due_date)}
              </span>
            )}
          </div>
        </div>

        <div className="relative shrink-0">
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-100 text-slate-400 opacity-0 group-hover:opacity-100 transition-all"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-7 z-20 bg-white rounded-xl shadow-lg border border-slate-100 py-1 w-32" onMouseLeave={() => setMenuOpen(false)}>
              {/* Quick status change */}
              {task.status !== 'in_progress' && (
                <button onClick={() => { onStatusChange(task.id, 'in_progress'); setMenuOpen(false) }} className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50">
                  ▶ In Progress
                </button>
              )}
              {task.status !== 'todo' && (
                <button onClick={() => { onStatusChange(task.id, 'todo'); setMenuOpen(false) }} className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
                  ↩ To Do
                </button>
              )}
              <div className="h-px bg-slate-100 my-1" />
              <button onClick={() => { onEdit(task); setMenuOpen(false) }} className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
                <Pencil className="w-3 h-3" /> Edit
              </button>
              <button onClick={() => { onDelete(task.id); setMenuOpen(false) }} className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-red-500 hover:bg-red-50">
                <Trash2 className="w-3 h-3" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Kanban Column ────────────────────────────────────────────
const KANBAN_COLS: { status: TaskStatus; label: string; color: string; bg: string }[] = [
  { status: 'todo', label: 'To Do', color: 'text-slate-600', bg: 'bg-slate-50' },
  { status: 'in_progress', label: 'In Progress', color: 'text-blue-600', bg: 'bg-blue-50' },
  { status: 'done', label: 'Done', color: 'text-green-600', bg: 'bg-green-50' },
]

function KanbanView({ tasks, onEdit, onDelete, onStatusChange, onAdd }: {
  tasks: Task[]
  onEdit: (t: Task) => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, s: TaskStatus) => void
  onAdd: () => void
}) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {KANBAN_COLS.map(col => {
        const colTasks = tasks.filter(t => t.status === col.status)
        return (
          <div key={col.status} className="flex flex-col gap-3">
            <div className={cn('flex items-center justify-between px-3 py-2 rounded-xl', col.bg)}>
              <span className={cn('text-sm font-semibold', col.color)}>{col.label}</span>
              <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full bg-white shadow-sm', col.color)}>{colTasks.length}</span>
            </div>
            <div className="flex flex-col gap-2 min-h-[120px]">
              {colTasks.map(t => (
                <TaskCard key={t.id} task={t} onEdit={onEdit} onDelete={onDelete} onStatusChange={onStatusChange} compact />
              ))}
              {colTasks.length === 0 && (
                <div className="flex items-center justify-center h-20 rounded-xl border-2 border-dashed border-slate-200">
                  <p className="text-xs text-slate-300">No tasks</p>
                </div>
              )}
            </div>
            {col.status === 'todo' && (
              <button onClick={onAdd} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors border-2 border-dashed border-slate-200">
                <Plus className="w-3.5 h-3.5" /> Add task
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────
export default function TasksClient({ initialTasks, painPoints, goals, userId }: {
  initialTasks: Task[]
  painPoints: { id: string; title: string }[]
  goals: { id: string; title: string }[]
  userId: string
}) {
  const supabase = createClient()
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)
  const [view, setView] = useState<ViewMode>('list')
  const [search, setSearch] = useState('')
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all')
  const [filterPhase, setFilterPhase] = useState<Phase | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all')

  const filtered = useMemo(() => tasks.filter(t => {
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false
    if (filterPhase !== 'all' && t.phase !== filterPhase) return false
    if (filterStatus !== 'all' && t.status !== filterStatus) return false
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [tasks, search, filterPriority, filterPhase, filterStatus])

  const counts = {
    todo: tasks.filter(t => t.status === 'todo').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    done: tasks.filter(t => t.status === 'done').length,
  }

  function openAdd() { setEditing(null); setModalOpen(true) }
  function openEdit(t: Task) { setEditing(t); setModalOpen(true) }

  function handleSaved(t: Task) {
    setTasks(prev => prev.find(p => p.id === t.id) ? prev.map(p => p.id === t.id ? t : p) : [t, ...prev])
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this task?')) return
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) toast.error(error.message)
    else { setTasks(prev => prev.filter(t => t.id !== id)); toast.success('Task deleted') }
  }

  async function handleStatusChange(id: string, status: TaskStatus) {
    const { data, error } = await supabase.from('tasks').update({ status }).eq('id', id).select().single()
    if (error) toast.error(error.message)
    else setTasks(prev => prev.map(t => t.id === id ? data as Task : t))
  }

  return (
    <>
      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'To Do', value: counts.todo, color: '#64748B' },
          { label: 'In Progress', value: counts.in_progress, color: '#3B82F6' },
          { label: 'Done', value: counts.done, color: '#22C55E' },
        ].map(s => (
          <Card key={s.label} className="px-5 py-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{s.label}</p>
            <p className="text-2xl font-bold mt-0.5" style={{ color: s.color, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]/30 focus:border-[#1B3A5C]"
            placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <select className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 focus:outline-none cursor-pointer"
          value={filterStatus} onChange={e => setFilterStatus(e.target.value as TaskStatus | 'all')}>
          <option value="all">All Statuses</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>

        <select className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 focus:outline-none cursor-pointer"
          value={filterPriority} onChange={e => setFilterPriority(e.target.value as Priority | 'all')}>
          <option value="all">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <select className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 focus:outline-none cursor-pointer"
          value={filterPhase} onChange={e => setFilterPhase(e.target.value as Phase | 'all')}>
          <option value="all">All Phases</option>
          <option value="30">Phase 1 (30)</option>
          <option value="60">Phase 2 (60)</option>
          <option value="90">Phase 3 (90)</option>
        </select>

        {/* View toggle */}
        <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1">
          <button onClick={() => setView('list')} className={cn('p-1.5 rounded-lg transition-colors', view === 'list' ? 'bg-[#1B3A5C] text-white' : 'text-slate-400 hover:text-slate-600')}>
            <List className="w-4 h-4" />
          </button>
          <button onClick={() => setView('kanban')} className={cn('p-1.5 rounded-lg transition-colors', view === 'kanban' ? 'bg-[#1B3A5C] text-white' : 'text-slate-400 hover:text-slate-600')}>
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>

        <Button onClick={openAdd}><Plus className="w-4 h-4" /> New Task</Button>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<CheckSquare className="w-8 h-8" />}
          title={tasks.length === 0 ? 'No tasks yet' : 'No matches'}
          description={tasks.length === 0 ? 'Create your first task — link it to a pain point or goal to track progress.' : 'Try adjusting your filters.'}
          action={tasks.length === 0 ? <Button onClick={openAdd}><Plus className="w-4 h-4" /> Create First Task</Button> : undefined}
        />
      ) : view === 'kanban' ? (
        <KanbanView tasks={filtered} onEdit={openEdit} onDelete={handleDelete} onStatusChange={handleStatusChange} onAdd={openAdd} />
      ) : (
        <div className="space-y-2">
          {filtered.map(t => (
            <TaskCard key={t.id} task={t} onEdit={openEdit} onDelete={handleDelete} onStatusChange={handleStatusChange} />
          ))}
        </div>
      )}

      <TaskModal
        open={modalOpen} onClose={() => setModalOpen(false)}
        userId={userId} editing={editing}
        painPoints={painPoints} goals={goals}
        onSaved={handleSaved}
      />
    </>
  )
}
