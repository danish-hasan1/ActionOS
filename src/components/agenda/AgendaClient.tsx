'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { upsertAgenda, updateAgendaItems, deleteAgenda } from '@/lib/actions'
import {
  Plus, ClipboardList, CheckSquare, Square, Pencil, Trash2,
  ChevronDown, ChevronRight, Calendar, Users, ChevronUp,
  Target, AlertTriangle, Flag, Map, FileText, StickyNote,
} from 'lucide-react'
import type { Agenda, AgendaItem, AgendaSubItem, SubItemType } from '@/types'
import {
  EmptyState, Button, Modal, FormField,
  inputCls, selectCls, textareaCls, Card,
} from '@/components/ui'
import { formatDate, cn } from '@/lib/utils'

const MEETING_TYPES = ['Team Sync', 'Leadership Check-in', 'Recruiter 1:1', 'HM Meeting', 'Retrospective', 'Strategy Session', 'Other']

const PROGRESS_STEPS = [0, 25, 50, 75, 100]

const SUBITEM_TYPES: { value: SubItemType; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'task',       label: 'Task',       icon: <CheckSquare className="w-3 h-3" />, color: '#4F46E5' },
  { value: 'pain_point', label: 'Pain Point', icon: <AlertTriangle className="w-3 h-3" />, color: '#EF4444' },
  { value: 'goal',       label: 'Goal',       icon: <Target className="w-3 h-3" />, color: '#10B981' },
  { value: 'milestone',  label: 'Milestone',  icon: <Map className="w-3 h-3" />, color: '#F59E0B' },
  { value: 'note',       label: 'Note',       icon: <StickyNote className="w-3 h-3" />, color: '#64748B' },
]

function subitemTypeMeta(type: SubItemType) {
  return SUBITEM_TYPES.find(t => t.value === type) ?? SUBITEM_TYPES[4]
}

function normalizeItem(item: Partial<AgendaItem> & { id: string; text: string; checked: boolean }): AgendaItem {
  return {
    ...item,
    progress_pct: item.progress_pct ?? 0,
    subitems: item.subitems ?? [],
  }
}

// ─── Progress Chips ───────────────────────────────────────────
function ProgressChips({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-slate-400 mr-1">Progress</span>
      {PROGRESS_STEPS.map(s => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className={cn(
            'px-2 py-0.5 rounded-full text-xs font-semibold transition-all border',
            value === s
              ? 'bg-indigo-500 text-white border-indigo-500'
              : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-500'
          )}
        >
          {s}%
        </button>
      ))}
      {!PROGRESS_STEPS.includes(value) && (
        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-500 text-white border border-indigo-500">
          {value}%
        </span>
      )}
    </div>
  )
}

// ─── SubItem Row (in modal) ───────────────────────────────────
function SubItemRow({ sub, onRemove, onToggle }: {
  sub: AgendaSubItem
  onRemove: () => void
  onToggle: () => void
}) {
  const meta = subitemTypeMeta(sub.type)
  return (
    <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-100">
      <button type="button" onClick={onToggle} className="shrink-0">
        {sub.checked
          ? <CheckSquare className="w-4 h-4 text-green-500" />
          : <Square className="w-4 h-4 text-slate-300" />}
      </button>
      <span
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-semibold shrink-0"
        style={{ backgroundColor: `${meta.color}15`, color: meta.color }}
      >
        {meta.icon} {meta.label}
      </span>
      <p className={cn('flex-1 text-xs text-slate-700', sub.checked && 'line-through text-slate-400')}>{sub.text}</p>
      <button type="button" onClick={onRemove} className="text-slate-300 hover:text-red-400 shrink-0">
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  )
}

// ─── Modal Item Editor ────────────────────────────────────────
function ItemEditor({ item, index, onChange, onRemove }: {
  item: AgendaItem
  index: number
  onChange: (updated: AgendaItem) => void
  onRemove: () => void
}) {
  const [open, setOpen] = useState(false)
  const [newSubText, setNewSubText] = useState('')
  const [newSubType, setNewSubType] = useState<SubItemType>('task')

  function addSub() {
    if (!newSubText.trim()) return
    const sub: AgendaSubItem = { id: crypto.randomUUID(), text: newSubText.trim(), checked: false, type: newSubType }
    onChange({ ...item, subitems: [...item.subitems, sub] })
    setNewSubText('')
  }

  function removeSub(id: string) {
    onChange({ ...item, subitems: item.subitems.filter(s => s.id !== id) })
  }

  function toggleSub(id: string) {
    onChange({ ...item, subitems: item.subitems.map(s => s.id === id ? { ...s, checked: !s.checked } : s) })
  }

  const subDone = item.subitems.filter(s => s.checked).length
  const autoProgress = item.subitems.length > 0
    ? Math.round((subDone / item.subitems.length) * 100)
    : null

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      {/* Main item row */}
      <div className="flex items-center gap-2 p-2.5 bg-slate-50">
        <span className="text-xs font-bold text-slate-400 w-5 shrink-0">{index + 1}.</span>
        <p className="flex-1 text-sm text-slate-700">{item.text}</p>
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 font-semibold shrink-0 px-2 py-1 rounded-lg hover:bg-indigo-50 transition-colors"
        >
          {item.subitems.length > 0 && <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">{item.subitems.length}</span>}
          {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
        <button type="button" onClick={onRemove} className="text-slate-300 hover:text-red-400 transition-colors shrink-0">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {open && (
        <div className="p-3 bg-white space-y-3 border-t border-slate-100">
          {/* Progress */}
          {autoProgress === null ? (
            <ProgressChips value={item.progress_pct} onChange={p => onChange({ ...item, progress_pct: p })} />
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Progress</span>
              <span className="text-xs font-semibold text-indigo-600">{autoProgress}%</span>
              <span className="text-xs text-slate-400">(auto from sub-items)</span>
            </div>
          )}

          {/* Sub-items */}
          {item.subitems.length > 0 && (
            <div className="space-y-1.5">
              {item.subitems.map(sub => (
                <SubItemRow key={sub.id} sub={sub} onRemove={() => removeSub(sub.id)} onToggle={() => toggleSub(sub.id)} />
              ))}
            </div>
          )}

          {/* Add sub-item */}
          <div className="flex gap-2">
            <select
              className="px-2 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              value={newSubType}
              onChange={e => setNewSubType(e.target.value as SubItemType)}
            >
              {SUBITEM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <input
              className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="Add sub-item... (Enter)"
              value={newSubText}
              onChange={e => setNewSubText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSub())}
            />
            <Button variant="secondary" size="sm" onClick={addSub}><Plus className="w-3.5 h-3.5" /></Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Agenda Modal ─────────────────────────────────────────────
function AgendaModal({ open, onClose, userId, editing, onSaved }: {
  open: boolean
  onClose: () => void
  userId: string
  editing?: Agenda | null
  onSaved: (_: Agenda) => void
}) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: editing?.title ?? '',
    meeting_date: editing?.meeting_date ?? new Date().toISOString().split('T')[0],
    meeting_type: editing?.meeting_type ?? 'Team Sync',
    attendees: editing?.attendees?.join(', ') ?? '',
    notes: editing?.notes ?? '',
    items: (editing?.items ?? []).map(normalizeItem),
    newItem: '',
  })

  function set<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm(f => ({ ...f, [k]: v }))
  }

  function addItem() {
    if (!form.newItem.trim()) return
    const item: AgendaItem = {
      id: crypto.randomUUID(),
      text: form.newItem.trim(),
      checked: false,
      progress_pct: 0,
      subitems: [],
    }
    setForm(f => ({ ...f, items: [...f.items, item], newItem: '' }))
  }

  function updateItem(id: string, updated: AgendaItem) {
    setForm(f => ({ ...f, items: f.items.map(i => i.id === id ? updated : i) }))
  }

  function removeItem(id: string) {
    setForm(f => ({ ...f, items: f.items.filter(i => i.id !== id) }))
  }

  async function save() {
    if (!form.title.trim()) return toast.error('Title is required')
    setLoading(true)
    const payload = {
      title: form.title.trim(),
      meeting_date: form.meeting_date,
      meeting_type: form.meeting_type,
      attendees: form.attendees ? form.attendees.split(',').map(a => a.trim()).filter(Boolean) : [],
      notes: form.notes || null,
      items: form.items,
      owner_id: userId,
    }
    const result = await upsertAgenda(payload, editing?.id)
    if (result.error) { toast.error(result.error) }
    else {
      toast.success(editing ? 'Agenda updated' : 'Agenda created')
      onSaved(result.data as Agenda)
      onClose()
    }
    setLoading(false)
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit Agenda' : 'New Meeting Agenda'}>
      <div className="space-y-4">
        <FormField label="Meeting Title" required>
          <input className={inputCls} value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Weekly Team Sync — Week 3" />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Date" required>
            <input type="date" className={inputCls} value={form.meeting_date} onChange={e => set('meeting_date', e.target.value)} />
          </FormField>
          <FormField label="Meeting Type">
            <select className={selectCls} value={form.meeting_type} onChange={e => set('meeting_type', e.target.value)}>
              {MEETING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </FormField>
        </div>
        <FormField label="Attendees" hint="Comma-separated names or roles">
          <input className={inputCls} value={form.attendees} onChange={e => set('attendees', e.target.value)} placeholder="e.g. Priya (Recruiter), Amit (AM), Leadership" />
        </FormField>

        <FormField label="Agenda Items">
          <div className="space-y-2 mb-2">
            {form.items.map((item, i) => (
              <ItemEditor
                key={item.id}
                item={item}
                index={i}
                onChange={updated => updateItem(item.id, updated)}
                onRemove={() => removeItem(item.id)}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <input
              className={inputCls}
              value={form.newItem}
              onChange={e => set('newItem', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addItem())}
              placeholder="Add agenda item... (press Enter)"
            />
            <Button variant="secondary" onClick={addItem}><Plus className="w-4 h-4" /></Button>
          </div>
        </FormField>

        <FormField label="Notes">
          <textarea className={textareaCls} rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Pre-meeting context or post-meeting summary..." />
        </FormField>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={loading}>{loading ? 'Saving...' : editing ? 'Save Changes' : 'Create Agenda'}</Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Inline Sub-items Panel ───────────────────────────────────
function SubItemsPanel({ item, onUpdate }: {
  item: AgendaItem
  onUpdate: (updated: AgendaItem) => void
}) {
  const [newText, setNewText] = useState('')
  const [newType, setNewType] = useState<SubItemType>('task')

  function add() {
    if (!newText.trim()) return
    const sub: AgendaSubItem = { id: crypto.randomUUID(), text: newText.trim(), checked: false, type: newType }
    onUpdate({ ...item, subitems: [...item.subitems, sub] })
    setNewText('')
  }

  function toggle(id: string) {
    const subitems = item.subitems.map(s => s.id === id ? { ...s, checked: !s.checked } : s)
    const autoProgress = Math.round((subitems.filter(s => s.checked).length / subitems.length) * 100)
    onUpdate({ ...item, subitems, progress_pct: autoProgress })
  }

  function remove(id: string) {
    const subitems = item.subitems.filter(s => s.id !== id)
    const autoProgress = subitems.length > 0
      ? Math.round((subitems.filter(s => s.checked).length / subitems.length) * 100)
      : item.progress_pct
    onUpdate({ ...item, subitems, progress_pct: autoProgress })
  }

  return (
    <div className="pl-8 pr-2 pb-2 space-y-1.5">
      {item.subitems.map(sub => {
        const meta = subitemTypeMeta(sub.type)
        return (
          <div key={sub.id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 group">
            <button onClick={() => toggle(sub.id)} className="shrink-0">
              {sub.checked
                ? <CheckSquare className="w-3.5 h-3.5 text-green-500" />
                : <Square className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-400" />}
            </button>
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-semibold shrink-0"
              style={{ backgroundColor: `${meta.color}15`, color: meta.color }}
            >
              {meta.icon}
              <span className="hidden sm:inline">{meta.label}</span>
            </span>
            <p className={cn('flex-1 text-xs', sub.checked ? 'line-through text-slate-400' : 'text-slate-700')}>{sub.text}</p>
            <button onClick={() => remove(sub.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-all shrink-0">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )
      })}

      {/* Inline add */}
      <div className="flex gap-1.5 pt-1">
        <select
          className="px-2 py-1 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-300"
          value={newType}
          onChange={e => setNewType(e.target.value as SubItemType)}
        >
          {SUBITEM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <input
          className="flex-1 px-2.5 py-1 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-300"
          placeholder="Add sub-item..."
          value={newText}
          onChange={e => setNewText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())}
        />
        <button
          onClick={add}
          className="px-2 py-1 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ─── Agenda Card ──────────────────────────────────────────────
function AgendaCard({ agenda, onEdit, onDelete, onItemsChange }: {
  agenda: Agenda
  onEdit: (_a: Agenda) => void
  onDelete: (_id: string) => void
  onItemsChange: (_agendaId: string, _items: AgendaItem[]) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [expandedSubs, setExpandedSubs] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)

  const items = agenda.items.map(normalizeItem)
  const checkedCount = items.filter(i => i.checked).length
  const total = items.length

  // Overall progress: average of item progress_pcts
  const overallPct = total > 0
    ? Math.round(items.reduce((acc, i) => acc + (i.progress_pct ?? 0), 0) / total)
    : 0

  function toggleSubExpand(id: string) {
    setExpandedSubs(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function persistItems(updated: AgendaItem[]) {
    setSaving(true)
    const { data, error } = await updateAgendaItems(agenda.id, updated)
    if (error) toast.error(error)
    else onItemsChange(agenda.id, (data as Agenda).items)
    setSaving(false)
  }

  async function toggleItem(id: string) {
    const updated = items.map(i => i.id === id ? { ...i, checked: !i.checked, progress_pct: !i.checked ? 100 : i.progress_pct } : i)
    await persistItems(updated)
  }

  async function setItemProgress(id: string, pct: number) {
    const updated = items.map(i => i.id === id ? { ...i, progress_pct: pct, checked: pct === 100 } : i)
    await persistItems(updated)
  }

  async function updateSubItems(itemId: string, updatedItem: AgendaItem) {
    const updated = items.map(i => i.id === itemId ? updatedItem : i)
    await persistItems(updated)
  }

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <button
        className="w-full flex items-start gap-3 p-4 hover:bg-slate-50 transition-colors text-left"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0 mt-0.5">
          <ClipboardList className="w-5 h-5 text-indigo-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-bold text-slate-800 text-sm" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{agenda.title}</h3>
            <div className="flex items-center gap-2 shrink-0">
              {saving && <span className="text-xs text-slate-400">saving…</span>}
              <span className="text-xs font-bold text-slate-500">{overallPct}%</span>
              <span className="text-xs text-slate-400">{checkedCount}/{total}</span>
              {expanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
            </div>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="inline-flex items-center gap-1 text-xs text-slate-400">
              <Calendar className="w-3 h-3" />{formatDate(agenda.meeting_date)}
            </span>
            <span className="text-xs text-slate-400">{agenda.meeting_type}</span>
            {agenda.attendees.length > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                <Users className="w-3 h-3" />{agenda.attendees.slice(0, 2).join(', ')}{agenda.attendees.length > 2 ? ` +${agenda.attendees.length - 2}` : ''}
              </span>
            )}
          </div>
          {total > 0 && (
            <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${overallPct}%`, backgroundColor: overallPct === 100 ? '#10B981' : '#4F46E5' }}
              />
            </div>
          )}
        </div>
      </button>

      {/* Expanded checklist */}
      {expanded && (
        <div className="border-t border-slate-100 px-4 pb-4">
          {items.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 text-center">No agenda items</p>
          ) : (
            <div className="space-y-1 pt-3">
              {items.map((item, i) => {
                const subsDone = item.subitems.filter(s => s.checked).length
                const hasSubs = item.subitems.length > 0
                const subsOpen = expandedSubs.has(item.id)

                return (
                  <div key={item.id} className="rounded-xl border border-slate-100 overflow-hidden">
                    {/* Item row */}
                    <div className="flex items-start gap-2.5 p-2.5 hover:bg-slate-50 transition-colors">
                      <span className="text-xs font-bold text-slate-300 w-5 shrink-0 mt-0.5">{i + 1}.</span>

                      {/* Checkbox */}
                      <button onClick={() => toggleItem(item.id)} className="shrink-0 mt-0.5">
                        {item.checked
                          ? <CheckSquare className="w-4 h-4 text-green-500" />
                          : <Square className="w-4 h-4 text-slate-300 hover:text-slate-400" />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm font-medium leading-snug', item.checked ? 'line-through text-slate-400' : 'text-slate-700')}>{item.text}</p>

                        {/* Progress bar per item */}
                        {!hasSubs && (
                          <div className="flex items-center gap-2 mt-1.5">
                            <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                  width: `${item.progress_pct}%`,
                                  backgroundColor: item.progress_pct === 100 ? '#10B981' : '#6366F1',
                                }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-slate-400 shrink-0 w-8 text-right">{item.progress_pct}%</span>
                          </div>
                        )}

                        {hasSubs && (
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                  width: `${item.progress_pct}%`,
                                  backgroundColor: item.progress_pct === 100 ? '#10B981' : '#6366F1',
                                }}
                              />
                            </div>
                            <span className="text-xs text-slate-400 shrink-0">{subsDone}/{item.subitems.length} done</span>
                          </div>
                        )}
                      </div>

                      {/* Progress quick-set (no subitems only) */}
                      {!hasSubs && !item.checked && (
                        <div className="flex gap-1 shrink-0">
                          {PROGRESS_STEPS.filter(s => s !== 100).map(s => (
                            <button
                              key={s}
                              onClick={() => setItemProgress(item.id, s)}
                              className={cn(
                                'px-1.5 py-0.5 rounded text-xs font-semibold transition-all',
                                item.progress_pct === s
                                  ? 'bg-indigo-500 text-white'
                                  : 'bg-slate-100 text-slate-500 hover:bg-indigo-100 hover:text-indigo-600'
                              )}
                            >
                              {s}%
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Sub-items toggle */}
                      <button
                        onClick={() => toggleSubExpand(item.id)}
                        className={cn(
                          'shrink-0 flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors font-semibold',
                          hasSubs
                            ? 'text-indigo-500 hover:bg-indigo-50'
                            : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'
                        )}
                        title={hasSubs ? 'Toggle sub-items' : 'Add sub-items'}
                      >
                        {hasSubs && <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs">{item.subitems.length}</span>}
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Sub-items panel */}
                    {subsOpen && (
                      <div className="border-t border-slate-100 bg-slate-50/50">
                        <SubItemsPanel item={item} onUpdate={updated => updateSubItems(item.id, updated)} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {agenda.notes && (
            <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
              <p className="text-xs font-semibold text-amber-700 mb-1">Notes</p>
              <p className="text-xs text-amber-800">{agenda.notes}</p>
            </div>
          )}

          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
            <Button variant="ghost" size="sm" onClick={() => onEdit(agenda)}>
              <Pencil className="w-3.5 h-3.5" /> Edit
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(agenda.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}

// ─── Main Component ───────────────────────────────────────────
export default function AgendaClient({ initialAgendas, userId }: {
  initialAgendas: Agenda[]
  userId: string
}) {
  const [agendas, setAgendas] = useState<Agenda[]>(initialAgendas)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Agenda | null>(null)

  function openAdd() { setEditing(null); setModalOpen(true) }
  function openEdit(a: Agenda) { setEditing(a); setModalOpen(true) }

  function handleSaved(a: Agenda) {
    setAgendas(prev => prev.find(p => p.id === a.id) ? prev.map(p => p.id === a.id ? a : p) : [a, ...prev])
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this agenda?')) return
    const { error } = await deleteAgenda(id)
    if (error) toast.error(error)
    else { setAgendas(prev => prev.filter(a => a.id !== id)); toast.success('Agenda deleted') }
  }

  function handleItemsChange(agendaId: string, items: AgendaItem[]) {
    setAgendas(prev => prev.map(a => a.id === agendaId ? { ...a, items } : a))
  }

  const today = new Date().toISOString().split('T')[0]
  const upcoming = agendas.filter(a => a.meeting_date >= today)
  const past = agendas.filter(a => a.meeting_date < today)

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 font-medium">
            {upcoming.length} upcoming · {past.length} past
          </div>
        </div>
        <Button onClick={openAdd}><Plus className="w-4 h-4" /> New Agenda</Button>
      </div>

      {agendas.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="w-8 h-8" />}
          title="No agendas yet"
          description="Create structured meeting agendas with checklist items, progress tracking, and typed sub-items."
          action={<Button onClick={openAdd}><Plus className="w-4 h-4" /> Create First Agenda</Button>}
        />
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <section>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Upcoming</h2>
              <div className="space-y-3">
                {upcoming.map(a => (
                  <AgendaCard key={a.id} agenda={a} onEdit={openEdit} onDelete={handleDelete} onItemsChange={handleItemsChange} />
                ))}
              </div>
            </section>
          )}
          {past.length > 0 && (
            <section>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Past Meetings</h2>
              <div className="space-y-3">
                {past.map(a => (
                  <AgendaCard key={a.id} agenda={a} onEdit={openEdit} onDelete={handleDelete} onItemsChange={handleItemsChange} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <AgendaModal
        open={modalOpen} onClose={() => setModalOpen(false)}
        userId={userId} editing={editing} onSaved={handleSaved}
      />
    </>
  )
}
