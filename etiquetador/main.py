from fastapi import FastAPI
from middlewares import cors
from asyncio import create_task
from contextlib import asynccontextmanager
from routes.champi import router as champi_router
from routes.hola import router as hola_router

import utils.logger as logger
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
import traceback
app = FastAPI()

app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request, exc):
    logger.error(f"HTTP error: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )

app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    error_details = str(exc)
    logger.error(f"Validation error: {error_details}")
    return JSONResponse(
        status_code=422,
        content={"detail": "Datos de entrada inválidos", "errors": exc.errors()},
    )

app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    error_details = traceback.format_exc()
    logger.critical(f"Unhandled exception: {str(exc)}\n{error_details}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Error interno del servidor"},
    )

#Crear instancia de fastapi

# Añadimos la configuración de CORS
cors.add(app)

# Incluir las routes
app.include_router(champi_router)
app.include_router(hola_router)



if __name__ == "__main__":
    # ejecutar el servidor al ejecutar el main
    from uvicorn import run
    run(app = app, host = "0.0.0.0", port = 8000)
