import os
from sys import platform
import asyncio
from pytest import fixture
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from bbdd.database import Base, SQLALCHEMY_DATABASE_URL

BASE_URL = "http://localhost:8000"

if platform.startswith('win'):
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

engine = create_async_engine(SQLALCHEMY_DATABASE_URL, echo = False)
TestingSessionLocal = sessionmaker(autocommit = False,
    autoflush = False, bind = engine,
    class_ = AsyncSession)

# Crear la base de datos en memoria

@fixture(autouse = True, scope = "function")
def setup_and_teardown_db():
    """
    Fixture para configurar y limpiar la base de datos antes de cada test.
    """

    async def setup():
        async with engine.begin() as conn:
            try:
                await conn.run_sync(Base.metadata.create_all)
            except Exception as e:
                print(e)

    async def teardown():
        async with engine.begin() as conn:
            try:
                await conn.run_sync(Base.metadata.drop_all)
            except Exception as e:
                print(e)
    # Limpiar las tablas después de cada test
    loop = asyncio.get_event_loop()
    loop.run_until_complete(teardown())
    loop.run_until_complete(setup())
    yield

def pytest_collection_modifyitems(session, config, items):
    # Recoge todos los ficheros de prueba en el directorio actual
    test_files = [item for item in items if item.fspath.ext == ".py"]
    """
    Si se necesita ordenar los test de alguna manera
    test_files.sort(
        key = lambda item: ("client" in os.path.basename(item.fspath),
        os.path.basename(item.fspath)))
        # Actualiza el orden de los items
        """
    items[:] = test_files

@fixture(scope='session', autouse=True)
def set_event_loop():
    asyncio.set_event_loop(asyncio.new_event_loop())
