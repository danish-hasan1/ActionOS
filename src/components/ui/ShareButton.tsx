'use client'

import { useState, useRef, useEffect } from 'react'
import { Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { shareItemWithUser } from '@/lib/actions'

type AppUser = { id: string; name: string }

export default function ShareButton({
  table,
  itemId,
  currentUserId,
}: {
  table: string
  itemId: string
  currentUserId: string
}) {
  const [open, setOpen] = useState(false)
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(false)
  const [sharing, setSharing] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleOpen() {
    if (open) { setOpen(false); return }
    setLoading(true)
    try {
      const res = await fetch('/api/users')
      const data: AppUser[] = await res.json()
      setUsers(Array.isArray(data) ? data.filter(u => u.id !== currentUserId) : [])
    } catch {
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
    setOpen(true)
  }

  async function handleShare(user: AppUser) {
    setSharing(true)
    setOpen(false)
    const result = await shareItemWithUser(table, itemId, user.id)
    if (result.error) {
      toast.error(`Failed to share: ${result.error}`)
    } else {
      toast.success(`Shared with ${user.name}`)
    }
    setSharing(false)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        disabled={sharing}
        className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-100 text-slate-400 hover:text-indigo-500 transition-colors disabled:opacity-50"
        title="Share with another user"
      >
        <Share2 className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div className="absolute right-0 top-7 z-30 bg-white rounded-xl shadow-lg border border-slate-100 py-1 min-w-[140px]">
          {loading ? (
            <p className="text-xs text-slate-400 px-3 py-2">Loading...</p>
          ) : users.length === 0 ? (
            <p className="text-xs text-slate-400 px-3 py-2">No other users</p>
          ) : (
            <>
              <p className="text-xs font-semibold text-slate-400 px-3 py-1.5 uppercase tracking-wide">Share with</p>
              {users.map(user => (
                <button
                  key={user.id}
                  onClick={() => handleShare(user)}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center shrink-0">
                    <span className="text-white text-xs font-bold">{user.name.slice(0, 1).toUpperCase()}</span>
                  </div>
                  {user.name}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
