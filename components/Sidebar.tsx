
import React from 'react';
import { AppView } from '../types';
import { 
  ChartBarIcon, 
  MagnifyingGlassIcon, 
  CheckCircleIcon, 
  ClockIcon 
} from '@heroicons/react/24/outline';

interface SidebarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate }) => {
  const navItems = [
    { id: AppView.DASHBOARD, label: 'Dashboard', icon: ChartBarIcon },
    { id: AppView.SCANNER, label: 'Scanner', icon: MagnifyingGlassIcon },
    { id: AppView.REVIEW, label: 'Smart Review', icon: CheckCircleIcon },
    { id: AppView.HISTORY, label: 'Activity Log', icon: ClockIcon },
  ];

  return (
    <aside className="w-20 md:w-64 border-r border-slate-200 bg-white flex flex-col h-screen shrink-0">
      <div className="p-6 hidden md:block">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-100">
            <span className="text-white font-black text-xl">N</span>
          </div>
          <span className="font-black text-xl tracking-tighter text-slate-800">NeatStep</span>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4 md:mt-0">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
              currentView === item.id 
                ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
            }`}
          >
            <item.icon className={`w-6 h-6 shrink-0 ${currentView === item.id ? 'text-indigo-600' : 'text-slate-400'}`} />
            <span className="hidden md:inline font-bold text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-6 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3 px-2">
           <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-black text-indigo-600 border border-indigo-200">
             AI
           </div>
           <div className="hidden md:block">
             <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Active Core</p>
             <p className="text-[10px] text-slate-400 font-medium">Standard Execution</p>
           </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
