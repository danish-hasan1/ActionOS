export default function Loading() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-slate-200 rounded-xl" />
          <div className="h-4 w-72 bg-slate-100 rounded-lg" />
        </div>
        <div className="h-9 w-32 bg-slate-200 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 space-y-3">
            <div className="h-3 w-20 bg-slate-100 rounded" />
            <div className="h-8 w-12 bg-slate-200 rounded-lg" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-200 shrink-0" />
            <div className="h-4 flex-1 bg-slate-100 rounded-lg" style={{ width: `${60 + Math.random() * 30}%` }} />
            <div className="h-5 w-16 bg-slate-100 rounded-full shrink-0" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
            <div className="h-4 w-32 bg-slate-200 rounded" />
            {[...Array(4)].map((_, j) => (
              <div key={j} className="h-12 bg-slate-50 rounded-xl" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
