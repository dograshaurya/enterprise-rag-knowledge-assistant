
import httpx

from app.core.config import settings


class OllamaService:
    def __init__(self) -> None:
        self.base_url = settings.ollama_base_url.rstrip("/")
        self.llm_model = settings.llm_model
        self.embedding_model = settings.embedding_model

    async def generate_embedding(self, text: str) -> list[float]:
        if not text.strip():
            raise ValueError("Text cannot be empty.")

        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{self.base_url}/api/embed",
                json={
                    "model": self.embedding_model,
                    "input": text,
                },
            )
            response.raise_for_status()
            data = response.json()

        embedding = data["embeddings"][0]

        if len(embedding) != settings.embedding_dimensions:
            raise ValueError(
                f"Expected {settings.embedding_dimensions} dimensions, "
                f"received {len(embedding)}."
            )

        return embedding

    async def generate_answer(self, prompt: str) -> str:
        async with httpx.AsyncClient(timeout=180.0) as client:
            response = await client.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": self.llm_model,
                    "prompt": prompt,
                    "stream": False,
                },
            )
            response.raise_for_status()
            data = response.json()

        return data["response"].strip()


ollama_service = OllamaService()
