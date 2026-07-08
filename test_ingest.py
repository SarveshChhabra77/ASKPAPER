from app.rag.ingest import IngestPipeline

ingestor = IngestPipeline()

session_id,vector_path = ingestor.ingest(
    pdf_path="data/samplepdf.pdf"
)

print('Session ID :',session_id)
print('Vector Path :',vector_path)