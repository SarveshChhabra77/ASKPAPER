---
title: AskPaper
emoji: 📄
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---

# 📄 AskPaper — Session-Based RAG System

AskPaper is an **end-to-end Retrieval-Augmented Generation (RAG) application** that allows users to upload PDFs and ask contextual questions powered by Large Language Models.

The system creates **isolated knowledge sessions**, performs semantic retrieval using FAISS, generates answers using Groq-hosted Llama models, and automatically manages data lifecycle through background cleanup.

---

## 🚀 Demo Workflow

1. Upload a PDF document
2. System creates a unique session
3. Document is embedded and stored in FAISS
4. Ask questions about the PDF
5. Receive context-aware AI answers
6. Session auto-deletes after expiration

---

## 🧠 Key Features

* ✅ PDF Question Answering using RAG
* ✅ Session-based vector databases
* ✅ Semantic search with HuggingFace embeddings
* ✅ Groq Llama-3.1 LLM integration
* ✅ FastAPI backend architecture
* ✅ Background worker for automatic cleanup
* ✅ Manual session deletion endpoint
* ✅ Structured logging & custom exception handling
* ✅ Lightweight web UI served via FastAPI

---

## 🏗️ Architecture

```
User Browser
     │
     ▼
FastAPI Web UI + API Layer
     │
     ├── Upload → Ingestion Pipeline
     │        PDF → Chunking → Embeddings → FAISS
     │
     ├── Ask → Retrieval Pipeline
     │        Similarity Search → Context → LLM
     │
     └── Background Cleaner
              TTL-based session deletion
```

---

## ⚙️ Tech Stack

| Component       | Technology                            |
| --------------- | ------------------------------------- |
| Backend         | FastAPI                               |
| LLM             | Groq (Llama-3.1)                      |
| Embeddings      | HuggingFace Sentence Transformers     |
| Vector Database | FAISS                                 |
| Frontend        | HTML + JavaScript (FastAPI Templates) |
| Language        | Python 3.10                           |
| Validation      | Pydantic                              |
| Logging         | Python Logging Module                 |

---

## 📂 Project Structure

```
app/
├── api/            # FastAPI routes
├── rag/            # ingestion, retrieval, generation
├── schemas/        # request/response models
├── utils/          # helpers & session cleaner
├── logging/        # logging configuration
├── exceptions/     # custom exceptions
└── templates/      # frontend UI
```

---

## 🔌 API Endpoints

### Upload PDF

```
POST /upload
```

Returns a unique session ID.

---

### Ask Question

```
POST /ask
```

Request:

```json
{
  "session_id": "...",
  "question": "What is operating system?"
}
```

---

### Delete Session

```
DELETE /session/{session_id}
```

Deletes stored embeddings and uploaded files.

---

## 🔄 Automatic Session Cleanup

A background daemon thread runs periodically to:

* detect expired sessions
* remove vectorstores
* delete uploaded PDFs
* prevent storage growth

---

## ▶️ Run Locally

```bash
git clone <your-repo-url>
cd AskPaper

conda activate askpaper
pip install -r requirements.txt

uvicorn app.main:app --reload
```

Open in browser:

```
http://127.0.0.1:8000
```

---

## 🎯 Learning Outcomes

* Designed a modular RAG architecture
* Implemented session-isolated AI backend
* Built lifecycle-aware data management
* Integrated LLM APIs with semantic retrieval
* Developed background workers in FastAPI

---

## 👨‍💻 Author

**Sarvesh Chhabra**

Machine Learning & Backend Developer
