from langchain_chroma import Chroma

def similarity_retriever(vectorstore: Chroma, k: int = 4):
    return vectorstore.as_retriever(
        search_type="similarity",
        search_kwargs={"k": k},
    )

def mmr_retriever(vectorstore: Chroma, k: int = 4, fetch_k: int = 20, lambda_mult: float = 0.5):
    return vectorstore.as_retriever(
        search_type="mmr",
        search_kwargs={"k": k, "fetch_k": fetch_k, "lambda_mult": lambda_mult},
    )

def threshold_retriever(vectorstore: Chroma, k: int = 4, score_threshold: float = 0.3):
    return vectorstore.as_retriever(
        search_type="similarity_score_threshold",
        search_kwargs={"k": k, "score_threshold": score_threshold},
    )