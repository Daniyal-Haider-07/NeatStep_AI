
import React, { useState } from 'react';
import { FileMetadata } from '../types';
import { 
  DocumentIcon, 
  CpuChipIcon,
  FolderIcon,
  CloudArrowUpIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';

interface ScannerProps {
  files: FileMetadata[];
  onStartAnalysis: (customStrategy?: string) => void;
  isAnalyzing: boolean;
}

const Scanner: React.FC<ScannerProps> = ({ files, onStartAnalysis, isAnalyzing }) => {
  const [customStrategy, setCustomStrategy] = useState('');

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[2.5rem] border-4 border-dashed border-slate-100 animate-in fade-in duration-500">
        <div className="bg-indigo-50 p-10 rounded-full mb-8 relative">
          <FolderIcon className="w-16 h-16 text-indigo-200" />
          <CloudArrowUpIcon className="w-8 h-8 text-indigo-600 absolute bottom-6 right-6" />
        </div>
        <h3 className="text-3xl font-black text-slate-800 mb-4 tracking-tighter">Ready for Cognitive Scan</h3>
        <p className="text-slate-500 max-w-sm text-center mb-10 font-medium leading-relaxed">
          Select a directory to begin. NeatStep AI will recursively map every nested node to develop a global organization strategy.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
      <div className="flex flex-col md:flex-row items-center justify-between bg-white/90 backdrop-blur-xl p-8 rounded-[2rem] shadow-xl shadow-slate-200 border border-slate-100 sticky top-0 z-30 gap-6">
        <div className="space-y-1 w-full md:w-auto">
          <h3 className="text-2xl font-black tracking-tighter text-slate-800">Recursive Map Complete</h3>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">{files.length} Total Nodes Detected</p>
        </div>
        
        <div className="flex-1 max-w-md w-full relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <AdjustmentsHorizontalIcon className="h-5 w-5 text-slate-400" />
          </div>
          <input 
            type="text" 
            placeholder="Tell AI your strategy (Optional: e.g. 'Group by Month')"
            className="w-full pl-11 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 font-medium placeholder:text-slate-400"
            value={customStrategy}
            onChange={(e) => setCustomStrategy(e.target.value)}
          />
        </div>

        <button 
          onClick={() => onStartAnalysis(customStrategy)}
          disabled={isAnalyzing}
          className="flex items-center justify-center gap-3 px-10 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-2xl shadow-indigo-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed group active:scale-95 text-sm uppercase tracking-widest whitespace-nowrap"
        >
          {isAnalyzing ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-4 border-white/30 border-t-white" />
              Processing Core...
            </>
          ) : (
            <>
              <CpuChipIcon className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              Analyze {files.length} Nodes
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
        {files.map((file, idx) => (
          <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 hover:border-indigo-200 transition-all hover:shadow-xl hover:shadow-indigo-50 group cursor-default">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-indigo-50 transition-colors">
                <DocumentIcon className="w-6 h-6 text-slate-400 group-hover:text-indigo-600" />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-lg">
                {formatSize(file.size)}
              </span>
            </div>
            
            <h4 className="font-bold text-slate-800 truncate mb-1.5 text-sm" title={file.name}>
              {file.name}
            </h4>
            
            <div className="flex items-center gap-2 mb-4">
              <FolderIcon className="w-3.5 h-3.5 text-slate-300" />
              <span className="text-[10px] text-slate-400 truncate font-black uppercase tracking-tighter opacity-70">
                {file.path.split('/').slice(0, -1).join(' / ') || 'ROOT_INDEX'}
              </span>
            </div>

            {file.contentSnippet && (
              <div className="mt-4 bg-slate-50/50 rounded-2xl p-4 border border-slate-100 group-hover:bg-white transition-colors">
                <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed font-medium italic">
                  "{file.contentSnippet}..."
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Scanner;
