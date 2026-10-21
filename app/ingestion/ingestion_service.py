
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Document, DocumentChunk
from app.ingestion.document_processor import document_processor
from app.services.ollama_service import ollama_service


class IngestionService:
    async def ingest_pdf(
        self,
        file_path: str,
        session: AsyncSession,
        original_filename: str | None = None,
    ) -> dict:
        path = Path(file_path)

        if path.suffix.lower() != ".pdf":
            raise ValueError("Only PDF files are supported.")

        extracted_text = document_processor.extract_text(str(path))
        chunks = document_processor.split_text(extracted_text)

        if not chunks:
            raise ValueError("No text chunks were generated.")

        document = Document(
            filename=original_filename or path.name,
            content_type="application/pdf",
        )

        session.add(document)
        await session.flush()

        for index, chunk_text in enumerate(chunks):
            embedding = await ollama_service.generate_embedding(chunk_text)

            session.add(
                DocumentChunk(
                    document_id=document.id,
                    chunk_index=index,
                    content=chunk_text,
                    embedding=embedding,
                )
            )

        await session.commit()

        return {
            "document_id": document.id,
            "filename": document.filename,
            "chunks_created": len(chunks),
        }


ingestion_service = IngestionService()
