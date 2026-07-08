from fastapi import APIRouter,UploadFile,File,HTTPException
import os
import shutil
from app.rag.pipeline import AskPaperPipeline
from app.rag.ingest import IngestPipeline
from app.logging.logger import logger
from app.schemas.chat_schema import UploadResponse,QuestionRequest,AnswerResponse
from app.utils.common import delete_session_data,generate_session_id


router = APIRouter()

@router.post('/upload',response_model=UploadResponse)
async def upload_pdf(file:UploadFile=File(...)):
    
    try:
        logger.info('Upload request received')
        
        ingestor = IngestPipeline()
        
        session_id = generate_session_id()
        
        upload_dir = os.path.join('uploads',session_id)
        
        os.makedirs(upload_dir,exist_ok=True)
        
        file_path = os.path.join(upload_dir,file.filename)
        
        with open(file_path,'wb') as buffer:
            shutil.copyfileobj(file.file,buffer)
            
        logger.info(f'Files saved at {file_path}')
        
        ingestor.ingest(file_path,session_id)
        
        return UploadResponse(
            session_id=session_id,
            message='PDF processed successfully'
        )
        
    except Exception as e:
        logger.error('Upload failed')
        raise e
    
    
@router.post('/ask',response_model=AnswerResponse)
async def ask_question(request:QuestionRequest):
    try:
        logger.info(f'Question received for session {request.session_id}')
        
        vectorestore_path = f'vectorstore/{request.session_id}'
        
        pipeline = AskPaperPipeline(vectorestore_path)
        
        answer = pipeline.run(request.question)
        
        logger.info('Answer generated successfully')
        
        return AnswerResponse(answer=answer)
    
    except Exception as e:
        logger.info('Question answering failed')
        raise e
    
    
@router.delete('/session/{session_id}')
async def delete_session(session_id:str):
    
    try:
        
        logger.info(f'Deleting session {session_id}')
        
        delete_session_data(session_id=session_id)
        
        logger.info('Session deleted successfully')
        
        return {
            'message' : f'Session {session_id} deleted successfully'
        }
        
    except Exception as e:
        logger.error('Session deletion failed')
        raise HTTPException(status_code=500,detail=str(e))