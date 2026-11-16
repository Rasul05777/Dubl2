import asyncio,os
from alembic import context
from sqlalchemy.ext.asyncio import create_async_engine
from app.models import Base
config=context.config
url=os.environ['DATABASE_URL']
def run(connection):
    context.configure(connection=connection,target_metadata=Base.metadata)
    with context.begin_transaction(): context.run_migrations()
async def online():
    engine=create_async_engine(url)
    async with engine.connect() as conn: await conn.run_sync(run)
    await engine.dispose()
if context.is_offline_mode():
    context.configure(url=url,target_metadata=Base.metadata,literal_binds=True)
    with context.begin_transaction(): context.run_migrations()
else: asyncio.run(online())
