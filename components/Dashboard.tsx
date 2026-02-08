
import React from 'react';
import { AppStats, ActivityLogEntry } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { 
  CircleStackIcon, 
  TrashIcon, 
  DocumentCheckIcon, 
  FolderPlusIcon,
  SparklesIcon,
  ShieldCheckIcon,
  LightBulbIcon
} from '@heroicons/react/24/solid';

interface DashboardProps {
  stats: AppStats;
  recentLogs: ActivityLogEntry[];
}

const Dashboard: React.FC<DashboardProps> = ({ stats, recentLogs }) => {
  const chartData = [
    { name: 'Analyzed', val: stats.filesAnalyzed },
    { name: 'Junk', val: stats.junkFound },
    { name: 'Created', val: stats.foldersCreated },
  ];

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const COLORS = ['#4f46e5', '#ef4444', '#10b981'];

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Impacted" value={formatSize(stats.spaceAnalyzed)} icon={<CircleStackIcon className="w-6 h-6 text-indigo-500" />} color="bg-indigo-50" />
        <StatCard label="Nodes Organized" value={stats.filesAnalyzed.toString()} icon={<DocumentCheckIcon className="w-6 h-6 text-emerald-500" />} color="bg-emerald-50" />
        <StatCard label="Junk Eliminated" value={stats.junkFound.toString()} icon={<TrashIcon className="w-6 h-6 text-rose-500" />} color="bg-rose-50" />
        <StatCard label="New Taxonomies" value={stats.foldersCreated.toString()} icon={<FolderPlusIcon className="w-6 h-6 text-amber-500" />} color="bg-amber-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-2">
            <SparklesIcon className="w-5 h-5 text-indigo-500" />
            <h3 className="text-lg font-black tracking-tight">AI Cognitive Insights</h3>
          </div>
          {stats.aiInsights.length > 0 ? (
            stats.aiInsights.map((insight, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-indigo-200 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">{insight.type}</span>
                  <div className={`w-2 h-2 rounded-full ${insight.priority === 'high' ? 'bg-rose-500' : 'bg-blue-400'}`} />
                </div>
                <h4 className="font-bold text-slate-800 text-sm mb-1">{insight.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{insight.description}</p>
              </div>
            ))
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 opacity-30">
              <LightBulbIcon className="w-12 h-12 mb-2" />
              <p className="text-sm font-medium">Scan a folder to reveal patterns.</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-black tracking-tight mb-6">Efficiency Analytics</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#64748b'}} />
                <YAxis hide />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="val" radius={[12, 12, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: string; icon: React.ReactNode; color: string }> = ({ label, value, icon, color }) => (
  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 hover:scale-[1.02] transition-transform cursor-default">
    <div className={`p-3.5 rounded-2xl ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.1em]">{label}</p>
      <p className="text-2xl font-black text-slate-800 tracking-tighter">{value}</p>
    </div>
  </div>
);

export default Dashboard;
