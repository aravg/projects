import os
import sys
import shutil
from fastapi import FastAPI, Request, File, UploadFile, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from src.loaders import load_pdf, load_text, load_csv
from src.chunkers import recursive_splitter
from src.vectorstore import create_vectorstore
from src.retrievers import similarity_retriever
from src.chains import create_rag_chain
from src.models import llm, embeddings

app = FastAPI(title="RAG Assistant")
templates = Jinja2Templates(directory=os.path.join(os.path.dirname(__file__), "templates"))

UPLOAD_FOLDER = './data/uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

vectorstore = None
rag_chain = None

if not llm or not embeddings:
    print("Error: OpenAI API key not configured. Please set OPENAI_API_KEY in .env file.")

class QueryRequest(BaseModel):
    question: str

class EvalRequest(BaseModel):
    questions: list[str] = []
    ground_truths: list[str] = []
    n: int = 5

@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse(request=request, name="index.html")

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    global vectorstore, rag_chain
    if not file.filename:
        raise HTTPException(status_code=400, detail="No selected file")
    
    filepath = os.path.join(UPLOAD_FOLDER, file.filename)
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # Load documents based on file type
        if file.filename.lower().endswith('.pdf'):
            docs = load_pdf(filepath)
        elif file.filename.lower().endswith('.txt'):
            docs = load_text(filepath)
        elif file.filename.lower().endswith('.csv'):
            docs = load_csv(filepath)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type (.pdf, .txt, .csv only)")

        # Chunk documents
        chunks = recursive_splitter(docs)

        # Create vectorstore
        persist_directory = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'chroma_db')
        vectorstore = create_vectorstore(chunks, persist_dir=persist_directory)

        # Create retriever and chain
        retriever = similarity_retriever(vectorstore)
        rag_chain = create_rag_chain(retriever)

        return {"message": f"Document '{file.filename}' processed successfully! You can now ask questions."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/query")
async def query(req: QueryRequest):
    global rag_chain
    if not rag_chain:
        raise HTTPException(status_code=400, detail="Please upload a document first.")

    try:
        answer = rag_chain.invoke(req.question)
        return {"answer": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/evaluate")
async def evaluate_endpoint(req: EvalRequest):
    """
    Run RAGAS evaluation (all 10 metrics) against the currently loaded document.
    No-GT metrics always run. GT metrics activate when ground_truths are provided.
    Uses gpt-4o-mini to keep token usage low.
    """
    if not vectorstore:
        raise HTTPException(status_code=400, detail="Please upload a document first.")

    try:
        from evaluate_rag import run_evaluation, DEFAULT_QUESTIONS, NO_GT_METRICS, GT_METRICS
        questions     = req.questions or DEFAULT_QUESTIONS
        ground_truths = req.ground_truths or None
        has_gt        = bool(ground_truths and len(ground_truths) == len(questions[:req.n]))

        result = run_evaluation(
            use_existing_db=True,
            questions=questions,
            n_questions=req.n,
            ground_truths=ground_truths,
        )
        df = result.to_pandas()

        active_cols = [c for c in (NO_GT_METRICS + (GT_METRICS if has_gt else [])) if c in df.columns]
        rows = df[["user_input"] + active_cols].to_dict(orient="records")

        averages = {col: round(float(df[col].mean()), 3) for col in active_cols if col in df.columns}
        return {"results": rows, "averages": averages, "has_ground_truth": has_gt}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
