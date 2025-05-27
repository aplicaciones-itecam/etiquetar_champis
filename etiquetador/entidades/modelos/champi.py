'''Modelo de bbdd para champi'''
from sqlalchemy import Column, Integer
from bbdd.database import Base

class Champi(Base):
    """
    Modelo de bbdd para champi
    """
    __tablename__ = 'champi'
    id = Column(Integer, primary_key = True, index = True)
