import { PageHeader } from '@/components/ui'

export default function Page() {
  return (
    <div>
      <PageHeader
        title="Module"
        description="This module is coming in the next build phase."
      />
      <div className="flex items-center justify-center h-64 bg-white rounded-2xl border border-dashed border-slate-200">
        <p className="text-slate-400 text-sm">🚧 Coming soon — module in progress</p>
      </div>
    </div>
  )
}
