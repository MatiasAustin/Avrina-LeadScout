import React from 'react';
import { useLeads } from '../hooks/useLeads';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { LeadStatus } from '../types';

const Dashboard: React.FC = () => {
  const { getStats } = useLeads();
  const { total, byStatus, winRate } = getStats();

  const data = Object.values(LeadStatus).map(status => ({
    name: status,
    value: byStatus[status] || 0
  })).filter(d => d.value > 0);

  // Updated Colors for better Dark Mode contrast
  // Swapped dark slate for Indigo to be visible on dark backgrounds
  const COLORS = ['#6366f1', '#94a3b8', '#cbd5e1', '#4ade80', '#f87171', '#c084fc'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Stat Cards - Changed bg-white to bg-slate-50 */}
      <div className="bg-slate-50 p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-center">
        <span className="text-slate-500 text-sm font-medium">Total Leads</span>
        <span className="text-4xl font-bold text-slate-800 mt-2">{total}</span>
      </div>
      
      <div className="bg-slate-50 p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-center">
        <span className="text-slate-500 text-sm font-medium">Win Rate (Won/Closed)</span>
        <span className="text-4xl font-bold text-slate-700 mt-2">{winRate}%</span>
      </div>

      {/* Chart - Changed bg-white to bg-slate-50 */}
      <div className="bg-slate-50 rounded-xl shadow-sm border border-slate-200 h-48 relative overflow-hidden">
        <h4 className="absolute top-4 left-4 text-xs font-bold text-slate-400 uppercase z-10">Pipeline Distribution</h4>
        <div className="w-full h-full pt-8 pb-2 px-2">
            {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={5}
                    dataKey="value"
                >
                    {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--slate-50)', borderColor: 'var(--slate-200)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--slate-800)' }}
                />
                </PieChart>
            </ResponsiveContainer>
            ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                No data yet
            </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;