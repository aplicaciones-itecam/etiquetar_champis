from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


def add(app: FastAPI):
    """
    Función para habilitar cors
    """
    app.add_middleware(CORSMiddleware,
                       allow_origins = ["*"],
                       allow_credentials = True,
                       allow_methods = ["*"],
                       allow_headers = ["*"])

