export default function Loading() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-7 w-36 bg-slate-200 rounded-xl" />
          <div className="h-4 w-72 bg-slate-100 rounded-lg" />
        </div>
      </div>
      {/* Date navigator */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-100 p-4">
        <div className="h-8 w-8 bg-slate-100 rounded-lg" />
        <div className="h-6 w-40 bg-slate-200 rounded-xl" />
        <div className="h-8 w-8 bg-slate-100 rounded-lg" />
      </div>
      {/* Quick add */}
      <div className="h-12 bg-white rounded-2xl border border-slate-100" />
      {/* Task rows */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-5 h-5 rounded bg-slate-100 shrink-0" />
            <div className="h-4 flex-1 bg-slate-100 rounded-lg" />
            <div className="h-5 w-14 bg-slate-100 rounded-full shrink-0" />
          </div>
        ))}
      </div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 space-y-2">
            <div className="h-3 w-20 bg-slate-100 rounded" />
            <div className="h-7 w-10 bg-slate-200 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}
