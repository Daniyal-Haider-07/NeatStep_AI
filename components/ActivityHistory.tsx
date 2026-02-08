
import React from 'react';
import { ActivityLogEntry } from '../types';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  MagnifyingGlassIcon,
  TagIcon,
  TrashIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface ActivityHistoryProps {
  logs: ActivityLogEntry[];
  onClear: () => void;
}

const ActivityHistory: React.FC<ActivityHistoryProps> = ({ logs, onClear }) => {
  const getIcon = (action: string) => {
    switch(action) {
      case 'scan': return <MagnifyingGlassIcon className="w-5 h-5" />;
      case 'rename': return <TagIcon className="w-5 h-5" />;
      case 'delete': return <TrashIcon className="w-5 h-5" />;
      case 'move': return <ArrowPathIcon className="w-5 h-5" />;
      default: return <ArrowPathIcon className="w-5 h-5" />;
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom duration-500">
      <div className="p-8 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-black tracking-tighter">Persistence Audit</h3>
          <p className="text-slate-400 text-sm font-medium">Historical trace of every cognitive transformation.</p>
        </div>
        {logs.length > 0 && (
          <button 
            onClick={onClear}
            className="flex items-center gap-2 px-4 py-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors font-bold text-xs uppercase tracking-widest border border-transparent hover:border-rose-100"
          >
            <TrashIcon className="w-4 h-4" />
            Wipe Audit
          </button>
        )}
      </div>

      <div className="divide-y divide-slate-50">
        {logs.length > 0 ? (
          logs.map((log) => (
            <div key={log.id} className="p-6 flex items-center gap-6 hover:bg-slate-50/50 transition-colors group">
              <div className={`p-3 rounded-2xl transition-all ${
                log.action === 'scan' ? 'bg-indigo-50 text-indigo-600' :
                log.action === 'rename' || log.action === 'move' ? 'bg-emerald-50 text-emerald-600' :
                'bg-slate-50 text-slate-600'
              }`}>
                {getIcon(log.action)}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{log.action}</span>
                  <div className="h-1 w-1 bg-slate-200 rounded-full" />
                  <span className="text-[10px] text-slate-400 font-bold uppercase">
                    {new Date(log.timestamp).toLocaleDateString()} at {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-800 leading-tight group-hover:text-indigo-700 transition-colors">{log.details}</p>
              </div>

              <div className="flex items-center gap-2">
                {log.status === 'success' ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-100">
                    <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
                    <span className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">Verified</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 rounded-full border border-rose-100">
                    <XCircleIcon className="w-4 h-4 text-rose-500" />
                    <span className="text-[10px] text-rose-600 font-black uppercase tracking-widest">Failed</span>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="p-24 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <ClockIcon className="w-10 h-10 text-slate-200" />
            </div>
            <h4 className="text-lg font-black text-slate-700 mb-2">Audit Trace Empty</h4>
            <p className="text-slate-400 max-w-xs mx-auto text-sm font-medium">History is ephemeral until you perform your first AI-driven scan or reorganization.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const ClockIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default ActivityHistory;
