import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
engine=create_async_engine(os.getenv('DATABASE_URL','postgresql+asyncpg://dubl:dubl@localhost:5432/dubl'))
SessionLocal=async_sessionmaker(engine,expire_on_commit=False)
async def db():
    async with SessionLocal() as s: yield s
