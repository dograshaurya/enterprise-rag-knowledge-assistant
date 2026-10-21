
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Enterprise RAG Knowledge Assistant"
    app_env: str = "development"
    app_debug: bool = True

    database_url: str = (
        "postgresql+asyncpg://raguser:ragpassword@localhost:5433/ragdb"
    )

    ollama_base_url: str = "http://localhost:11434"
    llm_model: str = "qwen2.5:3b"
    embedding_model: str = "nomic-embed-text"
    embedding_dimensions: int = 768

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
