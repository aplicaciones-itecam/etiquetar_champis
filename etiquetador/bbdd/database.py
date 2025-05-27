'''database manager'''
from os import getenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
# URL de la base de datos (leer de variables de entorno)
SQLALCHEMY_DATABASE_URL = getenv('DATABASE_URL',
                                 'postgresql+asyncpg://postgres:password@127.0.0.1:5432/db')

engine = create_async_engine(SQLALCHEMY_DATABASE_URL, echo =  True)
session_local = sessionmaker(engine, expire_on_commit = False, class_ = AsyncSession)
Base = declarative_base()

async def get_db() -> AsyncSession:
    """
    Dependency function to get a database session.

    This function is designed to be used as a FastAPI dependency, with the
    `Depends` function. It will create a database session, and yield it to the
    calling function, then close the session when the function has finished.

    The session is created with the `sessionmaker` class, which is configured
    to use the `engine` defined above. The `expire_on_commit` argument is set
    to `False`, which means that the session will not be expired after a
    commit operation.

    The `yield` statement is used to yield control back to the calling function,
    which can then use the session object to interact with the database. When
    the function has finished, the session is closed.
    """
    async with session_local() as session:
        yield session
