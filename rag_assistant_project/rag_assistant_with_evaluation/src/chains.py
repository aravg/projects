from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnableParallel, RunnablePassthrough
#from langchain.chains import create_history_aware_retriever, create_retrieval_chain
#from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import MessagesPlaceholder
from operator import itemgetter
from src.models import llm

def format_docs(docs):
    return "\n\n---\n\n".join(
        f"[page {d.metadata.get('page', '?')}] {d.page_content}"
        for d in docs
    )

def create_rag_chain(retriever):
    rag_prompt = ChatPromptTemplate.from_messages([
        ("system",
         "You are a careful assistant. Answer the user's question strictly from the "
         "provided context. If the answer is not in the context, say you don't know. "
         "Cite the page numbers you used in square brackets like [page 3]."),
        ("human",
         "Context:\n{context}\n\nQuestion: {question}")
    ])

    rag_chain = (
        RunnableParallel(
            context=retriever | format_docs,
            question=RunnablePassthrough(),
        )
        | rag_prompt
        | llm
        | StrOutputParser()
    )
    return rag_chain

def create_rag_with_sources_chain(retriever):
    rag_with_sources = RunnableParallel(
        context=retriever,
        question=RunnablePassthrough(),
    ).assign(
        answer=(
            {
                "context": lambda x: format_docs(x["context"]),
                "question": itemgetter("question"),
            }
            | ChatPromptTemplate.from_messages([
                ("system",
                 "You are a careful assistant. Answer the user's question strictly from the "
                 "provided context. If the answer is not in the context, say you don't know. "
                 "Cite the page numbers you used in square brackets like [page 3]."),
                ("human",
                 "Context:\n{context}\n\nQuestion: {question}")
            ])
            | llm
            | StrOutputParser()
        )
    )
    return rag_with_sources

def create_conversational_rag_chain(retriever):
    condense_prompt = ChatPromptTemplate.from_messages([
        ("system",
         "Given the chat history and the latest user question, rewrite the question "
         "so it is fully self-contained. Do NOT answer it — only rewrite. "
         "If it is already standalone, return it as-is."),
        MessagesPlaceholder("chat_history"),
        ("human", "{input}"),
    ])

    history_aware_retriever = create_history_aware_retriever(
        llm=llm,
        retriever=retriever,
        prompt=condense_prompt,
    )

    qa_prompt = ChatPromptTemplate.from_messages([
        ("system",
         "Answer the user's question strictly from the context below. "
         "If the answer is not present, say you don't know. Cite page numbers.\n\n"
         "Context:\n{context}"),
        MessagesPlaceholder("chat_history"),
        ("human", "{input}"),
    ])

#    conversational_rag = create_retrieval_chain(history_aware_retriever, qa_chain)
#    return conversational_rag