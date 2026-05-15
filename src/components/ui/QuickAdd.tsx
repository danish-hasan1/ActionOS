'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { quickInsert } from '@/lib/actions'
import { Plus, X, CheckSquare, AlertTriangle } from 'lucide-react'
import { Modal, FormField, Button, inputCls, selectCls } from '@/components/ui'
import { cn } from '@/lib/utils'

type QuickType = 'task' | 'pain_point'

export default function QuickAdd({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [type, setType] = useState<QuickType>('task')
  const [loading, setLoading] = useState(false)

  const [task, setTask] = useState({ title: '', priority: 'medium', phase: '' })
  const [pp, setPP] = useState({ title: '', severity: 'medium', phase: '' })

  function openAs(t: QuickType) {
    setType(t); setMenuOpen(false); setOpen(true)
  }

  async function save() {
    setLoading(true)
    if (type === 'task') {
      if (!task.title.trim()) { toast.error('Title required'); setLoading(false); return }
      const { error } = await quickInsert('tasks', {
        title: task.title.trim(), priority: task.priority,
        phase: task.phase || null, status: 'todo', owner_id: userId
      })
      if (error) toast.error(error)
      else { toast.success('Task created'); setTask({ title: '', priority: 'medium', phase: '' }); setOpen(false) }
    } else {
      if (!pp.title.trim()) { toast.error('Title required'); setLoading(false); return }
      const { error } = await quickInsert('pain_points', {
        title: pp.title.trim(), severity: pp.severity,
        phase: pp.phase || null, status: 'open', tag_ids: [], owner_id: userId
      })
      if (error) toast.error(error)
      else { toast.success('Pain point logged'); setPP({ title: '', severity: 'medium', phase: '' }); setOpen(false) }
    }
    setLoading(false)
  }

  return (
    <>
      {/* FAB */}
      <div className="fixed bottom-6 right-6 z-30 flex flex-col items-end gap-2">
        {/* Mini menu */}
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)} />
            <div className="relative z-30 flex flex-col gap-2 mb-1">
              <button
                onClick={() => openAs('pain_point')}
                className="flex items-center gap-2.5 px-4 py-2.5 bg-white shadow-lg rounded-xl text-sm font-semibold text-slate-700 border border-slate-100 hover:bg-slate-50 transition-all"
              >
                <AlertTriangle className="w-4 h-4 text-red-400" />
                Log Pain Point
              </button>
              <button
                onClick={() => openAs('task')}
                className="flex items-center gap-2.5 px-4 py-2.5 bg-white shadow-lg rounded-xl text-sm font-semibold text-slate-700 border border-slate-100 hover:bg-slate-50 transition-all"
              >
                <CheckSquare className="w-4 h-4 text-blue-500" />
                Add Task
              </button>
            </div>
          </>
        )}

        {/* Main FAB button */}
        <button
          onClick={() => setMenuOpen(v => !v)}
          className={cn(
            'w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-200',
            menuOpen
              ? 'bg-slate-700 rotate-45'
              : 'bg-indigo-500 hover:bg-indigo-600 hover:scale-105'
          )}
        >
          {menuOpen
            ? <X className="w-6 h-6 text-white" />
            : <Plus className="w-6 h-6 text-white" />
          }
        </button>
      </div>

      {/* Quick add modal */}
      <Modal open={open} onClose={() => setOpen(false)} title={type === 'task' ? 'Quick Add Task' : 'Quick Log Pain Point'}>
        <div className="space-y-4">
          {/* Type toggle */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            {(['task', 'pain_point'] as QuickType[]).map(t => (
              <button key={t} onClick={() => setType(t)}
                className={cn('flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all',
                  type === t ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'
                )}>
                {t === 'task' ? <><CheckSquare className="w-4 h-4 text-blue-500" /> Task</> : <><AlertTriangle className="w-4 h-4 text-red-400" /> Pain Point</>}
              </button>
            ))}
          </div>

          {type === 'task' ? (
            <>
              <FormField label="Task Title" required>
                <input className={inputCls} value={task.title} onChange={e => setTask(t => ({ ...t, title: e.target.value }))} placeholder="What needs to be done?" autoFocus />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Priority">
                  <select className={selectCls} value={task.priority} onChange={e => setTask(t => ({ ...t, priority: e.target.value }))}>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </FormField>
                <FormField label="Phase">
                  <select className={selectCls} value={task.phase} onChange={e => setTask(t => ({ ...t, phase: e.target.value }))}>
                    <option value="">Unassigned</option>
                    <option value="30">Phase 1 (30)</option>
                    <option value="60">Phase 2 (60)</option>
                    <option value="90">Phase 3 (90)</option>
                  </select>
                </FormField>
              </div>
            </>
          ) : (
            <>
              <FormField label="Pain Point Title" required>
                <input className={inputCls} value={pp.title} onChange={e => setPP(p => ({ ...p, title: e.target.value }))} placeholder="What is the issue?" autoFocus />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Severity">
                  <select className={selectCls} value={pp.severity} onChange={e => setPP(p => ({ ...p, severity: e.target.value }))}>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </FormField>
                <FormField label="Phase">
                  <select className={selectCls} value={pp.phase} onChange={e => setPP(p => ({ ...p, phase: e.target.value }))}>
                    <option value="">Unassigned</option>
                    <option value="30">Phase 1 (30)</option>
                    <option value="60">Phase 2 (60)</option>
                    <option value="90">Phase 3 (90)</option>
                  </select>
                </FormField>
              </div>
            </>
          )}

          <p className="text-xs text-slate-400">You can add full details from the dedicated module page.</p>

          <div className="flex justify-end gap-3 pt-1">
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={loading}>
              {loading ? 'Saving...' : type === 'task' ? 'Create Task' : 'Log Pain Point'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
