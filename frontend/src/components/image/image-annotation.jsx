import React, { useRef, useEffect, useState } from 'react';

export function AnnotationTool({ imageUrl, onAnnotationsChange, existingAnnotations = [] }) {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [annotations, setAnnotations] = useState(existingAnnotations);
    const [currentRect, setCurrentRect] = useState(null);
    const imageRef = useRef(new Image());

    useEffect(() => {
        if (imageUrl && canvasRef.current) { // Asegurarse que canvasRef.current exista
            const img = imageRef.current;
            img.onload = () => {
                const canvas = canvasRef.current;
                // El elemento padre del canvas es el div que tiene width: 100%, height: 100%
                // y está posicionado absolutamente sobre ImageDisplay.
                // Sus dimensiones deberían coincidir con las de la imagen mostrada.
                const parentElement = canvas.parentElement;

                if (canvas && parentElement) {
                    // Establecer la resolución del buffer de dibujo del canvas
                    // para que coincida con su tamaño de visualización.
                    canvas.width = parentElement.offsetWidth;
                    canvas.height = parentElement.offsetHeight;

                    console.log("Canvas dimensions set to (drawing buffer):", canvas.width, "x", canvas.height);
                    console.log("Image natural dimensions (for reference):", img.naturalWidth, "x", img.naturalHeight);
                    console.log("Canvas parentElement (display size):", parentElement.offsetWidth, "x", parentElement.offsetHeight);


                    redrawAnnotations(); // Redibujar con las nuevas dimensiones
                }
            };
            img.onerror = () => {
                console.error("Error al cargar la imagen para anotación.");
            }
            img.src = imageUrl; // Esto dispara el img.onload
        }
    }, [imageUrl]); // Este efecto se ejecuta cuando imageUrl cambia

    useEffect(() => {
        // Este efecto se encarga de redibujar cuando las anotaciones confirmadas cambian,
        // o cuando la imagen cambia (lo cual también maneja el efecto anterior para dimensiones),
        // o cuando el estado de dibujo cambia.
        if (canvasRef.current && canvasRef.current.getContext('2d')) { // Asegurarse que el canvas esté listo
            redrawAnnotations();
        }
    }, [annotations, imageUrl, isDrawing, currentRect]); // Añadir isDrawing y currentRect para asegurar limpieza y feedback

    const getEventCoordinates = (event) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect(); // Coordenadas y tamaño del canvas en la pantalla

        let clientX, clientY;
        if (event.touches && event.touches.length > 0) {
            clientX = event.touches[0].clientX;
            clientY = event.touches[0].clientY;
        } else {
            clientX = event.clientX;
            clientY = event.clientY;
        }

        // Dado que ahora canvas.width/height deberían ser iguales a rect.width/height,
        // scaleX y scaleY deberían ser muy cercanos a 1.
        // Se mantiene el escalado por si hay pequeñas diferencias (ej. subpíxeles en rect).
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY,
        };
    };

    const handleDrawStart = (e) => {
        if (e.type === 'touchstart') {
            e.preventDefault(); // Prevenir scroll en táctil
        }
        if (!canvasRef.current) return;
        const pos = getEventCoordinates(e);
        setIsDrawing(true);
        setCurrentRect({ startX: pos.x, startY: pos.y, endX: pos.x, endY: pos.y });
    };

    const handleDrawMove = (e) => {
        if (!isDrawing || !canvasRef.current || !currentRect) return;
        if (e.type === 'touchmove') {
            e.preventDefault(); // Prevenir scroll en táctil mientras se dibuja
        }
        const pos = getEventCoordinates(e);
        const updatedCurrentRect = { ...currentRect, endX: pos.x, endY: pos.y };
        setCurrentRect(updatedCurrentRect);

        // Dibujo inmediato para feedback visual
        // No es necesario limpiar y redibujar todo aquí si el useEffect [..., currentRect] lo hace.
        // Sin embargo, para un feedback más rápido, podrías dibujar solo el currentRect aquí
        // sobre lo ya existente, y el useEffect se encarga de la limpieza/redibujo completo.
        // Por ahora, dejaremos que el useEffect maneje el redibujado completo.
    };

    const handleDrawEnd = (e) => {
        if (e.type === 'touchend' || e.type === 'touchcancel') {
            e.preventDefault();
        }
        if (!isDrawing || !currentRect) {
            // Si no se estaba dibujando pero hay un currentRect (ej. un clic sin arrastrar), limpiarlo.
            if (currentRect) setCurrentRect(null);
            setIsDrawing(false); // Asegurar que isDrawing esté en false
            redrawAnnotations(); // Redibujar para limpiar cualquier feedback visual del currentRect
            return;
        }

        setIsDrawing(false);
        const newAnnotation = {
            x: Math.min(currentRect.startX, currentRect.endX),
            y: Math.min(currentRect.startY, currentRect.endY),
            width: Math.abs(currentRect.endX - currentRect.startX),
            height: Math.abs(currentRect.endY - currentRect.startY),
            coordsLLM: {
                points: [
                    {
                        x: currentRect.startX,
                        y: currentRect.startY
                    },
                    {
                        x: currentRect.endX,
                        y: currentRect.endY
                    }
                ]
            }
        };



        console.log("NIU ANOTEISION", newAnnotation);

        const updatedAnnotations = [...annotations, newAnnotation];
        setAnnotations(updatedAnnotations);
        onAnnotationsChange(updatedAnnotations);

        /*         if (newAnnotation.width > 5 && newAnnotation.height > 5) { // Umbral mínimo
                    const updatedAnnotations = [...annotations, newAnnotation];
                    setAnnotations(updatedAnnotations);
                    onAnnotationsChange(updatedAnnotations);
                } */
        setCurrentRect(null);
        // La actualización de 'annotations' debería disparar el useEffect para redibujar
        // Si no, se puede llamar a redrawAnnotations() explícitamente.
        // redrawAnnotations(); // Descomentar si el useEffect no es suficiente.
    };

    const drawRect = (rect, context, color = 'rgba(255, 0, 0, 0.5)', strokeColor = 'red', lineWidth = 1) => {
        const ctx = context || canvasRef.current?.getContext('2d');
        if (ctx && rect) {
            const x = rect.x !== undefined ? rect.x : Math.min(rect.startX, rect.endX);
            const y = rect.y !== undefined ? rect.y : Math.min(rect.startY, rect.endY);
            const width = rect.width !== undefined ? rect.width : Math.abs(rect.endX - rect.startX);
            const height = rect.height !== undefined ? rect.height : Math.abs(rect.endY - rect.startY);

            if (width > 0 && height > 0) {
                ctx.fillStyle = color;
                ctx.fillRect(x, y, width, height);
                ctx.strokeStyle = strokeColor;
                ctx.lineWidth = lineWidth;
                ctx.strokeRect(x, y, width, height);
            }
        }
    };

    const redrawAnnotations = () => {
        const canvas = canvasRef.current;
        if (!canvas || !canvas.getContext || canvas.width === 0 || canvas.height === 0) {
            // No dibujar si el canvas no está listo o no tiene dimensiones
            return;
        }
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        annotations.forEach(anno => drawRect(anno, ctx));
        // Si se está dibujando activamente un nuevo rectángulo, también dibujarlo
        if (isDrawing && currentRect) {
            // Usar un estilo ligeramente diferente para el rectángulo en progreso
            drawRect(currentRect, ctx, 'rgba(255, 0, 0, 0.2)', 'rgba(255,0,0,0.5)');
        }
    };

    useEffect(() => {
        // Este useEffect se encarga de redibujar cuando las anotaciones confirmadas cambian,
        // o cuando la imagen cambia.
        redrawAnnotations();
    }, [annotations, imageUrl, isDrawing, currentRect]); // Añadir isDrawing y currentRect para asegurar limpieza

    const clearLastAnnotation = () => {
        if (annotations.length > 0) {
            const newAnnotations = annotations.slice(0, -1);
            setAnnotations(newAnnotations);
            onAnnotationsChange(newAnnotations);
        }
    };

    const clearAllAnnotations = () => {
        setAnnotations([]);
        onAnnotationsChange([]);
    };


    if (!imageUrl) return null;

    return (
        // touchAction: 'none' ayuda a prevenir comportamientos táctiles por defecto como el scroll o zoom
        // mientras se interactúa con el canvas.
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', touchAction: 'none' }}>
            <canvas
                ref={canvasRef}
                onMouseDown={handleDrawStart}
                onMouseMove={handleDrawMove}
                onMouseUp={handleDrawEnd}
                onMouseLeave={handleDrawEnd} // Finalizar si el ratón sale del canvas
                onTouchStart={handleDrawStart}
                onTouchMove={handleDrawMove}
                onTouchEnd={handleDrawEnd}
                onTouchCancel={handleDrawEnd} // Finalizar si el sistema cancela el toque
                style={{ cursor: 'crosshair', display: 'block', width: '100%', height: '100%' }}
            />
            <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(255,255,255,0.8)', padding: '8px', zIndex: 10, display: 'flex', gap: '10px', borderRadius: '36px' }}>
                <button onClick={clearLastAnnotation} disabled={annotations.length === 0}>Deshacer</button>
                <button onClick={clearAllAnnotations} disabled={annotations.length === 0}>Limpiar</button>
            </div>
        </div>
    );
}
