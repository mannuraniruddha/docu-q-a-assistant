import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowRight, Layers, Binary, Search, Sparkles, Shield, Clock, AlertTriangle } from "lucide-react";

export default function RagExplained() {
  return (
    <div className="container py-6 max-w-4xl space-y-8">
      <div>
        <h1 className="font-mono text-2xl font-bold tracking-tight">RAG Deep Dive</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Understanding every layer of the Retrieval-Augmented Generation pipeline.
        </p>
      </div>

      {/* Pipeline Overview */}
      <Card>
        <CardContent className="pt-6">
          <h2 className="font-mono text-lg font-bold mb-4">The RAG Pipeline</h2>
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm font-mono">
            {[
              { label: "Document", icon: Layers },
              { label: "Chunk", icon: Layers },
              { label: "Embed", icon: Binary },
              { label: "Retrieve", icon: Search },
              { label: "Augment", icon: Sparkles },
              { label: "Generate", icon: Sparkles },
            ].map((step, i, arr) => (
              <div key={step.label} className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary/10 text-primary">
                  <step.icon className="h-4 w-4" />
                  <span className="text-xs font-semibold">{step.label}</span>
                </div>
                {i < arr.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Each step transforms data to ground the final answer in real documents.
          </p>
        </CardContent>
      </Card>

      {/* Sections */}
      <Accordion type="multiple" defaultValue={["chunking", "embeddings", "prompt", "production"]} className="space-y-3">
        {/* Chunking */}
        <AccordionItem value="chunking" className="border rounded-xl px-4">
          <AccordionTrigger className="font-mono text-base">
            <span className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              Chunking Strategies & Trade-offs
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <p>Chunking is the most impactful parameter in a RAG system. It determines what the model "sees" at query time.</p>

              <h4 className="font-mono">Fixed-Size Chunking</h4>
              <p>Split every N characters with M characters of overlap. Simple, predictable, and the default in this app.</p>
              <ul>
                <li><strong>Pros:</strong> Consistent chunk sizes, easy to reason about, works for most documents</li>
                <li><strong>Cons:</strong> May split mid-sentence, ignores document structure</li>
              </ul>

              <h4 className="font-mono">Sentence-Based Chunking</h4>
              <p>Split on sentence boundaries, grouping sentences until the size limit is reached.</p>
              <ul>
                <li><strong>Pros:</strong> Better semantic coherence, preserves complete thoughts</li>
                <li><strong>Cons:</strong> Variable chunk sizes, more complex implementation</li>
              </ul>

              <h4 className="font-mono">Key Trade-offs</h4>
              <table>
                <thead>
                  <tr><th>Parameter</th><th>Smaller Value</th><th>Larger Value</th></tr>
                </thead>
                <tbody>
                  <tr><td><strong>Chunk Size</strong></td><td>More precise retrieval, but may lose context</td><td>More context, but may dilute relevance</td></tr>
                  <tr><td><strong>Overlap</strong></td><td>Less redundancy, faster processing</td><td>Better boundary coverage, more storage</td></tr>
                  <tr><td><strong>Top-K</strong></td><td>Focused answers, may miss info</td><td>Comprehensive, but may confuse the model</td></tr>
                </tbody>
              </table>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Embeddings */}
        <AccordionItem value="embeddings" className="border rounded-xl px-4">
          <AccordionTrigger className="font-mono text-base">
            <span className="flex items-center gap-2">
              <Binary className="h-5 w-5 text-primary" />
              Embedding Model Selection & Fallbacks
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <p>Embeddings convert text into dense vectors that capture semantic meaning. The choice of model affects retrieval quality, latency, and cost.</p>

              <h4 className="font-mono">Model Comparison</h4>
              <table>
                <thead>
                  <tr><th>Model</th><th>Dims</th><th>Strengths</th><th>When to Use</th></tr>
                </thead>
                <tbody>
                  <tr><td>text-embedding-3-small</td><td>1536</td><td>Good general purpose</td><td>Default for most cases</td></tr>
                  <tr><td>text-embedding-004</td><td>768</td><td>Efficient, accurate</td><td>Cost-conscious workloads</td></tr>
                  <tr><td>Cohere embed-v3</td><td>1024</td><td>Search-optimized</td><td>Retrieval-heavy systems</td></tr>
                </tbody>
              </table>

              <h4 className="font-mono">Fallback Strategy</h4>
              <p>This app implements a provider fallback chain:</p>
              <ol>
                <li>Try the selected provider (Built-in AI / OpenAI / Gemini)</li>
                <li>If it fails, fall back to simple TF-IDF similarity (keyword matching)</li>
                <li>Always return results — even degraded quality is better than an error</li>
              </ol>

              <h4 className="font-mono">Critical Rule</h4>
              <p><strong>Never mix embedding models.</strong> Query embeddings must use the same model as document embeddings, or similarity scores are meaningless.</p>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Prompt Engineering */}
        <AccordionItem value="prompt" className="border rounded-xl px-4">
          <AccordionTrigger className="font-mono text-base">
            <span className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Prompt Engineering with Source Citations
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <p>The augmented prompt is where retrieval meets generation. It must clearly present context and instruct the model to cite sources.</p>

              <h4 className="font-mono">Prompt Template</h4>
              <pre className="bg-muted rounded-lg p-4 text-xs">{`You are a helpful assistant answering questions based on provided documents.

CONTEXT FROM DOCUMENTS:
[Source: {filename}, Chunk {n}]
"{chunk_text}"

---

QUESTION: {user_question}

INSTRUCTIONS:
1. Answer ONLY based on the provided context
2. Cite sources using [Source: filename, Chunk N] format
3. If the answer is not in the context, say "I cannot find this in the provided documents"
4. Be concise and specific`}</pre>

              <h4 className="font-mono">Key Principles</h4>
              <ul>
                <li><strong>Grounding:</strong> Instruct the model to use only provided context</li>
                <li><strong>Attribution:</strong> Require source citations for verifiability</li>
                <li><strong>Honesty:</strong> Explicitly handle "I don't know" cases</li>
                <li><strong>Context window:</strong> Truncate context if it exceeds model limits</li>
              </ul>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Production Thinking */}
        <AccordionItem value="production" className="border rounded-xl px-4">
          <AccordionTrigger className="font-mono text-base">
            <span className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Production Thinking
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <h4 className="font-mono flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Graceful Degradation</h4>
              <p>A production RAG system must never crash silently. This app implements:</p>
              <ul>
                <li><strong>Provider fallback:</strong> If the AI provider fails, fall back to keyword search</li>
                <li><strong>Partial results:</strong> Return what we have even if embedding fails</li>
                <li><strong>Clear error states:</strong> Every component shows loading, error, and empty states</li>
                <li><strong>Rate limit handling:</strong> 429 and 402 errors surfaced with user-friendly messages</li>
              </ul>

              <h4 className="font-mono flex items-center gap-2"><Clock className="h-4 w-4" /> Latency Tracking</h4>
              <p>Every pipeline step is timed and reported in the debug panel:</p>
              <ul>
                <li><strong>Embedding generation:</strong> Typically 200-500ms per batch</li>
                <li><strong>Similarity search:</strong> Under 10ms for small document sets</li>
                <li><strong>LLM generation:</strong> 1-5 seconds depending on model and prompt length</li>
                <li><strong>Total pipeline:</strong> Shown in the debug panel header</li>
              </ul>

              <h4 className="font-mono">Error Handling Patterns</h4>
              <table>
                <thead>
                  <tr><th>Failure</th><th>Response</th><th>User Impact</th></tr>
                </thead>
                <tbody>
                  <tr><td>Embedding API down</td><td>Fall back to keyword matching</td><td>Lower quality, but still works</td></tr>
                  <tr><td>LLM API timeout</td><td>Retry once, then show error</td><td>Clear feedback with retry option</td></tr>
                  <tr><td>Invalid file format</td><td>Reject at upload with message</td><td>Immediate, clear guidance</td></tr>
                  <tr><td>Rate limited (429)</td><td>Show toast with wait time</td><td>User knows when to retry</td></tr>
                  <tr><td>Credits exhausted (402)</td><td>Show top-up instructions</td><td>Actionable next step</td></tr>
                </tbody>
              </table>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
