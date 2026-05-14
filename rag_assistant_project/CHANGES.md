# RAG Assistant — Enhancement Summary

## Overview

Four files were modified to improve how the chatbot answers semantic (conceptual, inferential, and multi-part) questions. The changes fall into three categories: **better prompts**, **better chunking**, and **broader retrieval**.

---

## 1. `src/chains.py` — Smarter Prompts

### Problem
The original system prompt told the LLM to answer *"strictly from context"* and *"say you don't know"* if anything was missing. This worked for simple fact-extraction but actively suppressed reasoning, synthesis, and interpretation — exactly what semantic questions require.

### What Changed

**New shared `_SYSTEM_PROMPT`** (used by all three chains):

| Before | After |
|---|---|
| "Answer strictly from context" | "Answer as completely and accurately as possible" |
| "If not in context, say you don't know" | "Only say you lack info if the topic is entirely absent" |
| No synthesis guidance | Explicitly instructs synthesis across all context sections |
| No reasoning guidance | Instructs careful reasoning for conceptual/interpretive questions |
| Cite page numbers | Cite source after *each key point* |

**New shared `_CONDENSE_SYSTEM`** (used for follow-up question rewriting):

| Before | After |
|---|---|
| "Return as-is if standalone" | Always include necessary context from history |
| Generic rewrite instruction | Explicitly says to preserve the original intent |

**`create_conversational_rag_chain` qa_prompt** now uses the same `_SYSTEM_PROMPT` as the non-conversational chains — previously it had its own weaker inline prompt, causing inconsistent answers between streaming and non-streaming modes.

**`format_docs`** — added a newline after the `[page N]` label so the LLM can clearly associate citations with content.

Both `_SYSTEM_PROMPT`, `_CONDENSE_SYSTEM`, and `format_docs` are exported so the stream endpoint can import and reuse them (no more duplication).

---

## 2. `src/chunkers.py` — Larger, More Complete Chunks

### Problem
The default chunk size was **500 characters** — small enough to cut a paragraph in half. If the sentence that answers a semantic question was in one chunk, but its explanation or supporting evidence was in the next, the LLM would only see part of the story and give an incomplete answer.

### What Changed

| Splitter | chunk_size Before | chunk_size After | overlap Before | overlap After |
|---|---|---|---|---|
| `recursive_splitter` | 500 chars | **1000 chars** | 50 chars | **150 chars** |
| `character_splitter` | 500 chars | **1000 chars** | 50 chars | **150 chars** |
| `token_splitter` | 200 tokens | **300 tokens** | 20 tokens | **40 tokens** |

The larger overlap (150 chars) ensures that answers spanning a chunk boundary are not missed — the tail of one chunk overlaps with the head of the next.

> **Note:** If you have already uploaded documents with the old chunk size, clear the vector store and re-upload them so the new chunk sizes take effect.

---

## 3. `src/retrievers.py` — More Retrieved Context

### Problem
All retrievers were set to return only **k = 4** chunks. Semantic questions — especially those asking for comparisons, summaries, or explanations of concepts — often require evidence spread across more than four sections of a document.

### What Changed

| Retriever | k Before | k After | Other |
|---|---|---|---|
| `similarity_retriever` | 4 | **6** | — |
| `mmr_retriever` | 4 | **6** | `fetch_k` 20 → 30; `lambda_mult` 0.5 → 0.6 |
| `threshold_retriever` | 4 | **6** | — |

For MMR specifically:
- `fetch_k` increased from 20 to 30 — fetches a wider candidate pool before diversity filtering.
- `lambda_mult` increased from 0.5 to 0.6 — slightly favours relevance over diversity, which is better for factual semantic questions while still reducing redundant chunks.

---

## 4. `web/app.py` — Stream Endpoint Consistency

### Problem
The `/stream` endpoint had its own **hardcoded inline prompt** — a copy of the old weak prompt — completely separate from `chains.py`. This meant streaming responses and non-streaming responses used different (inconsistent) instructions.

### What Changed
- Removed the inline duplicate prompt and condense prompt from the stream endpoint.
- Imported `_SYSTEM_PROMPT`, `_CONDENSE_SYSTEM`, and `format_docs` from `src/chains.py`.
- The stream endpoint now uses the same improved prompts as the `/query` endpoint, giving consistent answers regardless of which mode is used.

---

## Summary Table

| File | Change | Impact |
|---|---|---|
| `src/chains.py` | New synthesis-focused system prompt | LLM reasons and synthesises instead of just extracting |
| `src/chains.py` | Stronger condense prompt | Follow-up questions retain full intent |
| `src/chains.py` | Conversational chain uses shared prompt | Consistent answers across all chain types |
| `src/chunkers.py` | chunk_size 500 → 1000, overlap 50 → 150 | Semantic units stay intact; boundary answers not missed |
| `src/retrievers.py` | k 4 → 6, wider MMR pool | More evidence retrieved for complex questions |
| `web/app.py` | Stream endpoint uses shared prompts | Streaming and non-streaming give the same quality answers |
