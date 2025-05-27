'''schemas para champi'''
from pydantic import BaseModel, ConfigDict


class ChampiBase(BaseModel):
    """
    representa un champi con sus atributos
    :param id: identificador unico.
    :type id: int
    """
    id: int

class ChampiCreate(ChampiBase):
    pass
class ChampiUpdate(ChampiBase):
    pass
class Champi(ChampiBase):
    id: int

