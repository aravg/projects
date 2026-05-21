const CONFIG = {
  Low: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  Medium: 'bg-sky-50 text-sky-700 border-sky-100',
  High: 'bg-orange-50 text-orange-700 border-orange-100',
  Critical: 'bg-red-50 text-red-700 border-red-200 font-semibold',
}

const ICONS = {
  Low: '↓',
  Medium: '→',
  High: '↑',
  Critical: '↑↑',
}

export default function PriorityBadge({ priority }) {
  const cls = CONFIG[priority] || CONFIG.Medium
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border ${cls}`}
    >
      <span className="font-bold">{ICONS[priority]}</span>
      {priority}
    </span>
  )
}
