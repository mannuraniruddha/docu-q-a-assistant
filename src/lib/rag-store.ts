import { create } from "zustand";

export interface DocumentChunk {
  id: string;
  text: string;
  index: number;
  metadata: {
    source: string;
    chunkSize: number;
    overlap: number;
  };
}

export interface ProcessedDocument {
  id: string;
  name: string;
  type: string;
  rawText: string;
  chunks: DocumentChunk[];
  embeddings: number[][];
  status: "uploading" | "processing" | "ready" | "error";
  error?: string;
  processedAt?: number;
}

export interface DebugInfo {
  chunking: {
    totalChunks: number;
    chunkSize: number;
    overlap: number;
    chunks: { index: number; text: string; length: number }[];
  };
  embeddings: {
    model: string;
    dimensions: number;
    latencyMs: number;
  };
  retrieval: {
    query: string;
    topK: number;
    results: { chunkIndex: number; score: number; text: string; source: string }[];
    latencyMs: number;
  };
  generation: {
    model: string;
    prompt: string;
    latencyMs: number;
    totalLatencyMs: number;
    tokensUsed?: number;
  };
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  debugInfo?: DebugInfo;
  timestamp: number;
}

export interface RAGSettings {
  provider: "default" | "openai" | "gemini";
  openaiKey: string;
  geminiKey: string;
  model: string;
  chunkSize: number;
  chunkOverlap: number;
  topK: number;
}

interface RAGStore {
  documents: ProcessedDocument[];
  messages: ChatMessage[];
  settings: RAGSettings;
  isProcessing: boolean;
  isQuerying: boolean;
  addDocument: (doc: ProcessedDocument) => void;
  updateDocument: (id: string, updates: Partial<ProcessedDocument>) => void;
  removeDocument: (id: string) => void;
  addMessage: (msg: ChatMessage) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  setSettings: (settings: Partial<RAGSettings>) => void;
  setIsProcessing: (v: boolean) => void;
  setIsQuerying: (v: boolean) => void;
  clearMessages: () => void;
}

export const useRAGStore = create<RAGStore>((set) => ({
  documents: [],
  messages: [],
  settings: {
    provider: "default",
    openaiKey: "",
    geminiKey: "",
    model: "google/gemini-3-flash-preview",
    chunkSize: 500,
    chunkOverlap: 50,
    topK: 5,
  },
  isProcessing: false,
  isQuerying: false,
  addDocument: (doc) => set((s) => ({ documents: [...s.documents, doc] })),
  updateDocument: (id, updates) =>
    set((s) => ({
      documents: s.documents.map((d) => (d.id === id ? { ...d, ...updates } : d)),
    })),
  removeDocument: (id) => set((s) => ({ documents: s.documents.filter((d) => d.id !== id) })),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  updateMessage: (id, updates) =>
    set((s) => ({
      messages: s.messages.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    })),
  setSettings: (settings) => set((s) => ({ settings: { ...s.settings, ...settings } })),
  setIsProcessing: (isProcessing) => set({ isProcessing }),
  setIsQuerying: (isQuerying) => set({ isQuerying }),
  clearMessages: () => set({ messages: [] }),
}));
