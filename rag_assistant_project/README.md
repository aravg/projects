# RAG Assistant

A modular Retrieval-Augmented Generation (RAG) application built with LangChain v0.3, ChromaDB, and FastAPI. Adapted from the original Google Colab notebook for local use.

## Stack

| Layer | Technology |
|---|---|
| LLM | `gpt-4o-mini` via `langchain-openai` |
| Embeddings | `text-embedding-3-small` |
| Vector Store | ChromaDB (persisted to disk) |
| Framework | FastAPI + Jinja2 |
| Chains | LangChain LCEL |

## Project Structure

```
rag_assistant_project/
├── src/
│   ├── models.py        # LLM + embedding model initialization
│   ├── loaders.py       # PDF, TXT, CSV, Web, Directory loaders
│   ├── chunkers.py      # Character, Recursive, Token splitters
│   ├── vectorstore.py   # ChromaDB create / load / add / count
│   ├── retrievers.py    # Similarity, MMR, Threshold retrievers
│   └── chains.py        # LCEL RAG chains (basic, with-sources, conversational)
├── web/
│   ├── app.py           # FastAPI app (upload, query, stream, clear, status)
│   └── templates/
│       └── index.html   # Chat UI with streaming, sources, URL loading
├── config/
│   └── config.py        # Loads .env variables
├── data/
│   ├── uploads/         # Uploaded files (auto-created)
│   └── chroma_db/       # Persisted vector index (auto-created)
├── .env                 # API keys (never commit this)
├── requirements.txt
└── test_upload.py       # Quick smoke test
```

## Setup

1. **Create and activate a virtual environment** (recommended):
   ```bash
   python -m venv venv
   # Windows
   venv\Scripts\activate
   # macOS / Linux
   source venv/bin/activate
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure your OpenAI API key** in `.env`:
   ```
   OPENAI_API_KEY=sk-...
   LANGCHAIN_TRACING_V2=false
   ```

4. **Run the application**:
   ```bash
   cd web
   python app.py
   ```
   Or with uvicorn directly:
   ```bash
   uvicorn web.app:app --host 0.0.0.0 --port 8000 --reload
   ```

5. Open **http://localhost:8000** in your browser.

## Features

- **File upload** — PDF, TXT, CSV (accumulates; each upload adds to the vector store)
- **URL loading** — ingest any public web page
- **Streaming responses** — token-by-token via Server-Sent Events
- **Chat history** — follow-up questions are automatically rephrased using conversation context
- **Source citations** — every answer shows which chunks were retrieved (expandable)
- **Retriever selector** — Similarity / MMR (diverse) / Threshold
- **Clear controls** — reset history only, or wipe all documents too

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/` | Web UI |
| GET | `/status` | Vector store stats |
| POST | `/upload` | Upload a file |
| POST | `/load_url` | Ingest a web URL |
| POST | `/query` | Non-streaming Q&A (returns answer + sources) |
| POST | `/stream` | Streaming Q&A via SSE |
| POST | `/clear` | Clear history and/or documents |

## Chunking Strategies (from `src/chunkers.py`)

| Function | Splitter | Best for |
|---|---|---|
| `recursive_splitter` | RecursiveCharacterTextSplitter | General-purpose default |
| `character_splitter` | CharacterTextSplitter | Documents with consistent `\n\n` separators |
| `token_splitter` | TokenTextSplitter | When exact token budget matters |
