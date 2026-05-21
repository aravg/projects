from langchain_community.document_loaders import PyPDFLoader, WebBaseLoader, TextLoader, CSVLoader, DirectoryLoader
from typing import List
from langchain_core.documents import Document

def load_pdf(file_path: str) -> List[Document]:
    loader = PyPDFLoader(file_path)
    return loader.load()

def load_web(urls: List[str]) -> List[Document]:
    loader = WebBaseLoader(urls)
    return loader.load()

def load_text(file_path: str) -> List[Document]:
    loader = TextLoader(file_path)
    return loader.load()

def load_csv(file_path: str) -> List[Document]:
    loader = CSVLoader(file_path)
    return loader.load()

def load_directory(dir_path: str, glob_pattern: str = "**/*.txt") -> List[Document]:
    loader = DirectoryLoader(dir_path, glob=glob_pattern, loader_cls=TextLoader)
    return loader.load()