# Enterprise RAG Knowledge Assistant

A local-first Retrieval-Augmented Generation (RAG) application that lets users upload PDF documents, ask questions about their contents, and receive answers grounded in retrieved passages with source references.

This portfolio project demonstrates backend engineering, LLM integration, semantic search, and full-stack application development.

## Features

- Upload, list, and delete PDF documents.
- Extract PDF text and split it into chunks for retrieval.
- Generate embeddings locally with Ollama using `nomic-embed-text`.
- Store document chunks and 768-dimensional embeddings in PostgreSQL with `pgvector`.
- Answer questions using the local `qwen2.5:3b` model.
- Display source filenames, chunk numbers, similarity scores, and retrieved passages.
- Return a fallback response when relevant document context is not found.
- Explore API endpoints through FastAPI Swagger UI.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js, React, TypeScript, Tailwind CSS |
| Backend | Python, FastAPI, Pydantic |
| Database | PostgreSQL |
| Vector search | pgvector |
| Database access | SQLAlchemy async |
| Local model runtime | Ollama |
| Chat model | `qwen2.5:3b` |
| Embedding model | `nomic-embed-text` |

## Architecture

```text
Next.js frontend
      │ HTTP
      ▼
FastAPI backend ───────────────► Ollama
      │                         ├─ qwen2.5:3b (answer generation)
      │                         └─ nomic-embed-text (embeddings)
      ▼
PostgreSQL + pgvector
(document metadata, text chunks, embeddings)
```

### Question-answering flow

1. A user uploads a PDF through the frontend.
2. The backend extracts text and splits it into chunks.
3. Ollama generates an embedding for each chunk.
4. PostgreSQL stores document metadata, chunks, and embeddings.
5. For a question, the backend generates a question embedding.
6. pgvector retrieves relevant chunks by vector similarity.
7. The local chat model generates an answer using the retrieved context.
8. The UI displays the answer and supporting source passages.

## Prerequisites

Install:

- Python and the project's backend dependencies
- Node.js and npm
- Docker Desktop with WSL 2 enabled
- Ollama

Pull the required Ollama models:

```powershell
ollama pull qwen2.5:3b
ollama pull nomic-embed-text
ollama list
```

Ensure Ollama is running before asking questions.

## Configuration

### Backend environment

Create a `.env` file in the backend project root. Do not commit it.

```dotenv
APP_NAME=Enterprise RAG Knowledge Assistant
APP_ENV=development
APP_DEBUG=true
DATABASE_URL=postgresql+asyncpg://YOUR_DB_USER:YOUR_DB_PASSWORD@localhost:5433/YOUR_DB_NAME
OLLAMA_BASE_URL=http://localhost:11434
LLM_MODEL=qwen2.5:3b
EMBEDDING_MODEL=nomic-embed-text
EMBEDDING_DIMENSIONS=768
```

Use local database credentials that match your PostgreSQL container configuration. The values above are development examples, not production credentials.

### Frontend environment

Create `frontend/.env.local`:

```dotenv
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

Never put secrets in `NEXT_PUBLIC_*` variables; they are exposed to the browser.

## Run Locally

Run the database, backend, and frontend in separate terminals.

### 1. Start PostgreSQL with pgvector

If you already have the project's container named `rag_postgres`, start it:

```powershell
docker start rag_postgres
```

The expected host port is `5433`, mapped to container port `5432`.

If you need to create the container, use the pgvector image and credentials matching your `.env` configuration. Example:

```powershell
docker run --name rag_postgres `
  -e POSTGRES_DB=YOUR_DB_NAME `
  -e POSTGRES_USER=YOUR_DB_USER `
  -e POSTGRES_PASSWORD=YOUR_DB_PASSWORD `
  -p 5433:5432 `
  -d pgvector/pgvector:pg16
```

### 2. Start the backend

From the project root, activate your virtual environment if you use one, install the project's dependencies, and run:

```powershell
python -m uvicorn app.main:app --reload
```

- API base URL: `http://127.0.0.1:8000`
- Swagger UI: `http://127.0.0.1:8000/docs`
- Health check: `http://127.0.0.1:8000/health`

### 3. Start the frontend

In a separate terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/health` | Check backend health |
| `POST` | `/api/documents/upload` | Upload a PDF |
| `GET` | `/api/documents/` | List uploaded documents |
| `DELETE` | `/api/documents/{document_id}` | Delete a document |
| `POST` | `/api/ask` | Ask a question against the knowledge base |

Example `POST /api/ask` request:

```json
{
  "question": "How does this system store document embeddings?",
  "top_k": 3
}
```

## Current Status

The current local MVP supports PDF upload, text chunking and embeddings, PostgreSQL/pgvector retrieval, local Ollama answer generation, source passages, and document deletion.

Authentication, multi-user access controls, production deployment hardening, and a comprehensive automated test suite are future improvements unless they are implemented separately.

## Security Notes

- Do not commit `.env`, `.env.local`, API keys, passwords, database dumps, or private documents.
- This setup is intended for local development.
- Before exposing the application publicly, add authentication and authorization, per-user document access controls, upload validation, production CORS settings, rate limiting, and a security review.
- Use synthetic or non-confidential PDFs in screenshots and demos.

## Roadmap

- [ ] Add automated tests for ingestion, retrieval, and answer generation.
- [ ] Evaluate retrieval using representative questions and expected source passages.
- [ ] Add authentication and per-user document permissions.
- [ ] Make chunking and retrieval settings configurable.
- [ ] Add Docker Compose for reproducible setup.
- [ ] Document production deployment and security configuration.

## Portfolio Notes

This project demonstrates an end-to-end RAG pipeline using local models instead of a paid hosted model API. When presenting it, be ready to explain local inference trade-offs, chunking strategy, retrieval `top_k`, similarity thresholds, grounding, and how you would evaluate retrieval quality and hallucinations.

## License

Choose and add a license before inviting others to reuse or contribute to this repository.
