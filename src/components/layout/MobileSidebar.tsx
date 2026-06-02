'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, AlertTriangle, CheckSquare, Target,
  Map, ClipboardList, Bell, FileText, Settings, Zap, Menu, X, CalendarCheck, Briefcase
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard',             label: 'Overview',    icon: LayoutDashboard },
  { href: '/dashboard/daily',       label: 'Daily Tasks', icon: CalendarCheck },
  { href: '/dashboard/pain-points', label: 'Pain Points', icon: AlertTriangle },
  { href: '/dashboard/tasks',       label: 'Tasks',       icon: CheckSquare },
  { href: '/dashboard/goals',       label: 'Goals',       icon: Target },
  { href: '/dashboard/roadmap',     label: 'Roadmap',     icon: Map },
  { href: '/dashboard/agenda',      label: 'Agenda',      icon: ClipboardList },
  { href: '/dashboard/followups',   label: 'Follow-ups',  icon: Bell },
  { href: '/dashboard/reports',     label: 'Reports',     icon: FileText },
  { href: '/dashboard/roles',       label: 'Roles',       icon: Briefcase },
  { href: '/dashboard/settings',    label: 'Settings',    icon: Settings },
]

export default function MobileSidebar({ startDate }: { startDate?: string | null }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const start = startDate ? new Date(startDate) : new Date()
  const days = Math.max(1, Math.floor((Date.now() - start.getTime()) / 86400000) + 1)
  const phase = days <= 30 ? 1 : days <= 60 ? 2 : 3
  const phaseColor = days <= 30 ? '#7C3AED' : days <= 60 ? '#F59E0B' : '#10B981'
  const phaseBg = days <= 30 ? '#F5F3FF' : days <= 60 ? '#FFFBEB' : '#ECFDF5'

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="md:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div className={cn(
        'fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 md:hidden shadow-xl',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center shadow-sm">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-gray-900 font-bold text-sm" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>ActionPlan OS</p>
              <p className="text-gray-400 text-xs">TA Command Center</p>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <Link key={href} href={href} onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all',
                  active ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                )}>
                <Icon className={cn('w-4 h-4 shrink-0', active ? 'text-indigo-600' : 'text-gray-400')} />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="px-3 py-4 border-t border-gray-100">
          <div className="px-3 py-3 rounded-xl" style={{ backgroundColor: phaseBg }}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: phaseColor }}>Phase {phase}</p>
              <span className="text-xs font-bold" style={{ color: phaseColor }}>Day {days}</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mt-2">
              <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.round((days / 90) * 100))}%`, backgroundColor: phaseColor }} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
