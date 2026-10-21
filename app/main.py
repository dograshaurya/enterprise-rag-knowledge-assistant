
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Depends, FastAPI, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import engine, get_db
from app.services.rag_service import rag_service
from app.api.documents import router as documents_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await engine.dispose()


app = FastAPI(
    title="Enterprise RAG Knowledge Assistant",
    description="Ask questions about your uploaded knowledge documents.",
    version="0.1.0",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(documents_router)

class AskRequest(BaseModel):
    question: str = Field(min_length=1, max_length=4000)
    top_k: int = Field(default=3, ge=1, le=10)


class SourceResponse(BaseModel):
    document_id: int
    chunk_id: int
    filename: str
    similarity: float
    content: str


class AskResponse(BaseModel):
    question: str
    answer: str
    sources: list[SourceResponse]


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/api/ask", response_model=AskResponse)
async def ask_question(
    request: AskRequest,
    session: AsyncSession = Depends(get_db),
):
    try:
        result = await rag_service.ask(
            question=request.question,
            session=session,
            top_k=request.top_k,
        )
        return result
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Unable to answer the question. Check the application logs.",
        ) from exc
