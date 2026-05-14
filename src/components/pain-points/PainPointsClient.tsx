'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Plus, Search, AlertTriangle, Pencil, Trash2, MoreHorizontal } from 'lucide-react'
import type { PainPoint, Tag, Severity, PainPointStatus, Phase } from '@/types'
import {
  Badge, TagBadge, EmptyState, Button, Modal, FormField,
  inputCls, selectCls, textareaCls, Card
} from '@/components/ui'
import { SEVERITY_CONFIG, PAIN_STATUS_CONFIG, PHASE_CONFIG, formatDate, cn } from '@/lib/utils'

// ─── Add / Edit Modal ─────────────────────────────────────────
function PainPointModal({
  open, onClose, tags, userId, editing, onSaved
}: {
  open: boolean
  onClose: () => void
  tags: Tag[]
  userId: string
  editing?: PainPoint | null
  onSaved: (_: PainPoint) => void
}) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: editing?.title ?? '',
    description: editing?.description ?? '',
    severity: (editing?.severity ?? 'medium') as Severity,
    status: (editing?.status ?? 'open') as PainPointStatus,
    phase: (editing?.phase ?? '') as Phase | '',
    notes: editing?.notes ?? '',
    tag_ids: editing?.tag_ids ?? [] as string[],
  })

  function set<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm(f => ({ ...f, [k]: v }))
  }

  function toggleTag(id: string) {
    set('tag_ids', form.tag_ids.includes(id)
      ? form.tag_ids.filter(t => t !== id)
      : [...form.tag_ids, id]
    )
  }

  async function save() {
    if (!form.title.trim()) return toast.error('Title is required')
    setLoading(true)
    const payload = {
      title: form.title.trim(),
      description: form.description || null,
      severity: form.severity,
      status: form.status,
      phase: form.phase || null,
      notes: form.notes || null,
      tag_ids: form.tag_ids,
      owner_id: userId,
    }
    let result
    if (editing) {
      result = await supabase.from('pain_points').update(payload).eq('id', editing.id).select().single()
    } else {
      result = await supabase.from('pain_points').insert(payload).select().single()
    }
    if (result.error) {
      toast.error(result.error.message)
    } else {
      toast.success(editing ? 'Pain point updated' : 'Pain point logged')
      onSaved(result.data as PainPoint)
      onClose()
    }
    setLoading(false)
  }

  // Group tags
  const ownerTags = tags.filter(t => t.category === 'owner')
  const catTags = tags.filter(t => t.category === 'category')

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit Pain Point' : 'Log New Pain Point'}>
      <div className="space-y-4">
        <FormField label="Title" required>
          <input className={inputCls} value={form.title} onChange={e => set('title', e.target.value)} placeholder="What is the issue?" />
        </FormField>

        <FormField label="Description">
          <textarea className={textareaCls} rows={3} value={form.description} onChange={e => set('description', e.target.value)} placeholder="More detail about the pain point..." />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Severity" required>
            <select className={selectCls} value={form.severity} onChange={e => set('severity', e.target.value as Severity)}>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </FormField>
          <FormField label="Status">
            <select className={selectCls} value={form.status} onChange={e => set('status', e.target.value as PainPointStatus)}>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </FormField>
        </div>

        <FormField label="Phase">
          <select className={selectCls} value={form.phase} onChange={e => set('phase', e.target.value as Phase | '')}>
            <option value="">Unassigned</option>
            <option value="30">Phase 1 — Days 1–30</option>
            <option value="60">Phase 2 — Days 31–60</option>
            <option value="90">Phase 3 — Days 61–90</option>
          </select>
        </FormField>

        <FormField label="Owner Tags">
          <div className="flex flex-wrap gap-2 p-3 border border-slate-200 rounded-xl bg-slate-50 min-h-[44px]">
            {ownerTags.map(tag => (
              <button key={tag.id} onClick={() => toggleTag(tag.id)}
                className={cn('px-2.5 py-1 rounded-full text-xs font-medium border transition-all',
                  form.tag_ids.includes(tag.id) ? 'ring-2 ring-offset-1' : 'opacity-60 hover:opacity-100'
                )}
                style={{
                  backgroundColor: `${tag.color}18`, color: tag.color,
                  borderColor: `${tag.color}40`,
                  outline: form.tag_ids.includes(tag.id) ? `2px solid ${tag.color}` : undefined,
                  outlineOffset: '2px'
                }}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </FormField>

        <FormField label="Category Tags">
          <div className="flex flex-wrap gap-2 p-3 border border-slate-200 rounded-xl bg-slate-50 min-h-[44px]">
            {catTags.map(tag => (
              <button key={tag.id} onClick={() => toggleTag(tag.id)}
                className={cn('px-2.5 py-1 rounded-full text-xs font-medium border transition-all',
                  form.tag_ids.includes(tag.id) ? 'ring-2 ring-offset-1' : 'opacity-60 hover:opacity-100'
                )}
                style={{ backgroundColor: `${tag.color}18`, color: tag.color, borderColor: `${tag.color}40` }}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </FormField>

        <FormField label="Internal Notes">
          <textarea className={textareaCls} rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Private notes (not shown in leadership reports)" />
        </FormField>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={loading}>
            {loading ? 'Saving...' : editing ? 'Save Changes' : 'Log Pain Point'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Pain Point Row Card ──────────────────────────────────────
function PainPointCard({
  pp, tags, onEdit, onDelete
}: {
  pp: PainPoint
  tags: Tag[]
  onEdit: (_pp: PainPoint) => void
  onDelete: (_id: string) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const sev = SEVERITY_CONFIG[pp.severity]
  const stat = PAIN_STATUS_CONFIG[pp.status]
  const ppTags = tags.filter(t => pp.tag_ids?.includes(t.id))

  return (
    <Card className="p-4 hover:shadow-md transition-shadow group">
      <div className="flex items-start gap-3">
        {/* Severity dot */}
        <div className={cn('w-2.5 h-2.5 rounded-full shrink-0 mt-1.5', sev.dot)} />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-slate-800 text-sm leading-snug group-hover:text-[#1B3A5C] transition-colors" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              {pp.title}
            </h3>
            <div className="relative shrink-0">
              <button
                onClick={() => setMenuOpen(v => !v)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors opacity-0 group-hover:opacity-100"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-8 z-10 bg-white rounded-xl shadow-lg border border-slate-100 py-1 w-36" onMouseLeave={() => setMenuOpen(false)}>
                  <button onClick={() => { onEdit(pp); setMenuOpen(false) }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={() => { onDelete(pp.id); setMenuOpen(false) }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              )}
            </div>
          </div>

          {pp.description && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{pp.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-2.5">
            <Badge label={sev.label} bg={sev.bg} text={sev.text} border={sev.border} />
            <Badge label={stat.label} bg={stat.bg} text={stat.text} border={stat.border} />
            {pp.phase && (
              <Badge
                label={PHASE_CONFIG[pp.phase].label}
                bg={PHASE_CONFIG[pp.phase].bg}
                text={PHASE_CONFIG[pp.phase].text}
              />
            )}
            {ppTags.map(tag => <TagBadge key={tag.id} name={tag.name} color={tag.color} />)}
          </div>

          <p className="text-xs text-slate-400 mt-2">{formatDate(pp.created_at)}</p>
        </div>
      </div>
    </Card>
  )
}

// ─── Main Client Component ─────────────────────────────────────
export default function PainPointsClient({
  initialPainPoints, tags, userId
}: {
  initialPainPoints: PainPoint[]
  tags: Tag[]
  userId: string
}) {
  const supabase = createClient()
  const [painPoints, setPainPoints] = useState<PainPoint[]>(initialPainPoints)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<PainPoint | null>(null)
  const [search, setSearch] = useState('')
  const [filterSeverity, setFilterSeverity] = useState<Severity | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<PainPointStatus | 'all'>('all')
  const [filterPhase, setFilterPhase] = useState<Phase | 'all'>('all')

  const filtered = useMemo(() => {
    return painPoints.filter(pp => {
      if (filterSeverity !== 'all' && pp.severity !== filterSeverity) return false
      if (filterStatus !== 'all' && pp.status !== filterStatus) return false
      if (filterPhase !== 'all' && pp.phase !== filterPhase) return false
      if (search && !pp.title.toLowerCase().includes(search.toLowerCase()) &&
        !pp.description?.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [painPoints, search, filterSeverity, filterStatus, filterPhase])

  // Counts
  const counts = {
    critical: painPoints.filter(p => p.severity === 'critical').length,
    open: painPoints.filter(p => p.status === 'open').length,
    resolved: painPoints.filter(p => p.status === 'resolved').length,
  }

  function openAdd() { setEditing(null); setModalOpen(true) }
  function openEdit(pp: PainPoint) { setEditing(pp); setModalOpen(true) }

  function handleSaved(pp: PainPoint) {
    setPainPoints(prev => {
      const exists = prev.find(p => p.id === pp.id)
      return exists ? prev.map(p => p.id === pp.id ? pp : p) : [pp, ...prev]
    })
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this pain point? This cannot be undone.')) return
    const { error } = await supabase.from('pain_points').delete().eq('id', id)
    if (error) toast.error(error.message)
    else { setPainPoints(prev => prev.filter(p => p.id !== id)); toast.success('Deleted') }
  }

  return (
    <>
      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total', value: painPoints.length, color: '#1B3A5C' },
          { label: 'Critical', value: counts.critical, color: '#EF4444' },
          { label: 'Open', value: counts.open, color: '#F59E0B' },
        ].map(s => (
          <Card key={s.label} className="px-5 py-4 flex items-center gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{s.label}</p>
              <p className="text-2xl font-bold mt-0.5" style={{ color: s.color, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{s.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]/30 focus:border-[#1B3A5C]"
            placeholder="Search pain points..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]/30 cursor-pointer"
          value={filterSeverity} onChange={e => setFilterSeverity(e.target.value as Severity | 'all')}>
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]/30 cursor-pointer"
          value={filterStatus} onChange={e => setFilterStatus(e.target.value as PainPointStatus | 'all')}>
          <option value="all">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
        <select className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]/30 cursor-pointer"
          value={filterPhase} onChange={e => setFilterPhase(e.target.value as Phase | 'all')}>
          <option value="all">All Phases</option>
          <option value="30">Phase 1 (30)</option>
          <option value="60">Phase 2 (60)</option>
          <option value="90">Phase 3 (90)</option>
        </select>
        <Button onClick={openAdd}>
          <Plus className="w-4 h-4" /> Log Pain Point
        </Button>
      </div>

      {/* Results count */}
      {filtered.length !== painPoints.length && (
        <p className="text-xs text-slate-400 mb-3">{filtered.length} of {painPoints.length} pain points</p>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<AlertTriangle className="w-8 h-8" />}
          title={painPoints.length === 0 ? 'No pain points logged yet' : 'No matches found'}
          description={painPoints.length === 0 ? 'Start documenting issues you discover. Every pain point you log is the first step to fixing it.' : 'Try adjusting your filters.'}
          action={painPoints.length === 0 ? <Button onClick={openAdd}><Plus className="w-4 h-4" /> Log Your First Pain Point</Button> : undefined}
        />
      ) : (
        <div className="grid gap-3">
          {filtered.map(pp => (
            <PainPointCard key={pp.id} pp={pp} tags={tags} onEdit={openEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Modal */}
      <PainPointModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        tags={tags}
        userId={userId}
        editing={editing}
        onSaved={handleSaved}
      />
    </>
  )
}
