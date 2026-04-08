import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
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
  const mag = Math.sqrt(embedding.reduce((s, v) => s + v * v, 0)) || 1;
  return embedding.map((v) => v / mag);
}

async function getQueryEmbedding(
  query: string,
  provider: string,
  openaiKey?: string,
  geminiKey?: string
): Promise<number[]> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

  if (provider === "lovable" || (!openaiKey && !geminiKey)) {
    if (!LOVABLE_API_KEY) return simpleEmbedding(query);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
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
          { role: "user", content: query.slice(0, 500) },
        ],
      }),
    });

    if (!response.ok) return simpleEmbedding(query);

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    try {
      const match = content.match(/\[[\s\S]*\]/);
      if (match) {
        const arr = JSON.parse(match[0]);
        if (Array.isArray(arr) && arr.length >= 64) return arr.slice(0, 64).map(Number);
      }
    } catch {}
    return simpleEmbedding(query);
  }

  if (provider === "openai" && openaiKey) {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: "text-embedding-3-small", input: [query] }),
    });
    if (!response.ok) return simpleEmbedding(query);
    const data = await response.json();
    return data.data[0].embedding;
  }

  if (provider === "gemini" && geminiKey) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "models/text-embedding-004",
          content: { parts: [{ text: query }] },
        }),
      }
    );
    if (!response.ok) return simpleEmbedding(query);
    const data = await response.json();
    return data.embedding.values;
  }

  return simpleEmbedding(query);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const totalStart = performance.now();

  try {
    const { question, chunks, settings } = await req.json();

    if (!question || !chunks || !Array.isArray(chunks)) {
      return new Response(JSON.stringify({ error: "question and chunks are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { provider = "lovable", openaiKey, geminiKey, model = "google/gemini-3-flash-preview", topK = 5, chunkSize = 500, chunkOverlap = 50 } =
      settings || {};

    // Step 1: Get query embedding
    const embStart = performance.now();
    const queryEmbedding = await getQueryEmbedding(question, provider, openaiKey, geminiKey);
    const embLatency = Math.round(performance.now() - embStart);

    // Step 2: Compute similarity and retrieve top-K
    const retrievalStart = performance.now();
    const scored = chunks.map((chunk: any) => ({
      ...chunk,
      score: cosineSimilarity(queryEmbedding, chunk.embedding || []),
    }));
    scored.sort((a: any, b: any) => b.score - a.score);
    const topChunks = scored.slice(0, topK);
    const retrievalLatency = Math.round(performance.now() - retrievalStart);

    // Step 3: Build augmented prompt
    const contextBlocks = topChunks
      .map(
        (c: any) =>
          `[Source: ${c.metadata?.source || "unknown"}, Chunk ${c.index}]\n"${c.text.slice(0, 800)}"`
      )
      .join("\n\n");

    const prompt = `You are a helpful assistant answering questions based on provided documents.

CONTEXT FROM DOCUMENTS:
${contextBlocks}

---

QUESTION: ${question}

INSTRUCTIONS:
1. Answer ONLY based on the provided context above
2. Cite sources using [Source: filename, Chunk N] format
3. If the answer cannot be found in the context, say "I cannot find this information in the provided documents"
4. Be concise, specific, and accurate`;

    // Step 4: Generate answer
    const genStart = performance.now();
    let answer = "";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (provider === "lovable" || (!openaiKey && !geminiKey)) {
      if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: model || "google/gemini-3-flash-preview",
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limited. Please wait and try again." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ error: "Credits exhausted. Add funds at Settings → Workspace → Usage." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const errText = await response.text();
        throw new Error(`AI gateway error: ${errText}`);
      }

      const data = await response.json();
      answer = data.choices?.[0]?.message?.content || "No response generated.";
    } else if (provider === "openai" && openaiKey) {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: model || "gpt-4o",
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (!response.ok) throw new Error(`OpenAI error: ${await response.text()}`);
      const data = await response.json();
      answer = data.choices?.[0]?.message?.content || "No response generated.";
    } else if (provider === "gemini" && geminiKey) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model || "gemini-2.5-flash"}:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );
      if (!response.ok) throw new Error(`Gemini error: ${await response.text()}`);
      const data = await response.json();
      answer = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
    }

    const genLatency = Math.round(performance.now() - genStart);
    const totalLatency = Math.round(performance.now() - totalStart);

    // Build debug info
    const debug = {
      chunking: {
        totalChunks: chunks.length,
        chunkSize,
        overlap: chunkOverlap,
        chunks: chunks.slice(0, 10).map((c: any) => ({
          index: c.index,
          text: c.text.slice(0, 200),
          length: c.text.length,
        })),
      },
      embeddings: {
        model: provider === "openai" ? "text-embedding-3-small" : provider === "gemini" ? "text-embedding-004" : "lovable-ai-semantic",
        dimensions: queryEmbedding.length,
        latencyMs: embLatency,
      },
      retrieval: {
        query: question,
        topK,
        results: topChunks.map((c: any) => ({
          chunkIndex: c.index,
          score: c.score,
          text: c.text.slice(0, 200),
          source: c.metadata?.source || "unknown",
        })),
        latencyMs: retrievalLatency,
      },
      generation: {
        model: model || "google/gemini-3-flash-preview",
        prompt,
        latencyMs: genLatency,
        totalLatencyMs: totalLatency,
      },
    };

    return new Response(JSON.stringify({ answer, debug }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("rag-query error:", e);
    const status = e?.status === 429 ? 429 : e?.status === 402 ? 402 : 500;
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
