RAG_PROMPT = """
Instruction: 1. If the user's query is a greeting (e.g., "Hi", "Hello", "Hey"), ignore the context and respond with:
"Hello! I am ready to assist you with the document provided. What would you like to know?"
2. For all other queries, answer using ONLY the context below.
3. If the answer is not present in the context, say: "I could not find the answer in the provided document."

Context:
{context}

Question:
{query}
"""