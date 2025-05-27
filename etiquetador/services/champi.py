'''servicios para champi'''
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload
from fastapi import Depends, status
from bbdd.database import get_db
from entidades.modelos.champi import Champi

"""
Aqui van las dependencias con otras tablas
"""
dependencias = []

async def get_all(db : AsyncSession = Depends(get_db)):
    champis = await db.execute(select(Champi).options(*dependencias))
    return champis.scalars()

