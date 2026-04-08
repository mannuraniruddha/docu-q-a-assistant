
# RAG Document QA App

## Overview
A web app that lets users upload documents (PDF, TXT, MD), ask questions using RAG (Retrieval-Augmented Generation), and inspect every pipeline step. Uses Lovable AI by default with the option to plug in your own OpenAI/Gemini keys.

## Pages

### 1. Home / Upload & Chat Page (`/`)
- **Document upload area** — drag-and-drop or file picker for PDF, TXT, MD files
- **Document list** — shows uploaded docs with name, type, chunk count, status
- **Chat interface** — ask questions, get answers with source citations
- **Collapsible debug panel** on each answer showing:
  - **Chunking** — extracted text chunks with sizes, overlap info
  - **Embeddings** — similarity scores for top-k retrieved chunks
  - **Retrieval** — which chunks were selected and why
  - **Generation** — the full prompt sent to the LLM, latency stats
- Pre-loaded demo document (a sample PDF about RAG concepts) so users can try immediately

### 2. Settings Page (`/settings`)
- Toggle between Lovable AI (default) and user-provided keys
- Input fields for OpenAI API key and Gemini API key
- Model selection dropdown
- Chunking parameters: chunk size, overlap size
- Top-k retrieval count

### 3. README Page (`/readme`)
- Project overview and architecture diagram
- File-by-file breakdown explaining each component and method
- Why each piece matters for Technical Program Manager work
- Qualities showcased: systems thinking, pipeline design, trade-off awareness, documentation

### 4. RAG Deep Dive Page (`/rag-explained`)
- **RAG Pipeline** — retrieval → augmentation → generation explained
- **Chunking Strategies** — fixed-size, sentence-based, trade-offs
- **Embedding Model Selection** — model choices, fallback strategies
- **Prompt Engineering** — citation formatting, context window management
- **Production Thinking** — graceful degradation, latency tracking, error handling

## Backend (Edge Functions)

### `process-document` function
- Receives uploaded file content
- Extracts text (PDF parsing, plain text reading)
- Chunks text with configurable size/overlap
- Generates embeddings via Lovable AI or user-provided key
- Returns chunks and embeddings to the client

### `rag-query` function
- Receives question + document embeddings
- Computes similarity search against stored chunks
- Builds augmented prompt with retrieved context
- Calls LLM (Lovable AI or user key) for generation
- Returns answer + full debug info (scores, prompt, latency)

## Key Technical Details
- **Client-side storage** — embeddings and chunks stored in browser (IndexedDB/state) for simplicity
- **Chunking** — configurable fixed-size with overlap, displayed in debug panel
- **Similarity search** — cosine similarity computed in the edge function
- **Error handling** — graceful fallback if AI provider fails, clear error messages
- **Latency tracking** — each pipeline step timed and shown in debug panel
- **Demo document** — bundled sample document ready to use on first load
