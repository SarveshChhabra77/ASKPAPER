from app.rag.pipeline import AskPaperPipeline

pipeline = AskPaperPipeline(session_path='vectorstore')

query = ' What is tightly coupled system ?'


answer = pipeline.run(query=query)

print(answer)