import asyncio

from app.db.session import AsyncSessionLocal, engine
from app.retrieval.retrieval_service import retrieval_service


async def main():
    try:
        async with AsyncSessionLocal() as session:
            results = await retrieval_service.search(
                question="What is the company's employee leave policy?",
                session=session,
                top_k=3,
            )

            for index, item in enumerate(results, start=1):
                print(f"\nResult {index}")
                print("Document ID:", item["document_id"])
                print("Similarity:", item["similarity"])
                print("Content:", item["content"][:300])

    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())