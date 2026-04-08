import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const fileBreakdown = [
  {
    file: "src/lib/rag-store.ts",
    purpose: "Central state management using Zustand",
    why: "Demonstrates systems thinking — single source of truth for documents, messages, settings, and pipeline state. A TPM must understand how state flows through complex systems.",
    quality: "Architecture & State Design",
  },
  {
    file: "src/lib/demo-document.ts",
    purpose: "Bundled sample document for immediate onboarding",
    why: "Shows product thinking — reducing time-to-value by letting users try the system instantly without setup. A TPM always considers first-run experience.",
    quality: "User Experience & Onboarding",
  },
  {
    file: "src/components/DocumentUpload.tsx",
    purpose: "Drag-and-drop file upload with validation",
    why: "Handles edge cases: file type validation, size limits, processing states. A TPM defines acceptance criteria that cover error scenarios.",
    quality: "Error Handling & Edge Cases",
  },
  {
    file: "src/components/DebugPanel.tsx",
    purpose: "Collapsible pipeline visualization with latency tracking",
    why: "Provides observability into every pipeline step. A TPM needs to understand and communicate system behavior to stakeholders.",
    quality: "Observability & Communication",
  },
  {
    file: "src/components/ChatInterface.tsx",
    purpose: "Question-answer interface with source citations",
    why: "The core user interaction. Integrates upload → chunking → embedding → retrieval → generation into a seamless flow.",
    quality: "End-to-End Integration",
  },
  {
    file: "supabase/functions/process-document/index.ts",
    purpose: "Document processing edge function: text extraction, chunking, embedding",
    why: "Separates concerns: client handles UI, server handles compute. Shows understanding of distributed system design and API contract definition.",
    quality: "API Design & Separation of Concerns",
  },
  {
    file: "supabase/functions/rag-query/index.ts",
    purpose: "RAG query edge function: similarity search, prompt construction, generation",
    why: "The complete retrieval-augmented generation pipeline in one function. Includes latency tracking, error handling, and provider abstraction.",
    quality: "Pipeline Engineering & Resilience",
  },
  {
    file: "src/pages/Settings.tsx",
    purpose: "Configuration UI for provider, model, and chunking parameters",
    why: "Makes the system configurable without code changes. A TPM ensures systems are tunable for different use cases and trade-offs.",
    quality: "Configurability & Flexibility",
  },
];

export default function ReadmePage() {
  return (
    <div className="container py-6 max-w-4xl space-y-8">
      <div>
        <h1 className="font-mono text-2xl font-bold tracking-tight">README</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Architecture overview and why each piece matters for TPM work.
        </p>
      </div>

      {/* Overview */}
      <Card>
        <CardContent className="pt-6 prose prose-sm max-w-none dark:prose-invert">
          <h2 className="font-mono">Project Overview</h2>
          <p>
            <strong>RAG Document QA</strong> is a full-stack web application that implements a complete
            Retrieval-Augmented Generation pipeline. Users upload documents (PDF, TXT, MD), ask natural
            language questions, and receive AI-generated answers grounded in the uploaded content — with
            full pipeline visibility.
          </p>

          <h3 className="font-mono">Architecture</h3>
          <pre className="bg-muted rounded-lg p-4 text-xs overflow-x-auto">
{`┌──────────────────────────────────────────────────┐
│                   Frontend (React)                │
│  ┌────────────┐  ┌──────────┐  ┌──────────────┐  │
│  │  Upload UI  │  │ Chat UI  │  │ Debug Panel  │  │
│  └─────┬──────┘  └────┬─────┘  └──────────────┘  │
│        │              │                           │
│  ┌─────▼──────────────▼──────────────────────┐    │
│  │         Zustand State (rag-store)          │    │
│  └─────┬──────────────┬──────────────────────┘    │
└────────┼──────────────┼──────────────────────────┘
         │              │
    ┌────▼────┐    ┌────▼────┐
    │ process │    │   rag   │    ← Edge Functions
    │   doc   │    │  query  │
    └────┬────┘    └────┬────┘
         │              │
    ┌────▼──────────────▼────┐
    │   AI Gateway / API      │
    │  (Lovable / OpenAI /    │
    │   Gemini)               │
    └─────────────────────────┘`}
          </pre>

          <h3 className="font-mono">Tech Stack</h3>
          <ul>
            <li><strong>Frontend:</strong> React 18, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion</li>
            <li><strong>State:</strong> Zustand (client-side document & message store)</li>
            <li><strong>Backend:</strong> Supabase Edge Functions (Deno runtime)</li>
            <li><strong>AI:</strong> Lovable AI Gateway (default), OpenAI, Google Gemini</li>
          </ul>
        </CardContent>
      </Card>

      {/* File Breakdown */}
      <div>
        <h2 className="font-mono text-xl font-bold mb-4">File-by-File Breakdown</h2>
        <div className="space-y-3">
          {fileBreakdown.map((f) => (
            <Card key={f.file}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <code className="text-sm font-mono text-primary font-semibold">{f.file}</code>
                    <p className="text-sm mt-1">{f.purpose}</p>
                    <Separator className="my-2" />
                    <p className="text-sm text-muted-foreground">
                      <strong>Why it matters:</strong> {f.why}
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0 font-mono text-xs">
                    {f.quality}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* TPM Qualities */}
      <Card>
        <CardContent className="pt-6 prose prose-sm max-w-none dark:prose-invert">
          <h2 className="font-mono">Qualities Showcased for TPM Work</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose">
            {[
              { title: "Systems Thinking", desc: "Understanding how components interact across the full pipeline from upload to generation." },
              { title: "Pipeline Design", desc: "Designing a multi-stage pipeline with clear interfaces between chunking, embedding, retrieval, and generation." },
              { title: "Trade-off Awareness", desc: "Configurable parameters expose chunking and retrieval trade-offs that a TPM must understand." },
              { title: "Observability", desc: "The debug panel provides full pipeline transparency — essential for production systems." },
              { title: "Error Handling", desc: "Graceful degradation with clear error states and fallback strategies." },
              { title: "Documentation", desc: "This README and the RAG Deep Dive demonstrate technical communication skills." },
            ].map((q) => (
              <div key={q.title} className="p-3 rounded-lg border bg-muted/30">
                <h4 className="font-mono text-sm font-semibold">{q.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">{q.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
