'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Plus, Target, Pencil, Trash2, CheckCircle2, Circle, TrendingUp } from 'lucide-react'
import type { Goal, GoalType, GoalStatus, Phase } from '@/types'
import {
  Badge, ProgressBar, EmptyState, Button, Modal, FormField,
  inputCls, selectCls, textareaCls, Card, StatCard
} from '@/components/ui'
import { GOAL_STATUS_CONFIG, PHASE_CONFIG, formatDate, cn } from '@/lib/utils'

type LinkedTask = { id: string; title: string; status: string; goal_id: string | null }

// ─── Goal Modal ───────────────────────────────────────────────
function GoalModal({ open, onClose, userId, editing, onSaved }: {
  open: boolean
  onClose: () => void
  userId: string
  editing?: Goal | null
  onSaved: (_: Goal) => void
}) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: editing?.title ?? '',
    description: editing?.description ?? '',
    type: (editing?.type ?? 'short_term') as GoalType,
    phase: (editing?.phase ?? '30') as Phase,
    target_date: editing?.target_date ?? '',
    status: (editing?.status ?? 'not_started') as GoalStatus,
    progress_pct: editing?.progress_pct ?? 0,
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
      type: form.type,
      phase: form.phase,
      target_date: form.target_date || null,
      status: form.status,
      progress_pct: form.progress_pct,
      owner_id: userId,
    }
    let result
    if (editing) {
      result = await supabase.from('goals').update(payload).eq('id', editing.id).select().single()
    } else {
      result = await supabase.from('goals').insert(payload).select().single()
    }
    if (result.error) {
      toast.error(result.error.message)
    } else {
      toast.success(editing ? 'Goal updated' : 'Goal created')
      onSaved(result.data as Goal)
      onClose()
    }
    setLoading(false)
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit Goal' : 'New Goal'}>
      <div className="space-y-4">
        <FormField label="Goal Title" required>
          <input className={inputCls} value={form.title} onChange={e => set('title', e.target.value)} placeholder="What do you want to achieve?" />
        </FormField>

        <FormField label="Description">
          <textarea className={textareaCls} rows={2} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Why does this goal matter?" />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Type">
            <select className={selectCls} value={form.type} onChange={e => set('type', e.target.value as GoalType)}>
              <option value="short_term">Short Term (30 days)</option>
              <option value="long_term">Long Term (60–90 days)</option>
            </select>
          </FormField>
          <FormField label="Phase">
            <select className={selectCls} value={form.phase} onChange={e => set('phase', e.target.value as Phase)}>
              <option value="30">Phase 1 — Days 1–30</option>
              <option value="60">Phase 2 — Days 31–60</option>
              <option value="90">Phase 3 — Days 61–90</option>
            </select>
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Status">
            <select className={selectCls} value={form.status} onChange={e => set('status', e.target.value as GoalStatus)}>
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="at_risk">At Risk</option>
              <option value="complete">Complete</option>
            </select>
          </FormField>
          <FormField label="Target Date">
            <input type="date" className={inputCls} value={form.target_date} onChange={e => set('target_date', e.target.value)} />
          </FormField>
        </div>

        <FormField label={`Progress — ${form.progress_pct}%`} hint="Drag to set manual progress, or link tasks to auto-calculate">
          <div className="space-y-2">
            <input
              type="range" min={0} max={100} step={5}
              value={form.progress_pct}
              onChange={e => set('progress_pct', Number(e.target.value))}
              className="w-full accent-indigo-600"
            />
            <ProgressBar pct={form.progress_pct} color="#4F46E5" height="h-2" />
          </div>
        </FormField>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={loading}>
            {loading ? 'Saving...' : editing ? 'Save Changes' : 'Create Goal'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Goal Card ────────────────────────────────────────────────
function GoalCard({ goal, linkedTasks, onEdit, onDelete, onProgressUpdate }: {
  goal: Goal
  linkedTasks: LinkedTask[]
  onEdit: (_g: Goal) => void
  onDelete: (_id: string) => void
  onProgressUpdate?: (_id: string, _pct: number) => void
}) {
  const stat = GOAL_STATUS_CONFIG[goal.status]
  const isShort = goal.type === 'short_term'
  const progressColor = isShort ? '#7C3AED' : '#10B981'
  const doneTasks = linkedTasks.filter(t => t.status === 'done').length
  const totalTasks = linkedTasks.length

  // Auto-calc from tasks if linked
  const displayPct = totalTasks > 0
    ? Math.round((doneTasks / totalTasks) * 100)
    : goal.progress_pct

  return (
    <Card className="p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5', isShort ? 'bg-violet-100' : 'bg-emerald-100')}>
            <Target className={cn('w-5 h-5', isShort ? 'text-violet-600' : 'text-emerald-600')} />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-slate-800 text-sm leading-snug" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              {goal.title}
            </h3>
            {goal.description && (
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{goal.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={() => onEdit(goal)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(goal.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-3">
        <ProgressBar pct={displayPct} color={progressColor} height="h-2.5" showLabel label={totalTasks > 0 ? `${doneTasks}/${totalTasks} tasks done` : 'Manual'} />
      </div>

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Badge label={isShort ? 'Short Term' : 'Long Term'} bg={isShort ? 'bg-violet-50' : 'bg-emerald-50'} text={isShort ? 'text-violet-700' : 'text-emerald-700'} border={isShort ? 'border-violet-200' : 'border-emerald-200'} />
        <Badge label={stat.label} bg={stat.bg} text={stat.text} border="border-transparent" />
        {goal.phase && (
          <Badge label={PHASE_CONFIG[goal.phase].label} bg={PHASE_CONFIG[goal.phase].bg} text={PHASE_CONFIG[goal.phase].text} />
        )}
        {goal.target_date && (
          <span className="text-xs text-slate-400">Due {formatDate(goal.target_date)}</span>
        )}
      </div>

      {/* Linked tasks preview */}
      {linkedTasks.length > 0 && (
        <div className="border-t border-slate-100 pt-3 space-y-1.5">
          {linkedTasks.slice(0, 3).map(t => (
            <div key={t.id} className="flex items-center gap-2">
              {t.status === 'done'
                ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                : <Circle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              }
              <p className={cn('text-xs line-clamp-1', t.status === 'done' ? 'line-through text-slate-400' : 'text-slate-600')}>{t.title}</p>
            </div>
          ))}
          {linkedTasks.length > 3 && (
            <p className="text-xs text-slate-400 pl-5">+{linkedTasks.length - 3} more tasks</p>
          )}
        </div>
      )}
    </Card>
  )
}

// ─── Main Component ───────────────────────────────────────────
export default function GoalsClient({ initialGoals, allTasks, userId }: {
  initialGoals: Goal[]
  allTasks: LinkedTask[]
  userId: string
}) {
  const supabase = createClient()
  const [goals, setGoals] = useState<Goal[]>(initialGoals)
  const [tasks] = useState<LinkedTask[]>(allTasks)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Goal | null>(null)
  const [activeTab, setActiveTab] = useState<GoalType | 'all'>('all')

  const filtered = useMemo(() =>
    activeTab === 'all' ? goals : goals.filter(g => g.type === activeTab),
    [goals, activeTab]
  )

  const shortTerm = goals.filter(g => g.type === 'short_term')
  const longTerm = goals.filter(g => g.type === 'long_term')
  const complete = goals.filter(g => g.status === 'complete')

  // Overall avg progress
  const avgProgress = goals.length > 0
    ? Math.round(goals.reduce((a, g) => {
        const linked = tasks.filter(t => t.goal_id === g.id)
        const pct = linked.length > 0
          ? Math.round((linked.filter(t => t.status === 'done').length / linked.length) * 100)
          : g.progress_pct
        return a + pct
      }, 0) / goals.length)
    : 0

  function openAdd() { setEditing(null); setModalOpen(true) }
  function openEdit(g: Goal) { setEditing(g); setModalOpen(true) }

  function handleSaved(g: Goal) {
    setGoals(prev => prev.find(p => p.id === g.id) ? prev.map(p => p.id === g.id ? g : p) : [g, ...prev])
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this goal?')) return
    const { error } = await supabase.from('goals').delete().eq('id', id)
    if (error) toast.error(error.message)
    else { setGoals(prev => prev.filter(g => g.id !== id)); toast.success('Goal deleted') }
  }


  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Goals" value={goals.length} color="#4F46E5" icon={<Target className="w-4 h-4" />} />
        <StatCard label="Short Term" value={shortTerm.length} sub="30-day wins" color="#7C3AED" icon={<TrendingUp className="w-4 h-4" />} />
        <StatCard label="Long Term" value={longTerm.length} sub="strategic" color="#10B981" icon={<TrendingUp className="w-4 h-4" />} />
        <StatCard label="Avg Progress" value={`${avgProgress}%`} sub={`${complete.length} complete`} color="#F59E0B" icon={<CheckCircle2 className="w-4 h-4" />} />
      </div>

      {/* Overall progress bar */}
      {goals.length > 0 && (
        <Card className="p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-bold text-gray-900" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Overall Goal Progress</p>
              <p className="text-xs text-slate-400 mt-0.5">Across all {goals.length} goals</p>
            </div>
            <span className="text-2xl font-bold text-[#F59E0B]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{avgProgress}%</span>
          </div>
          <ProgressBar pct={avgProgress} color="#F59E0B" height="h-3" />

          {/* Per-phase breakdown */}
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-100">
            {(['30', '60', '90'] as Phase[]).map(phase => {
              const phaseGoals = goals.filter(g => g.phase === phase)
              const phasePct = phaseGoals.length > 0
                ? Math.round(phaseGoals.reduce((a, g) => a + g.progress_pct, 0) / phaseGoals.length)
                : 0
              const cfg = PHASE_CONFIG[phase]
              return (
                <div key={phase}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-medium text-slate-500">{cfg.label}</span>
                    <span className="text-xs font-bold" style={{ color: cfg.color }}>{phasePct}%</span>
                  </div>
                  <ProgressBar pct={phasePct} color={cfg.color} height="h-1.5" />
                  <p className="text-xs text-slate-400 mt-1">{phaseGoals.length} goal{phaseGoals.length !== 1 ? 's' : ''}</p>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Tabs + Add */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
          {([['all', 'All'], ['short_term', 'Short Term'], ['long_term', 'Long Term']] as [GoalType | 'all', string][]).map(([val, label]) => (
            <button key={val} onClick={() => setActiveTab(val)}
              className={cn('px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
                activeTab === val ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
              )}>
              {label}
            </button>
          ))}
        </div>
        <Button onClick={openAdd}><Plus className="w-4 h-4" /> New Goal</Button>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Target className="w-8 h-8" />}
          title={goals.length === 0 ? 'No goals set yet' : 'No goals in this category'}
          description={goals.length === 0 ? 'Define your short-term wins and long-term targets. Link tasks to auto-track progress.' : undefined}
          action={goals.length === 0 ? <Button onClick={openAdd}><Plus className="w-4 h-4" /> Set Your First Goal</Button> : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(g => (
            <GoalCard
              key={g.id}
              goal={g}
              linkedTasks={tasks.filter(t => t.goal_id === g.id)}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <GoalModal
        open={modalOpen} onClose={() => setModalOpen(false)}
        userId={userId} editing={editing} onSaved={handleSaved}
      />
    </>
  )
}
