from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def funciona():
    return "funciona perfectamente :D"

