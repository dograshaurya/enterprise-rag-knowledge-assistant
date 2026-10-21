
import tempfile
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.ingestion.ingestion_service import ingestion_service
from sqlalchemy import select
from app.db.models import Document

router = APIRouter(prefix="/api/documents", tags=["Documents"])

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

@router.get("/")
async def list_documents(
    session: AsyncSession = Depends(get_db),
):
    result = await session.execute(
        select(Document).order_by(Document.created_at.desc())
    )
    documents = result.scalars().all()

    return [
        {
            "id": document.id,
            "filename": document.filename,
            "content_type": document.content_type,
            "created_at": document.created_at,
        }
        for document in documents
    ]

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_db),
):
    if not file.filename or Path(file.filename).suffix.lower() != ".pdf":
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported.",
        )

    if file.content_type not in ("application/pdf", "application/octet-stream"):
        raise HTTPException(
            status_code=400,
            detail="The uploaded file must be a PDF.",
        )

    temp_path = None

    try:
        content = await file.read(MAX_FILE_SIZE + 1)

        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail="PDF must be 10 MB or smaller.",
            )

        if not content.startswith(b"%PDF-"):
            raise HTTPException(
                status_code=400,
                detail="The uploaded file is not a valid PDF.",
            )

        with tempfile.NamedTemporaryFile(
            suffix=".pdf", delete=False
        ) as temp_file:
            temp_file.write(content)
            temp_path = temp_file.name

        result = await ingestion_service.ingest_pdf(
            temp_path,
            session,
            original_filename=Path(file.filename).name,
        )

        return {
            "message": "Document uploaded and processed successfully.",
            **result,
        }

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Document processing failed. Check the application logs.",
        ) from exc
    finally:
        if temp_path:
            Path(temp_path).unlink(missing_ok=True)
        await file.close()


@router.delete("/{document_id}")
async def delete_document(
    document_id: int,
    session: AsyncSession = Depends(get_db),
):
    result = await session.execute(
        select(Document).where(Document.id == document_id)
    )
    document = result.scalar_one_or_none()

    if document is None:
        raise HTTPException(
            status_code=404,
            detail="Document not found.",
        )

    filename = document.filename

    try:
        await session.delete(document)
        await session.commit()
    except Exception as exc:
        await session.rollback()
        raise HTTPException(
            status_code=500,
            detail="Failed to delete the document.",
        ) from exc

    return {
        "message": "Document deleted successfully.",
        "document_id": document_id,
        "filename": filename,
    }