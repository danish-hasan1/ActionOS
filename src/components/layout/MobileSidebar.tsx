'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, AlertTriangle, CheckSquare, Target,
  Map, ClipboardList, Bell, FileText, Settings, Zap, Menu, X
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard',             label: 'Overview',   icon: LayoutDashboard },
  { href: '/dashboard/pain-points', label: 'Pain Points',icon: AlertTriangle },
  { href: '/dashboard/tasks',       label: 'Tasks',      icon: CheckSquare },
  { href: '/dashboard/goals',       label: 'Goals',      icon: Target },
  { href: '/dashboard/roadmap',     label: 'Roadmap',    icon: Map },
  { href: '/dashboard/agenda',      label: 'Agenda',     icon: ClipboardList },
  { href: '/dashboard/followups',   label: 'Follow-ups', icon: Bell },
  { href: '/dashboard/reports',     label: 'Reports',    icon: FileText },
  { href: '/dashboard/settings',    label: 'Settings',   icon: Settings },
]

export default function MobileSidebar({ startDate }: { startDate?: string | null }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const start = startDate ? new Date(startDate) : new Date()
  const days = Math.max(1, Math.floor((Date.now() - start.getTime()) / 86400000) + 1)
  const phase = days <= 30 ? 1 : days <= 60 ? 2 : 3
  const phaseColor = days <= 30 ? '#7C3AED' : days <= 60 ? '#E85D26' : '#2E9E6B'

  return (
    <>
      {/* Hamburger button — only visible on mobile */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div className={cn(
        'fixed inset-y-0 left-0 z-50 w-72 bg-[#1B3A5C] flex flex-col transition-transform duration-300 md:hidden',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#E85D26] flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>ActionPlan OS</p>
              <p className="text-white/40 text-xs">TA Command Center</p>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
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
                  active ? 'bg-white/15 text-white' : 'text-white/55 hover:text-white hover:bg-white/8'
                )}>
                <Icon className={cn('w-4 h-4 shrink-0', active ? 'text-[#E85D26]' : 'text-white/40')} />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="px-3 py-4 border-t border-white/10">
          <div className="px-3 py-3 bg-white/8 rounded-xl">
            <div className="flex items-center justify-between mb-1">
              <p className="text-white/40 text-xs font-semibold uppercase tracking-wide">Phase {phase}</p>
              <span className="text-xs font-bold" style={{ color: phaseColor }}>Day {days}</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mt-2">
              <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.round((days / 90) * 100))}%`, backgroundColor: phaseColor }} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
