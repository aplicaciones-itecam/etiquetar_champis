"""schemas para champi"""

from pydantic import BaseModel, ConfigDict


class ChampiBase(BaseModel):
    """
    representa un champi con sus atributos
    :param id: identificador unico.
    :type id: int
    """


class Champi(BaseModel):
    imagen: str
