import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

function StatCard({ icon: Icon, value, label, color = 'indigo', trend, trendValue, sublabel }) {
  const colorConfig = {
    indigo: { bg: 'from-indigo-500 to-indigo-600', light: 'bg-indigo-50', text: 'text-indigo-600', ring: 'ring-indigo-100' },
    green: { bg: 'from-emerald-500 to-green-600', light: 'bg-green-50', text: 'text-green-600', ring: 'ring-green-100' },
    amber: { bg: 'from-amber-500 to-orange-500', light: 'bg-amber-50', text: 'text-amber-600', ring: 'ring-amber-100' },
    purple: { bg: 'from-purple-500 to-violet-600', light: 'bg-purple-50', text: 'text-purple-600', ring: 'ring-purple-100' },
    red: { bg: 'from-red-500 to-rose-600', light: 'bg-red-50', text: 'text-red-600', ring: 'ring-red-100' },
    blue: { bg: 'from-blue-500 to-blue-600', light: 'bg-blue-50', text: 'text-blue-600', ring: 'ring-blue-100' },
  }

  const c = colorConfig[color] || colorConfig.indigo

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor = trend === 'up' ? 'text-green-600 bg-green-50' : trend === 'down' ? 'text-red-600 bg-red-50' : 'text-slate-500 bg-slate-100'

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 card-hover">
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${c.bg} flex items-center justify-center shadow-lg ring-4 ${c.ring}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && trendValue && (
          <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${trendColor}`}>
            <TrendIcon className="w-3 h-3" />
            {trendValue}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-3xl font-bold text-slate-900">{value?.toLocaleString() ?? '—'}</p>
        <p className="text-sm font-medium text-slate-500 mt-0.5">{label}</p>
        {sublabel && <p className="text-xs text-slate-400 mt-1">{sublabel}</p>}
      </div>
    </div>
  )
}

export default StatCard
