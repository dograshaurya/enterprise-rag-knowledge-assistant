import asyncio

from sqlalchemy import select, func

from app.db.models import Document, DocumentChunk
from app.db.session import AsyncSessionLocal, engine
from app.ingestion.ingestion_service import ingestion_service


async def main():
    try:
        async with AsyncSessionLocal() as session:
            result = await ingestion_service.ingest_pdf(
                "sample_knowledge.pdf",
                session,
            )
            print("Ingestion result:", result)

            count_result = await session.execute(
                select(func.count()).select_from(DocumentChunk).where(
                    DocumentChunk.document_id == result["document_id"]
                )
            )
            print("Stored chunks:", count_result.scalar_one())

    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())