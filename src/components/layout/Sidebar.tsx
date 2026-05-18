'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, AlertTriangle, CheckSquare, Target,
  Map, ClipboardList, Bell, FileText, Settings, Zap, CalendarCheck
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard',              label: 'Overview',    icon: LayoutDashboard },
  { href: '/dashboard/daily',        label: 'Daily Tasks', icon: CalendarCheck },
  { href: '/dashboard/pain-points',  label: 'Pain Points', icon: AlertTriangle, alert: true },
  { href: '/dashboard/tasks',        label: 'Tasks',       icon: CheckSquare },
  { href: '/dashboard/goals',        label: 'Goals',       icon: Target },
  { href: '/dashboard/roadmap',      label: 'Roadmap',     icon: Map },
  { href: '/dashboard/agenda',       label: 'Agenda',      icon: ClipboardList },
  { href: '/dashboard/followups',    label: 'Follow-ups',  icon: Bell },
  { href: '/dashboard/reports',      label: 'Reports',     icon: FileText },
]

interface SidebarProps {
  startDate?: string | null
}

export default function Sidebar({ startDate }: SidebarProps) {
  const pathname = usePathname()

  const start = startDate ? new Date(startDate) : new Date()
  const days = Math.max(1, Math.floor((Date.now() - start.getTime()) / 86400000) + 1)
  const pct = Math.min(100, Math.round((days / 90) * 100))
  const phase = days <= 30 ? 1 : days <= 60 ? 2 : 3
  const phaseLabel = days <= 30 ? 'Learn & Listen' : days <= 60 ? 'Fix & Build' : 'Scale & Optimise'
  const phaseColor = days <= 30 ? '#7C3AED' : days <= 60 ? '#F59E0B' : '#10B981'
  const phaseBg = days <= 30 ? '#F5F3FF' : days <= 60 ? '#FFFBEB' : '#ECFDF5'
  const dayRange = days <= 30 ? 'Days 1–30' : days <= 60 ? 'Days 31–60' : 'Days 61–90'

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-full shrink-0">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center shadow-sm">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-gray-900 font-bold text-sm leading-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>ActionPlan OS</p>
            <p className="text-gray-400 text-xs">TA Command Center</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon, alert }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
                active
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              )}
            >
              <Icon className={cn(
                'w-4 h-4 shrink-0 transition-colors',
                active ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'
              )} />
              <span className="flex-1">{label}</span>
              {alert && (
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-gray-100 space-y-1">
        <Link
          href="/dashboard/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
            pathname.startsWith('/dashboard/settings')
              ? 'bg-indigo-50 text-indigo-700'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
          )}
        >
          <Settings className={cn('w-4 h-4', pathname.startsWith('/dashboard/settings') ? 'text-indigo-600' : 'text-gray-400')} />
          Settings
        </Link>

        {/* Phase indicator */}
        <div className="mt-2 px-3 py-3 rounded-xl" style={{ backgroundColor: phaseBg }}>
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: phaseColor }}>Phase {phase}</p>
            <span className="text-xs font-bold" style={{ color: phaseColor }}>Day {days}</span>
          </div>
          <p className="text-xs font-semibold mb-2" style={{ color: phaseColor }}>{phaseLabel}</p>
          <p className="text-gray-400 text-xs mb-1.5">{dayRange}</p>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, backgroundColor: phaseColor }}
            />
          </div>
          <p className="text-gray-400 text-xs mt-1">{pct}% of 90 days</p>
        </div>
      </div>
    </aside>
  )
}
