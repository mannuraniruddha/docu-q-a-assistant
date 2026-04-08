import { useState } from "react";
import { ChevronDown, ChevronRight, Layers, Binary, Search, Sparkles, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { DebugInfo } from "@/lib/rag-store";
import { cn } from "@/lib/utils";

interface DebugPanelProps {
  debug: DebugInfo;
}

function Section({
  title,
  icon: Icon,
  latency,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: React.ElementType;
  latency?: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border rounded-md overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-mono font-medium hover:bg-muted/50 transition-colors"
      >
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        <Icon className="h-3.5 w-3.5 text-primary" />
        <span>{title}</span>
        {latency !== undefined && (
          <span className="ml-auto flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
            {latency}ms
          </span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-1 text-xs">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function DebugPanel({ debug }: DebugPanelProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
      >
        {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        <span>Pipeline Debug</span>
        <span className="text-primary font-medium">{debug.generation.totalLatencyMs}ms total</span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2 space-y-2">
              <Section title="Chunking" icon={Layers}>
                <div className="space-y-2">
                  <div className="flex gap-4 text-muted-foreground">
                    <span>Chunks: <span className="text-foreground font-medium">{debug.chunking.totalChunks}</span></span>
                    <span>Size: <span className="text-foreground font-medium">{debug.chunking.chunkSize}</span></span>
                    <span>Overlap: <span className="text-foreground font-medium">{debug.chunking.overlap}</span></span>
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {debug.chunking.chunks.slice(0, 5).map((c) => (
                      <div key={c.index} className="bg-muted/50 rounded p-2">
                        <span className="text-primary font-medium">#{c.index}</span>
                        <span className="text-muted-foreground ml-2">({c.length} chars)</span>
                        <p className="text-muted-foreground mt-1 line-clamp-2">{c.text}</p>
                      </div>
                    ))}
                    {debug.chunking.chunks.length > 5 && (
                      <p className="text-muted-foreground">...and {debug.chunking.chunks.length - 5} more</p>
                    )}
                  </div>
                </div>
              </Section>

              <Section title="Embeddings" icon={Binary} latency={debug.embeddings.latencyMs}>
                <div className="flex gap-4 text-muted-foreground">
                  <span>Model: <span className="text-foreground font-medium">{debug.embeddings.model}</span></span>
                  <span>Dimensions: <span className="text-foreground font-medium">{debug.embeddings.dimensions}</span></span>
                </div>
              </Section>

              <Section title="Retrieval" icon={Search} latency={debug.retrieval.latencyMs}>
                <div className="space-y-2">
                  <div className="text-muted-foreground">
                    Query: <span className="text-foreground">"{debug.retrieval.query}"</span> | Top-K: {debug.retrieval.topK}
                  </div>
                  <div className="space-y-1">
                    {debug.retrieval.results.map((r, i) => (
                      <div key={i} className="bg-muted/50 rounded p-2 flex items-start gap-2">
                        <span className={cn(
                          "font-mono font-bold shrink-0",
                          r.score > 0.8 ? "text-success" : r.score > 0.5 ? "text-warning" : "text-muted-foreground"
                        )}>
                          {r.score.toFixed(3)}
                        </span>
                        <div className="min-w-0">
                          <span className="text-primary font-medium">Chunk #{r.chunkIndex}</span>
                          <span className="text-muted-foreground ml-1">({r.source})</span>
                          <p className="text-muted-foreground mt-1 line-clamp-2">{r.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Section>

              <Section title="Generation" icon={Sparkles} latency={debug.generation.latencyMs}>
                <div className="space-y-2">
                  <div className="text-muted-foreground">
                    Model: <span className="text-foreground font-medium">{debug.generation.model}</span>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Full prompt sent to LLM:</p>
                    <pre className="bg-muted/50 rounded p-2 text-xs overflow-x-auto whitespace-pre-wrap max-h-48 overflow-y-auto">
                      {debug.generation.prompt}
                    </pre>
                  </div>
                </div>
              </Section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
