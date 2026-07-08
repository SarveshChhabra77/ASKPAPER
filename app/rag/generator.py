from groq import Groq
import os
from dotenv import load_dotenv
from app.exceptions.custom_exceptions import AskPaperException
from app.core.prompts import RAG_PROMPT
import sys


class Generator:

    def __init__(self):
        try:
            load_dotenv()
            self.client = Groq(api_key=os.getenv("GROQ_API_KEY"))
            self.model = "llama-3.1-8b-instant"

        except Exception as e:
            raise AskPaperException(e, sys)

    def generate(self, query: str, context: str) -> str:

        try:
            prompt = RAG_PROMPT.format(context=context,query=query)
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
            )

            return response.choices[0].message.content

        except Exception as e:
            raise AskPaperException(e, sys)