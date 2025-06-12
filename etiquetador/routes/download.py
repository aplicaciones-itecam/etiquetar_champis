from fastapi import APIRouter
from starlette.responses import StreamingResponse
import os
import io
import zipfile
import json
import pandas as pd
from typing import List, Dict, Any

from utils.logger import logger

router = APIRouter()

DATASET_DIR = "dataset"

# (La función _generate_excel_in_memory sigue siendo la misma que en mi respuesta anterior)
def _generate_excel_in_memory() -> io.BytesIO:
    # ... (código para generar el Excel en memoria, sin cambios)
    logger.info("Generando datos de Excel en memoria.")
    
    processed_data: List[Dict[str, Any]] = []
    malformed_files: List[str] = []
    DATA_DIR = os.path.join(DATASET_DIR, "data")

    if not os.path.exists(DATA_DIR):
        logger.warning(f"El directorio de datos no se ha encontrado en: {DATA_DIR}")
        df = pd.DataFrame([{"info": "El directorio 'data' no fue encontrado."}])
    else:
        for filename in os.listdir(DATA_DIR):
            if filename.endswith(".json"):
                file_path = os.path.join(DATA_DIR, filename)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                    
                    annotations = data.get("anotaciones")
                    if annotations is None:
                        annotations = data.get("annotations", [])

                    base_row = {
                        "nombre_archivo": data.get("nombre", filename),
                        "dia_entrada": data.get("dia_entrada"),
                        "fecha": data.get("fecha"),
                        "hora": data.get("hora"),
                        "sala": data.get("sala"),
                        "muestra": data.get("muestra"),
                        "temperatura": data.get("temperatura"),
                        "humedad": data.get("humedad"),
                        "temp_compost": data.get("temp_compost"),
                        "co2": data.get("co2"),
                        "circulacion": data.get("circulacion"),
                        "observaciones": data.get("observaciones"),
                        "estado": data.get("estado"),
                        "comentarios": data.get("comentarios"),
                    }

                    if not annotations:
                        processed_data.append(base_row)
                    else:
                        for anotacion in annotations:
                            row = base_row.copy()
                            bbox = anotacion.get("bbox")
                            if bbox is None:
                                points = anotacion.get("points")
                                if points and len(points) == 2:
                                    x1, y1 = points[0]['x'], points[0]['y']
                                    x2, y2 = points[1]['x'], points[1]['y']
                                    bbox = [x1, y1, x2 - x1, y2 - y1]
                                else:
                                    bbox = [None, None, None, None]
                            
                            row.update({
                                "label_anotacion": anotacion.get("label"),
                                "bbox_x": bbox[0],
                                "bbox_y": bbox[1],
                                "bbox_width": bbox[2],
                                "bbox_height": bbox[3],
                            })
                            processed_data.append(row)
                            
                except json.JSONDecodeError:
                    logger.warning(f"Omitiendo fichero JSON mal formado: {filename}")
                    malformed_files.append(filename)
                except Exception as e:
                    logger.error(f"Error procesando el fichero {filename}: {e}")
                    malformed_files.append(filename)

    df = pd.DataFrame.from_records(processed_data) if processed_data else pd.DataFrame()

    excel_buffer = io.BytesIO()
    with pd.ExcelWriter(excel_buffer, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name="Anotaciones")
        if malformed_files:
            pd.DataFrame({"archivos_omitidos": malformed_files}).to_excel(writer, index=False, sheet_name="Archivos Omitidos")

    excel_buffer.seek(0)
    return excel_buffer


@router.get("/download/dataset", response_description="Descarga un ZIP con todo el dataset en crudo.")
async def download_dataset():
    """
    Crea un archivo ZIP en memoria con todo el contenido de la carpeta 'dataset'.
    Esta descarga está pensada para usuarios avanzados (raw data).
    """
    logger.info("Recibida petición para descargar el dataset completo (raw).")
    zip_buffer = io.BytesIO()
    try:
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for root, dirs, files in os.walk(DATASET_DIR):
                if not files and not dirs:
                     arc_root = os.path.relpath(root, DATASET_DIR)
                     if arc_root != ".":
                        zipf.write(root, arc_root)
                for file in files:
                    file_path = os.path.join(root, file)
                    if "__pycache__" in file_path or file.endswith(".pyc"):
                        continue
                    arcname = os.path.relpath(file_path, DATASET_DIR)
                    zipf.write(file_path, arcname)
        zip_buffer.seek(0)
        headers = {'Content-Disposition': 'attachment; filename="dataset_raw.zip"'}
        return StreamingResponse(zip_buffer, media_type="application/zip", headers=headers)
    except Exception as e:
        logger.error(f"Fallo al crear el ZIP del dataset (raw): {e}", exc_info=True)
        raise

@router.get("/download/dataset/report", response_description="Descarga un ZIP con el Excel de resumen y todas las imágenes.")
async def download_dataset_report():
    """
    Crea un ZIP con el fichero Excel de resumen y la carpeta de imágenes.
    Esta descarga está pensada para usuarios básicos.
    """
    logger.info("Recibida petición para descargar el informe (Excel + Imágenes).")
    excel_buffer = _generate_excel_in_memory()
    zip_buffer = io.BytesIO()
    IMAGENES_DIR = os.path.join(DATASET_DIR, "images")
    try:
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zipf:
            zipf.writestr("dataset_anotaciones.xlsx", excel_buffer.getvalue())
            if os.path.exists(IMAGENES_DIR):
                for filename in os.listdir(IMAGENES_DIR):
                    file_path = os.path.join(IMAGENES_DIR, filename)
                    if os.path.isfile(file_path):
                        zipf.write(file_path, os.path.join("images", filename))
            else:
                logger.warning(f"Directorio de imágenes no encontrado: {IMAGENES_DIR}")
        zip_buffer.seek(0)
        headers = {'Content-Disposition': 'attachment; filename="informe_dataset.zip"'}
        return StreamingResponse(zip_buffer, media_type="application/zip", headers=headers)
    except Exception as e:
        logger.error(f"Fallo al crear el ZIP del informe: {e}", exc_info=True)
        raise

@router.get("/download/dataset/excel", response_description="Descarga únicamente el fichero Excel con los datos procesados.")
async def download_dataset_excel():
    """
    Genera y devuelve únicamente el archivo Excel con los datos procesados.
    (Este endpoint se mantiene por si se usa, pero no se muestra en la UI principal).
    """
    logger.info("Recibida petición para descargar únicamente el Excel de datos procesados.")
    excel_buffer = _generate_excel_in_memory()
    headers = {'Content-Disposition': 'attachment; filename="dataset_anotaciones.xlsx"'}
    return StreamingResponse(excel_buffer, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers=headers)