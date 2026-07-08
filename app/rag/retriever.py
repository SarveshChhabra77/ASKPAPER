from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from app.exceptions.custom_exceptions import AskPaperException
import sys
from typing import List


class Retriever:
    
    def __init__(self,vectorstore_path:str):
        
        try:
            self.embeddings = HuggingFaceEmbeddings(
                model_name="sentence-transformers/all-MiniLM-L6-v2"
            )
            self.vectorstore = FAISS.load_local(
                vectorstore_path,
                embeddings=self.embeddings,
                allow_dangerous_deserialization=True
            )
        except Exception as e:
            raise AskPaperException(e,sys)
        
        
    def retrieve(self,query:str,k=3)->List:
        
        try:
            results = self.vectorstore.similarity_search(query,k=k)
            return results
        except Exception as e:
            raise AskPaperException(e,sys)
        
        
'''LangChain Protects You

By default LangChain says:

❌ “I will NOT load this file because it might be dangerous.”

✅ What This Line Means
allow_dangerous_deserialization=True

You are telling LangChain:

✅ “Don’t worry — I created this file myself. It is safe.
'''