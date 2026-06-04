'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { upsertDailyTask, deleteDailyTask, carryForwardTasks } from '@/lib/actions'
import {
  ChevronLeft, ChevronRight, CheckSquare, Square, Trash2,
  Plus, ChevronDown, ChevronUp, Flame, RotateCcw, CalendarCheck, Pencil, Check, X, Copy, ArrowDownToLine,
} from 'lucide-react'
import type { DailyTask } from '@/types'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui'

// ─── Helpers ──────────────────────────────────────────────────
function toLocalISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function parseLocalDate(s: string) {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function formatDisplayDate(s: string) {
  const d = parseLocalDate(s)
  const today = toLocalISO(new Date())
  const yesterday = toLocalISO(new Date(Date.now() - 86400000))
  const tomorrow = toLocalISO(new Date(Date.now() + 86400000))
  if (s === today) return 'Today'
  if (s === yesterday) return 'Yesterday'
  if (s === tomorrow) return 'Tomorrow'
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
}

function formatFullDate(s: string) {
  return parseLocalDate(s).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

const PRIORITY_CONFIG = {
  high:   { label: 'High',   bg: 'bg-red-50',    text: 'text-red-600',    border: 'border-red-200',    dot: 'bg-red-400' },
  medium: { label: 'Medium', bg: 'bg-amber-50',  text: 'text-amber-600',  border: 'border-amber-200',  dot: 'bg-amber-400' },
  low:    { label: 'Low',    bg: 'bg-slate-50',  text: 'text-slate-500',  border: 'border-slate-200',  dot: 'bg-slate-300' },
}

function nextPriority(p: DailyTask['priority']): DailyTask['priority'] {
  return p === 'high' ? 'medium' : p === 'medium' ? 'low' : 'high'
}

// ─── Streak calculator ────────────────────────────────────────
function calcStreak(tasks: DailyTask[], today: string): number {
  const byDate: Record<string, DailyTask[]> = {}
  for (const t of tasks) {
    if (!byDate[t.date]) byDate[t.date] = []
    byDate[t.date].push(t)
  }
  let streak = 0
  const cursor = new Date(parseLocalDate(today))
  cursor.setDate(cursor.getDate() - 1) // start from yesterday
  while (true) {
    const key = toLocalISO(cursor)
    const dayTasks = byDate[key]
    if (!dayTasks || dayTasks.length === 0) break
    if (!dayTasks.every(t => t.checked)) break
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

// ─── Task Row ─────────────────────────────────────────────────
function TaskRow({ task, onToggle, onDelete, onPriority, onNotesSave, onTitleSave, onCopyTo }: {
  task: DailyTask
  onToggle: () => void
  onDelete: () => void
  onPriority: () => void
  onNotesSave: (notes: string) => void
  onTitleSave: (title: string) => void
  onCopyTo: (date: string) => void
}) {
  const [notesOpen, setNotesOpen] = useState(false)
  const [notesVal, setNotesVal] = useState(task.notes ?? '')
  const [noteSaving, setNoteSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editVal, setEditVal] = useState(task.title)
  const [copying, setCopying] = useState(false)
  const [copyDate, setCopyDate] = useState('')
  const editRef = useRef<HTMLInputElement>(null)
  const copyDateRef = useRef<HTMLInputElement>(null)
  const pri = PRIORITY_CONFIG[task.priority]

  function startCopy() {
    setCopyDate('')
    setCopying(true)
    setTimeout(() => copyDateRef.current?.showPicker?.(), 50)
  }

  function commitCopy() {
    if (!copyDate) { setCopying(false); return }
    onCopyTo(copyDate)
    setCopying(false)
    setCopyDate('')
  }

  async function saveNotes() {
    if (notesVal === (task.notes ?? '')) return
    setNoteSaving(true)
    await onNotesSave(notesVal)
    setNoteSaving(false)
  }

  function startEdit() {
    setEditVal(task.title)
    setEditing(true)
    setTimeout(() => editRef.current?.select(), 0)
  }

  function cancelEdit() {
    setEditVal(task.title)
    setEditing(false)
  }

  async function commitEdit() {
    const trimmed = editVal.trim()
    if (!trimmed) { cancelEdit(); return }
    setEditing(false)
    if (trimmed !== task.title) onTitleSave(trimmed)
  }

  return (
    <div className={cn(
      'rounded-xl border transition-all duration-200',
      task.checked ? 'border-slate-100 bg-slate-50/50' : 'border-slate-200 bg-white hover:border-indigo-200'
    )}>
      <div className="flex items-center gap-3 px-3 py-2.5">
        {/* Checkbox */}
        <button onClick={onToggle} className="shrink-0" disabled={editing}>
          {task.checked
            ? <CheckSquare className="w-5 h-5 text-green-500" />
            : <Square className="w-5 h-5 text-slate-300 hover:text-indigo-400 transition-colors" />}
        </button>

        {/* Title / inline edit */}
        {editing ? (
          <input
            ref={editRef}
            className="flex-1 text-sm font-medium px-2 py-0.5 rounded-lg border border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white text-slate-700"
            value={editVal}
            onChange={e => setEditVal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') cancelEdit() }}
            onBlur={commitEdit}
            autoFocus
          />
        ) : (
          <p
            className={cn('flex-1 text-sm font-medium cursor-text', task.checked ? 'line-through text-slate-400' : 'text-slate-700')}
            onDoubleClick={startEdit}
          >
            {task.title}
          </p>
        )}

        {/* Edit / confirm / cancel */}
        {editing ? (
          <>
            <button onClick={commitEdit} className="shrink-0 p-1.5 text-green-500 hover:bg-green-50 rounded-lg transition-colors">
              <Check className="w-3.5 h-3.5" />
            </button>
            <button onClick={cancelEdit} className="shrink-0 p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <>
            {/* Priority badge */}
            <button
              onClick={onPriority}
              className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border transition-all hover:opacity-80 shrink-0',
                pri.bg, pri.text, pri.border
              )}
              title="Click to cycle priority"
            >
              <span className={cn('w-1.5 h-1.5 rounded-full', pri.dot)} />
              {pri.label}
            </button>

            {/* Edit */}
            <button
              onClick={startEdit}
              className="shrink-0 p-1.5 text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
              title="Edit title"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>

            {/* Copy to date — only on unchecked tasks */}
            {!task.checked && (
              copying ? (
                <div className="flex items-center gap-1 shrink-0">
                  <input
                    ref={copyDateRef}
                    type="date"
                    className="text-xs px-2 py-1 rounded-lg border border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white text-slate-700 w-32"
                    value={copyDate}
                    onChange={e => setCopyDate(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') commitCopy(); if (e.key === 'Escape') setCopying(false) }}
                    autoFocus
                  />
                  <button
                    onClick={commitCopy}
                    disabled={!copyDate}
                    className="shrink-0 p-1.5 text-green-500 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-40"
                    title="Confirm copy"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setCopying(false)}
                    className="shrink-0 p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Cancel"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={startCopy}
                  className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-violet-500 bg-violet-50 hover:bg-violet-100 transition-colors border border-violet-200"
                  title="Copy to another date"
                >
                  <Copy className="w-3 h-3" />
                  Copy
                </button>
              )
            )}

            {/* Notes toggle */}
            <button
              onClick={() => setNotesOpen(v => !v)}
              className={cn(
                'shrink-0 p-1.5 rounded-lg transition-colors',
                notesOpen ? 'bg-indigo-50 text-indigo-500' : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100',
                task.notes && !notesOpen && 'text-amber-400 hover:text-amber-600'
              )}
              title="Notes"
            >
              {notesOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {/* Delete */}
            <button
              onClick={onDelete}
              className="shrink-0 p-1.5 text-slate-200 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>

      {/* Notes panel */}
      {notesOpen && (
        <div className="px-3 pb-3 border-t border-slate-100 pt-2">
          <textarea
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none bg-white"
            rows={2}
            placeholder="Add a note..."
            value={notesVal}
            onChange={e => setNotesVal(e.target.value)}
            onBlur={saveNotes}
          />
          {noteSaving && <p className="text-xs text-slate-400 mt-1">Saving…</p>}
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────
export default function DailyClient({ initialTasks, userId }: {
  initialTasks: DailyTask[]
  userId: string
}) {
  const today = toLocalISO(new Date())
  const [selectedDate, setSelectedDate] = useState(today)
  const [tasks, setTasks] = useState<DailyTask[]>(initialTasks)
  const [newTitle, setNewTitle] = useState('')
  const [newPriority, setNewPriority] = useState<DailyTask['priority']>('medium')
  const [completedOpen, setCompletedOpen] = useState(true)
  const [adding, setAdding] = useState(false)
  const [bulkCopying, setBulkCopying] = useState(false)
  const [bulkDate, setBulkDate] = useState('')
  const [showPullPanel, setShowPullPanel] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Tasks for selected date
  const dayTasks = tasks
    .filter(t => t.date === selectedDate)
    .sort((a, b) => a.order_index - b.order_index || a.created_at.localeCompare(b.created_at))

  // Yesterday's uncompleted tasks for carry-forward
  const yesterday = toLocalISO(new Date(parseLocalDate(selectedDate).getTime() - 86400000))
  const yesterdayUncompleted = tasks.filter(t => t.date === yesterday && !t.checked)

  // Stats
  const done = dayTasks.filter(t => t.checked).length
  const total = dayTasks.length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  const streak = calcStreak(tasks, today)

  // This week (Mon–today)
  const weekStart = new Date(parseLocalDate(today))
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + (weekStart.getDay() === 0 ? -6 : 1))
  const weekDone = tasks.filter(t => t.date >= toLocalISO(weekStart) && t.date <= today && t.checked).length

  function stepDate(dir: -1 | 1) {
    const d = parseLocalDate(selectedDate)
    d.setDate(d.getDate() + dir)
    setSelectedDate(toLocalISO(d))
  }

  async function addTask() {
    if (!newTitle.trim()) return
    setAdding(true)
    const payload = {
      title: newTitle.trim(),
      date: selectedDate,
      priority: newPriority,
      checked: false,
      notes: null,
      order_index: dayTasks.length,
      owner_id: userId,
    }
    const { data, error } = await upsertDailyTask(payload)
    if (error) { toast.error(error) }
    else {
      setTasks(prev => [...prev, data as DailyTask])
      setNewTitle('')
    }
    setAdding(false)
    inputRef.current?.focus()
  }

  async function toggleTask(id: string) {
    const task = tasks.find(t => t.id === id)
    if (!task) return
    const checked = !task.checked
    setTasks(prev => prev.map(t => t.id === id ? { ...t, checked } : t))
    const { error } = await upsertDailyTask({ checked }, id)
    if (error) {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, checked: !checked } : t))
      toast.error(error)
    }
  }

  async function cyclePriority(id: string) {
    const task = tasks.find(t => t.id === id)
    if (!task) return
    const priority = nextPriority(task.priority)
    setTasks(prev => prev.map(t => t.id === id ? { ...t, priority } : t))
    const { error } = await upsertDailyTask({ priority }, id)
    if (error) toast.error(error)
  }

  async function bulkCopyPending(toDate: string) {
    if (!toDate || unchecked.length === 0) return
    const existing = tasks.filter(t => t.date === toDate)
    const { data, error } = await carryForwardTasks(
      unchecked.map((t, i) => ({ title: t.title, priority: t.priority, notes: t.notes, order_index: existing.length + i })),
      toDate,
      userId
    )
    if (error) { toast.error(error); return }

    // Mark all originals as done on the source date
    const ids = unchecked.map(t => t.id)
    setTasks(prev => prev.map(t => ids.includes(t.id) ? { ...t, checked: true } : t))
    await Promise.all(ids.map(id => upsertDailyTask({ checked: true }, id)))

    setTasks(prev => [...prev, ...(data as DailyTask[])])
    const label = toDate === toLocalISO(new Date()) ? 'today' : toDate
    toast.success(`${unchecked.length} task${unchecked.length > 1 ? 's' : ''} rescheduled to ${label}`)
    setBulkCopying(false)
    setBulkDate('')
  }

  async function copyTask(id: string, toDate: string) {
    const task = tasks.find(t => t.id === id)
    if (!task) return
    const existing = tasks.filter(t => t.date === toDate)
    const payload = {
      title: task.title,
      date: toDate,
      priority: task.priority,
      notes: task.notes,
      checked: false,
      order_index: existing.length,
      owner_id: userId,
    }
    const { data, error } = await upsertDailyTask(payload)
    if (error) { toast.error(error); return }

    // Mark original as done on source date
    setTasks(prev => prev.map(t => t.id === id ? { ...t, checked: true } : t))
    await upsertDailyTask({ checked: true }, id)

    setTasks(prev => [...prev, data as DailyTask])
    const label = toDate === toLocalISO(new Date()) ? 'today' : toDate
    toast.success(`Rescheduled to ${label}`)
  }

  async function saveTitle(id: string, title: string) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, title } : t))
    const { error } = await upsertDailyTask({ title }, id)
    if (error) toast.error(error)
  }

  async function saveNotes(id: string, notes: string) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, notes: notes || null } : t))
    const { error } = await upsertDailyTask({ notes: notes || null }, id)
    if (error) toast.error(error)
  }

  async function deleteTask(id: string) {
    setTasks(prev => prev.filter(t => t.id !== id))
    const { error } = await deleteDailyTask(id)
    if (error) {
      toast.error(error)
      setTasks(initialTasks)
    } else {
      toast.success('Task removed')
    }
  }

  async function handleCarryForward() {
    if (yesterdayUncompleted.length === 0) return
    const { data, error } = await carryForwardTasks(
      yesterdayUncompleted.map((t, i) => ({ title: t.title, priority: t.priority, notes: t.notes, order_index: dayTasks.length + i })),
      selectedDate,
      userId
    )
    if (error) { toast.error(error) }
    else {
      // Mark originals as done so they don't re-appear
      const ids = yesterdayUncompleted.map(t => t.id)
      setTasks(prev => prev.map(t => ids.includes(t.id) ? { ...t, checked: true } : t))
      await Promise.all(ids.map(id => upsertDailyTask({ checked: true }, id)))
      setTasks(prev => [...prev, ...(data as DailyTask[])])
      toast.success(`${yesterdayUncompleted.length} task${yesterdayUncompleted.length > 1 ? 's' : ''} carried forward`)
    }
  }

  // Past dates (before selectedDate) with unchecked tasks
  const pastPendingByDate = useMemo(() => {
    const map: Record<string, DailyTask[]> = {}
    tasks.forEach(t => {
      if (!t.checked && t.date < selectedDate) {
        if (!map[t.date]) map[t.date] = []
        map[t.date].push(t)
      }
    })
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a))
  }, [tasks, selectedDate])

  async function pullFromDate(fromDate: string) {
    const pending = tasks.filter(t => t.date === fromDate && !t.checked)
    if (!pending.length) return
    const existing = tasks.filter(t => t.date === selectedDate)
    const { data, error } = await carryForwardTasks(
      pending.map((t, i) => ({ title: t.title, priority: t.priority, notes: t.notes, order_index: existing.length + i })),
      selectedDate,
      userId
    )
    if (error) { toast.error(error); return }
    // Mark originals as done
    const ids = pending.map(t => t.id)
    setTasks(prev => prev.map(t => ids.includes(t.id) ? { ...t, checked: true } : t))
    await Promise.all(ids.map(id => upsertDailyTask({ checked: true }, id)))
    setTasks(prev => [...prev, ...(data as DailyTask[])])
    toast.success(`${pending.length} task${pending.length > 1 ? 's' : ''} pulled from ${formatDisplayDate(fromDate)}`)
    setShowPullPanel(false)
  }

  // Keep today tasks sorted: unchecked first, then checked
  const unchecked = dayTasks.filter(t => !t.checked)
  const checked = dayTasks.filter(t => t.checked)

  return (
    <div className="max-w-2xl mx-auto space-y-4">

      {/* ── Date Navigator ── */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => stepDate(-1)}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex-1 text-center">
            <p className="font-bold text-slate-800 text-base" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              {formatDisplayDate(selectedDate)}
            </p>
            <p className="text-xs text-slate-400">{formatFullDate(selectedDate)}</p>
          </div>

          <button
            onClick={() => stepDate(1)}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {selectedDate !== today && (
            <button
              onClick={() => setSelectedDate(today)}
              className="text-xs font-semibold text-indigo-500 hover:text-indigo-700 px-3 py-1.5 bg-indigo-50 rounded-xl transition-colors shrink-0"
            >
              Today
            </button>
          )}
        </div>

        {/* Day progress bar */}
        {total > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-400">{done}/{total} done</span>
              <span className="text-xs font-bold" style={{ color: pct === 100 ? '#10B981' : '#4F46E5' }}>{pct}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: pct === 100 ? '#10B981' : '#4F46E5' }}
              />
            </div>
          </div>
        )}
      </Card>

      {/* ── Quick Add ── */}
      <Card className="p-3">
        <div className="flex items-center gap-2">
          <select
            className="px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 shrink-0"
            value={newPriority}
            onChange={e => setNewPriority(e.target.value as DailyTask['priority'])}
          >
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <input
            ref={inputRef}
            className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
            placeholder={`Add a task for ${formatDisplayDate(selectedDate).toLowerCase()}…`}
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !adding && addTask()}
          />
          <button
            onClick={addTask}
            disabled={adding || !newTitle.trim()}
            className="w-10 h-10 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white flex items-center justify-center transition-colors disabled:opacity-40 shrink-0"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </Card>

      {/* ── Bulk copy pending ── */}
      {unchecked.length > 0 && (
        <div className="flex items-center gap-2">
          {bulkCopying ? (
            <>
              <span className="text-xs font-semibold text-violet-600 shrink-0">Copy {unchecked.length} pending to:</span>
              <input
                type="date"
                autoFocus
                className="flex-1 px-3 py-1.5 rounded-xl border border-violet-300 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white text-slate-700"
                value={bulkDate}
                onChange={e => setBulkDate(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') bulkCopyPending(bulkDate); if (e.key === 'Escape') { setBulkCopying(false); setBulkDate('') } }}
              />
              <button
                onClick={() => bulkCopyPending(bulkDate)}
                disabled={!bulkDate}
                className="px-3 py-1.5 rounded-xl bg-violet-500 hover:bg-violet-600 text-white text-xs font-bold transition-colors disabled:opacity-40 shrink-0"
              >
                Copy all
              </button>
              <button
                onClick={() => { setBulkCopying(false); setBulkDate('') }}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition-colors shrink-0"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setBulkCopying(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-violet-200 bg-violet-50 text-violet-600 text-xs font-semibold hover:bg-violet-100 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy all {unchecked.length} pending to another date
            </button>
          )}
        </div>
      )}

      {/* ── Task List ── */}
      {total === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mb-3">
            <CalendarCheck className="w-7 h-7 text-indigo-400" />
          </div>
          <p className="text-sm font-semibold text-slate-600 mb-1">No tasks for {formatDisplayDate(selectedDate).toLowerCase()}</p>
          <p className="text-xs text-slate-400">Type above and press Enter to add your first task.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Unchecked tasks */}
          {unchecked.map(task => (
            <TaskRow
              key={task.id}
              task={task}
              onToggle={() => toggleTask(task.id)}
              onDelete={() => deleteTask(task.id)}
              onPriority={() => cyclePriority(task.id)}
              onNotesSave={notes => saveNotes(task.id, notes)}
              onTitleSave={title => saveTitle(task.id, title)}
              onCopyTo={date => copyTask(task.id, date)}
            />
          ))}

          {/* Checked tasks — collapsible section */}
          {checked.length > 0 && (
            <>
              <button
                onClick={() => setCompletedOpen(v => !v)}
                className="w-full flex items-center gap-2 py-1 group"
              >
                <div className="flex-1 h-px bg-slate-100" />
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 group-hover:text-slate-600 transition-colors px-1 shrink-0">
                  {completedOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {checked.length} completed
                </span>
                <div className="flex-1 h-px bg-slate-100" />
              </button>
              {completedOpen && checked.map(task => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onToggle={() => toggleTask(task.id)}
                  onDelete={() => deleteTask(task.id)}
                  onPriority={() => cyclePriority(task.id)}
                  onNotesSave={notes => saveNotes(task.id, notes)}
                  onTitleSave={title => saveTitle(task.id, title)}
                  onCopyTo={date => copyTask(task.id, date)}
                />
              ))}
            </>
          )}
        </div>
      )}

      {/* ── Pull old pending tasks ── */}
      {pastPendingByDate.length > 0 && (
        <div>
          {!showPullPanel ? (
            <button
              onClick={() => setShowPullPanel(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 text-xs font-semibold hover:bg-amber-100 transition-colors"
            >
              <ArrowDownToLine className="w-3.5 h-3.5" />
              Pull pending from past ({pastPendingByDate.reduce((s, [, ts]) => s + ts.length, 0)} tasks across {pastPendingByDate.length} {pastPendingByDate.length === 1 ? 'day' : 'days'})
            </button>
          ) : (
            <Card className="p-4 border-amber-200 bg-amber-50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowDownToLine className="w-4 h-4 text-amber-600" />
                  <p className="text-sm font-bold text-amber-800">Pull pending tasks to {formatDisplayDate(selectedDate)}</p>
                </div>
                <button
                  onClick={() => setShowPullPanel(false)}
                  className="p-1 text-amber-400 hover:text-amber-700 hover:bg-amber-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                {pastPendingByDate.map(([date, pending]) => (
                  <div key={date} className="flex items-center justify-between gap-3 bg-white rounded-xl px-3 py-2.5 border border-amber-100">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-600">
                        {formatDisplayDate(date)}
                        <span className="ml-1.5 font-normal text-slate-400">· {date}</span>
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">
                        {pending.slice(0, 3).map(t => t.title).join(' · ')}{pending.length > 3 ? ` +${pending.length - 3} more` : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => pullFromDate(date)}
                      className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors"
                    >
                      <ArrowDownToLine className="w-3 h-3" />
                      Pull {pending.length}
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-amber-600">Pulled tasks are added here; originals are marked done.</p>
            </Card>
          )}
        </div>
      )}

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Today</p>
          <p className="text-2xl font-bold" style={{ color: '#4F46E5', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            {done}/{total}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">done</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">This Week</p>
          <p className="text-2xl font-bold" style={{ color: '#10B981', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            {weekDone}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">tasks done</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Streak</p>
          <div className="flex items-center justify-center gap-1">
            <p className="text-2xl font-bold" style={{ color: streak > 0 ? '#F59E0B' : '#CBD5E1', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              {streak}
            </p>
            {streak > 0 && <Flame className="w-5 h-5 text-amber-400 mb-0.5" />}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{streak === 1 ? 'day' : 'days'} complete</p>
        </Card>
      </div>
    </div>
  )
}
