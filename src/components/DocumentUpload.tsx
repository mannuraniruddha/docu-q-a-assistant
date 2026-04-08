import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, Loader2 } from "lucide-react";
import { useRAGStore } from "@/lib/rag-store";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function DocumentUpload() {
  const { addDocument, updateDocument, settings, isProcessing, setIsProcessing } = useRAGStore();

  const processFile = useCallback(
    async (file: File) => {
      const docId = crypto.randomUUID();
      const reader = new FileReader();

      addDocument({
        id: docId,
        name: file.name,
        type: file.type || file.name.split(".").pop() || "unknown",
        rawText: "",
        chunks: [],
        embeddings: [],
        status: "uploading",
      });

      reader.onload = async (e) => {
        const text = e.target?.result as string;
        updateDocument(docId, { rawText: text, status: "processing" });
        setIsProcessing(true);

        try {
          const { data, error } = await supabase.functions.invoke("process-document", {
            body: {
              text,
              fileName: file.name,
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

          toast({
            title: "Document processed",
            description: `${file.name}: ${data.chunks.length} chunks created`,
          });
        } catch (err: any) {
          updateDocument(docId, { status: "error", error: err.message });
          toast({
            title: "Processing failed",
            description: err.message,
            variant: "destructive",
          });
        } finally {
          setIsProcessing(false);
        }
      };

      reader.readAsText(file);
    },
    [addDocument, updateDocument, settings, setIsProcessing]
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      acceptedFiles.forEach(processFile);
    },
    [processFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
      "text/markdown": [".md"],
    },
    maxSize: 10 * 1024 * 1024,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200",
        isDragActive
          ? "border-primary bg-primary/5 scale-[1.02]"
          : "border-border hover:border-primary/50 hover:bg-muted/50",
        isProcessing && "pointer-events-none opacity-60"
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-3">
        {isProcessing ? (
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
        ) : isDragActive ? (
          <Upload className="h-10 w-10 text-primary" />
        ) : (
          <FileText className="h-10 w-10 text-muted-foreground" />
        )}
        <div>
          <p className="font-mono text-sm font-medium">
            {isProcessing
              ? "Processing document..."
              : isDragActive
              ? "Drop files here"
              : "Drop documents or click to upload"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            PDF, TXT, MD — up to 10MB
          </p>
        </div>
      </div>
    </div>
  );
}
