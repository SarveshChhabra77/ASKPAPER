from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from app.exceptions.custom_exceptions import AskPaperException
from app.utils.common import generate_session_id,session_metadata
from app.logging.logger import logger
import os
import json
import sys

class IngestPipeline:
    def __init__(self):
        
        try:
            
           self.embeddings = HuggingFaceEmbeddings(
               model_name = "sentence-transformers/all-MiniLM-L6-v2"
           )
           self.text_splitter = RecursiveCharacterTextSplitter(
               chunk_size = 1000,
               chunk_overlap=200
           )
           
        except Exception as e:
            raise AskPaperException(e,sys)
        
    def load_and_split(self,pdf_path:str):
        
        try:
            
            logger.info(f"Loading PDF from {pdf_path}")
            loader = PyPDFLoader(file_path=pdf_path)
            docs = loader.load()
            logger.info(f"Loaded {len(docs)} pages")
            chunks = self.text_splitter.split_documents(docs)
            
            return chunks
            
        except Exception as e:
            raise AskPaperException(e,sys)
        
        
    def create_vectorstore(self,chunks,save_path:str):
        
        try:
            
            logger.info("Creating FAISS vectorstore")
            vectorstore = FAISS.from_documents(
                chunks,
                self.embeddings
            )
            os.makedirs(save_path,exist_ok=True)
            vectorstore.save_local(save_path)
            
            logger.info(f"Saving vectorstore at {save_path}")
            
            return save_path
        
        except Exception as e:
            raise AskPaperException(e,sys)
        
    def ingest(self,pdf_path:str,session_id:str):
        
        try:
            
            logger.info("Ingestion pipeline started")
            
            vectorstore_path = os.path.join('vectorstore',session_id)
            
            chunks = self.load_and_split(pdf_path)
            
            self.create_vectorstore(
                chunks,
                vectorstore_path
            )
            
            meta_path = os.path.join(vectorstore_path,'meta.json')
            
            with open(meta_path,'w') as f:
                json.dump(session_metadata(),f)
            
            
            
            logger.info("Ingestion pipeline completed successfully")
            
            return session_id,vectorstore_path
        
        except Exception as e:
            raise AskPaperException(e,sys)
