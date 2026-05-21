import shutil
from langchain_chroma import Chroma
from src.models import embeddings
from typing import List
from langchain_core.documents import Document

def create_vectorstore(docs: List[Document], persist_dir: str = "./data/chroma_db", collection_name: str = "rag_demo") -> Chroma:
    # Wipe any prior index
    shutil.rmtree(persist_dir, ignore_errors=True)
    vectorstore = Chroma.from_documents(
        documents=docs,
        embedding=embeddings,
        persist_directory=persist_dir,
        collection_name=collection_name,
    )
    return vectorstore