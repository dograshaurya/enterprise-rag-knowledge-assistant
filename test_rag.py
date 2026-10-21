
import asyncio

from app.db.session import AsyncSessionLocal, engine
from app.services.rag_service import rag_service


async def main():
    try:
        async with AsyncSessionLocal() as session:
            result = await rag_service.ask(
                question="How does this system store document embeddings?",
                session=session,
                top_k=3,
            )

            print("\nQUESTION:")
            print(result["question"])

            print("\nANSWER:")
            print(result["answer"])

            print("\nSOURCES:")
            for source in result["sources"]:
                print(
                    f"Document ID: {source['document_id']} | "
                    f"Chunk ID: {source['chunk_id']} | "
                    f"Similarity: {source['similarity']}"
                )

    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
