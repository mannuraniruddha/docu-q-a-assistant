import { FileText, Trash2, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { useRAGStore } from "@/lib/rag-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const statusConfig = {
  uploading: { icon: Loader2, label: "Uploading", className: "text-info animate-spin" },
  processing: { icon: Loader2, label: "Processing", className: "text-warning animate-spin" },
  ready: { icon: CheckCircle2, label: "Ready", className: "text-success" },
  error: { icon: AlertCircle, label: "Error", className: "text-destructive" },
};

export function DocumentList() {
  const { documents, removeDocument } = useRAGStore();

  if (documents.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="font-mono text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Documents ({documents.length})
      </h3>
      {documents.map((doc) => {
        const status = statusConfig[doc.status];
        const StatusIcon = status.icon;
        return (
          <div
            key={doc.id}
            className="flex items-center gap-3 p-3 rounded-lg border bg-card text-card-foreground"
          >
            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{doc.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <StatusIcon className={`h-3 w-3 ${status.className}`} />
                <span className="text-xs text-muted-foreground">{status.label}</span>
                {doc.status === "ready" && (
                  <Badge variant="secondary" className="text-xs font-mono">
                    {doc.chunks.length} chunks
                  </Badge>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => removeDocument(doc.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}
