from groq import Groq
import os
import time
import sys
from dotenv import load_dotenv
from app.exceptions.custom_exceptions import AskPaperException
from app.core.prompts import RAG_PROMPT
from app.logging.logger import logger


# Models to try in order if one fails to schedule or fails
GROQ_MODEL_FALLBACKS = [
    "groq/compound-mini",
    "qwen/qwen3.8-27b",
    "groq/compound",
]

MAX_RETRIES = 3
RETRY_DELAY_SECONDS = 2


class Generator:

    def __init__(self):
        try:
            load_dotenv()
            self.client = Groq(api_key=os.getenv("GROQ_API_KEY"))
            env_model = os.getenv("MODEL_NAME")
            self.model_fallbacks = []
            if env_model:
                self.model_fallbacks.append(env_model)
            for m in GROQ_MODEL_FALLBACKS:
                if m not in self.model_fallbacks:
                    self.model_fallbacks.append(m)
            self.model = self.model_fallbacks[0]

        except Exception as e:
            raise AskPaperException(e, sys)

    def generate(self, query: str, context: str) -> str:

        prompt = RAG_PROMPT.format(context=context, query=query)
        messages = [{"role": "user", "content": prompt}]

        for model in self.model_fallbacks:
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
                    is_fallbackable_error = (
                        "scheduling failure" in error_msg
                        or "unable to schedule" in error_msg
                        or "service unavailable" in error_msg
                        or "503" in error_msg
                        or "decommissioned" in error_msg
                        or "does not exist" in error_msg
                        or "model_not_found" in error_msg
                    )

                    if is_fallbackable_error:
                        if "decommissioned" in error_msg or "does not exist" in error_msg:
                            logger.warning(
                                f"Model '{model}' is decommissioned or unavailable. Trying next fallback model."
                            )
                            break
                        elif attempt < MAX_RETRIES:
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
                        # Non-retryable error — raise immediately
                        raise AskPaperException(e, sys)

        raise AskPaperException(
            Exception(
                "All Groq models failed. Please verify model configuration and try again."
            ),
            sys,
        )