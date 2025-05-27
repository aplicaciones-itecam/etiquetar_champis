# Utilizar una imagen base de Python
FROM python:3.8-slim

#RUN apt-get update && apt-get install -y cron
# # Establecer el directorio de trabajo dentro del contenedor
RUN pip install uv
WORKDIR /etiquetador
# Copiar los archivos del proyecto al contenedor
COPY . /etiquetador

# Instalar las dependencias del proyecto
RUN uv sync 
# Exponer el puerto 8000 para FastAPI
EXPOSE 8000
# Comando para ejecutar la aplicacion FastAPI usando Uvicorn
#CMD ["cron", "-f"]
#CMD ["sh", "-c", "cd ..; uv run uvicorn etiquetador.main:app --host 0.0.0.0 --port 8000"]
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
