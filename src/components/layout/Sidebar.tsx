'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, AlertTriangle, CheckSquare, Target,
  Map, ClipboardList, Bell, FileText, Settings, Zap
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/pain-points', label: 'Pain Points', icon: AlertTriangle },
  { href: '/dashboard/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/dashboard/goals', label: 'Goals', icon: Target },
  { href: '/dashboard/roadmap', label: 'Roadmap', icon: Map },
  { href: '/dashboard/agenda', label: 'Agenda', icon: ClipboardList },
  { href: '/dashboard/followups', label: 'Follow-ups', icon: Bell },
  { href: '/dashboard/reports', label: 'Reports', icon: FileText },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-[#1B3A5C] flex flex-col h-full shrink-0">
      {/* Brand */}
      <div className="px-5 py-6 border-b border-white/10">
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
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
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
              <Icon className={cn('w-4 h-4 shrink-0 transition-colors', active ? 'text-[#E85D26]' : 'text-white/40 group-hover:text-white/70')} />
              {label}
              {label === 'Pain Points' && (
                <span className="ml-auto w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-white/10">
        <Link
          href="/dashboard/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
            'text-white/55 hover:text-white hover:bg-white/8'
          )}
        >
          <Settings className="w-4 h-4 text-white/40" />
          Settings
        </Link>

        {/* Phase indicator */}
        <div className="mt-3 px-3 py-3 bg-white/8 rounded-xl">
          <p className="text-white/40 text-xs font-medium mb-1.5 uppercase tracking-wide">Current Phase</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-violet-300 text-xs font-semibold">Phase 1 — Days 1–30</span>
          </div>
          <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-violet-400 rounded-full" style={{ width: '12%' }} />
          </div>
          <p className="text-white/30 text-xs mt-1">Day 3 of 90</p>
        </div>
      </div>
    </aside>
  )
}
