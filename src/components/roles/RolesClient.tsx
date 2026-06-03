'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { upsertRole, deleteRole, addRoleConversation, deleteRoleConversation } from '@/lib/actions'
import {
  Plus, Search, Briefcase, Trash2, Pencil, MessageSquare,
  X, Calendar, UserPlus, ChevronDown,
} from 'lucide-react'
import type { Role, RoleConversation, RoleStatus } from '@/types'
import { Button, Card, Modal, FormField, inputCls, selectCls, textareaCls } from '@/components/ui'
import { cn } from '@/lib/utils'

// ─── Config ───────────────────────────────────────────────────
const STATUS_CONFIG: Record<RoleStatus, { label: string; bg: string; text: string; dot: string }> = {
  open:    { label: 'Open',    bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-400' },
  on_hold: { label: 'On Hold', bg: 'bg-amber-50',  text: 'text-amber-700',  dot: 'bg-amber-400' },
  filled:  { label: 'Filled',  bg: 'bg-blue-50',   text: 'text-blue-700',   dot: 'bg-blue-400' },
  closed:  { label: 'Closed',  bg: 'bg-slate-100', text: 'text-slate-500',  dot: 'bg-slate-400' },
}

const PRIORITY_CONFIG = {
  urgent: { label: 'Urgent', color: '#EF4444' },
  high:   { label: 'High',   color: '#F97316' },
  medium: { label: 'Medium', color: '#F59E0B' },
  low:    { label: 'Low',    color: '#94A3B8' },
}

const DEPARTMENTS = ['Engineering', 'Product', 'Design', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations', 'Legal', 'Other']

// ─── Types ────────────────────────────────────────────────────
interface PersonEntry { name: string; title: string }
interface KnownPerson { name: string; title: string }

// ─── Helpers ─────────────────────────────────────────────────
function avatarColor(name: string) {
  const palette = ['#6366F1', '#EC4899', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#EF4444', '#14B8A6', '#F97316', '#06B6D4']
  let h = 0
  for (const c of name) h = c.charCodeAt(0) + ((h << 5) - h)
  return palette[Math.abs(h) % palette.length]
}

function initials(name: string) {
  return name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function fmtDateTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── Person Name Input w/ Autocomplete ───────────────────────
function PersonNameInput({ value, titleValue, onChangeName, onChangeTitle, onRemove, showRemove, knownPeople, autoFocus }: {
  value: string
  titleValue: string
  onChangeName: (v: string) => void
  onChangeTitle: (v: string) => void
  onRemove: () => void
  showRemove: boolean
  knownPeople: KnownPerson[]
  autoFocus?: boolean
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const suggestions = useMemo(() => {
    if (!value.trim()) return []
    const q = value.toLowerCase()
    return knownPeople.filter(p => p.name.toLowerCase().includes(q) && p.name.toLowerCase() !== q)
  }, [value, knownPeople])

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function pick(p: KnownPerson) {
    onChangeName(p.name)
    onChangeTitle(p.title)
    setOpen(false)
  }

  return (
    <div className="flex gap-2 items-start">
      <div className="flex-1 grid grid-cols-2 gap-2">
        {/* Name with autocomplete */}
        <div className="relative" ref={containerRef}>
          <input
            className={inputCls}
            placeholder="Person name *"
            value={value}
            autoFocus={autoFocus}
            onChange={e => { onChangeName(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
          />
          {open && suggestions.length > 0 && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
              {suggestions.slice(0, 6).map(p => (
                <button
                  key={p.name}
                  type="button"
                  onMouseDown={() => pick(p)}
                  className="w-full text-left px-3 py-2.5 text-sm hover:bg-indigo-50 flex items-center gap-2 border-b border-slate-50 last:border-0"
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ backgroundColor: avatarColor(p.name) }}
                  >
                    {initials(p.name)}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">{p.name}</span>
                    {p.title && <span className="text-slate-400 ml-1.5 text-xs">· {p.title}</span>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        {/* Title */}
        <input
          className={inputCls}
          placeholder="Their role / title"
          value={titleValue}
          onChange={e => onChangeTitle(e.target.value)}
        />
      </div>
      {showRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="mt-2.5 p-1.5 text-slate-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

// ─── Role Modal ───────────────────────────────────────────────
function RoleModal({ open, onClose, userId, editing, knownPeople, onSaved, onConversationsSaved }: {
  open: boolean
  onClose: () => void
  userId: string
  editing?: Role | null
  knownPeople: KnownPerson[]
  onSaved: (r: Role) => void
  onConversationsSaved: (convs: RoleConversation[]) => void
}) {
  const emptyPerson = (): PersonEntry => ({ name: '', title: '' })
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: editing?.title ?? '',
    department: editing?.department ?? '',
    status: editing?.status ?? 'open' as RoleStatus,
    priority: editing?.priority ?? 'medium' as Role['priority'],
    description: editing?.description ?? '',
    requirements: editing?.requirements ?? '',
    notes: editing?.notes ?? '',
  })
  const [people, setPeople] = useState<PersonEntry[]>([emptyPerson()])

  function set<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm(f => ({ ...f, [k]: v }))
  }

  function updatePerson(i: number, field: keyof PersonEntry, value: string) {
    setPeople(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: value } : p))
  }

  async function save() {
    if (!form.title.trim()) return toast.error('Title is required')
    setLoading(true)
    const payload = {
      title: form.title.trim(),
      department: form.department || null,
      status: form.status,
      priority: form.priority,
      description: form.description || null,
      requirements: form.requirements || null,
      notes: form.notes || null,
      owner_id: userId,
    }
    const { data, error } = await upsertRole(payload, editing?.id)
    if (error) { toast.error(error); setLoading(false); return }

    const role = data as Role
    // Save any people entered as conversation stubs (name-only, no content = just a contact record)
    const validPeople = people.filter(p => p.name.trim())
    const saved: RoleConversation[] = []
    for (const p of validPeople) {
      const { data: cd, error: ce } = await addRoleConversation({
        role_id: role.id,
        person_name: p.name.trim(),
        person_title: p.title.trim() || null,
        content: '—',
        owner_id: userId,
      })
      if (!ce) saved.push(cd as RoleConversation)
    }
    if (saved.length) onConversationsSaved(saved)

    toast.success(editing ? 'Role updated' : 'Role created')
    onSaved(role)
    onClose()
    setLoading(false)
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit Role' : 'New Role'}>
      <div className="space-y-4">
        <FormField label="Role Title" required>
          <input className={inputCls} value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Senior Product Manager" autoFocus />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Department">
            <select className={selectCls} value={form.department} onChange={e => set('department', e.target.value)}>
              <option value="">Select...</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </FormField>
          <FormField label="Status">
            <select className={selectCls} value={form.status} onChange={e => set('status', e.target.value as RoleStatus)}>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </FormField>
        </div>
        <FormField label="Priority">
          <div className="flex gap-2">
            {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
              <button
                key={k} type="button"
                onClick={() => set('priority', k as Role['priority'])}
                className={cn(
                  'flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all',
                  form.priority === k ? 'border-current text-white' : 'border-slate-200 text-slate-500 bg-white hover:border-slate-300'
                )}
                style={form.priority === k ? { backgroundColor: v.color, borderColor: v.color } : {}}
              >
                {v.label}
              </button>
            ))}
          </div>
        </FormField>

        {/* People spoken to */}
        <div className="border border-slate-200 rounded-xl p-3 space-y-2 bg-slate-50">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Who did you speak to?</p>
            <button
              type="button"
              onClick={() => setPeople(prev => [...prev, emptyPerson()])}
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 px-2 py-1 rounded-lg transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" /> Add person
            </button>
          </div>
          <div className="space-y-2">
            {people.map((p, i) => (
              <PersonNameInput
                key={i}
                value={p.name}
                titleValue={p.title}
                onChangeName={v => updatePerson(i, 'name', v)}
                onChangeTitle={v => updatePerson(i, 'title', v)}
                onRemove={() => setPeople(prev => prev.filter((_, idx) => idx !== i))}
                showRemove={people.length > 1}
                knownPeople={knownPeople}
              />
            ))}
          </div>
          <p className="text-xs text-slate-400">Optional — you can add conversation notes after saving</p>
        </div>

        <FormField label="Description">
          <textarea className={textareaCls} rows={2} value={form.description} onChange={e => set('description', e.target.value)} placeholder="What is this role responsible for?" />
        </FormField>
        <FormField label="Requirements">
          <textarea className={textareaCls} rows={2} value={form.requirements} onChange={e => set('requirements', e.target.value)} placeholder="Must-have skills, experience, qualifications..." />
        </FormField>
        <FormField label="Notes">
          <textarea className={textareaCls} rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Internal notes, sourcing strategy, compensation..." />
        </FormField>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={loading}>{loading ? 'Saving...' : editing ? 'Save Changes' : 'Create Role'}</Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Conversation Bubble ──────────────────────────────────────
function ConversationBubble({ conv, onDelete }: { conv: RoleConversation; onDelete: () => void }) {
  const color = avatarColor(conv.person_name)
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="flex gap-3 group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5 shadow-sm"
        style={{ backgroundColor: color }}
      >
        {initials(conv.person_name)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <span className="font-bold text-slate-800 text-sm">{conv.person_name}</span>
              {conv.person_title && (
                <span className="text-xs text-slate-400 ml-2">· {conv.person_title}</span>
              )}
            </div>
            <button
              onClick={onDelete}
              className={cn(
                'shrink-0 p-1 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition-all',
                hovered ? 'opacity-100' : 'opacity-0'
              )}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{conv.content}</p>
        </div>
        <p className="text-xs text-slate-400 mt-1.5 ml-1">{fmtDateTime(conv.created_at)}</p>
      </div>
    </div>
  )
}

// ─── Add Conversation Form ────────────────────────────────────
function AddConversationForm({ roleId, userId, knownPeople, onAdded }: {
  roleId: string
  userId: string
  knownPeople: KnownPerson[]
  onAdded: (convs: RoleConversation[]) => void
}) {
  const emptyPerson = (): PersonEntry => ({ name: '', title: '' })
  const [people, setPeople] = useState<PersonEntry[]>([emptyPerson()])
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  function updatePerson(i: number, field: keyof PersonEntry, value: string) {
    setPeople(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: value } : p))
  }

  function addPerson() {
    setPeople(prev => [...prev, emptyPerson()])
  }

  function removePerson(i: number) {
    setPeople(prev => prev.filter((_, idx) => idx !== i))
  }

  async function submit() {
    const valid = people.filter(p => p.name.trim())
    if (!valid.length) return toast.error('At least one person name is required')
    if (!content.trim()) return toast.error('Note content is required')
    setLoading(true)

    const saved: RoleConversation[] = []
    for (const p of valid) {
      const { data, error } = await addRoleConversation({
        role_id: roleId,
        person_name: p.name.trim(),
        person_title: p.title.trim() || null,
        content: content.trim(),
        owner_id: userId,
      })
      if (error) { toast.error(error); setLoading(false); return }
      saved.push(data as RoleConversation)
    }

    onAdded(saved)
    setPeople([emptyPerson()])
    setContent('')
    toast.success(saved.length > 1 ? `${saved.length} conversations saved` : 'Conversation saved')
    setLoading(false)
  }

  return (
    <div className="border-t border-slate-100 pt-5 mt-5 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Add Conversation</p>
        <button
          type="button"
          onClick={addPerson}
          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 px-2 py-1 rounded-lg transition-colors"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Add person
        </button>
      </div>

      <div className="space-y-2">
        {people.map((p, i) => (
          <PersonNameInput
            key={i}
            value={p.name}
            titleValue={p.title}
            onChangeName={v => updatePerson(i, 'name', v)}
            onChangeTitle={v => updatePerson(i, 'title', v)}
            onRemove={() => removePerson(i)}
            showRemove={people.length > 1}
            knownPeople={knownPeople}
            autoFocus={i === 0}
          />
        ))}
      </div>

      <textarea
        className={textareaCls}
        rows={3}
        placeholder="What was discussed, key takeaways, next steps..."
        value={content}
        onChange={e => setContent(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit() }}
      />
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">⌘ + Enter to save</p>
        <Button
          onClick={submit}
          disabled={loading || !people.some(p => p.name.trim()) || !content.trim()}
          size="sm"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          {loading ? 'Saving...' : people.filter(p => p.name.trim()).length > 1
            ? `Save ${people.filter(p => p.name.trim()).length} notes`
            : 'Save Note'}
        </Button>
      </div>
    </div>
  )
}

// ─── Role Detail Panel ────────────────────────────────────────
function RoleDetail({ role, conversations, allConversations, onEdit, onDelete, onConversationAdded, onConversationDeleted, userId }: {
  role: Role
  conversations: RoleConversation[]
  allConversations: RoleConversation[]
  onEdit: () => void
  onDelete: () => void
  onConversationAdded: (convs: RoleConversation[]) => void
  onConversationDeleted: (id: string) => void
  userId: string
}) {
  const st = STATUS_CONFIG[role.status]
  const pr = PRIORITY_CONFIG[role.priority]
  const roleConvs = conversations.filter(c => c.role_id === role.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  // Derive known people from ALL conversations across all roles
  const knownPeople = useMemo<KnownPerson[]>(() => {
    const map = new Map<string, string>()
    allConversations.forEach(c => {
      if (!map.has(c.person_name)) map.set(c.person_name, c.person_title ?? '')
    })
    return Array.from(map.entries()).map(([name, title]) => ({ name, title }))
  }, [allConversations])

  async function handleDeleteConv(id: string) {
    const { error } = await deleteRoleConversation(id)
    if (error) toast.error(error)
    else { onConversationDeleted(id); toast.success('Note deleted') }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-slate-800 leading-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              {role.title}
            </h2>
            {role.department && (
              <p className="text-sm text-slate-400 mt-0.5">{role.department}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={onEdit} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors">
              <Pencil className="w-4 h-4" />
            </button>
            <button onClick={onDelete} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold', st.bg, st.text)}>
            <span className={cn('w-1.5 h-1.5 rounded-full', st.dot)} />{st.label}
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: pr.color }} />
            {pr.label}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-slate-400">
            <Calendar className="w-3 h-3" /> Since {fmtDate(role.created_at)}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-slate-400">
            <MessageSquare className="w-3 h-3" /> {roleConvs.length} note{roleConvs.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Unique people who have been spoken to */}
        {roleConvs.length > 0 && (() => {
          const uniqueNames = Array.from(new Set(roleConvs.map(c => c.person_name)))
          return (
            <div className="flex items-center gap-1.5 mt-3 flex-wrap">
              {uniqueNames.map(name => (
                <div key={name} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-full">
                  <div
                    className="w-4 h-4 rounded-full flex items-center justify-center text-white font-bold shrink-0"
                    style={{ backgroundColor: avatarColor(name), fontSize: 8 }}
                  >
                    {initials(name)}
                  </div>
                  <span className="text-xs text-slate-600 font-medium">{name}</span>
                </div>
              ))}
            </div>
          )
        })()}
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {(role.description || role.requirements || role.notes) && (
          <div className="space-y-4">
            {role.description && (
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Description</p>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{role.description}</p>
              </div>
            )}
            {role.requirements && (
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Requirements</p>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{role.requirements}</p>
              </div>
            )}
            {role.notes && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1">Notes</p>
                <p className="text-sm text-amber-800 whitespace-pre-wrap">{role.notes}</p>
              </div>
            )}
            <div className="h-px bg-slate-100" />
          </div>
        )}

        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-4 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" /> Conversations & Notes
          </p>
          {roleConvs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <MessageSquare className="w-8 h-8 text-slate-200 mb-2" />
              <p className="text-sm text-slate-400">No conversations yet. Add your first note below.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {roleConvs.map(conv => (
                <ConversationBubble
                  key={conv.id}
                  conv={conv}
                  onDelete={() => handleDeleteConv(conv.id)}
                />
              ))}
            </div>
          )}
        </div>

        <AddConversationForm
          roleId={role.id}
          userId={userId}
          knownPeople={knownPeople}
          onAdded={convs => onConversationAdded(convs)}
        />
      </div>
    </div>
  )
}

// ─── Role Card (sidebar) ──────────────────────────────────────
function RoleCard({ role, convCount, uniquePeople, active, onClick }: {
  role: Role
  convCount: number
  uniquePeople: string[]
  active: boolean
  onClick: () => void
}) {
  const st = STATUS_CONFIG[role.status]
  const pr = PRIORITY_CONFIG[role.priority]

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-4 rounded-2xl border transition-all duration-150',
        active
          ? 'bg-indigo-50 border-indigo-200 shadow-sm'
          : 'bg-white border-slate-100 hover:border-indigo-200 hover:shadow-sm'
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className={cn('font-bold text-sm leading-snug', active ? 'text-indigo-700' : 'text-slate-800')}>
          {role.title}
        </p>
        <span className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: pr.color }} />
      </div>
      {role.department && (
        <p className="text-xs text-slate-400 mb-2">{role.department}</p>
      )}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold', st.bg, st.text)}>
          <span className={cn('w-1.5 h-1.5 rounded-full', st.dot)} />{st.label}
        </span>
        {convCount > 0 && (
          <span className="inline-flex items-center gap-1 text-xs text-slate-400">
            <MessageSquare className="w-3 h-3" />{convCount}
          </span>
        )}
      </div>
      {/* People chips */}
      {uniquePeople.length > 0 && (
        <div className="flex items-center gap-1 mt-2.5 flex-wrap">
          {uniquePeople.slice(0, 3).map(name => (
            <div
              key={name}
              className="w-5 h-5 rounded-full flex items-center justify-center text-white font-bold border-2 border-white shadow-sm"
              style={{ backgroundColor: avatarColor(name), fontSize: 8 }}
              title={name}
            >
              {initials(name)}
            </div>
          ))}
          {uniquePeople.length > 3 && (
            <span className="text-xs text-slate-400 ml-0.5">+{uniquePeople.length - 3}</span>
          )}
        </div>
      )}
    </button>
  )
}

// ─── Main Component ───────────────────────────────────────────
export default function RolesClient({ initialRoles, initialConversations, userId }: {
  initialRoles: Role[]
  initialConversations: RoleConversation[]
  userId: string
}) {
  const [roles, setRoles] = useState<Role[]>(initialRoles)
  const [conversations, setConversations] = useState<RoleConversation[]>(initialConversations)
  const [selectedId, setSelectedId] = useState<string | null>(initialRoles[0]?.id ?? null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Role | null>(null)
  const [search, setSearch] = useState('')

  const selectedRole = roles.find(r => r.id === selectedId) ?? null

  const filteredRoles = search.trim()
    ? roles.filter(r => {
        const q = search.toLowerCase()
        if (r.title.toLowerCase().includes(q)) return true
        if (r.department?.toLowerCase().includes(q)) return true
        return conversations.some(c => c.role_id === r.id && c.person_name.toLowerCase().includes(q))
      })
    : roles

  const knownPeople = useMemo<KnownPerson[]>(() => {
    const map = new Map<string, string>()
    conversations.forEach(c => {
      if (!map.has(c.person_name)) map.set(c.person_name, c.person_title ?? '')
    })
    return Array.from(map.entries()).map(([name, title]) => ({ name, title }))
  }, [conversations])

  function openAdd() { setEditing(null); setModalOpen(true) }
  function openEdit(r: Role) { setEditing(r); setModalOpen(true) }

  function handleSaved(r: Role) {
    setRoles(prev => prev.find(p => p.id === r.id) ? prev.map(p => p.id === r.id ? r : p) : [r, ...prev])
    setSelectedId(r.id)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this role and all its conversations?')) return
    const { error } = await deleteRole(id)
    if (error) toast.error(error)
    else {
      setRoles(prev => prev.filter(r => r.id !== id))
      setConversations(prev => prev.filter(c => c.role_id !== id))
      setSelectedId(roles.find(r => r.id !== id)?.id ?? null)
      toast.success('Role deleted')
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5" style={{ height: 'calc(100vh - 180px)' }}>

        {/* ── Left: Role list ── */}
        <div className="flex flex-col gap-3 lg:overflow-y-auto">
          <div className="flex gap-2 sticky top-0 bg-[#F5F6FA] pb-1 z-10">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder="Search roles or people..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Button onClick={openAdd} size="sm"><Plus className="w-4 h-4" /></Button>
          </div>

          {filteredRoles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Briefcase className="w-8 h-8 text-slate-200 mb-2" />
              <p className="text-sm text-slate-400">
                {search ? `No results for "${search}"` : 'No roles yet'}
              </p>
              {!search && (
                <button onClick={openAdd} className="text-xs text-indigo-500 hover:text-indigo-700 mt-1 font-semibold">
                  Add your first role →
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredRoles.map(r => {
                const roleConvs = conversations.filter(c => c.role_id === r.id)
                const uniquePeople = Array.from(new Set(roleConvs.map(c => c.person_name)))
                return (
                  <RoleCard
                    key={r.id}
                    role={r}
                    convCount={roleConvs.length}
                    uniquePeople={uniquePeople}
                    active={r.id === selectedId}
                    onClick={() => setSelectedId(r.id)}
                  />
                )
              })}
            </div>
          )}
        </div>

        {/* ── Right: Role detail ── */}
        <div className="lg:col-span-2">
          {selectedRole ? (
            <Card className="h-full overflow-hidden flex flex-col">
              <RoleDetail
                role={selectedRole}
                conversations={conversations}
                allConversations={conversations}
                onEdit={() => openEdit(selectedRole)}
                onDelete={() => handleDelete(selectedRole.id)}
                onConversationAdded={convs => setConversations(prev => [...convs, ...prev])}
                onConversationDeleted={id => setConversations(prev => prev.filter(c => c.id !== id))}
                userId={userId}
              />
            </Card>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center rounded-2xl border-2 border-dashed border-slate-200 p-10">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
                <Briefcase className="w-8 h-8 text-indigo-300" />
              </div>
              <p className="text-base font-semibold text-slate-600 mb-1">Select a role to view details</p>
              <p className="text-sm text-slate-400 mb-4">Or create your first role to start tracking conversations.</p>
              <Button onClick={openAdd}><Plus className="w-4 h-4" /> New Role</Button>
            </div>
          )}
        </div>
      </div>

      <RoleModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        userId={userId}
        editing={editing}
        knownPeople={knownPeople}
        onSaved={handleSaved}
        onConversationsSaved={convs => setConversations(prev => [...convs, ...prev])}
      />
    </>
  )
}
