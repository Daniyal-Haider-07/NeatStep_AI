
import React, { useState, useEffect } from 'react';
import { AIAnalysisResult, FullAnalysisResponse } from '../types';
import { 
  ArrowRightIcon, 
  FolderIcon, 
  SparklesIcon,
  InformationCircleIcon,
  CheckIcon,
  ChatBubbleLeftRightIcon,
  LightBulbIcon,
  ArrowPathIcon,
  ArchiveBoxIcon,
  LockClosedIcon,
  ShieldExclamationIcon,
  AdjustmentsHorizontalIcon,
  LockOpenIcon
} from '@heroicons/react/24/outline';

interface ReviewPanelProps {
  fullAnalysis: FullAnalysisResponse | null;
  isAnalyzing: boolean;
  progress: { current: number; total: number };
  onApply: (selected: AIAnalysisResult[]) => void;
  onRefine: (feedback: string) => void;
}

const ReviewPanel: React.FC<ReviewPanelProps> = ({ fullAnalysis, isAnalyzing, progress, onApply, onRefine }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [allowedSensitiveIds, setAllowedSensitiveIds] = useState<Set<string>>(new Set());
  const [refinementText, setRefinementText] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [showOrganizedWarning, setShowOrganizedWarning] = useState(false);
  
  const analysis = fullAnalysis?.analyses || [];

  useEffect(() => {
    if (fullAnalysis?.isAlreadyOrganized) {
      setShowOrganizedWarning(true);
    } else {
      setShowOrganizedWarning(false);
    }
  }, [fullAnalysis]);

  const toggleSelection = (id: string, isSensitive: boolean) => {
    if (isSensitive && !allowedSensitiveIds.has(id)) return; // Prevent selection if not allowed
    
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleGrantPermission = (id: string) => {
    const nextAllowed = new Set(allowedSensitiveIds);
    nextAllowed.add(id);
    setAllowedSensitiveIds(nextAllowed);
    
    // Auto-select once granted
    const nextSelected = new Set(selectedIds);
    nextSelected.add(id);
    setSelectedIds(nextSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === analysis.length) {
      setSelectedIds(new Set());
    } else {
      // Select all that are either safe OR already allowed sensitive ones
      const toSelect = analysis
        .filter(a => !a.containsSensitiveData || allowedSensitiveIds.has(a.originalName))
        .map(a => a.originalName);
      setSelectedIds(new Set(toSelect));
    }
  };

  const handleExecuteClick = () => {
    setIsExecuting(true);
    onApply(analysis.filter(a => selectedIds.has(a.originalName)));
  };

  useEffect(() => {
    if (analysis.length > 0 && selectedIds.size === 0) {
      // Auto-select everything EXCEPT files with sensitive data for safety by default
      const safeFiles = analysis
        .filter(a => !a.containsSensitiveData)
        .map(a => a.originalName);
      setSelectedIds(new Set(safeFiles));
    }
  }, [analysis]);

  if (isAnalyzing || isExecuting) {
    const pct = Math.round((progress.current / progress.total) * 100) || 0;
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-10 animate-in fade-in">
        <div className="relative">
          <div className="w-40 h-40 border-8 border-indigo-50 border-t-indigo-600 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
             {isExecuting ? <FolderIcon className="w-12 h-12 text-indigo-600 animate-bounce" /> : <SparklesIcon className="w-12 h-12 text-indigo-600 animate-pulse" />}
          </div>
        </div>
        <div className="text-center space-y-4 max-w-md">
          <h3 className="text-3xl font-black text-slate-800 tracking-tighter">
            {isExecuting ? "Relocating Assets..." : "Scanning Context..."}
          </h3>
          <p className="text-slate-500 font-medium">
            {isExecuting ? "Moving your files into a cleaner structure." : `Curating ${progress.total} nodes with logic and care.`}
          </p>
          {!isExecuting && (
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-0.5 mt-4">
              <div className="h-full bg-indigo-600 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!fullAnalysis || analysis.length === 0) {
    return (
      <div className="text-center py-32 bg-white rounded-3xl border border-slate-100 flex flex-col items-center">
        <InformationCircleIcon className="w-16 h-16 text-slate-200 mb-6" />
        <h3 className="text-xl font-black text-slate-700">Awaiting Analysis</h3>
        <p className="text-slate-500 mt-2 max-w-xs">Return to the Scanner to begin the cognitive mapping process.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-32">
      {showOrganizedWarning && (
        <div className="bg-amber-50 border-2 border-amber-200 p-8 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 animate-in slide-in-from-top">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-amber-200 rounded-2xl shadow-lg shadow-amber-200/50">
              <InformationCircleIcon className="w-8 h-8 text-amber-800" />
            </div>
            <div>
              <p className="text-xl font-black text-amber-900 tracking-tighter">Already Organized!</p>
              <p className="text-sm text-amber-700 font-medium max-w-md leading-relaxed">
                NeatStep detected that this folder is already looking good. Do you want to try a <span className="underline font-bold">different organization strategy</span> anyway?
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                setShowOrganizedWarning(false);
                onRefine("The folder is already clean, but I want a DIFFERENT, fresh approach to organization. Group them by a new logic like Project Phase or Priority.");
              }} 
              className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
            >
              Force New Strategy
            </button>
            <button 
              onClick={() => setShowOrganizedWarning(false)} 
              className="px-8 py-4 bg-white text-amber-800 border-2 border-amber-200 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-amber-100 transition-all"
            >
              Keep Existing
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-white rounded-[2.5rem] p-10 shadow-xl border border-indigo-100 relative group overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <SparklesIcon className="w-32 h-32 text-indigo-200" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-100">
                <LightBulbIcon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-indigo-600">Cognitive Strategy</h3>
            </div>
            <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight leading-tight">{fullAnalysis.summary}</h2>
            <p className="text-slate-500 font-medium text-lg leading-relaxed italic max-w-2xl">"{fullAnalysis.strategy}"</p>
          </div>
        </div>

        <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-2xl flex flex-col justify-between group">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <AdjustmentsHorizontalIcon className="w-5 h-5 text-indigo-300" />
              <h4 className="font-black text-sm uppercase tracking-wider text-indigo-300">Custom Strategy</h4>
            </div>
            <p className="text-[10px] text-slate-400 mb-4 font-medium italic leading-relaxed">"Help me understand how you want these files moved."</p>
            <textarea 
              value={refinementText}
              onChange={(e) => setRefinementText(e.target.value)}
              placeholder="e.g. 'Put images in a separate Photos folder'"
              className="w-full text-xs p-4 rounded-2xl bg-white/10 border-none h-24 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
          <button 
            onClick={() => { onRefine(refinementText); setRefinementText(''); }} 
            className="mt-6 w-full py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all active:scale-95"
          >
            Refine Logic
          </button>
        </div>
      </div>

      <div className="sticky top-0 z-40 bg-slate-50/90 backdrop-blur-md py-6 border-b flex items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-6">
          <button onClick={handleSelectAll} className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-800">
            {selectedIds.size === analysis.length ? 'Deselect All' : `Include All Available`}
          </button>
          <div className="h-4 w-[1px] bg-slate-200 hidden md:block" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden md:block">
            {selectedIds.size} Ready for relocation
          </span>
        </div>
        <button 
          disabled={selectedIds.size === 0}
          onClick={handleExecuteClick}
          className="px-10 py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-100 transition-all flex items-center gap-3 active:scale-95"
        >
          <ArchiveBoxIcon className="w-5 h-5" />
          Execute {selectedIds.size} Moves
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 pb-20">
        {analysis.map((item, idx) => {
          const isSelected = selectedIds.has(item.originalName);
          const hasSecrets = item.containsSensitiveData;
          const isAllowed = !hasSecrets || allowedSensitiveIds.has(item.originalName);
          
          return (
            <div 
              key={idx}
              className={`bg-white rounded-[2rem] p-8 border-2 transition-all relative group ${
                !isAllowed ? 'border-rose-100 bg-rose-50/10' :
                isSelected ? 'border-indigo-600 shadow-2xl cursor-pointer' : 'border-transparent hover:border-slate-200 shadow-sm cursor-pointer'
              }`}
              onClick={() => isAllowed && toggleSelection(item.originalName, !!hasSecrets)}
            >
              {hasSecrets && (
                <div className={`absolute top-4 right-4 flex items-center gap-2 px-4 py-2 rounded-full border shadow-sm ${
                  isAllowed ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200 animate-pulse'
                }`}>
                  {isAllowed ? <LockOpenIcon className="w-4 h-4" /> : <ShieldExclamationIcon className="w-4 h-4" />}
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {isAllowed ? 'Access Granted' : 'Sensitive Data Detected'}
                  </span>
                </div>
              )}

              <div className="flex flex-col lg:flex-row items-start gap-10">
                <div className="flex-1 space-y-6">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      item.isJunk ? 'bg-rose-100 text-rose-700' : 'bg-indigo-50 text-indigo-700'
                    }`}>
                      {item.category}
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                      AI Confidence: {(item.confidence * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center gap-4 text-base font-black text-slate-800">
                    <div className="flex-1 truncate max-w-xs md:max-w-md">
                      <p className="text-[9px] text-slate-400 uppercase mb-1">Current Name</p>
                      <span className="text-slate-400 font-medium opacity-60 line-through">{item.originalName}</span>
                    </div>
                    <ArrowPathIcon className="w-5 h-5 text-indigo-400 rotate-90 md:rotate-0" />
                    <div className="flex-1">
                      <p className="text-[9px] text-indigo-600 uppercase mb-1">Suggested Name</p>
                      <span className="text-indigo-600">{item.suggestedName}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <FolderIcon className="w-5 h-5 text-indigo-300" />
                    <div className="flex flex-col">
                      <p className="text-[9px] text-slate-400 uppercase font-black">Target Subfolder</p>
                      <p className="text-sm font-black text-slate-800">
                        /{item.suggestedFolder || 'root'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="lg:w-1/3 shrink-0 border-t lg:border-t-0 lg:border-l border-slate-100 pt-6 lg:pt-0 lg:pl-10 h-full flex flex-col justify-center">
                  <div className="flex items-start gap-3">
                    <ChatBubbleLeftRightIcon className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Reasoning</p>
                      <p className="text-sm text-slate-600 leading-relaxed font-medium italic">
                        "{item.reason}"
                      </p>
                    </div>
                  </div>
                  
                  {hasSecrets && !isAllowed && (
                    <div className="mt-6 p-6 bg-white rounded-2xl border-2 border-rose-100 shadow-xl shadow-rose-100/20">
                       <div className="flex items-center gap-3 mb-4">
                          <LockClosedIcon className="w-6 h-6 text-rose-500" />
                          <p className="text-xs font-black text-rose-900 uppercase tracking-tighter">Permission Required</p>
                       </div>
                       <p className="text-xs font-medium text-slate-500 leading-relaxed mb-6">
                         This file contains private data (API keys or passwords). Grant access to allow AI organization.
                       </p>
                       <button 
                         onClick={(e) => { e.stopPropagation(); handleGrantPermission(item.originalName); }}
                         className="w-full py-4 bg-rose-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-700 transition-all flex items-center justify-center gap-2"
                       >
                         <ShieldExclamationIcon className="w-4 h-4" />
                         Grant Permission
                       </button>
                    </div>
                  )}

                  {hasSecrets && isAllowed && (
                    <div className="mt-6 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3">
                       <LockOpenIcon className="w-5 h-5 text-emerald-500" />
                       <p className="text-[10px] font-bold text-emerald-700 leading-tight">
                         Permission granted for organization.
                       </p>
                    </div>
                  )}
                </div>
              </div>

              {isSelected && (
                <div className="absolute -bottom-1 -left-1 w-24 h-24 bg-indigo-600/5 blur-3xl rounded-full" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ReviewPanel;
