
import asyncio

from app.services.ollama_service import ollama_service


async def main():
    text = "Enterprise RAG Knowledge Assistant"

    embedding = await ollama_service.generate_embedding(text)

    print("Embedding generated successfully.")
    print("Dimensions:", len(embedding))
    print("First five values:", embedding[:5])


if __name__ == "__main__":
    asyncio.run(main())
