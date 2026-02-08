
import { GoogleGenAI } from "@google/genai";
import { FileMetadata, AIAnalysisResult, FullAnalysisResponse, DashboardInsight, AppStats } from "../types";
import { SYSTEM_INSTRUCTION, INSIGHT_GENERATION_PROMPT } from "../constants";

export class GeminiService {
  async analyzeBatch(files: FileMetadata[], userFeedback?: string): Promise<FullAnalysisResponse> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      const fileData = files.map(f => ({
        name: f.name,
        type: f.type,
        size: `${(f.size / 1024).toFixed(2)} KB`,
        snippet: f.contentSnippet || 'No snippet available',
        path: f.path
      }));

      const feedbackContext = userFeedback ? `\n\nUSER STRATEGY/REFINEMENT: "${userFeedback}". Override previous logic with this.` : "";

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze this batch of files and determine if they are organized. Also check snippets for secrets: ${JSON.stringify(fileData)}${feedbackContext}`,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
        },
      });

      const text = response.text || '{"analyses": [], "summary": "N/A", "strategy": "None", "impactScore": 0, "isAlreadyOrganized": false}';
      return JSON.parse(text);
    } catch (error) {
      console.error("Batch Analysis Failed:", error);
      throw error;
    }
  }

  async generateInsights(stats: Partial<AppStats>, files: FileMetadata[]): Promise<DashboardInsight[]> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const context = {
        totalFiles: files.length,
        totalSize: stats.spaceAnalyzed,
        fileTypes: Array.from(new Set(files.map(f => f.type))).slice(0, 10),
      };

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `${INSIGHT_GENERATION_PROMPT}\nStats Context: ${JSON.stringify(context)}`,
        config: {
          responseMimeType: "application/json",
        },
      });
      return JSON.parse(response.text || '[]');
    } catch {
      return [];
    }
  }
}
