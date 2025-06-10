import React, { useState, useRef, useEffect } from 'react';

export function AnnotationViewer({ imageUrl, annotations = [], className = "", showAsCircle = true }) {
    const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
    const imgRef = useRef(null);

    useEffect(() => {
        const updateDimensions = () => {
            if (imgRef.current) {
                const { naturalWidth, naturalHeight, width, height } = imgRef.current;
                setImageDimensions({
                    naturalWidth,
                    naturalHeight,
                    width,
                    height,
                    scaleX: width / naturalWidth,
                    scaleY: height / naturalHeight,
                    aspectRatio: naturalWidth / naturalHeight
                });
            }
        };

        if (imgRef.current) {
            if (imgRef.current.complete) {
                updateDimensions();
            } else {
                imgRef.current.addEventListener('load', updateDimensions);
            }
        }

        window.addEventListener('resize', updateDimensions);

        return () => {
            if (imgRef.current) {
                imgRef.current.removeEventListener('load', updateDimensions);
            }
            window.removeEventListener('resize', updateDimensions);
        };
    }, [imageUrl]);

    if (!imageUrl) {
        return (
            <div className={`border rounded-lg flex items-center justify-center bg-gray-100 h-64 ${className}`}>
                <p className="text-gray-500">No hay imagen disponible</p>
            </div>
        );
    }

    return (
        <div className={`relative ${className} `}>
            <div className="relative overflow-hidden">
                <picture>
                    <source
                        srcSet={imageUrl.startsWith('http') ? imageUrl : `http://localhost:8000${imageUrl}`}
                        type="image/webp"
                    />
                    <source
                        srcSet={imageUrl.startsWith('http') ? imageUrl : `http://localhost:8000${imageUrl}`}
                        type="image/png"
                    />
                </picture>
                <img
                    ref={imgRef}
                    src={imageUrl.startsWith('http') ? imageUrl : `http://localhost:8000${imageUrl}`}
                    alt="Imagen anotada"
                    className="max-w-full h-auto rounded-lg"
                    loading='lazy'
                />

                {/* Dibujar las anotaciones encima de la imagen */}
                {annotations && annotations.length > 0 && imageDimensions.width > 0 && annotations.map((annotation, index) => {
                    if (!Array.isArray(annotation) || annotation.length !== 4) {
                        console.warn("Formato de anotación no soportado:", annotation);
                        return null;
                    }

                    // Extraer coordenadas [x1, y1, width, height]
                    const [x1, y1, width, height] = annotation;

                    // Determinar si son coordenadas normalizadas o absolutas
                    const isNormalized = x1 <= 1 && y1 <= 1 && width <= 1 && height <= 1;

                    // Calcular el centro y el radio para mantener proporciones correctas
                    let centerX, centerY, radiusX, radiusY;

                    if (isNormalized) {
                        // Si están normalizadas, usarlas directamente
                        centerX = x1 + width / 2;
                        centerY = y1 + height / 2;

                        // Usar el mínimo entre ancho y alto para el diámetro del círculo
                        // Esto hace que los círculos sean más pequeños y ajustados al tamaño real
                        const diameter = Math.min(width, height);
                        radiusX = diameter / 2;
                        radiusY = diameter / 2;
                    } else {
                        // Si son coordenadas en píxeles, normalizarlas
                        centerX = (x1 + width / 2) / imageDimensions.naturalWidth;
                        centerY = (y1 + height / 2) / imageDimensions.naturalHeight;

                        // Usar el mínimo entre ancho y alto para el diámetro del círculo
                        const diameter = Math.min(width, height);
                        radiusX = diameter / (2 * imageDimensions.naturalWidth);
                        radiusY = diameter / (2 * imageDimensions.naturalHeight);
                    }

                    if (showAsCircle) {
                        // Para mostrar un círculo perfecto, necesitamos ajustar por la relación de aspecto
                        const aspectRatio = imageDimensions.aspectRatio || 1;

                        // Aplicar un factor de escala para reducir aún más el tamaño si es necesario
                        // Puedes ajustar este factor según sea necesario (0.8 = 80% del tamaño original)
                        const scaleFactor = 1;
                        radiusX *= scaleFactor;
                        radiusY *= scaleFactor;

                        // Ajustar el radio para mantener una forma circular
                        if (aspectRatio > 1) {
                            radiusY = radiusX * aspectRatio;
                        } else {
                            radiusX = radiusY / aspectRatio;
                        }

                        return (
                            <div
                                key={index}
                                className="absolute border-2 border-red-500 bg-red-200 opacity-35 rounded-full"
                                style={{
                                    left: `${(centerX - radiusX) * 100}%`,
                                    top: `${(centerY - radiusY) * 100}%`,
                                    width: `${radiusX * 2 * 100}%`,
                                    height: `${radiusY * 2 * 100}%`,
                                }}
                            />
                        );
                    } else {
                        // Representación rectangular
                        return (
                            <div
                                key={index}
                                className="absolute border-2 border-red-500 bg-red-200 bg-opacity-30"
                                style={{
                                    left: isNormalized ? `${x1 * 100}%` : `${(x1 / imageDimensions.naturalWidth) * 100}%`,
                                    top: isNormalized ? `${y1 * 100}%` : `${(y1 / imageDimensions.naturalHeight) * 100}%`,
                                    width: isNormalized ? `${width * 100}%` : `${(width / imageDimensions.naturalWidth) * 100}%`,
                                    height: isNormalized ? `${height * 100}%` : `${(height / imageDimensions.naturalHeight) * 100}%`,
                                }}
                            />
                        );
                    }
                })}
            </div>
        </div>
    );
}