from fastapi import APIRouter, FastAPI, HTTPException, Form
from pydantic import BaseModel
import base64
import io
from PIL import Image
from os import makedirs
from os.path import join
from uuid import uuid4
from json import dump
from typing import Optional

from pydantic_core.core_schema import dataclass_field

router = APIRouter()


class Point(BaseModel):
    x: float
    y: float


class Annotation(BaseModel):
    points: list[
        Point
    ] 

class AnnotatedImage(BaseModel):
    annotatedImageFile: str
    annotations: list[Annotation]
    diaEntrada: Optional[str] = None
    tempAmbiente: Optional[float] = None
    humedad: Optional[float] = None
    sala: Optional[str] = None
    muestra: Optional[str] = None
    fecha: Optional[str] = None
    hora: Optional[str] = None
    tempCompost: Optional[float] = None
    co2: Optional[float] = None
    circulacion: Optional[float] = None
    observaciones: Optional[str] = None

IMAGES_DIR = "dataset/images"
LABELS_DIR = "dataset/labels"
DATOS_DIR = "dataset/data"
makedirs(IMAGES_DIR, exist_ok=True)
makedirs(LABELS_DIR, exist_ok=True)
makedirs(DATOS_DIR, exist_ok=True)


@router.post("/upload-image/")
async def upload_image(payload: AnnotatedImage):
    
    try:
        # Generar UUID único para la imagen/anotación
        uuid = str(uuid4())

        # Decodificar y guardar imagen
        image_data = base64.b64decode(payload.annotatedImageFile)
        image = Image.open(io.BytesIO(image_data))
        img_width, img_height = image.size

        image_filename = f"{uuid}.png"
        image_path = join(IMAGES_DIR, image_filename)
        image.save(image_path)

        # Crear archivo de anotaciones YOLO
        label_filename = f"{uuid}.txt"
        json_filename = f"{uuid}.json"
        label_path = join(LABELS_DIR, label_filename)
        datos_path = join(DATOS_DIR, json_filename)
        with open(datos_path, "w") as f:
            annotations_data = [ann.model_dump() for ann in payload.annotations]
            dump(
                {
                "dia_entrada": payload.diaEntrada,
                "temperatura": payload.tempAmbiente, 
                "humedad": payload.humedad,
                "sala": payload.sala,
                "muestra": payload.muestra,
                "fecha": payload.fecha,
                "hora": payload.hora,
                "temp_compost": payload.tempCompost,
                "co2": payload.co2,
                "circulacion": payload.circulacion,
                "observaciones": payload.observaciones,
                "annotations": annotations_data
                 },
                f,
                indent=4,
            )

        with open(label_path, "w") as f:
            for ann in payload.annotations:
                if len(ann.points) != 2:
                    continue 
 
                p1, p2 = ann.points
                xmin = min(p1.x, p2.x)
                xmax = max(p1.x, p2.x)
                ymin = min(p1.y, p2.y)
                ymax = max(p1.y, p2.y)
 
                # Calcular en formato YOLO (normalizado)
                x_center = (xmin + xmax) / (2 * img_width)
                y_center = (ymin + ymax) / (2 * img_height)
                width = (xmax - xmin) / img_width
                height = (ymax - ymin) / img_height
 
                if width == 0 or height == 0:
                    continue  # evitar cajas inválidas
 
                f.write(f"0 {x_center:.6f} {y_center:.6f} {width:.6f} {height:.6f}\n")

        return {
            "message": "Imagen y anotaciones guardadas correctamente.",
            "id": uuid,
            "image_filename": image_filename,
            "label_filename": label_filename,
        }

    except Exception as e:
        print(e)
        raise HTTPException(status_code=400, detail=str(e))
