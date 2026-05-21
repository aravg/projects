const COLOR = {
  indigo: {
    icon: 'bg-indigo-100 text-indigo-600',
    value: 'text-indigo-600',
    border: 'border-indigo-100',
  },
  blue: {
    icon: 'bg-blue-100 text-blue-600',
    value: 'text-blue-700',
    border: 'border-blue-100',
  },
  amber: {
    icon: 'bg-amber-100 text-amber-600',
    value: 'text-amber-700',
    border: 'border-amber-100',
  },
  emerald: {
    icon: 'bg-emerald-100 text-emerald-600',
    value: 'text-emerald-700',
    border: 'border-emerald-100',
  },
  slate: {
    icon: 'bg-slate-100 text-slate-500',
    value: 'text-slate-600',
    border: 'border-slate-200',
  },
  red: {
    icon: 'bg-red-100 text-red-600',
    value: 'text-red-700',
    border: 'border-red-100',
  },
}

export default function StatsCard({ title, value, icon: Icon, color = 'indigo' }) {
  const c = COLOR[color]
  return (
    <div className="card p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
            {title}
          </p>
          <p className={`text-3xl font-bold ${c.value}`}>{value}</p>
        </div>
        <div className={`w-11 h-11 rounded-xl ${c.icon} flex items-center justify-center flex-shrink-0`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  )
}
