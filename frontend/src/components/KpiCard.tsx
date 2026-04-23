import { memo } from 'react';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: string;
  trend?: string;
  trendUp?: boolean;
  color?: 'indigo' | 'emerald' | 'amber' | 'rose';
}

const colorMap = {
  indigo: {
    bg: 'bg-indigo-50',
    icon: 'bg-gradient-to-br from-indigo-500 to-purple-600',
    text: 'text-indigo-600',
  },
  emerald: {
    bg: 'bg-emerald-50',
    icon: 'bg-gradient-to-br from-emerald-500 to-teal-600',
    text: 'text-emerald-600',
  },
  amber: {
    bg: 'bg-amber-50',
    icon: 'bg-gradient-to-br from-amber-500 to-orange-600',
    text: 'text-amber-600',
  },
  rose: {
    bg: 'bg-rose-50',
    icon: 'bg-gradient-to-br from-rose-500 to-pink-600',
    text: 'text-rose-600',
  },
};

/**
 * REQUIREMENT: React.memo
 * This component ONLY re-renders when its props change.
 * With 4+ KPI cards on the dashboard, this prevents unnecessary re-renders
 * when only the search term changes (which doesn't affect KPI values).
 */
const KpiCard = memo(({ title, value, icon, trend, trendUp, color = 'indigo' }: KpiCardProps) => {
  const colors = colorMap[color];

  return (
    <div className="glass-card p-5 animate-fade-in group cursor-default">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-500 truncate">{title}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
          {trend && (
            <div className="mt-2 flex items-center gap-1">
              <span className={`text-xs font-semibold ${trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                {trendUp ? '↑' : '↓'} {trend}
              </span>
              <span className="text-xs text-slate-400">vs last period</span>
            </div>
          )}
        </div>
        <div className={`${colors.icon} p-3 rounded-xl text-white text-xl shadow-lg 
          group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
      </div>
    </div>
  );
});

export default KpiCard;