from  pydantic import BaseModel

class UploadResponse(BaseModel):
    session_id:str
    message:str
    
    
    
class QuestionRequest(BaseModel):
    session_id:str
    question:str
    
    
class AnswerResponse(BaseModel):
    answer:str
    
    
'''
Without BaseModel:
Your program may crash later because types are wrong.

Python normally does no checking.

Now Python automatically checks:

✔ field exists
✔ correct datatype
✔ valid structure
'''