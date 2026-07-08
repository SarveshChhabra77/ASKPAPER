import uuid
import shutil
import os
from pathlib import Path
from datetime import datetime

BASE_DIR = Path(__file__).resolve().parents[2]

def generate_session_id():
    return str(uuid.uuid4())


def session_metadata():
    return {
        'created_at' : datetime.utcnow().isoformat()
    }

def delete_session_data(session_id:str):
    
    vectorstore_path = os.path.join(BASE_DIR,'vectorstore',session_id)
    
    upload_path = os.path.join(BASE_DIR,'uploads',session_id)
    
    if os.path.exists(vectorstore_path):
        shutil.rmtree(vectorstore_path)
        
    if os.path.exists(upload_path):
        shutil.rmtree(upload_path)
    
