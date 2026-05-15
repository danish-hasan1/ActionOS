'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { upsertMilestone, updateMilestoneStatus, deleteMilestone } from '@/lib/actions'
import { Plus, Map, Pencil, Trash2, Calendar, CheckCircle2, AlertTriangle, Clock, Circle } from 'lucide-react'
import type { Milestone, MilestoneStatus, Phase } from '@/types'
import {
  Badge, EmptyState, Button, Modal, FormField,
  inputCls, selectCls, textareaCls, Card, ProgressBar
} from '@/components/ui'
import { PHASE_CONFIG, formatDate, cn } from '@/lib/utils'

const STATUS_CONFIG: Record<MilestoneStatus, { label: string; icon: React.ReactNode; color: string; bg: string; border: string }> = {
  not_started: { label: 'Not Started', icon: <Circle className="w-4 h-4" />, color: 'text-slate-500', bg: 'bg-slate-100', border: 'border-slate-200' },
  on_track:    { label: 'On Track',    icon: <Clock className="w-4 h-4" />,   color: 'text-blue-600',  bg: 'bg-blue-50',   border: 'border-blue-200' },
  at_risk:     { label: 'At Risk',     icon: <AlertTriangle className="w-4 h-4" />, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-200' },
  complete:    { label: 'Complete',    icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
}

// ─── Milestone Modal ──────────────────────────────────────────
function MilestoneModal({ open, onClose, userId, editing, goals, onSaved }: {
  open: boolean
  onClose: () => void
  userId: string
  editing?: Milestone | null
  goals: { id: string; title: string }[]
  onSaved: (m: Milestone) => void
}) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: editing?.title ?? '',
    phase: (editing?.phase ?? '30') as Phase,
    start_date: editing?.start_date ?? '',
    end_date: editing?.end_date ?? '',
    status: (editing?.status ?? 'not_started') as MilestoneStatus,
    notes: editing?.notes ?? '',
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
      phase: form.phase,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      status: form.status,
      notes: form.notes || null,
      goal_id: form.goal_id || null,
      owner_id: userId,
    }
    const result = await upsertMilestone(payload, editing?.id)
    if (result.error) { toast.error(result.error) }
    else {
      toast.success(editing ? 'Milestone updated' : 'Milestone created')
      onSaved(result.data as Milestone)
      onClose()
    }
    setLoading(false)
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit Milestone' : 'New Milestone'}>
      <div className="space-y-4">
        <FormField label="Milestone Title" required>
          <input className={inputCls} value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Complete stakeholder 1:1s" />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Phase" required>
            <select className={selectCls} value={form.phase} onChange={e => set('phase', e.target.value as Phase)}>
              <option value="30">Phase 1 — Days 1–30</option>
              <option value="60">Phase 2 — Days 31–60</option>
              <option value="90">Phase 3 — Days 61–90</option>
            </select>
          </FormField>
          <FormField label="Status">
            <select className={selectCls} value={form.status} onChange={e => set('status', e.target.value as MilestoneStatus)}>
              <option value="not_started">Not Started</option>
              <option value="on_track">On Track</option>
              <option value="at_risk">At Risk</option>
              <option value="complete">Complete</option>
            </select>
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Start Date">
            <input type="date" className={inputCls} value={form.start_date} onChange={e => set('start_date', e.target.value)} />
          </FormField>
          <FormField label="End Date">
            <input type="date" className={inputCls} value={form.end_date} onChange={e => set('end_date', e.target.value)} />
          </FormField>
        </div>
        <FormField label="Linked Goal (optional)">
          <select className={selectCls} value={form.goal_id} onChange={e => set('goal_id', e.target.value)}>
            <option value="">None</option>
            {goals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
          </select>
        </FormField>
        <FormField label="Notes">
          <textarea className={textareaCls} rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Additional context..." />
        </FormField>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={loading}>{loading ? 'Saving...' : editing ? 'Save Changes' : 'Create Milestone'}</Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Milestone Row ────────────────────────────────────────────
function MilestoneRow({ m, onEdit, onDelete, onStatusCycle }: {
  m: Milestone
  onEdit: (_m: Milestone) => void
  onDelete: (_id: string) => void
  onStatusCycle: (_m: Milestone) => void
}) {
  const cfg = STATUS_CONFIG[m.status]
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0 group">
      {/* Status toggle button */}
      <button
        onClick={() => onStatusCycle(m)}
        className={cn('mt-0.5 p-1 rounded-lg transition-colors shrink-0', cfg.color, cfg.bg, 'hover:opacity-80')}
        title="Click to cycle status"
      >
        {cfg.icon}
      </button>

      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-semibold', m.status === 'complete' ? 'line-through text-slate-400' : 'text-slate-800')}>
          {m.title}
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <span className={cn('inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border', cfg.color, cfg.bg, cfg.border)}>
            {cfg.label}
          </span>
          {(m.start_date || m.end_date) && (
            <span className="inline-flex items-center gap-1 text-xs text-slate-400">
              <Calendar className="w-3 h-3" />
              {m.start_date ? formatDate(m.start_date) : '—'}
              {m.end_date ? ` → ${formatDate(m.end_date)}` : ''}
            </span>
          )}
        </div>
        {m.notes && <p className="text-xs text-slate-400 mt-1 line-clamp-1">{m.notes}</p>}
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button onClick={() => onEdit(m)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => onDelete(m.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

const STATUS_CYCLE: Record<MilestoneStatus, MilestoneStatus> = {
  not_started: 'on_track',
  on_track: 'complete',
  at_risk: 'complete',
  complete: 'not_started',
}

const PHASES: { phase: Phase; label: string; focus: string; days: string }[] = [
  { phase: '30', label: 'Phase 1', focus: 'Learn & Listen', days: 'Days 1–30' },
  { phase: '60', label: 'Phase 2', focus: 'Fix & Build',    days: 'Days 31–60' },
  { phase: '90', label: 'Phase 3', focus: 'Scale & Optimise', days: 'Days 61–90' },
]

// ─── Main Component ───────────────────────────────────────────
export default function RoadmapClient({ initialMilestones, goals, userId }: {
  initialMilestones: Milestone[]
  goals: { id: string; title: string }[]
  userId: string
}) {
  const [milestones, setMilestones] = useState<Milestone[]>(initialMilestones)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Milestone | null>(null)
  const [defaultPhase, setDefaultPhase] = useState<Phase>('30')

  function openAdd(phase: Phase = '30') { setDefaultPhase(phase); setEditing(null); setModalOpen(true) }
  function openEdit(m: Milestone) { setEditing(m); setModalOpen(true) }

  function handleSaved(m: Milestone) {
    setMilestones(prev => prev.find(p => p.id === m.id) ? prev.map(p => p.id === m.id ? m : p) : [...prev, m])
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this milestone?')) return
    const { error } = await deleteMilestone(id)
    if (error) toast.error(error)
    else { setMilestones(prev => prev.filter(m => m.id !== id)); toast.success('Deleted') }
  }

  async function handleStatusCycle(m: Milestone) {
    const nextStatus = STATUS_CYCLE[m.status]
    const { data, error } = await updateMilestoneStatus(m.id, nextStatus)
    if (error) toast.error(error)
    else setMilestones(prev => prev.map(p => p.id === m.id ? data as Milestone : p))
  }

  return (
    <>
      <div className="flex justify-end mb-6">
        <Button onClick={() => openAdd()}><Plus className="w-4 h-4" /> Add Milestone</Button>
      </div>

      {milestones.length === 0 && (
        <EmptyState
          icon={<Map className="w-8 h-8" />}
          title="No milestones yet"
          description="Build your 30/60/90 day roadmap. Add milestones to each phase and track them to completion."
          action={<Button onClick={() => openAdd()}><Plus className="w-4 h-4" /> Add First Milestone</Button>}
        />
      )}

      {/* Phase lanes */}
      <div className="space-y-5">
        {PHASES.map(({ phase, label, focus, days }) => {
          const phaseMilestones = milestones.filter(m => m.phase === phase)
          const complete = phaseMilestones.filter(m => m.status === 'complete').length
          const atRisk = phaseMilestones.filter(m => m.status === 'at_risk').length
          const pct = phaseMilestones.length > 0 ? Math.round((complete / phaseMilestones.length) * 100) : 0
          const cfg = PHASE_CONFIG[phase]

          return (
            <Card key={phase} className="overflow-hidden">
              {/* Phase header */}
              <div className="px-5 py-4 border-b border-slate-100" style={{ backgroundColor: `${cfg.color}0D` }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: cfg.color }}>
                      {label.split(' ')[1]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-800 text-sm" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{label} — {focus}</h3>
                        {atRisk > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 text-xs font-semibold">
                            <AlertTriangle className="w-3 h-3" />{atRisk} at risk
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">{days} · {phaseMilestones.length} milestone{phaseMilestones.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Progress</p>
                      <p className="text-sm font-bold" style={{ color: cfg.color }}>{pct}%</p>
                    </div>
                    <button
                      onClick={() => openAdd(phase)}
                      className="p-1.5 rounded-lg hover:bg-white/60 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {phaseMilestones.length > 0 && (
                  <div className="mt-3">
                    <ProgressBar pct={pct} color={cfg.color} height="h-1.5" />
                  </div>
                )}
              </div>

              {/* Milestones */}
              <div className="px-5">
                {phaseMilestones.length === 0 ? (
                  <button
                    onClick={() => openAdd(phase)}
                    className="w-full py-4 flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Add a milestone to this phase
                  </button>
                ) : (
                  phaseMilestones.map(m => (
                    <MilestoneRow key={m.id} m={m} onEdit={openEdit} onDelete={handleDelete} onStatusCycle={handleStatusCycle} />
                  ))
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mt-6 px-1">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Status legend:</p>
        {Object.entries(STATUS_CONFIG).map(([k, v]) => (
          <span key={k} className={cn('inline-flex items-center gap-1.5 text-xs font-medium', v.color)}>
            {v.icon}{v.label}
          </span>
        ))}
        <p className="text-xs text-slate-400 ml-2">Click status icon to cycle</p>
      </div>

      <MilestoneModal
        open={modalOpen} onClose={() => setModalOpen(false)}
        userId={userId} editing={editing} goals={goals}
        onSaved={handleSaved}
      />
    </>
  )
}
