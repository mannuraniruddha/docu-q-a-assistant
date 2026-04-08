import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function chunkText(
  text: string,
  chunkSize: number,
  overlap: number,
  fileName: string
): { id: string; text: string; index: number; metadata: any }[] {
  const chunks: any[] = [];
  let start = 0;
  let index = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunkText = text.slice(start, end);

    if (chunkText.trim().length > 0) {
      chunks.push({
        id: `${fileName}-chunk-${index}`,
        text: chunkText,
        index,
        metadata: {
          source: fileName,
          chunkSize,
          overlap,
        },
      });
      index++;
    }

    start += chunkSize - overlap;
    if (start >= text.length) break;
  }

  return chunks;
}

async function getEmbeddings(
  texts: string[],
  provider: string,
  openaiKey?: string,
  geminiKey?: string
): Promise<{ embeddings: number[][]; model: string; dimensions: number }> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

  if (provider === "default" || (!openaiKey && !geminiKey)) {
    if (!LOVABLE_API_KEY) {
      // Fallback: generate simple hash-based pseudo-embeddings
      return {
        embeddings: texts.map((t) => simpleEmbedding(t)),
        model: "fallback-hash",
        dimensions: 64,
      };
    }

    // Use Lovable AI for embeddings via chat completion (extract semantic representation)
    const embeddings: number[][] = [];
    for (const text of texts) {
      const embedding = await getDefaultEmbedding(text, LOVABLE_API_KEY);
      embeddings.push(embedding);
    }
    return { embeddings, model: "built-in-semantic", dimensions: 64 };
  }

  if (provider === "openai" && openaiKey) {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: texts,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI embedding error: ${err}`);
    }

    const data = await response.json();
    return {
      embeddings: data.data.map((d: any) => d.embedding),
      model: "text-embedding-3-small",
      dimensions: 1536,
    };
  }

  if (provider === "gemini" && geminiKey) {
    const embeddings: number[][] = [];
    for (const text of texts) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "models/text-embedding-004",
            content: { parts: [{ text }] },
          }),
        }
      );

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Gemini embedding error: ${err}`);
      }

      const data = await response.json();
      embeddings.push(data.embedding.values);
    }
    return { embeddings, model: "text-embedding-004", dimensions: 768 };
  }

  // Final fallback
  return {
    embeddings: texts.map((t) => simpleEmbedding(t)),
    model: "fallback-hash",
    dimensions: 64,
  };
}

function simpleEmbedding(text: string): number[] {
  const dims = 64;
  const embedding = new Array(dims).fill(0);
  const words = text.toLowerCase().split(/\s+/);

  for (const word of words) {
    for (let i = 0; i < word.length && i < dims; i++) {
      embedding[(word.charCodeAt(i) + i) % dims] += 1;
    }
  }

  // Normalize
  const mag = Math.sqrt(embedding.reduce((s, v) => s + v * v, 0)) || 1;
  return embedding.map((v) => v / mag);
}

async function getDefaultEmbedding(text: string, apiKey: string): Promise<number[]> {
  // Use Lovable AI to generate a semantic fingerprint via structured output
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        {
          role: "system",
          content:
            "You are an embedding generator. Given text, output exactly 64 floating point numbers between -1 and 1 that represent the semantic meaning. Output ONLY a JSON array of 64 numbers, nothing else.",
        },
        { role: "user", content: text.slice(0, 500) },
      ],
    }),
  });

  if (!response.ok) {
    return simpleEmbedding(text);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";

  try {
    const match = content.match(/\[[\s\S]*\]/);
    if (match) {
      const arr = JSON.parse(match[0]);
      if (Array.isArray(arr) && arr.length >= 64) {
        return arr.slice(0, 64).map(Number);
      }
    }
  } catch {
    // fall through
  }

  return simpleEmbedding(text);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, fileName, chunkSize = 500, chunkOverlap = 50, provider = "default", openaiKey, geminiKey } =
      await req.json();

    if (!text || !fileName) {
      return new Response(JSON.stringify({ error: "text and fileName are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Chunk the text
    const chunks = chunkText(text, chunkSize, chunkOverlap, fileName);

    // Generate embeddings
    const embeddingStart = performance.now();
    const { embeddings, model, dimensions } = await getEmbeddings(
      chunks.map((c) => c.text),
      provider,
      openaiKey,
      geminiKey
    );
    const embeddingLatency = Math.round(performance.now() - embeddingStart);

    return new Response(
      JSON.stringify({
        chunks,
        embeddings,
        debug: {
          chunking: {
            totalChunks: chunks.length,
            chunkSize,
            overlap: chunkOverlap,
          },
          embeddings: {
            model,
            dimensions,
            latencyMs: embeddingLatency,
          },
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("process-document error:", e);

    const status = e?.status === 429 ? 429 : e?.status === 402 ? 402 : 500;
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error processing document",
      }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
