import { useRAGStore } from "@/lib/rag-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Shield, Key, Sliders, Brain } from "lucide-react";

const providers = [
  { value: "lovable", label: "Lovable AI (default)", description: "No API key needed" },
  { value: "openai", label: "OpenAI", description: "Requires API key" },
  { value: "gemini", label: "Google Gemini", description: "Requires API key" },
];

const models: Record<string, { value: string; label: string }[]> = {
  lovable: [
    { value: "google/gemini-3-flash-preview", label: "Gemini 3 Flash (default)" },
    { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash" },
    { value: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro" },
    { value: "openai/gpt-5-mini", label: "GPT-5 Mini" },
    { value: "openai/gpt-5", label: "GPT-5" },
  ],
  openai: [
    { value: "gpt-4o", label: "GPT-4o" },
    { value: "gpt-4o-mini", label: "GPT-4o Mini" },
  ],
  gemini: [
    { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
    { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
  ],
};

export default function Settings() {
  const { settings, setSettings } = useRAGStore();
  const currentModels = models[settings.provider] || models.lovable;

  return (
    <div className="container py-6 max-w-3xl space-y-6">
      <div>
        <h1 className="font-mono text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure your RAG pipeline parameters.</p>
      </div>

      {/* AI Provider */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Brain className="h-5 w-5 text-primary" />
            AI Provider
          </CardTitle>
          <CardDescription>Choose the AI service for embeddings and generation.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="font-mono text-xs">Provider</Label>
            <Select value={settings.provider} onValueChange={(v: any) => setSettings({ provider: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {providers.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    <div className="flex items-center gap-2">
                      {p.label}
                      {p.value === "lovable" && <Badge variant="secondary" className="text-xs">Free</Badge>}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {settings.provider === "openai" && (
            <div className="space-y-2">
              <Label className="font-mono text-xs flex items-center gap-2">
                <Key className="h-3 w-3" /> OpenAI API Key
              </Label>
              <Input
                type="password"
                value={settings.openaiKey}
                onChange={(e) => setSettings({ openaiKey: e.target.value })}
                placeholder="sk-..."
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Shield className="h-3 w-3" /> Stored only in your browser, never sent to our servers
              </p>
            </div>
          )}

          {settings.provider === "gemini" && (
            <div className="space-y-2">
              <Label className="font-mono text-xs flex items-center gap-2">
                <Key className="h-3 w-3" /> Gemini API Key
              </Label>
              <Input
                type="password"
                value={settings.geminiKey}
                onChange={(e) => setSettings({ geminiKey: e.target.value })}
                placeholder="AIza..."
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Shield className="h-3 w-3" /> Stored only in your browser, never sent to our servers
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label className="font-mono text-xs">Model</Label>
            <Select value={settings.model} onValueChange={(v) => setSettings({ model: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currentModels.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Chunking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sliders className="h-5 w-5 text-primary" />
            Chunking Parameters
          </CardTitle>
          <CardDescription>Control how documents are split into retrievable chunks.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between">
              <Label className="font-mono text-xs">Chunk Size</Label>
              <span className="font-mono text-xs text-muted-foreground">{settings.chunkSize} chars</span>
            </div>
            <Slider
              value={[settings.chunkSize]}
              onValueChange={([v]) => setSettings({ chunkSize: v })}
              min={100}
              max={2000}
              step={50}
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <Label className="font-mono text-xs">Chunk Overlap</Label>
              <span className="font-mono text-xs text-muted-foreground">{settings.chunkOverlap} chars</span>
            </div>
            <Slider
              value={[settings.chunkOverlap]}
              onValueChange={([v]) => setSettings({ chunkOverlap: v })}
              min={0}
              max={500}
              step={10}
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <Label className="font-mono text-xs">Top-K Results</Label>
              <span className="font-mono text-xs text-muted-foreground">{settings.topK}</span>
            </div>
            <Slider
              value={[settings.topK]}
              onValueChange={([v]) => setSettings({ topK: v })}
              min={1}
              max={20}
              step={1}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
