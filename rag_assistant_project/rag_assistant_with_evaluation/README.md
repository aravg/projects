# RAG Assistant

A modular RAG (Retrieval-Augmented Generation) application built with LangChain and ChromaDB.

## Project Structure

- `src/`: Core modules
  - `models.py`: LLM and embedding models
  - `loaders.py`: Document loaders
  - `chunkers.py`: Text splitters
  - `vectorstore.py`: Chroma vector store setup
  - `retrievers.py`: Retriever configurations
  - `chains.py`: LCEL chains for RAG
- `web/`: Web interface
  - `app.py`: Flask application
  - `templates/index.html`: HTML interface
- `config/`: Configuration
  - `config.py`: Environment variables
- `data/`: Data storage
  - `uploads/`: Uploaded files
  - `chroma_db/`: Vector database

## Setup

1. Create and activate virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env and add your OPENAI_API_KEY
   ```

4. Run the web application:
   ```bash
   cd web
   python app.py
   ```

5. Open http://localhost:5000 in your browser.

## Usage

1. Upload a PDF, TXT, or CSV file.
2. Ask questions about the document.
3. Get AI-powered answers based on the document content.

## Features

- Modular architecture following Separation of Concerns
- Support for PDF, TXT, CSV files
- Recursive text chunking
- ChromaDB vector storage
- LangChain LCEL chains
- Simple web interface for upload and query