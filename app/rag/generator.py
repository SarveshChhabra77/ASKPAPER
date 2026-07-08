from groq import Groq
import os
import time
import sys
from dotenv import load_dotenv
from app.exceptions.custom_exceptions import AskPaperException
from app.core.prompts import RAG_PROMPT
from app.logging.logger import logger


# Models to try in order if one fails to schedule
GROQ_MODEL_FALLBACKS = [
    "llama-3.1-8b-instant",
    "llama3-8b-8192",
    "gemma2-9b-it",
]

MAX_RETRIES = 3
RETRY_DELAY_SECONDS = 2


class Generator:

    def __init__(self):
        try:
            load_dotenv()
            self.client = Groq(api_key=os.getenv("GROQ_API_KEY"))
            self.model = GROQ_MODEL_FALLBACKS[0]

        except Exception as e:
            raise AskPaperException(e, sys)

    def generate(self, query: str, context: str) -> str:

        prompt = RAG_PROMPT.format(context=context, query=query)
        messages = [{"role": "user", "content": prompt}]

        for model in GROQ_MODEL_FALLBACKS:
            for attempt in range(1, MAX_RETRIES + 1):
                try:
                    logger.info(f"Calling Groq model '{model}' (attempt {attempt}/{MAX_RETRIES})")
                    response = self.client.chat.completions.create(
                        model=model,
                        messages=messages,
                    )
                    return response.choices[0].message.content

                except Exception as e:
                    error_msg = str(e).lower()
                    is_scheduling_error = (
                        "scheduling failure" in error_msg
                        or "unable to schedule" in error_msg
                        or "service unavailable" in error_msg
                        or "503" in error_msg
                    )

                    if is_scheduling_error:
                        if attempt < MAX_RETRIES:
                            wait = RETRY_DELAY_SECONDS * attempt
                            logger.warning(
                                f"Groq scheduling failure on model '{model}', "
                                f"retrying in {wait}s... (attempt {attempt}/{MAX_RETRIES})"
                            )
                            time.sleep(wait)
                        else:
                            logger.warning(
                                f"Model '{model}' exhausted retries, trying next fallback model."
                            )
                    else:
                        # Non-scheduling error — raise immediately
                        raise AskPaperException(e, sys)

        raise AskPaperException(
            Exception(
                "All Groq models failed due to scheduling errors. "
                "Please try again in a moment."
            ),
            sys,
        )