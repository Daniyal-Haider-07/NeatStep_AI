
export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  handle: FileSystemFileHandle;
  path: string;
  contentSnippet?: string;
}

export interface AIAnalysisResult {
  originalName: string;
  suggestedName: string;
  category: string;
  isJunk: boolean;
  reason: string;
  suggestedFolder: string;
  confidence: number;
  contextTags?: string[];
}

export interface FullAnalysisResponse {
  summary: string;
  strategy: string;
  impactScore: number;
  analyses: AIAnalysisResult[];
}

export interface DashboardInsight {
  title: string;
  description: string;
  type: 'optimization' | 'security' | 'clutter';
  priority: 'high' | 'medium' | 'low';
}

export interface ActivityLogEntry {
  id: string;
  timestamp: number;
  action: 'rename' | 'move' | 'delete' | 'scan' | 'consult' | 'refine';
  details: string;
  status: 'success' | 'failed' | 'pending';
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  SCANNER = 'SCANNER',
  REVIEW = 'REVIEW',
  HISTORY = 'HISTORY'
}

export interface AppStats {
  filesAnalyzed: number;
  junkFound: number;
  spaceAnalyzed: number;
  foldersCreated: number;
  aiInsights: DashboardInsight[];
}
