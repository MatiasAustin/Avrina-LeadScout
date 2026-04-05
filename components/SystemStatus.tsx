import React, { useState, useEffect } from 'react';
import { checkDbConnection } from '../services/supabase';
import { checkAiConnection } from '../services/ai';
import { RefreshCw, Database, BrainCircuit, Activity } from 'lucide-react';

const SystemStatus: React.FC = () => {
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'offline'>('checking');
  const [aiStatus, setAiStatus] = useState<'checking' | 'connected' | 'offline'>('checking');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkConnections = async () => {
    setIsRefreshing(true);
    setDbStatus('checking');
    setAiStatus('checking');

    const [dbOk, aiOk] = await Promise.all([
      checkDbConnection(),
      checkAiConnection()
    ]);

    setDbStatus(dbOk ? 'connected' : 'offline');
    setAiStatus(aiOk ? 'connected' : 'offline');
    setIsRefreshing(false);
  };

  useEffect(() => {
    checkConnections();
    // Optional: auto-refresh every 5 minutes
    const interval = setInterval(checkConnections, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const StatusDot = ({ status }: { status: 'checking' | 'connected' | 'offline' }) => {
    let colorClass = 'bg-slate-300';
    if (status === 'connected') colorClass = 'bg-green-500';
    if (status === 'offline') colorClass = 'bg-red-500';
    
    return (
      <span className="relative flex h-2 w-2">
        {status === 'connected' && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${colorClass}`}></span>
      </span>
    );
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs shadow-sm w-full mx-auto animate-fade-in group hover:border-slate-300 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
          <Activity className="w-3 h-3" /> System Status
        </h3>
        <button 
          onClick={checkConnections}
          disabled={isRefreshing}
          className="p-1 hover:bg-slate-200 rounded-md text-slate-400 transition hover:text-slate-700 disabled:opacity-50"
          title="Refresh Connections"
        >
          <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between bg-white px-2 py-1.5 rounded border border-slate-100">
          <div className="flex items-center gap-2 text-slate-600 font-medium">
            <Database className="w-3.5 h-3.5" /> Database
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-500 capitalize">{dbStatus}</span>
            <StatusDot status={dbStatus} />
          </div>
        </div>

        <div className="flex items-center justify-between bg-white px-2 py-1.5 rounded border border-slate-100">
          <div className="flex items-center gap-2 text-slate-600 font-medium">
            <BrainCircuit className="w-3.5 h-3.5" /> AI Model
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-500 capitalize">{aiStatus}</span>
            <StatusDot status={aiStatus} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemStatus;
