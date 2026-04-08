import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRAGStore } from "@/lib/rag-store";
import { DebugPanel } from "@/components/DebugPanel";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export function ChatInterface() {
  const [input, setInput] = useState("");
  const { messages, documents, settings, isQuerying, addMessage, updateMessage, setIsQuerying } =
    useRAGStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  const readyDocs = documents.filter((d) => d.status === "ready");

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isQuerying) return;

    if (readyDocs.length === 0) {
      toast({ title: "No documents", description: "Upload a document first.", variant: "destructive" });
      return;
    }

    const userMsg = {
      id: crypto.randomUUID(),
      role: "user" as const,
      content: input.trim(),
      timestamp: Date.now(),
    };
    addMessage(userMsg);
    setInput("");
    setIsQuerying(true);

    const assistantId = crypto.randomUUID();
    addMessage({
      id: assistantId,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
    });

    try {
      const allChunks = readyDocs.flatMap((d) =>
        d.chunks.map((c) => ({ ...c, embedding: d.embeddings[c.index] }))
      );

      const { data, error } = await supabase.functions.invoke("rag-query", {
        body: {
          question: userMsg.content,
          chunks: allChunks,
          settings: {
            provider: settings.provider,
            openaiKey: settings.openaiKey,
            geminiKey: settings.geminiKey,
            model: settings.model,
            topK: settings.topK,
            chunkSize: settings.chunkSize,
            chunkOverlap: settings.chunkOverlap,
          },
        },
      });

      if (error) throw error;

      updateMessage(assistantId, {
        content: data.answer,
        debugInfo: data.debug,
      });
    } catch (err: any) {
      updateMessage(assistantId, { content: `Error: ${err.message}` });
      toast({ title: "Query failed", description: err.message, variant: "destructive" });
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Send className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-mono text-lg font-semibold">Ask a question</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              Upload documents and ask questions about their content. Each answer includes a debug panel showing the full RAG pipeline.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border text-card-foreground"
              }`}
            >
              {msg.role === "assistant" && !msg.content && isQuerying ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              )}
              {msg.debugInfo && <DebugPanel debug={msg.debugInfo} />}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t bg-card/50">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={readyDocs.length > 0 ? "Ask about your documents..." : "Upload a document first..."}
            disabled={isQuerying || readyDocs.length === 0}
            className="font-mono text-sm"
          />
          <Button type="submit" disabled={isQuerying || !input.trim() || readyDocs.length === 0}>
            {isQuerying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </form>
    </div>
  );
}
