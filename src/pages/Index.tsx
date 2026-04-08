import { useCallback } from "react";
import { DocumentUpload } from "@/components/DocumentUpload";
import { DocumentList } from "@/components/DocumentList";
import { ChatInterface } from "@/components/ChatInterface";
import { Button } from "@/components/ui/button";
import { useRAGStore } from "@/lib/rag-store";
import { DEMO_DOCUMENT_NAME, DEMO_DOCUMENT_CONTENT } from "@/lib/demo-document";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { FileDown, Trash2 } from "lucide-react";

export default function Index() {
  const { documents, addDocument, updateDocument, settings, setIsProcessing, clearMessages } = useRAGStore();

  const loadDemo = useCallback(async () => {
    if (documents.some((d) => d.name === DEMO_DOCUMENT_NAME)) {
      toast({ title: "Already loaded", description: "Demo document is already uploaded." });
      return;
    }

    const docId = crypto.randomUUID();
    addDocument({
      id: docId,
      name: DEMO_DOCUMENT_NAME,
      type: "text/markdown",
      rawText: DEMO_DOCUMENT_CONTENT,
      chunks: [],
      embeddings: [],
      status: "processing",
    });
    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke("process-document", {
        body: {
          text: DEMO_DOCUMENT_CONTENT,
          fileName: DEMO_DOCUMENT_NAME,
          chunkSize: settings.chunkSize,
          chunkOverlap: settings.chunkOverlap,
          provider: settings.provider,
          openaiKey: settings.openaiKey,
          geminiKey: settings.geminiKey,
        },
      });

      if (error) throw error;

      updateDocument(docId, {
        chunks: data.chunks,
        embeddings: data.embeddings,
        status: "ready",
        processedAt: Date.now(),
      });

      toast({ title: "Demo loaded", description: `${data.chunks.length} chunks created from demo document.` });
    } catch (err: any) {
      updateDocument(docId, { status: "error", error: err.message });
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  }, [documents, addDocument, updateDocument, settings, setIsProcessing]);

  return (
    <div className="container py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-6rem)]">
        {/* Left panel: Upload & Docs */}
        <div className="space-y-4 lg:overflow-y-auto">
          <div>
            <h1 className="font-mono text-2xl font-bold tracking-tight">RAG Document QA</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Upload documents, ask questions, inspect the full pipeline.
            </p>
          </div>

          <DocumentUpload />

          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="font-mono text-xs gap-2" onClick={loadDemo}>
              <FileDown className="h-3.5 w-3.5" />
              Load Demo Doc
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="font-mono text-xs gap-2"
              onClick={clearMessages}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear Chat
            </Button>
          </div>

          <DocumentList />
        </div>

        {/* Right panel: Chat */}
        <div className="lg:col-span-2 border rounded-xl bg-card/30 flex flex-col overflow-hidden">
          <ChatInterface />
        </div>
      </div>
    </div>
  );
}
