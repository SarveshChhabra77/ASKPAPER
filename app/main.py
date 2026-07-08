from fastapi import FastAPI,Request
from app.api.chat_routes import router as chat_router
from app.logging.logger import logger
from app.utils.session_cleaner import start_session_cleaner
import threading
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from pathlib import Path


BASE_DIR = Path(__file__).parent

app = FastAPI(
    title = 'Askpaper API',
    version='1.0.0',
    description='Session-based RAG system for asking questions from PDFs'
)

# Use absolute paths so static files & templates resolve correctly on Render
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

# Mount static BEFORE including the router (order matters in FastAPI)
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")

app.include_router(chat_router)

@app.get('/',response_class=HTMLResponse)
async def home(request:Request):
    return templates.TemplateResponse(
        'index.html',
        {'request':request}
    )



@app.on_event('startup')
def start_background_tasks():
    logger.info('Startup event triggered')
    cleaner_thread = threading.Thread(
        target=start_session_cleaner,
        daemon=True
    )
    cleaner_thread.start()
    
