'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, AlertTriangle, CheckSquare, Target,
  Map, ClipboardList, Bell, FileText, Settings, Zap
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard',              label: 'Overview',    icon: LayoutDashboard },
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

  // Phase calculation from real start date
  const start = startDate ? new Date(startDate) : new Date()
  const days = Math.max(1, Math.floor((Date.now() - start.getTime()) / 86400000) + 1)
  const pct = Math.min(100, Math.round((days / 90) * 100))
  const phase = days <= 30 ? 1 : days <= 60 ? 2 : 3
  const phaseLabel = days <= 30 ? 'Learn & Listen' : days <= 60 ? 'Fix & Build' : 'Scale & Optimise'
  const phaseColor = days <= 30 ? '#7C3AED' : days <= 60 ? '#E85D26' : '#2E9E6B'
  const dayRange = days <= 30 ? 'Days 1–30' : days <= 60 ? 'Days 31–60' : 'Days 61–90'

  return (
    <aside className="w-64 bg-[#1B3A5C] flex flex-col h-full shrink-0">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#E85D26] flex items-center justify-center shadow">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>ActionPlan OS</p>
            <p className="text-white/40 text-xs">TA Command Center</p>
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
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-white/55 hover:text-white hover:bg-white/8'
              )}
            >
              <Icon className={cn(
                'w-4 h-4 shrink-0 transition-colors',
                active ? 'text-[#E85D26]' : 'text-white/40 group-hover:text-white/70'
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
      <div className="px-3 py-4 border-t border-white/10 space-y-1">
        <Link
          href="/dashboard/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
            pathname.startsWith('/dashboard/settings')
              ? 'bg-white/15 text-white'
              : 'text-white/55 hover:text-white hover:bg-white/8'
          )}
        >
          <Settings className={cn('w-4 h-4', pathname.startsWith('/dashboard/settings') ? 'text-[#E85D26]' : 'text-white/40')} />
          Settings
        </Link>

        {/* Phase indicator — now dynamic */}
        <div className="mt-2 px-3 py-3 bg-white/8 rounded-xl">
          <div className="flex items-center justify-between mb-1">
            <p className="text-white/40 text-xs font-semibold uppercase tracking-wide">Phase {phase}</p>
            <span className="text-xs font-bold" style={{ color: phaseColor }}>Day {days}</span>
          </div>
          <p className="text-xs font-semibold mb-2" style={{ color: phaseColor }}>{phaseLabel}</p>
          <p className="text-white/30 text-xs mb-1.5">{dayRange}</p>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, backgroundColor: phaseColor }}
            />
          </div>
          <p className="text-white/25 text-xs mt-1">{pct}% of 90 days</p>
        </div>
      </div>
    </aside>
  )
}
