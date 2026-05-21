from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from config.config import OPENAI_API_KEY

if OPENAI_API_KEY:
    llm = ChatOpenAI(
        model="gpt-4o-mini",
        temperature=0.1,
        openai_api_key=OPENAI_API_KEY
    )

    embeddings = OpenAIEmbeddings(
        model="text-embedding-3-small",
        openai_api_key=OPENAI_API_KEY
    )
else:
    llm = None
    embeddings = None