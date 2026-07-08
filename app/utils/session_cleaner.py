import os
import json
from datetime import datetime,timedelta 
from pathlib import Path
import time
from app.utils.common import delete_session_data
from app.logging.logger import logger

BASE_DIR = Path(__file__).resolve().parents[2]

VECTORSTORE_DIR = os.path.join(BASE_DIR,'vectorstore')

SESSION_TTL_MINUTES = 30

def cleanup_expired_session():
    
    logger.info('Session cleaner started')
    
    if not os.path.exists(VECTORSTORE_DIR):
        return 
    
    for session_folder in Path(VECTORSTORE_DIR).iterdir():
        
        try:
            meta_file = os.path.join(session_folder,'meta.json')
            
            if not os.path.exists(meta_file):
                continue
            with open(meta_file,'r') as f:
                meta_data = json.load(f)
                
            created_at = datetime.fromisoformat(meta_data['created_at'])
            
            if datetime.utcnow() - created_at > timedelta(minutes=SESSION_TTL_MINUTES) :
                
                session_id = session_folder.name
                logger.info(f'Deleting expired session : {session_id}')
                
                delete_session_data(session_id)
                
        except Exception as e:
            logger.error(f'Cleanup error : {str(e)}')



def start_session_cleaner():
    
    while True:
        cleanup_expired_session()
        time.sleep(300)
