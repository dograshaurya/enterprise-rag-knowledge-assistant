
from sqlalchemy import text

from app.db.session import engine


async def initialize_database() -> None:
    async with engine.begin() as connection:
        await connection.execute(
            text("CREATE EXTENSION IF NOT EXISTS vector")
        )

    print("Database initialized successfully.")


async def main() -> None:
    try:
        await initialize_database()
    finally:
        await engine.dispose()


if __name__ == "__main__":
    import asyncio

    asyncio.run(main())
