"""
RAGAS evaluation for the RAG assistant — ragas 0.4.x API.

Metrics (no ground truth needed):
  1. Faithfulness                      — answer grounded in retrieved context
  2. AnswerRelevancy                   — answer addresses the question
  3. ContextPrecisionWithoutReference  — retrieved chunks are signal, not noise
  4. ResponseGroundedness              — every claim in response supported by context

Metrics (ground truth required, enabled via --ground-truths):
  5. ContextPrecisionWithReference     — context quality vs known answer
  6. ContextRecall                     — how much of GT is covered by context
  7. FactualCorrectness                — factual accuracy vs GT (F1)
  8. AnswerCorrectness                 — weighted correctness vs GT
  9. SemanticSimilarity                — embedding similarity to GT
 10. ContextEntityRecall              — entity overlap between context and GT

Token-efficient: uses gpt-4o-mini, k=4 retrieval, default 5 questions.

Usage:
  python evaluate_rag.py data/uploads/doc.pdf
  python evaluate_rag.py data/uploads/doc.pdf --n 3
  python evaluate_rag.py --use-existing-db
  python evaluate_rag.py data/uploads/doc.pdf --questions "What is X?" "How does Y?" --ground-truths "X is ..." "Y works by ..."
"""
import os, sys, argparse, warnings
warnings.filterwarnings("ignore", category=DeprecationWarning)

sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from openai import OpenAI
from ragas.llms import llm_factory
from ragas.embeddings import OpenAIEmbeddings as RagasOAIEmbeddings
from ragas import evaluate, EvaluationDataset, SingleTurnSample
from ragas.metrics.collections import (
    Faithfulness,
    AnswerRelevancy,
    ContextPrecisionWithoutReference,
    ResponseGroundedness,
    ContextPrecisionWithReference,
    ContextRecall,
    FactualCorrectness,
    AnswerCorrectness,
    SemanticSimilarity,
    ContextEntityRecall,
)

from src.models import llm as app_llm, embeddings as app_embeddings
from src.vectorstore import create_vectorstore
from src.retrievers import similarity_retriever
from src.chains import create_rag_chain
from src.loaders import load_pdf, load_text, load_csv
from src.chunkers import recursive_splitter

DEFAULT_QUESTIONS = [
    "What is the main topic of this document?",
    "What are the key concepts discussed?",
    "What are the most important findings or conclusions?",
    "Can you give an example mentioned in the document?",
    "What problem does this document address?",
]

NO_GT_METRICS = [
    "faithfulness",
    "answer_relevancy",
    "context_precision_without_reference",
    "response_groundedness",
]
GT_METRICS = [
    "context_precision_with_reference",
    "context_recall",
    "factual_correctness",
    "answer_correctness",
    "semantic_similarity",
    "context_entity_recall",
]
ALL_METRICS = NO_GT_METRICS + GT_METRICS

METRIC_DESCRIPTIONS = {
    "faithfulness":                       "answer is grounded in retrieved context",
    "answer_relevancy":                   "answer directly addresses the question",
    "context_precision_without_reference":"retrieved chunks are signal, not noise",
    "response_groundedness":              "every claim in response is supported by context",
    "context_precision_with_reference":   "context quality vs known ground truth",
    "context_recall":                     "ground truth info is covered by context",
    "factual_correctness":               "factual accuracy vs ground truth (F1)",
    "answer_correctness":                "weighted correctness vs ground truth",
    "semantic_similarity":               "embedding similarity to ground truth",
    "context_entity_recall":             "entity overlap between context and ground truth",
}


def _make_ragas_clients(api_key: str):
    client = OpenAI(api_key=api_key)
    llm = llm_factory("gpt-4o-mini", client=client)
    emb = RagasOAIEmbeddings(client=client, model="text-embedding-3-small")
    return llm, emb


def _load_document(path: str):
    if path.lower().endswith(".pdf"):
        return load_pdf(path)
    if path.lower().endswith(".csv"):
        return load_csv(path)
    return load_text(path)


def _build_pipeline(doc_path=None, use_existing_db=False):
    if use_existing_db:
        from langchain_chroma import Chroma
        print("Reusing existing ChromaDB...")
        vs = Chroma(
            persist_directory=os.path.join(os.path.dirname(__file__), "data", "chroma_db"),
            embedding_function=app_embeddings,
            collection_name="rag_demo",
        )
    else:
        print(f"Loading document: {doc_path}")
        docs = _load_document(doc_path)
        chunks = recursive_splitter(docs)
        print(f"  {len(docs)} page(s) -> {len(chunks)} chunks")
        vs = create_vectorstore(
            chunks,
            persist_dir=os.path.join(os.path.dirname(__file__), "data", "eval_chroma_db"),
        )
    # k=4 (vs production k=6) keeps context shorter and saves tokens
    retriever = similarity_retriever(vs, k=4)
    chain = create_rag_chain(retriever)
    return retriever, chain


def run_evaluation(
    doc_path=None,
    questions=None,
    n_questions=5,
    use_existing_db=False,
    ground_truths=None,
):
    if not app_llm or not app_embeddings:
        sys.exit("OPENAI_API_KEY not set. Add it to .env and retry.")

    api_key = os.environ.get("OPENAI_API_KEY", "")
    questions = (questions or DEFAULT_QUESTIONS)[:n_questions]
    has_gt = bool(ground_truths and len(ground_truths) == len(questions))

    retriever, chain = _build_pipeline(doc_path, use_existing_db)

    print(f"\nRunning {len(questions)} question(s) through the RAG pipeline...")
    samples = []
    for i, q in enumerate(questions, 1):
        print(f"  [{i}/{len(questions)}] {q[:70]}...")
        contexts = [d.page_content for d in retriever.invoke(q)]
        answer = chain.invoke(q)
        kwargs = dict(user_input=q, retrieved_contexts=contexts, response=answer)
        if has_gt:
            kwargs["reference"] = ground_truths[i - 1]
        samples.append(SingleTurnSample(**kwargs))

    eval_llm, eval_emb = _make_ragas_clients(api_key)

    metrics = [
        Faithfulness(llm=eval_llm),
        AnswerRelevancy(llm=eval_llm, embeddings=eval_emb),
        ContextPrecisionWithoutReference(llm=eval_llm),
        ResponseGroundedness(llm=eval_llm),
    ]
    if has_gt:
        metrics += [
            ContextPrecisionWithReference(llm=eval_llm),
            ContextRecall(llm=eval_llm),
            FactualCorrectness(llm=eval_llm),
            AnswerCorrectness(llm=eval_llm, embeddings=eval_emb),
            SemanticSimilarity(embeddings=eval_emb),
            ContextEntityRecall(llm=eval_llm),
        ]

    print(f"\nRunning RAGAS evaluation ({len(metrics)} metrics, gpt-4o-mini)...")
    result = evaluate(dataset=EvaluationDataset(samples=samples), metrics=metrics)
    _print_results(result, has_gt)
    return result


def _print_results(result, has_gt: bool):
    df = result.to_pandas()
    active_no_gt = [c for c in NO_GT_METRICS if c in df.columns]
    active_gt = [c for c in GT_METRICS if c in df.columns] if has_gt else []
    all_active = active_no_gt + active_gt

    df["q"] = df["user_input"].str[:45]
    sep = "=" * 80

    print(f"\n{sep}")
    print("RAGAS EVALUATION RESULTS")
    print(sep)
    print(df[["q"] + all_active].to_string(index=False))
    print("-" * 80)
    print("Averages:")
    for col in all_active:
        print(f"  {col:<40} {df[col].mean():.3f}")
    print(sep)
    print("\nScore guide: 0.0 = poor  |  0.5 = acceptable  |  1.0 = perfect")
    for col in all_active:
        print(f"  {col:<40} - {METRIC_DESCRIPTIONS.get(col, '')}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Evaluate RAG pipeline with all 10 RAGAS metrics. "
                    "Uses gpt-4o-mini to keep token costs low."
    )
    parser.add_argument("doc_path", nargs="?",
                        help="Document to evaluate (PDF/TXT/CSV). Omit with --use-existing-db.")
    parser.add_argument("--use-existing-db", action="store_true",
                        help="Reuse the production ChromaDB.")
    parser.add_argument("--n", type=int, default=5, metavar="N",
                        help="Number of questions (default: 5).")
    parser.add_argument("--questions", nargs="+", metavar="Q",
                        help="Custom evaluation questions.")
    parser.add_argument("--ground-truths", nargs="+", metavar="GT",
                        help="Ground-truth answers — enables 6 extra GT metrics.")
    args = parser.parse_args()

    if not args.doc_path and not args.use_existing_db:
        parser.error("Provide doc_path or --use-existing-db.")

    run_evaluation(
        doc_path=args.doc_path,
        questions=args.questions,
        n_questions=args.n,
        use_existing_db=args.use_existing_db,
        ground_truths=args.ground_truths,
    )
