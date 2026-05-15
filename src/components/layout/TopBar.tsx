'use client'

import { usePathname } from 'next/navigation'

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
  mobileOnly = false,
}: {
  displayName?: string | null
  mobileOnly?: boolean
}) {
  const pathname = usePathname()
  const label = ROUTE_LABELS[pathname] ?? 'Dashboard'
  const name  = displayName || 'TA Head'
  const initials = name.slice(0, 2).toUpperCase()

  if (mobileOnly) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center shrink-0">
          <span className="text-white text-xs font-bold">{initials}</span>
        </div>
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
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200">
        <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center shrink-0">
          <span className="text-white text-xs font-bold">{initials}</span>
        </div>
        <span className="text-sm text-gray-600 font-medium">{name}</span>
      </div>
    </div>
  )
}
