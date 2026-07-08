FROM python:3.10-slim

# Create a non-root user to avoid running as root (Hugging Face default requirement)
RUN useradd -m -u 1000 user

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy and install dependencies first
COPY --chown=user requirements.txt .
RUN pip install --no-cache-dir --upgrade -r requirements.txt

# Copy the rest of the application
COPY --chown=user . .

# Set up environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Create the required directories and ensure correct permissions
RUN mkdir -p uploads vectorstore logs && chown -R user:user /app

# Switch to the non-root user
USER user

# HF Spaces listens on port 7860 by default
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
