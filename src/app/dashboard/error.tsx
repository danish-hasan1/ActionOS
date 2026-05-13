'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8 text-red-400" />
      </div>
      <h2 className="text-xl font-bold text-slate-800 mb-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
        Something went wrong
      </h2>
      <p className="text-sm text-slate-400 max-w-sm mb-6">
        {error.message ?? 'An unexpected error occurred. Your data is safe — try refreshing the page.'}
      </p>
      <div className="flex gap-3">
        <Button onClick={reset}>
          <RefreshCw className="w-4 h-4" /> Try Again
        </Button>
        <Button variant="secondary" onClick={() => window.location.href = '/dashboard'}>
          Back to Overview
        </Button>
      </div>
      {error.digest && (
        <p className="text-xs text-slate-300 mt-4">Error ID: {error.digest}</p>
      )}
    </div>
  )
}
