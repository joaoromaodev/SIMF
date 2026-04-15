function SkeletonBlock({ className }) {
  return <div className={`bg-slate-200 rounded animate-pulse ${className}`} />;
}

function KpiCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md border-l-4 border-slate-200 p-6 space-y-3">
      <SkeletonBlock className="h-3 w-32" />
      <SkeletonBlock className="h-8 w-40" />
      <SkeletonBlock className="h-3 w-28" />
    </div>
  );
}

function TableSkeleton({ rows = 6 }) {
  return (
    <div className="bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
        <SkeletonBlock className="h-5 w-52" />
      </div>
      <div className="p-4 space-y-2">
        <div className="grid grid-cols-6 gap-3 px-2 py-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-3 w-full" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className={`grid grid-cols-6 gap-3 px-2 py-3 rounded ${i % 2 === 0 ? "bg-white" : "bg-slate-50"}`}
          >
            {Array.from({ length: 6 }).map((_, j) => (
              <SkeletonBlock key={j} className="h-4 w-full" style={{ opacity: 1 - j * 0.06 }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function SidebarCardSkeleton({ lines = 3 }) {
  return (
    <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6 space-y-3">
      <SkeletonBlock className="h-3 w-24 mb-1" />
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBlock key={i} className="h-4 w-full" />
      ))}
    </div>
  );
}

export default function Loading() {
  return (
    <div className="space-y-10">
      {/* Breadcrumb */}
      <div>
        <SkeletonBlock className="h-3 w-28 mb-6" />
      </div>

      {/* Header */}
      <div className="space-y-2">
        <SkeletonBlock className="h-10 w-64" />
        <SkeletonBlock className="h-4 w-52" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCardSkeleton />
        <KpiCardSkeleton />
        <KpiCardSkeleton />
      </div>

      {/* Main content + sidebar */}
      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-8">
        <div className="space-y-8">
          <TableSkeleton rows={6} />
          <TableSkeleton rows={5} />
        </div>
        <aside className="space-y-6">
          <SidebarCardSkeleton lines={2} />
          <SidebarCardSkeleton lines={3} />
          <SidebarCardSkeleton lines={2} />
        </aside>
      </div>
    </div>
  );
}
