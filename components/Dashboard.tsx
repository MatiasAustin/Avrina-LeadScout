import React, { useState, useMemo } from 'react';
import { useLeads } from '../hooks/useLeads';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { LeadStatus, User } from '../types';
import { TrendingUp, Target, DollarSign, Calendar, Zap, MessageCircle, Filter } from 'lucide-react';
import { formatCurrency, formatCompactCurrency } from '../utils/currency';

interface Props {
  user?: User | null;
}

const Dashboard: React.FC<Props> = ({ user }) => {
  const [timeRange, setTimeRange] = useState<'all' | 'day' | 'week' | 'month'>('all');
  const [selectedCurrency, setSelectedCurrency] = useState<string>(() => {
    return localStorage.getItem('leadscout_currency') || 'IDR';
  });

  const { getStats, leads } = useLeads();
  const { total, byStatus, winRate, replyRate } = getStats(timeRange);

  const dailyStats = getStats('day');
  const weeklyStats = getStats('week');
  const monthlyStats = getStats('month');

  const now = new Date();
  const timeRangeFilteredLeads = leads.filter(lead => {
    if (timeRange === 'all') return true;
    const leadDate = new Date(lead.dateAdded);
    const diffTime = Math.abs(now.getTime() - leadDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (timeRange === 'day') return diffDays <= 1;
    if (timeRange === 'week') return diffDays <= 7;
    if (timeRange === 'month') return diffDays <= 30;
    return true;
  });

  // Calculate revenue grouped by currency for WON leads
  const wonLeads = useMemo(() => {
    return timeRangeFilteredLeads.filter(l => l.status === LeadStatus.WON);
  }, [timeRangeFilteredLeads]);

  const revenueByCurrency = useMemo(() => {
    const rev: Record<string, number> = { IDR: 0, USD: 0, EUR: 0 };
    wonLeads.forEach(l => {
      const c = (l.currency || 'IDR').toUpperCase();
      rev[c] = (rev[c] || 0) + (Number(l.value) || 0);
    });
    return rev;
  }, [wonLeads]);

  // Active currency to display
  const activeCurrency = useMemo(() => {
    if (revenueByCurrency[selectedCurrency] && revenueByCurrency[selectedCurrency] > 0) {
      return selectedCurrency;
    }
    const withRev = Object.keys(revenueByCurrency).find(c => revenueByCurrency[c] > 0);
    if (withRev) {
      return withRev;
    }
    return selectedCurrency;
  }, [revenueByCurrency, selectedCurrency]);

  const activeRevenue = revenueByCurrency[activeCurrency] || 0;
  const formattedRevenue = formatCurrency(activeRevenue, activeCurrency);
  const compactRevenue = formatCompactCurrency(activeRevenue, activeCurrency);

  const data = Object.values(LeadStatus).map(status => ({
    name: status,
    value: byStatus[status] || 0
  })).filter(d => d.value > 0);

  const COLORS = ['#6366f1', '#94a3b8', '#cbd5e1', '#4ade80', '#f87171', '#c084fc'];

  const TargetProgress = ({ label, current, target, icon: Icon, color }: any) => {
    const percent = Math.min(100, Math.round((current / target) * 100) || 0);
    return (
      <div className="space-y-3">
        <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider">
          <div className="flex items-center gap-2 text-slate-500">
             <Icon className={`w-3 h-3 ${color}`} />
             {label}
          </div>
          <span className="text-slate-800">{current} / {target}</span>
        </div>
        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden shadow-inner">
          <div className={`h-full rounded-full transition-all duration-700 ease-out ${color}`} style={{ width: `${percent}%` }}></div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 mb-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
            <Filter className="w-4 h-4 text-indigo-500" /> Statistic Filter
          </h3>
          <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200/80">
            {(['IDR', 'USD', 'EUR'] as const).map(curr => (
              <button
                key={curr}
                onClick={() => {
                  setSelectedCurrency(curr);
                  localStorage.setItem('leadscout_currency', curr);
                }}
                className={`px-2.5 py-1 text-xs font-black rounded-lg transition ${
                  activeCurrency === curr 
                    ? 'bg-emerald-600 text-white shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {curr}
              </button>
            ))}
          </div>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto max-w-full">
          {(['all', 'day', 'week', 'month'] as const).map(t => (
            <button 
              key={t}
              onClick={() => setTimeRange(t)}
              className={`px-4 py-1.5 text-xs font-black rounded-lg transition whitespace-nowrap ${timeRange === t ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {t === 'all' ? 'All Time' : t === 'day' ? 'Daily' : t === 'week' ? 'Weekly' : 'Monthly'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-5">
        <div className="bg-slate-50 p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between min-w-0 overflow-hidden">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <Zap className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="truncate">Total Leads</span>
          </div>
          <span className="text-3xl sm:text-4xl font-black text-slate-800 truncate">{total}</span>
        </div>
        
        <div className="bg-slate-50 p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between min-w-0 overflow-hidden">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <MessageCircle className="w-4 h-4 text-blue-500 shrink-0" />
            <span className="truncate">Reply Rate</span>
          </div>
          <span className="text-3xl sm:text-4xl font-black text-slate-800 truncate">{replyRate}%</span>
        </div>

        <div className="bg-slate-50 p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between min-w-0 overflow-hidden">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <TrendingUp className="w-4 h-4 text-indigo-500 shrink-0" />
            <span className="truncate">Win Rate</span>
          </div>
          <span className="text-3xl sm:text-4xl font-black text-slate-800 truncate">{winRate}%</span>
        </div>

        <div className="bg-slate-50 p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between min-w-0 overflow-hidden">
          <div className="flex items-center justify-between gap-1 text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <DollarSign className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="truncate">Total Revenue</span>
            </div>
            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 uppercase shrink-0">
              {activeCurrency}
            </span>
          </div>
          <div className="min-w-0">
            <div 
              className={`font-black text-slate-800 tracking-tight truncate leading-tight ${
                formattedRevenue.length > 14 
                  ? 'text-lg sm:text-xl' 
                  : formattedRevenue.length > 10 
                    ? 'text-xl sm:text-2xl' 
                    : 'text-2xl sm:text-3xl'
              }`}
              title={formattedRevenue}
            >
              {formattedRevenue}
            </div>
            {compactRevenue && compactRevenue !== formattedRevenue && (
              <div className="text-[11px] font-bold text-emerald-600 truncate mt-1" title={formattedRevenue}>
                ≈ {compactRevenue}
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-50 p-5 rounded-2xl shadow-sm border border-slate-200 min-h-[140px] flex flex-col min-w-0 overflow-hidden sm:col-span-2 lg:col-span-1">
          <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Pipeline</h4>
          <div className="w-full flex-1 min-h-[100px]">
              {data.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                  <Pie
                      data={data}
                      cx="50%"
                      cy="50%"
                      innerRadius={32}
                      outerRadius={42}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                  >
                      {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                  </Pie>
                  <Tooltip />
                  </PieChart>
              </ResponsiveContainer>
              ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-[10px]">No data</div>
              )}
          </div>
        </div>
      </div>

      <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
           <Target className="w-5 h-5 text-indigo-600" />
           Productivity Targets
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
           <TargetProgress 
             label="Daily Target" 
             current={dailyStats.total} 
             target={user?.dailyTarget || 5} 
             icon={Zap} 
             color="bg-amber-500" 
           />
           <TargetProgress 
             label="Weekly Target" 
             current={weeklyStats.total} 
             target={user?.weeklyTarget || 25} 
             icon={Calendar} 
             color="bg-indigo-500" 
           />
           <TargetProgress 
             label="Monthly Target" 
             current={monthlyStats.total} 
             target={user?.monthlyTarget || 100} 
             icon={TrendingUp} 
             color="bg-emerald-500" 
           />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;