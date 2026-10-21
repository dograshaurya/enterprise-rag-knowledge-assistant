
import asyncio

from app.db.models import Base
from app.db.session import engine


async def create_tables() -> None:
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    print("Document tables created successfully.")


async def main() -> None:
    try:
        await create_tables()
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
