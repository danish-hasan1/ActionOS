export default function Loading() {
  return (
    <div className="animate-pulse grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="space-y-3">
        <div className="h-10 bg-slate-100 rounded-xl" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 space-y-2">
            <div className="h-4 w-3/4 bg-slate-200 rounded" />
            <div className="h-3 w-1/2 bg-slate-100 rounded" />
            <div className="flex gap-2 mt-2">
              <div className="h-5 w-14 bg-slate-100 rounded-full" />
              <div className="h-5 w-14 bg-slate-100 rounded-full" />
            </div>
          </div>
        ))}
      </div>
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-3">
          <div className="h-6 w-48 bg-slate-200 rounded" />
          <div className="h-4 w-full bg-slate-100 rounded" />
          <div className="h-4 w-3/4 bg-slate-100 rounded" />
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 flex gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-slate-200 rounded" />
              <div className="h-3 w-full bg-slate-100 rounded" />
              <div className="h-3 w-2/3 bg-slate-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
