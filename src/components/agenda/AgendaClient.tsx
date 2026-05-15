'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { upsertAgenda, updateAgendaItems, deleteAgenda } from '@/lib/actions'
import { Plus, ClipboardList, CheckSquare, Square, Pencil, Trash2, ChevronDown, ChevronRight, Calendar, Users } from 'lucide-react'
import type { Agenda, AgendaItem } from '@/types'
import {
  EmptyState, Button, Modal, FormField,
  inputCls, selectCls, textareaCls, Card
} from '@/components/ui'
import { formatDate, cn } from '@/lib/utils'

const MEETING_TYPES = ['Team Sync', 'Leadership Check-in', 'Recruiter 1:1', 'HM Meeting', 'Retrospective', 'Strategy Session', 'Other']

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
    items: editing?.items ?? [] as AgendaItem[],
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
    }
    setForm(f => ({ ...f, items: [...f.items, item], newItem: '' }))
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
              <div key={item.id} className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg">
                <span className="text-xs font-bold text-slate-400 w-5 shrink-0">{i + 1}.</span>
                <p className="flex-1 text-sm text-slate-700">{item.text}</p>
                <button onClick={() => removeItem(item.id)} className="text-slate-400 hover:text-red-500 transition-colors shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
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

// ─── Agenda Card with Live Checklist Runner ───────────────────
function AgendaCard({ agenda, onEdit, onDelete, onItemToggle }: {
  agenda: Agenda
  onEdit: (_a: Agenda) => void
  onDelete: (_id: string) => void
  onItemToggle: (_agendaId: string, _itemId: string, _checked: boolean) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const checkedCount = agenda.items.filter(i => i.checked).length
  const total = agenda.items.length
  const pct = total > 0 ? Math.round((checkedCount / total) * 100) : 0

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <button className="w-full flex items-start gap-3 p-4 hover:bg-slate-50 transition-colors text-left" onClick={() => setExpanded(v => !v)}>
        <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0 mt-0.5">
          <ClipboardList className="w-5 h-5 text-indigo-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-bold text-slate-800 text-sm" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{agenda.title}</h3>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-semibold text-slate-500">{checkedCount}/{total}</span>
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
            <div className="mt-2 h-1 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#10B981] rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
          )}
        </div>
      </button>

      {/* Expanded checklist */}
      {expanded && (
        <div className="border-t border-slate-100 px-4 pb-4">
          {agenda.items.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 text-center">No agenda items</p>
          ) : (
            <div className="space-y-2 pt-3">
              {agenda.items.map((item, i) => (
                <button
                  key={item.id}
                  onClick={() => onItemToggle(agenda.id, item.id, !item.checked)}
                  className="w-full flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left group"
                >
                  <span className="text-xs font-bold text-slate-300 w-5 shrink-0 mt-0.5">{i + 1}.</span>
                  {item.checked
                    ? <CheckSquare className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    : <Square className="w-4 h-4 text-slate-300 group-hover:text-slate-400 shrink-0 mt-0.5" />
                  }
                  <p className={cn('text-sm flex-1', item.checked ? 'line-through text-slate-400' : 'text-slate-700')}>{item.text}</p>
                </button>
              ))}
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

  async function handleItemToggle(agendaId: string, itemId: string, checked: boolean) {
    const agenda = agendas.find(a => a.id === agendaId)
    if (!agenda) return
    const updatedItems = agenda.items.map(i => i.id === itemId ? { ...i, checked } : i)
    const { data, error } = await updateAgendaItems(agendaId, updatedItems)
    if (error) toast.error(error)
    else setAgendas(prev => prev.map(a => a.id === agendaId ? data as Agenda : a))
  }

  // Group by upcoming vs past
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
          description="Create structured meeting agendas with checklist items. Track what was covered and what needs follow-up."
          action={<Button onClick={openAdd}><Plus className="w-4 h-4" /> Create First Agenda</Button>}
        />
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <section>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Upcoming</h2>
              <div className="space-y-3">
                {upcoming.map(a => (
                  <AgendaCard key={a.id} agenda={a} onEdit={openEdit} onDelete={handleDelete} onItemToggle={handleItemToggle} />
                ))}
              </div>
            </section>
          )}
          {past.length > 0 && (
            <section>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Past Meetings</h2>
              <div className="space-y-3">
                {past.map(a => (
                  <AgendaCard key={a.id} agenda={a} onEdit={openEdit} onDelete={handleDelete} onItemToggle={handleItemToggle} />
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
