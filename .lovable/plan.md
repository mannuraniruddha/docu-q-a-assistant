

# Plan: Remove Lovable References + E2E Pipeline Verification

## Pipeline Test Result
I tested the `process-document` edge function end-to-end — it successfully chunked text and generated embeddings using the AI gateway. The pipeline is working.

## Changes to Remove Lovable References

The default AI provider will be renamed from "lovable" to "default" throughout the app. The AI gateway URL and LOVABLE_API_KEY remain unchanged in the edge functions (they're internal infrastructure, not user-facing), but all user-visible labels and references will be neutralized.

### 1. `index.html` — Update metadata
- Change title from "Lovable App" to "RAG Document QA"
- Update meta description, og:title, remove Lovable opengraph image and Twitter references

### 2. `src/lib/rag-store.ts` — Rename provider type
- Change `"lovable"` to `"default"` in the `RAGSettings` type union and default value

### 3. `src/pages/Settings.tsx` — Update UI labels
- Rename provider from "Lovable AI (default)" to "Built-in AI (default)"
- Change `lovable` key to `default` in providers and models arrays
- Update badge and conditional checks

### 4. `src/pages/RagExplained.tsx` — Update text
- Change "Lovable AI" reference to "Built-in AI" in the fallback chain explanation

### 5. `src/pages/ReadmePage.tsx` — Update text
- Change "Lovable / OpenAI / Gemini" to "Built-in AI / OpenAI / Gemini" in architecture diagram
- Update tech stack bullet point

### 6. `supabase/functions/process-document/index.ts` — Internal rename
- Change `provider === "lovable"` checks to `provider === "default"`
- Change default provider parameter from `"lovable"` to `"default"`
- Rename `getLovableEmbedding` to `getDefaultEmbedding`
- Update model name from `"lovable-ai-semantic"` to `"built-in-semantic"`

### 7. `supabase/functions/rag-query/index.ts` — Internal rename
- Change `provider === "lovable"` checks to `provider === "default"`
- Change default provider parameter from `"lovable"` to `"default"`
- Update model name reference from `"lovable-ai-semantic"` to `"built-in-semantic"`

### 8. `src/pages/Index.tsx` — No changes needed (no Lovable references)

### Not Changed (infrastructure — invisible to users)
- `vite.config.ts` — `lovable-tagger` is a dev dependency for the Lovable platform; removing it would break the dev environment
- `.env` — auto-generated, must not be edited
- `src/integrations/supabase/client.ts` — auto-generated
- Edge function gateway URL (`ai.gateway.lovable.dev`) — this is the backend infrastructure URL, not visible to users

### Post-Implementation
- Redeploy both edge functions
- Test the full pipeline again to verify nothing broke

