'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { LogOut } from 'lucide-react'
import { toast } from 'sonner'

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
  user,
  displayName,
  mobileOnly = false,
}: {
  user: User
  displayName?: string | null
  mobileOnly?: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    toast.success('Signed out')
    router.push('/login')
    router.refresh()
  }

  const label    = ROUTE_LABELS[pathname] ?? 'Dashboard'
  const name     = (displayName || user.email?.split('@')[0]) ?? 'TA'
  const initials = name.slice(0, 2).toUpperCase()

  if (mobileOnly) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-[#1B3A5C] flex items-center justify-center shrink-0">
          <span className="text-white text-xs font-bold">{initials}</span>
        </div>
        <button onClick={signOut} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xs text-slate-400">ActionPlan OS</span>
        <span className="text-slate-300">/</span>
        <span className="text-sm font-semibold text-slate-700 truncate">{label}</span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
          <div className="w-6 h-6 rounded-full bg-[#1B3A5C] flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">{initials}</span>
          </div>
          <span className="text-sm text-slate-600 font-medium max-w-[140px] truncate">
            {displayName || user.email}
          </span>
        </div>
        <button onClick={signOut} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" title="Sign out">
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
