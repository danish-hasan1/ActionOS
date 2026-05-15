import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const SEVERITY_CONFIG = {
  critical: { label: 'Critical', bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', dot: 'bg-red-500' },
  high:     { label: 'High',     bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300', dot: 'bg-orange-500' },
  medium:   { label: 'Medium',   bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300', dot: 'bg-yellow-500' },
  low:      { label: 'Low',      bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300', dot: 'bg-green-500' },
}

export const PAIN_STATUS_CONFIG = {
  open:        { label: 'Open',        bg: 'bg-red-50',    text: 'text-red-600',    border: 'border-red-200' },
  in_progress: { label: 'In Progress', bg: 'bg-blue-50',   text: 'text-blue-600',   border: 'border-blue-200' },
  resolved:    { label: 'Resolved',    bg: 'bg-green-50',  text: 'text-green-600',  border: 'border-green-200' },
}

export const TASK_STATUS_CONFIG = {
  todo:        { label: 'To Do',       bg: 'bg-slate-100', text: 'text-slate-600',  border: 'border-slate-300' },
  in_progress: { label: 'In Progress', bg: 'bg-blue-50',   text: 'text-blue-600',   border: 'border-blue-200' },
  done:        { label: 'Done',        bg: 'bg-green-50',  text: 'text-green-600',  border: 'border-green-200' },
}

export const PRIORITY_CONFIG = {
  urgent: { label: 'Urgent', bg: 'bg-red-100',    text: 'text-red-700' },
  high:   { label: 'High',   bg: 'bg-orange-100', text: 'text-orange-700' },
  medium: { label: 'Medium', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  low:    { label: 'Low',    bg: 'bg-slate-100',  text: 'text-slate-600' },
}

export const PHASE_CONFIG = {
  '30': { label: 'Day 1–30',  bg: 'bg-violet-50', text: 'text-violet-700', color: '#7C3AED' },
  '60': { label: 'Day 31–60', bg: 'bg-amber-50',  text: 'text-amber-700',  color: '#F59E0B' },
  '90': { label: 'Day 61–90', bg: 'bg-emerald-50', text: 'text-emerald-700', color: '#10B981' },
}

export const GOAL_STATUS_CONFIG = {
  not_started: { label: 'Not Started', bg: 'bg-slate-100', text: 'text-slate-600' },
  in_progress: { label: 'In Progress', bg: 'bg-blue-100',  text: 'text-blue-700' },
  at_risk:     { label: 'At Risk',     bg: 'bg-red-100',   text: 'text-red-700' },
  complete:    { label: 'Complete',    bg: 'bg-green-100', text: 'text-green-700' },
}

export function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function getDaysSinceStart(startDate: Date) {
  const now = new Date()
  return Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
}

export function getCurrentPhase(days: number): '30' | '60' | '90' {
  if (days <= 30) return '30'
  if (days <= 60) return '60'
  return '90'
}
