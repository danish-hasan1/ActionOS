'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { User, Tag as TagIcon, Plus, Trash2, Pencil, Check, X, Save } from 'lucide-react'
import type { Tag } from '@/types'
import { Button, Card, FormField, inputCls } from '@/components/ui'
import { cn } from '@/lib/utils'

type UserSettings = {
  id?: string
  display_name?: string | null
  company_name?: string | null
  role_title?: string | null
  start_date?: string | null
  notification_email?: string | null
}

const PRESET_COLORS = [
  '#6366F1', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899',
  '#64748B', '#10B981', '#3B82F6', '#F97316', '#14B8A6',
  '#EAB308', '#4F46E5', '#F59E0B', '#10B981', '#DC2626',
]

// ─── Tag Row ──────────────────────────────────────────────────
function TagRow({ tag, onDelete, onUpdate }: {
  tag: Tag
  onDelete: (id: string) => void
  onUpdate: (tag: Tag) => void
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(tag.name)
  const [color, setColor] = useState(tag.color)

  function cancel() { setName(tag.name); setColor(tag.color); setEditing(false) }
  function save() {
    if (!name.trim()) return
    onUpdate({ ...tag, name: name.trim(), color })
    setEditing(false)
  }

  return (
    <div className={cn('flex items-center gap-3 p-3 rounded-xl border transition-all',
      editing ? 'border-indigo-200 bg-slate-50' : 'border-slate-100 bg-white hover:border-slate-200'
    )}>
      {editing ? (
        <>
          {/* Color picker */}
          <div className="flex flex-wrap gap-1.5 shrink-0">
            {PRESET_COLORS.map(c => (
              <button key={c} onClick={() => setColor(c)}
                className={cn('w-5 h-5 rounded-full border-2 transition-transform hover:scale-110',
                  color === c ? 'border-slate-700 scale-110' : 'border-transparent'
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <input
            className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && save()}
            autoFocus
          />
          <button onClick={save} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"><Check className="w-4 h-4" /></button>
          <button onClick={cancel} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
        </>
      ) : (
        <>
          <span
            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border shrink-0"
            style={{ backgroundColor: `${tag.color}18`, color: tag.color, borderColor: `${tag.color}40` }}
          >
            {tag.name}
          </span>
          <span className="text-xs text-slate-400 capitalize">{tag.category}</span>
          <div className="flex-1" />
          <button onClick={() => setEditing(true)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(tag.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </>
      )}
    </div>
  )
}

// ─── Add Tag Form ─────────────────────────────────────────────
function AddTagForm({ onAdd }: { onAdd: (_name: string, _color: string, _cat: 'owner' | 'category') => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [color, setColor] = useState('#6366F1')
  const [category, setCategory] = useState<'owner' | 'category'>('owner')

  function submit() {
    if (!name.trim()) return
    onAdd(name.trim(), color, category)
    setName(''); setColor('#6366F1'); setCategory('owner'); setOpen(false)
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl border-2 border-dashed border-slate-200 text-sm text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all">
        <Plus className="w-4 h-4" /> Add custom tag
      </button>
    )
  }

  return (
    <div className="p-4 rounded-xl border-2 border-indigo-100 bg-indigo-50/40 space-y-3">
      <p className="text-sm font-semibold text-slate-700">New Tag</p>
      <div>
        <p className="text-xs text-slate-500 mb-2">Choose colour</p>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)}
              className={cn('w-6 h-6 rounded-full border-2 transition-transform hover:scale-110',
                color === c ? 'border-slate-700 scale-110' : 'border-transparent'
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Tag Name</label>
          <input
            className={inputCls}
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="e.g. Finance, L&D..."
            autoFocus
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
          <select
            className={inputCls + ' cursor-pointer'}
            value={category}
            onChange={e => setCategory(e.target.value as 'owner' | 'category')}
          >
            <option value="owner">Owner</option>
            <option value="category">Category</option>
          </select>
        </div>
      </div>
      {/* Preview */}
      {name && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Preview:</span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border"
            style={{ backgroundColor: `${color}18`, color, borderColor: `${color}40` }}>
            {name}
          </span>
        </div>
      )}
      <div className="flex gap-2">
        <Button onClick={submit} size="sm" disabled={!name.trim()}><Plus className="w-3.5 h-3.5" /> Add Tag</Button>
        <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────
export default function SettingsClient({ initialSettings, initialTags, userId }: {
  initialSettings: UserSettings | null
  initialTags: Tag[]
  userId: string
}) {
  const supabase = createClient()

  // Profile state
  const [profile, setProfile] = useState<UserSettings>({
    display_name: initialSettings?.display_name ?? '',
    company_name: initialSettings?.company_name ?? '',
    role_title: initialSettings?.role_title ?? 'Head of Talent Acquisition',
    start_date: initialSettings?.start_date ?? new Date().toISOString().split('T')[0],
    notification_email: initialSettings?.notification_email ?? '',
  })
  const [savingProfile, setSavingProfile] = useState(false)

  // Tags state
  const [tags, setTags] = useState<Tag[]>(initialTags)
  const [activeTab, setActiveTab] = useState<'profile' | 'tags' | 'danger'>('profile')

  // ── Profile save ───────────────────────────────────────────
  async function saveProfile() {
    setSavingProfile(true)
    const payload = { ...profile, owner_id: userId }
    const { error } = initialSettings?.id
      ? await supabase.from('user_settings').update(payload).eq('id', initialSettings.id)
      : await supabase.from('user_settings').insert(payload)
    if (error) toast.error(error.message)
    else toast.success('Profile saved')
    setSavingProfile(false)
  }

  // ── Tag ops ───────────────────────────────────────────────
  async function handleAddTag(name: string, color: string, category: 'owner' | 'category') {
    const { data, error } = await supabase.from('tags').insert({ name, color, category }).select().single()
    if (error) toast.error(error.message)
    else { setTags(prev => [...prev, data as Tag]); toast.success('Tag added') }
  }

  async function handleUpdateTag(updated: Tag) {
    const { error } = await supabase.from('tags').update({ name: updated.name, color: updated.color }).eq('id', updated.id)
    if (error) toast.error(error.message)
    else { setTags(prev => prev.map(t => t.id === updated.id ? updated : t)); toast.success('Tag updated') }
  }

  async function handleDeleteTag(id: string) {
    if (!confirm('Delete this tag? It will be removed from all pain points.')) return
    const { error } = await supabase.from('tags').delete().eq('id', id)
    if (error) toast.error(error.message)
    else { setTags(prev => prev.filter(t => t.id !== id)); toast.success('Tag deleted') }
  }

  const ownerTags = tags.filter(t => t.category === 'owner')
  const catTags = tags.filter(t => t.category === 'category')

  return (
    <div className="max-w-2xl space-y-5">
      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 w-fit">
        {([['profile', 'Profile & Preferences', User], ['tags', 'Tag Management', TagIcon]] as [string, string, React.ElementType][]).map(([val, label, Icon]) => (
          <button key={val} onClick={() => setActiveTab(val as typeof activeTab)}
            className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              activeTab === val ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
            )}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {/* ── Profile Tab ──────────────────────────────────────── */}
      {activeTab === 'profile' && (
        <Card className="p-6 space-y-5">
          <div>
            <h3 className="font-bold text-[#4F46E5] mb-0.5" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Your Profile</h3>
            <p className="text-xs text-slate-400">Used in reports and the dashboard sidebar phase tracker.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Display Name">
              <input className={inputCls} value={profile.display_name ?? ''} onChange={e => setProfile(p => ({ ...p, display_name: e.target.value }))} placeholder="Your name" />
            </FormField>
            <FormField label="Company Name">
              <input className={inputCls} value={profile.company_name ?? ''} onChange={e => setProfile(p => ({ ...p, company_name: e.target.value }))} placeholder="Company" />
            </FormField>
          </div>

          <FormField label="Role Title">
            <input className={inputCls} value={profile.role_title ?? ''} onChange={e => setProfile(p => ({ ...p, role_title: e.target.value }))} placeholder="Head of Talent Acquisition" />
          </FormField>

          <FormField label="Start Date (Day 1 of your 90-day plan)" hint="This drives the phase indicator in the sidebar — Day X of 90.">
            <input type="date" className={inputCls} value={profile.start_date ?? ''} onChange={e => setProfile(p => ({ ...p, start_date: e.target.value }))} />
          </FormField>

          <FormField label="Reminder Email" hint="Where follow-up reminders will be sent (if enabled).">
            <input type="email" className={inputCls} value={profile.notification_email ?? ''} onChange={e => setProfile(p => ({ ...p, notification_email: e.target.value }))} placeholder="you@company.com" />
          </FormField>

          {/* Phase preview */}
          {profile.start_date && (() => {
            const days = Math.floor((Date.now() - new Date(profile.start_date).getTime()) / 86400000)
            const phase = days <= 30 ? '1' : days <= 60 ? '2' : '3'
            const phaseLabel = days <= 30 ? 'Learn & Listen' : days <= 60 ? 'Fix & Build' : 'Scale & Optimise'
            const pct = Math.min(100, Math.round((days / 90) * 100))
            return (
              <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                <p className="text-xs font-semibold text-indigo-700 mb-2">📍 Current position in your 90-day plan</p>
                <p className="text-sm font-bold text-indigo-900">Day {Math.max(1, days)} · Phase {phase} — {phaseLabel}</p>
                <div className="mt-2 h-2 bg-white rounded-full overflow-hidden border border-[#4F46E5]/10">
                  <div className="h-full bg-[#F59E0B] rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-xs text-slate-400 mt-1">{pct}% through your 90-day plan</p>
              </div>
            )
          })()}

          <Button onClick={saveProfile} disabled={savingProfile}>
            <Save className="w-4 h-4" />{savingProfile ? 'Saving...' : 'Save Profile'}
          </Button>
        </Card>
      )}

      {/* ── Tags Tab ─────────────────────────────────────────── */}
      {activeTab === 'tags' && (
        <div className="space-y-5">
          {/* Owner tags */}
          <Card className="p-6">
            <div className="mb-4">
              <h3 className="font-bold text-gray-900" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Owner Tags</h3>
              <p className="text-xs text-slate-400 mt-0.5">Tag pain points by who owns the issue — Recruiter, AM, HM, etc.</p>
            </div>
            <div className="space-y-2 mb-3">
              {ownerTags.map(tag => (
                <TagRow key={tag.id} tag={tag} onDelete={handleDeleteTag} onUpdate={handleUpdateTag} />
              ))}
              {ownerTags.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-3">No owner tags yet</p>
              )}
            </div>
            <AddTagForm onAdd={(n, c) => handleAddTag(n, c, 'owner')} />
          </Card>

          {/* Category tags */}
          <Card className="p-6">
            <div className="mb-4">
              <h3 className="font-bold text-gray-900" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Category Tags</h3>
              <p className="text-xs text-slate-400 mt-0.5">Tag pain points by type — Process, Technology, Communication, etc.</p>
            </div>
            <div className="space-y-2 mb-3">
              {catTags.map(tag => (
                <TagRow key={tag.id} tag={tag} onDelete={handleDeleteTag} onUpdate={handleUpdateTag} />
              ))}
              {catTags.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-3">No category tags yet</p>
              )}
            </div>
            <AddTagForm onAdd={(n, c) => handleAddTag(n, c, 'category')} />
          </Card>

          <p className="text-xs text-slate-400 px-1">
            Tags are global — changes apply across all pain points immediately.
            Deleting a tag removes it from any pain points it was attached to.
          </p>
        </div>
      )}
    </div>
  )
}
