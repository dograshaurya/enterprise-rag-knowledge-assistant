from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Document, DocumentChunk
from app.services.ollama_service import ollama_service


class RetrievalService:
    async def search(
        self,
        question: str,
        session: AsyncSession,
        top_k: int = 5,
        min_similarity: float = 0.50,
    ) -> list[dict]:
        if not question.strip():
            raise ValueError("Question cannot be empty.")

        if top_k < 1:
            raise ValueError("top_k must be at least 1.")

        if not 0.0 <= min_similarity <= 1.0:
            raise ValueError("min_similarity must be between 0 and 1.")

        question_embedding = await ollama_service.generate_embedding(question)

        distance = DocumentChunk.embedding.cosine_distance(
            question_embedding
        ).label("distance")

        statement = (
            select(DocumentChunk, Document.filename, distance)
            .join(
                Document,
                Document.id == DocumentChunk.document_id,
            )
            .order_by(distance)
            .limit(top_k)
        )

        result = await session.execute(statement)
        rows = result.all()

        matches = []

        for chunk, filename, distance_value in rows:
            similarity = 1 - float(distance_value)

            if similarity < min_similarity:
                continue

            matches.append(
                {
                    "chunk_id": chunk.id,
                    "document_id": chunk.document_id,
                    "filename": filename,
                    "content": chunk.content,
                    "similarity": round(similarity, 4),
                }
            )

        return matches


retrieval_service = RetrievalService()