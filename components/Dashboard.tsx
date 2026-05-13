import React from 'react';
import { useLeads } from '../hooks/useLeads';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { LeadStatus, User } from '../types';
import { TrendingUp, Target, DollarSign, Calendar, Zap } from 'lucide-react';

interface Props {
  user?: User | null;
}

const Dashboard: React.FC<Props> = ({ user }) => {
  const { getStats, leads } = useLeads();
  const { total, byStatus, winRate } = getStats();

  const totalRevenue = leads
    .filter(l => l.status === LeadStatus.WON)
    .reduce((sum, l) => sum + (Number(l.value) || 0), 0);

  const data = Object.values(LeadStatus).map(status => ({
    name: status,
    value: byStatus[status] || 0
  })).filter(d => d.value > 0);

  const COLORS = ['#6366f1', '#94a3b8', '#cbd5e1', '#4ade80', '#f87171', '#c084fc'];

  const TargetProgress = ({ label, current, target, icon: Icon, color }: any) => {
    const percent = Math.min(100, Math.round((current / target) * 100) || 0);
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider">
          <div className="flex items-center gap-2 text-slate-500">
             <Icon className={`w-3 h-3 ${color}`} />
             {label}
          </div>
          <span className="text-slate-800">{current} / {target}</span>
        </div>
        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${percent}%` }}></div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 mb-8 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-50 p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <Zap className="w-4 h-4 text-amber-500" /> Total Leads
          </div>
          <span className="text-4xl font-black text-slate-800">{total}</span>
        </div>
        
        <div className="bg-slate-50 p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <TrendingUp className="w-4 h-4 text-indigo-500" /> Win Rate
          </div>
          <span className="text-4xl font-black text-slate-800">{winRate}%</span>
        </div>

        <div className="bg-slate-50 p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <DollarSign className="w-4 h-4 text-emerald-500" /> Total Revenue
          </div>
          <span className="text-4xl font-black text-slate-800">${totalRevenue.toLocaleString()}</span>
        </div>

        <div className="bg-slate-50 p-6 rounded-2xl shadow-sm border border-slate-200 h-full relative overflow-hidden">
          <h4 className="absolute top-4 left-4 text-[10px] font-bold text-slate-400 uppercase z-10">Pipeline</h4>
          <div className="w-full h-full pt-4">
              {data.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                  <Pie
                      data={data}
                      cx="50%"
                      cy="55%"
                      innerRadius={30}
                      outerRadius={45}
                      paddingAngle={5}
                      dataKey="value"
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

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
           <Target className="w-5 h-5 text-indigo-600" />
           Productivity Targets
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
           <TargetProgress 
             label="Daily Target" 
             current={byStatus[LeadStatus.QUALIFIED] || 0} 
             target={user?.dailyTarget || 5} 
             icon={Zap} 
             color="bg-amber-500" 
           />
           <TargetProgress 
             label="Weekly Target" 
             current={byStatus[LeadStatus.QUALIFIED] || 0} 
             target={user?.weeklyTarget || 25} 
             icon={Calendar} 
             color="bg-indigo-500" 
           />
           <TargetProgress 
             label="Monthly Target" 
             current={byStatus[LeadStatus.QUALIFIED] || 0} 
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