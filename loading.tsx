import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F8F9FC] flex items-center justify-center px-6">
      <div className="text-center">
        <div className="w-20 h-20 rounded-3xl bg-[#1B3A5C] flex items-center justify-center mx-auto mb-6 shadow-lg">
          <span className="text-white font-bold text-3xl" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>A</span>
        </div>
        <p className="text-6xl font-bold text-[#1B3A5C] mb-3" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>404</p>
        <h1 className="text-xl font-semibold text-slate-700 mb-2">Page not found</h1>
        <p className="text-sm text-slate-400 mb-8 max-w-xs mx-auto">
          This page doesn't exist or you don't have access to it.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#1B3A5C] text-white text-sm font-semibold rounded-xl hover:bg-[#162d47] transition-colors shadow-sm"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
