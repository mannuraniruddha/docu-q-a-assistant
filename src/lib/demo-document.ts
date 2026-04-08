export const DEMO_DOCUMENT_NAME = "RAG_Fundamentals_Guide.md";
export const DEMO_DOCUMENT_TYPE = "text/markdown";

export const DEMO_DOCUMENT_CONTENT = `# Retrieval-Augmented Generation (RAG) Fundamentals

## What is RAG?

Retrieval-Augmented Generation (RAG) is an AI architecture pattern that enhances Large Language Model (LLM) outputs by grounding them in external, domain-specific knowledge. Instead of relying solely on the model's training data, RAG retrieves relevant documents at query time and injects them into the generation prompt.

## Why RAG Matters

Traditional LLMs have several limitations:
- **Knowledge cutoff**: Models only know what they were trained on
- **Hallucination**: Models may generate plausible but incorrect information
- **No domain specificity**: General models lack specialized knowledge
- **No source attribution**: Answers lack verifiable references

RAG addresses all of these by grounding generation in real, retrievable documents.

## The RAG Pipeline

### Step 1: Document Ingestion
Documents are loaded and preprocessed. This involves:
- Text extraction from various formats (PDF, DOCX, HTML, Markdown)
- Cleaning and normalization (removing headers, footers, artifacts)
- Metadata tagging (source, date, author)

### Step 2: Chunking
Documents are split into smaller, semantically meaningful pieces. Common strategies include:
- **Fixed-size chunking**: Split every N characters with overlap. Simple and predictable.
- **Sentence-based chunking**: Split on sentence boundaries. Better semantic coherence.
- **Recursive character splitting**: Tries paragraph → sentence → character boundaries.
- **Semantic chunking**: Uses embeddings to detect topic shifts. Most accurate but slowest.

Trade-offs:
- Smaller chunks = more precise retrieval but may lose context
- Larger chunks = better context but may dilute relevance
- Overlap prevents losing information at chunk boundaries

### Step 3: Embedding Generation
Each chunk is converted to a dense vector representation using an embedding model:
- **OpenAI text-embedding-3-small**: 1536 dimensions, good general purpose
- **Google text-embedding-004**: 768 dimensions, efficient and accurate
- **Cohere embed-v3**: Optimized for search and retrieval tasks

The embedding captures the semantic meaning of the text, enabling similarity search.

### Step 4: Retrieval
When a user asks a question:
1. The query is embedded using the same model
2. Cosine similarity is computed between the query embedding and all chunk embeddings
3. The top-K most similar chunks are retrieved
4. Scores are used to filter low-relevance results

### Step 5: Augmented Prompt Construction
Retrieved chunks are formatted into a context block and injected into the LLM prompt:

\`\`\`
Given the following context from the documents:

[Source: document.pdf, Chunk 3]
"Relevant text from chunk 3..."

[Source: document.pdf, Chunk 7]
"Relevant text from chunk 7..."

Based on the above context, answer the following question:
{user_question}

If the answer cannot be found in the context, say so explicitly.
Cite the source for each claim using [Source: filename, Chunk N] format.
\`\`\`

### Step 6: Generation
The LLM generates an answer grounded in the retrieved context, with source citations.

## Production Considerations

### Error Handling
- Graceful degradation when embedding service is unavailable
- Fallback to keyword search when vector search fails
- Clear error messages for unsupported file formats

### Latency Optimization
- Pre-compute embeddings at upload time, not query time
- Cache frequently accessed embeddings
- Use approximate nearest neighbor (ANN) for large document sets

### Quality Assurance
- Monitor retrieval relevance scores
- Track answer quality through user feedback
- A/B test different chunking strategies

## Evaluation Metrics

- **Retrieval Precision**: Are the retrieved chunks relevant?
- **Retrieval Recall**: Are all relevant chunks retrieved?
- **Answer Faithfulness**: Is the answer grounded in the context?
- **Answer Relevance**: Does the answer address the question?

## Common Pitfalls

1. **Chunks too small**: Lose context, get fragmented answers
2. **Chunks too large**: Dilute relevance, exceed context windows
3. **No overlap**: Miss information at chunk boundaries
4. **Wrong embedding model**: Mismatch between query and document embeddings
5. **Ignoring metadata**: Miss opportunities for filtering by source, date, etc.
`;
