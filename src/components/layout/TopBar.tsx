'use client'

import { usePathname, useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { useState } from 'react'

const ROUTE_LABELS: Record<string, string> = {
  '/dashboard': 'Overview',
  '/dashboard/pain-points': 'Pain Points',
  '/dashboard/tasks': 'Tasks',
  '/dashboard/goals': 'Goals',
  '/dashboard/roadmap': 'Roadmap',
  '/dashboard/agenda': 'Agenda',
  '/dashboard/followups': 'Follow-ups',
  '/dashboard/reports': 'Reports',
  '/dashboard/settings': 'Settings',
}

export default function TopBar({
  displayName,
  userName,
  mobileOnly = false,
}: {
  displayName?: string | null
  userName?: string | null
  mobileOnly?: boolean
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  const label = ROUTE_LABELS[pathname] ?? 'Dashboard'
  const name = userName || displayName || 'TA Head'
  const initials = name.slice(0, 2).toUpperCase()

  async function handleLogout() {
    setSigningOut(true)
    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      })
    } catch {
      // ignore
    }
    router.push('/')
  }

  if (mobileOnly) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center shrink-0">
          <span className="text-white text-xs font-bold">{initials}</span>
        </div>
        <button
          onClick={handleLogout}
          disabled={signingOut}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xs text-gray-400">ActionPlan OS</span>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-semibold text-gray-800 truncate">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200">
          <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">{initials}</span>
          </div>
          <span className="text-sm text-gray-600 font-medium">{name}</span>
        </div>
        <button
          onClick={handleLogout}
          disabled={signingOut}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all text-xs font-medium disabled:opacity-50"
          title="Sign out"
        >
          <LogOut className="w-3.5 h-3.5" />
          {signingOut ? 'Signing out...' : 'Sign out'}
        </button>
      </div>
    </div>
  )
}
