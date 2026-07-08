import sys
from app.exceptions.custom_exceptions import AskPaperException
from app.rag.retriever import Retriever
from app.rag.generator import Generator
from app.logging.logger import logger


class AskPaperPipeline:
    
    def __init__(self,session_path:str):
        try:
            logger.info(f"Initializing pipeline for session: {session_path}")
            
            self.retriever = Retriever(vectorstore_path=session_path)
            self.generator = Generator()
            
            logger.info("Pipeline initialized successfully")
        except Exception as e:
            raise AskPaperException(e,sys)
        
        
    def run(self,query:str):
        try:
            logger.info(f"Received query: {query}")
            
            docs = self.retriever.retrieve(query)
            context = '\n\n'.join([doc.page_content for doc in docs])
            answer = self.generator.generate(query=query,context=context)
            
            logger.info("Answer generated successfully")
            
            return answer
        
        except Exception as e:
            raise AskPaperException(e,sys)