const CONFIG = {
  Open: {
    cls: 'bg-blue-50 text-blue-700 border-blue-100',
    dot: 'bg-blue-500',
  },
  'In Progress': {
    cls: 'bg-amber-50 text-amber-700 border-amber-100',
    dot: 'bg-amber-500 animate-pulse',
  },
  Resolved: {
    cls: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    dot: 'bg-emerald-500',
  },
  Closed: {
    cls: 'bg-slate-50 text-slate-500 border-slate-200',
    dot: 'bg-slate-400',
  },
}

export default function StatusBadge({ status }) {
  const cfg = CONFIG[status] || CONFIG.Open
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.cls}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {status}
    </span>
  )
}
