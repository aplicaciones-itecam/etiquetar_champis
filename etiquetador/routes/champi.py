'''rutas para champi'''
from fastapi import APIRouter, Depends, status
from fastapi.exceptions import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from bbdd.database import get_db


router = APIRouter()


@router.get("/champi")
async def obtener_todos(db: AsyncSession = Depends(get_db)):
    return "champi funcional"

