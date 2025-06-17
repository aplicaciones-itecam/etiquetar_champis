from fastapi import APIRouter, FastAPI, HTTPException, Form
from pydantic import BaseModel
import base64
import io
from PIL import Image
from os import makedirs
from os.path import join
from uuid import uuid4
from json import dump
from typing import List, Dict, Any, Optional
import traceback
import os
from os.path import join
import json
from datetime import datetime

# Import the logger
from utils.logger import logger

CLIENT_LOGS_DIR = "logs/client"
os.makedirs(CLIENT_LOGS_DIR, exist_ok=True)

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

class LogEntry(BaseModel):
    type: str
    message: str
    stack: Optional[str] = None
    timestamp: str
    userAgent: Optional[str] = None
    url: Optional[str] = None
    source: Optional[str] = None
    line: Optional[int] = None
    column: Optional[int] = None
    componentInfo: Optional[Dict[str, Any]] = None
    reactInfo: Optional[Dict[str, Any]] = None
    reason: Optional[Any] = None

class BatchLogRequest(BaseModel):
    logs: List[LogEntry]

IMAGES_DIR = "dataset/images"
LABELS_DIR = "dataset/labels"
DATOS_DIR = "dataset/data"
makedirs(IMAGES_DIR, exist_ok=True)
makedirs(LABELS_DIR, exist_ok=True)
makedirs(DATOS_DIR, exist_ok=True)


@router.post("/upload-image/")
async def upload_image(payload: AnnotatedImage):
    logger.info("Received image upload request")
    
    try:
        # Generar UUID único para la imagen/anotación
        uuid = str(uuid4())
        logger.debug(f"Generated UUID: {uuid}")

        # Decodificar y guardar imagen
        try:
            image_data = base64.b64decode(payload.annotatedImageFile)
            image = Image.open(io.BytesIO(image_data))
            image = image.convert("RGB") 
            img_width, img_height = image.size
            logger.debug(f"Successfully decoded image, dimensions: {img_width}x{img_height}")
        except Exception as e:
            logger.error(f"Failed to decode image: {str(e)}")
            raise ValueError("Invalid image data provided")

        image_filename = f"{uuid}.webp"
        image_path = join(IMAGES_DIR, image_filename)
        
        try:
            image.save(image_path, 'webp')
            logger.debug(f"Image saved to {image_path}")
        except Exception as e:
            logger.error(f"Failed to save image: {str(e)}")
            raise ValueError(f"Could not save image: {str(e)}")

        # Crear archivo de anotaciones YOLO
        label_filename = f"{uuid}.txt"
        json_filename = f"{uuid}.json"
        label_path = join(LABELS_DIR, label_filename)
        datos_path = join(DATOS_DIR, json_filename)
        
        # Save metadata
        try:
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
            logger.debug(f"Metadata saved to {datos_path}")
        except Exception as e:
            logger.error(f"Failed to save metadata: {str(e)}")
            raise ValueError(f"Could not save metadata: {str(e)}")

        # Save annotations
        valid_annotations = 0
        skipped_annotations = 0
        
        try:
            with open(label_path, "w") as f:
                for i, ann in enumerate(payload.annotations):
                    if len(ann.points) != 2:
                        logger.warning(f"Skipping annotation {i+1}: expected 2 points, got {len(ann.points)}")
                        skipped_annotations += 1
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
                        logger.warning(f"Skipping annotation {i+1}: zero width or height")
                        skipped_annotations += 1
                        continue  # evitar cajas inválidas
     
                    f.write(f"0 {x_center:.6f} {y_center:.6f} {width:.6f} {height:.6f}\n")
                    valid_annotations += 1
            
            logger.info(f"Saved {valid_annotations} valid annotations to {label_path} (skipped {skipped_annotations})")
        except Exception as e:
            logger.error(f"Failed to save annotations: {str(e)}")
            raise ValueError(f"Could not save annotations: {str(e)}")

        logger.info(f"Successfully processed image upload with ID: {uuid}")
        return {
            "message": "Imagen y anotaciones guardadas correctamente.",
            "id": uuid,
            "image_filename": image_filename,
            "label_filename": label_filename,
            "valid_annotations": valid_annotations,
            "skipped_annotations": skipped_annotations
        }

    except Exception as e:
        error_details = traceback.format_exc()
        logger.error(f"Error processing image upload: {str(e)}\n{error_details}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/images/")
async def get_images():
    """Obtener la lista de todas las imágenes con sus datos"""
    import os
    import json
    
    try:
        result = []
        error_files = []
        
        # Leer todos los archivos JSON en el directorio de datos
        for filename in os.listdir(DATOS_DIR):
            if filename.endswith('.json'):
                file_id = filename.split('.')[0]  # UUID sin extensión
                
                # Ruta del archivo JSON y la imagen correspondiente
                json_path = join(DATOS_DIR, filename)
                image_path = join(IMAGES_DIR, f"{file_id}.webp")
                
                # Verificar si la imagen existe
                if not os.path.exists(image_path):
                    continue
                
                # Cargar datos del JSON con manejo de errores
                try:
                    with open(json_path, 'r') as f:
                        data = json.load(f)
                except json.JSONDecodeError as je:
                    # Registrar el archivo con error y continuar con el siguiente
                    error_files.append({"file": filename, "error": str(je)})
                    print(f"Error en archivo JSON {filename}: {je}")
                    continue
                
                # Crear estructura de respuesta
                record = {
                    "id": file_id,
                    "imageUrl": f"/dataset/images/{file_id}.webp",
                    "sala": data.get("sala", ""),
                    "muestra": data.get("muestra", ""),
                    "fecha": data.get("fecha", ""),
                    "hora": data.get("hora", ""),
                    "diaEntrada": data.get("dia_entrada", ""),
                    "tempCompost": data.get("temp_compost"),
                    "tempAmbiente": data.get("temperatura"),
                    "humedad": data.get("humedad"),
                    "co2": data.get("co2"),
                    "circulacion": data.get("circulacion"),
                    "observaciones": data.get("observaciones"),
                    "annotations": []
                }
                
                # Procesar anotaciones
                if "annotations" in data:
                    for ann in data["annotations"]:
                        if "points" in ann and len(ann["points"]) == 2:
                            p1 = ann["points"][0]
                            p2 = ann["points"][1]
                            
                            # Calcular coordenadas relativas (x, y, ancho, alto)
                            x = min(p1["x"], p2["x"])
                            y = min(p1["y"], p2["y"])
                            width = abs(p2["x"] - p1["x"])
                            height = abs(p2["y"] - p1["y"])
                            
                            record["annotations"].append([x, y, width, height])
                
                result.append(record)
        
        # Si hay archivos con error, incluirlo en los registros de la aplicación
        if error_files:
            print(f"Encontrados {len(error_files)} archivos JSON con errores: {error_files}")
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener imágenes: {str(e)}")

@router.get("/images/{image_id}")
async def get_image(image_id: str):
    """Obtener los datos de una imagen específica por ID"""
    import os
    import json
    
    try:
        # Ruta del archivo JSON y la imagen
        json_path = join(DATOS_DIR, f"{image_id}.json")
        image_path = join(IMAGES_DIR, f"{image_id}.webp")
        
        # Verificar si los archivos existen
        if not os.path.exists(json_path) or not os.path.exists(image_path):
            raise HTTPException(status_code=404, detail=f"Imagen con ID {image_id} no encontrada")
        
        # Cargar datos del JSON
        with open(json_path, 'r') as f:
            data = json.load(f)
        
        # Crear estructura de respuesta
        record = {
            "id": image_id,
            "imageUrl": f"/dataset/images/{image_id}.webp",
            "sala": data.get("sala", ""),
            "muestra": data.get("muestra", ""),
            "fecha": data.get("fecha", ""),
            "hora": data.get("hora", ""),
            "tempCompost": data.get("temp_compost"),
            "tempAmbiente": data.get("temperatura"),
            "diaEntrada": data.get("dia_entrada", ""),
            "humedad": data.get("humedad"),
            "co2": data.get("co2"),
            "circulacion": data.get("circulacion"),
            "observaciones": data.get("observaciones"),
            "annotations": []
        }
        
        # Procesar anotaciones
        if "annotations" in data:
            for ann in data["annotations"]:
                if "points" in ann and len(ann["points"]) == 2:
                    p1 = ann["points"][0]
                    p2 = ann["points"][1]
                    
                    # Calcular coordenadas relativas (x, y, ancho, alto)
                    x = min(p1["x"], p2["x"])
                    y = min(p1["y"], p2["y"])
                    width = abs(p2["x"] - p1["x"])
                    height = abs(p2["y"] - p1["y"])
                    
                    record["annotations"].append([x, y, width, height])
        
        return record
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener imagen: {str(e)}")

@router.post("/log/")
async def log_error(log_entry: LogEntry):
    try:
        # Log to server logs
        log_message = f"Client error: {log_entry.type} - {log_entry.message}"
        logger.error(log_message)
        
        # Store in client logs file
        log_file = join(CLIENT_LOGS_DIR, f"client_errors_{datetime.now().strftime('%Y%m%d')}.json")
        
        # Read existing logs or create empty list
        try:
            if os.path.exists(log_file):
                with open(log_file, "r") as f:
                    logs = json.load(f)
            else:
                logs = []
        except json.JSONDecodeError:
            # Handle corrupted log file
            logs = []
            logger.warning(f"Found corrupted log file: {log_file}, creating new one")
        
        # Add new log entry
        logs.append(log_entry.model_dump())
        
        # Write back to file
        with open(log_file, "w") as f:
            json.dump(logs, f, indent=2)
        
        return {"success": True}
    
    except Exception as e:
        logger.error(f"Failed to log client error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to log error")
    
@router.post("/log/batch/")
async def log_errors_batch(batch_request: BatchLogRequest):
    try:
        if not batch_request.logs:
            return {"success": True, "message": "No logs to process"}
        
        # Log to server logs
        logger.info(f"Received batch of {len(batch_request.logs)} client error logs")
        
        # Store in client logs file
        log_file = join(CLIENT_LOGS_DIR, f"client_errors_{datetime.now().strftime('%Y%m%d')}.json")
        
        # Read existing logs or create empty list
        try:
            if os.path.exists(log_file):
                with open(log_file, "r") as f:
                    logs = json.load(f)
            else:
                logs = []
        except json.JSONDecodeError:
            logs = []
            logger.warning(f"Found corrupted log file: {log_file}, creating new one")
        
        # Add new log entries
        for log_entry in batch_request.logs:
            logs.append(log_entry.model_dump())
            
            # Also log critical errors to server logs
            if log_entry.type in ["uncaught-error", "unhandled-rejection"]:
                logger.error(f"Critical client error: {log_entry.message}")
        
        # Write back to file
        with open(log_file, "w") as f:
            json.dump(logs, f, indent=2)
        
        return {"success": True, "processed": len(batch_request.logs)}
    
    except Exception as e:
        logger.error(f"Failed to log batch of client errors: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to log errors batch")