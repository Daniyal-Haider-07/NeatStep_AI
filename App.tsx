
import React, { useState, useRef, useEffect } from 'react';
import { 
  FileMetadata, 
  AIAnalysisResult, 
  FullAnalysisResponse,
  ActivityLogEntry, 
  AppView, 
  AppStats 
} from './types';
import { scanDirectory, organizeFile } from './services/fileSystemService';
import { GeminiService } from './services/geminiService';
import Dashboard from './components/Dashboard';
import Scanner from './components/Scanner';
import ReviewPanel from './components/ReviewPanel';
import ActivityHistory from './components/ActivityHistory';
import Sidebar from './components/Sidebar';
import { 
  FolderIcon, 
  SparklesIcon, 
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  BeakerIcon,
  CubeTransparentIcon
} from '@heroicons/react/24/outline';

const gemini = new GeminiService();

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [directoryHandle, setDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [fullAnalysis, setFullAnalysis] = useState<FullAnalysisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState({ current: 0, total: 0 });
  const [isExecuting, setIsExecuting] = useState(false);
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [stats, setStats] = useState<AppStats>({
    filesAnalyzed: 0,
    junkFound: 0,
    spaceAnalyzed: 0,
    foldersCreated: 0,
    aiInsights: []
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (files.length > 0) {
      const updateInsights = async () => {
        const insights = await gemini.generateInsights(stats, files);
        setStats(prev => ({ ...prev, aiInsights: insights }));
      };
      updateInsights();
    }
  }, [files.length]);

  const addLog = (action: ActivityLogEntry['action'], details: string, status: 'success' | 'failed' = 'success') => {
    const newLog: ActivityLogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      action,
      details,
      status
    };
    setLogs(prev => [newLog, ...prev]);
  };

  const handleSelectDirectory = async () => {
    setError(null);
    try {
      if (!(window as any).showDirectoryPicker) {
        throw new Error("Your browser environment does not support direct folder access. Please use Chrome/Edge or a Desktop environment.");
      }
      const handle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
      setDirectoryHandle(handle);
      setCurrentView(AppView.SCANNER);
      const scannedFiles = await scanDirectory(handle);
      setFiles(scannedFiles);
      setIsDemoMode(false);
      addLog('scan', `Deep scan completed in /${handle.name}. Indexed ${scannedFiles.length} nodes.`);
    } catch (err: any) {
      if (err.name !== 'AbortError') setError(err.message || "An unexpected error occurred.");
    }
  };

  const loadDemoData = () => {
    const demoFiles: FileMetadata[] = Array.from({ length: 150 }).map((_, i) => ({
      name: i % 10 === 0 ? `IMG_RAW_${i}.CR2` : i % 7 === 0 ? `Invoice_Draft_${i}.pdf` : `untilted_note_${i}.txt`,
      size: Math.random() * 1024 * 5000,
      type: i % 10 === 0 ? 'image/raw' : 'application/pdf',
      lastModified: Date.now(),
      handle: {} as any,
      path: `Root/Simulated/Node_${i}`,
      contentSnippet: "Demo content snippet..."
    }));
    setFiles(demoFiles);
    setDirectoryHandle(null);
    setIsDemoMode(true);
    setError(null);
    setCurrentView(AppView.SCANNER);
    addLog('scan', 'Simulated recursive file structure loaded.');
  };

  const startAIAnalysis = async (feedback?: string) => {
    if (files.length === 0) return;
    setIsAnalyzing(true);
    setAnalysisProgress({ current: 0, total: files.length });
    setCurrentView(AppView.REVIEW);
    
    const BATCH_SIZE = 50;
    const allAnalyses: AIAnalysisResult[] = [];
    let masterSummary = "";
    let masterStrategy = "";
    let avgImpact = 0;

    try {
      for (let i = 0; i < files.length; i += BATCH_SIZE) {
        const batch = files.slice(i, i + BATCH_SIZE);
        setAnalysisProgress({ current: i, total: files.length });
        
        const result = await gemini.analyzeBatch(batch, feedback);
        allAnalyses.push(...result.analyses);
        
        if (i === 0) {
          masterSummary = result.summary;
          masterStrategy = result.strategy;
          avgImpact = result.impactScore;
        } else {
          avgImpact = (avgImpact + result.impactScore) / 2;
        }
      }

      setFullAnalysis({
        summary: masterSummary,
        strategy: masterStrategy,
        impactScore: Math.round(avgImpact),
        analyses: allAnalyses
      });
      
      addLog(feedback ? 'refine' : 'consult', `Comprehensive analysis complete. Strategy applied to ${allAnalyses.length} nodes.`);
    } catch (error) {
      setError("AI Engine encountered a bottleneck. Try a smaller batch or check connectivity.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applyActions = async (selectedResults: AIAnalysisResult[]) => {
    if (isDemoMode || !directoryHandle) {
      alert("Demo Mode: Operation simulated.");
      setFullAnalysis(null);
      setCurrentView(AppView.DASHBOARD);
      return;
    }

    setIsExecuting(true);
    let successCount = 0;
    let junkCount = 0;
    let folderCount = new Set();

    try {
      for (const result of selectedResults) {
        const fileMeta = files.find(f => f.name === result.originalName);
        if (fileMeta && fileMeta.handle) {
          try {
            await organizeFile(directoryHandle, fileMeta, result);
            successCount++;
            if (result.isJunk) junkCount++;
            if (result.suggestedFolder !== '.') folderCount.add(result.suggestedFolder);
          } catch (e: any) {
            addLog('move', `Relocation failed for ${result.originalName}`, 'failed');
          }
        }
      }

      setStats(prev => ({
        ...prev,
        filesAnalyzed: prev.filesAnalyzed + successCount,
        junkFound: prev.junkFound + junkCount,
        foldersCreated: prev.foldersCreated + folderCount.size,
        spaceAnalyzed: prev.spaceAnalyzed + files.reduce((acc, f) => acc + f.size, 0)
      }));
      addLog('move', `Automation Cycle Complete: ${successCount} files relocated.`);
    } finally {
      setIsExecuting(false);
      setFullAnalysis(null);
      setCurrentView(AppView.DASHBOARD);
      const refreshedFiles = await scanDirectory(directoryHandle);
      setFiles(refreshedFiles);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      <Sidebar currentView={currentView} onNavigate={setCurrentView} />

      <main className="flex-1 overflow-y-auto p-4 md:p-10 relative">
        <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="animate-in fade-in slide-in-from-top duration-700">
            <h1 className="text-4xl font-black text-slate-800 flex items-center gap-3 tracking-tighter">
              <CubeTransparentIcon className="w-10 h-10 text-indigo-600" />
              NeatStep AI
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-100">
                <ShieldCheckIcon className="w-4 h-4" />
                Curatorial Core 3.5
              </span>
              <p className="text-slate-400 text-xs font-medium">
                {directoryHandle ? `Analyzing /${directoryHandle.name}` : 'Awaiting file system access...'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button onClick={loadDemoData} className="px-5 py-3 border-2 border-slate-200 hover:border-indigo-200 text-slate-500 hover:text-indigo-600 rounded-2xl transition-all flex items-center gap-2 font-bold bg-white text-sm">
              <BeakerIcon className="w-5 h-5" />
              AI Simulation
            </button>
            <button onClick={handleSelectDirectory} className="px-8 py-4 bg-slate-900 hover:bg-black text-white rounded-2xl shadow-2xl shadow-slate-200 transition-all transform hover:scale-[1.02] active:scale-95 flex items-center gap-2 font-black text-sm">
              <FolderIcon className="w-5 h-5" />
              Deep Scan Folder
            </button>
          </div>
        </header>

        <div className="max-w-7xl mx-auto">
          {error && (
            <div className="mb-8 p-6 bg-rose-50 border-2 border-rose-100 rounded-3xl flex items-start gap-5 animate-in slide-in-from-right">
              <div className="p-2 bg-rose-100 rounded-full">
                <ExclamationTriangleIcon className="w-6 h-6 text-rose-600" />
              </div>
              <div className="flex-1">
                <p className="text-rose-800 font-black uppercase tracking-widest text-xs mb-1">Intelligence Link Interrupted</p>
                <p className="text-rose-700 text-sm leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {currentView === AppView.DASHBOARD && <Dashboard stats={stats} recentLogs={logs.slice(0, 6)} />}
          {currentView === AppView.SCANNER && <Scanner files={files} onStartAnalysis={() => startAIAnalysis()} isAnalyzing={isAnalyzing} />}
          {currentView === AppView.REVIEW && <ReviewPanel fullAnalysis={fullAnalysis} isAnalyzing={isAnalyzing || isExecuting} progress={analysisProgress} onApply={applyActions} onRefine={startAIAnalysis} />}
          {currentView === AppView.HISTORY && <ActivityHistory logs={logs} />}
        </div>
      </main>

      <div className="fixed bottom-6 right-6 z-50">
        <div className="px-4 py-2 bg-white/80 backdrop-blur-xl border border-slate-200 rounded-full shadow-2xl flex items-center gap-3">
          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-200" />
          <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Cognitive Sync Active</span>
        </div>
      </div>
    </div>
  );
};

export default App;
