import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";

export function AnnotationTool({ imageUrl, onAnnotationsChange, existingAnnotations = [] }) {
    const canvasRef = useRef(null);
    const imageRef = useRef(new Image());
    const imageDimensionsRef = useRef({ width: 0, height: 0 });

    const [annotations, setAnnotations] = useState(existingAnnotations);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentRect, setCurrentRect] = useState(null);

    const [zoomLevel, setZoomLevel] = useState(1);
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

    const [isPanningWithTouch, setIsPanningWithTouch] = useState(false);
    const [isPanningWithMouse, setIsPanningWithMouse] = useState(false);
    const [lastPanPosition, setLastPanPosition] = useState(null);
    const [touchState, setTouchState] = useState({
        isPinching: false, initialPinchDistance: null, lastPinchMidpoint: null,
        initialZoom: 1, initialPanOffset: { x: 0, y: 0 },
    });

    const [interactionMode, setInteractionMode] = useState('annotate');

    const handleModeChange = (newMode) => {
        setIsDrawing(false); setCurrentRect(null); setIsPanningWithTouch(false);
        setIsPanningWithMouse(false); setLastPanPosition(null);
        setTouchState(prev => ({ ...prev, isPinching: false, initialPinchDistance: null }));
        setInteractionMode(newMode);
    };

    useEffect(() => {
        if (imageUrl && canvasRef.current) {
            const img = imageRef.current;
            img.crossOrigin = "anonymous";
            img.onload = () => {
                const canvas = canvasRef.current; const parentElement = canvas.parentElement;
                imageDimensionsRef.current = { width: img.naturalWidth, height: img.naturalHeight };
                if (canvas && parentElement) {
                    canvas.width = parentElement.offsetWidth; canvas.height = parentElement.offsetHeight;
                    setZoomLevel(1); setPanOffset({ x: 0, y: 0 });
                }
            };
            img.onerror = () => console.error("Error al cargar la imagen para anotación.");
            img.src = imageUrl;
        }
    }, [imageUrl]);

    const getEventCoordinates = useCallback((event) => {
        const canvas = canvasRef.current; if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;
        if (event.touches && event.touches.length > 0) { clientX = event.touches[0].clientX; clientY = event.touches[0].clientY; }
        else { clientX = event.clientX; clientY = event.clientY; }
        const displayX = clientX - rect.left; const displayY = clientY - rect.top;
        const cX = displayX * (canvas.width / rect.width); const cY = displayY * (canvas.height / rect.height);
        return { x: (cX - panOffset.x) / zoomLevel, y: (cY - panOffset.y) / zoomLevel };
    }, [panOffset, zoomLevel]);

    // MODIFICADO: Ahora dibuja un círculo
    const drawAnnotationShape = useCallback((annotation, context, fillColor = 'rgba(255, 0, 0, 0.3)', strokeColor = 'red', lineWidth = 1) => {
        const ctx = context;
        if (ctx && annotation) {
            // annotation.x, y, width, height definen el CUADRADO DELIMITADOR del círculo
            const centerX = annotation.x + annotation.width / 2;
            const centerY = annotation.y + annotation.height / 2;
            const radius = annotation.width / 2; // width y height deberían ser iguales (diámetro)

            if (radius > 0) {
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
                ctx.fillStyle = fillColor;
                ctx.fill();
                ctx.strokeStyle = strokeColor;
                ctx.lineWidth = Math.max(0.5, lineWidth / zoomLevel);
                ctx.stroke();
            }
        }
    }, [zoomLevel]);

    const redrawAnnotations = useCallback(() => {
        const canvas = canvasRef.current;
        const img = imageRef.current;
        const imgDims = imageDimensionsRef.current;

        if (!canvas || !canvas.getContext || !img.complete || imgDims.width === 0) {
            return;
        }
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(panOffset.x, panOffset.y);
        ctx.scale(zoomLevel, zoomLevel);

        ctx.drawImage(img, 0, 0, imgDims.width, imgDims.height);

        annotations.forEach(anno => {
            drawAnnotationShape(anno, ctx);
        });

        // MODIFICADO: Mostrar un CÍRCULO como previsualización mientras se dibuja
        if (isDrawing && currentRect) {
            // Calcular las propiedades del rectángulo que el usuario está definiendo
            const previewUserRectX = Math.min(currentRect.startX, currentRect.endX);
            const previewUserRectY = Math.min(currentRect.startY, currentRect.endY);
            const previewUserRectWidth = Math.abs(currentRect.endX - currentRect.startX);
            const previewUserRectHeight = Math.abs(currentRect.endY - currentRect.startY);

            // Solo dibujar la previsualización si el área es válida
            if (previewUserRectWidth > 0 && previewUserRectHeight > 0) {
                // Calcular las propiedades del círculo inscrito en ese rectángulo
                const previewCircleCenterX = previewUserRectX + previewUserRectWidth / 2;
                const previewCircleCenterY = previewUserRectY + previewUserRectHeight / 2;
                const previewCircleRadius = Math.min(previewUserRectWidth, previewUserRectHeight) / 2;

                if (previewCircleRadius > 0) {
                    // Crear un objeto temporal con formato de anotación para el círculo de previsualización
                    const previewCircleAnnotation = {
                        x: previewCircleCenterX - previewCircleRadius,
                        y: previewCircleCenterY - previewCircleRadius,
                        width: 2 * previewCircleRadius,
                        height: 2 * previewCircleRadius,
                    };
                    // Usar drawAnnotationShape para dibujar el círculo de previsualización
                    // Se pueden usar colores diferentes para distinguirlo de las anotaciones finales
                    drawAnnotationShape(previewCircleAnnotation, ctx, 'rgba(0, 0, 255, 0.2)', 'rgba(0,0,255,0.5)');
                }
            }
        }
        ctx.restore();
    }, [annotations, panOffset, zoomLevel, isDrawing, currentRect, drawAnnotationShape]);

    useEffect(() => redrawAnnotations(), [redrawAnnotations]);

    const internalHandleDrawStart = useCallback((e) => {
        const pos = getEventCoordinates(e);
        setIsDrawing(true); setCurrentRect({ startX: pos.x, startY: pos.y, endX: pos.x, endY: pos.y });
    }, [getEventCoordinates]);

    const internalHandleDrawMove = useCallback((e) => {
        if (!isDrawing || !currentRect) return;
        const pos = getEventCoordinates(e);
        setCurrentRect(prev => ({ ...prev, endX: pos.x, endY: pos.y }));
    }, [isDrawing, currentRect, getEventCoordinates]);

    // MODIFICADO: Crea un círculo a partir del rectángulo dibujado
    const internalHandleDrawEnd = useCallback(() => {
        if (!isDrawing || !currentRect) { setIsDrawing(false); setCurrentRect(null); return; }
        setIsDrawing(false);

        const userRectX = Math.min(currentRect.startX, currentRect.endX);
        const userRectY = Math.min(currentRect.startY, currentRect.endY);
        const userRectWidth = Math.abs(currentRect.endX - currentRect.startX);
        const userRectHeight = Math.abs(currentRect.endY - currentRect.startY);

        if (userRectWidth < 5 || userRectHeight < 5) { setCurrentRect(null); return; }

        const circleCenterX = userRectX + userRectWidth / 2;
        const circleCenterY = userRectY + userRectHeight / 2;
        const circleRadius = Math.min(userRectWidth, userRectHeight) / 2;

        if (circleRadius < 2.5) { setCurrentRect(null); return; } // Círculo demasiado pequeño

        const newAnnotationData = {
            type: 'circle', // Tipo de anotación
            x: circleCenterX - circleRadius,    // Coordenada X del cuadrado delimitador del círculo
            y: circleCenterY - circleRadius,    // Coordenada Y del cuadrado delimitador del círculo
            width: 2 * circleRadius,            // Ancho del cuadrado (diámetro)
            height: 2 * circleRadius,           // Alto del cuadrado (diámetro)
            // coordsLLM sigue guardando los puntos originales que definieron el rectángulo
            coordsLLM: {
                points: [
                    { x: currentRect.startX, y: currentRect.startY },
                    { x: currentRect.endX, y: currentRect.endY }
                ]
            }
        };
        const updatedAnnos = [...annotations, newAnnotationData];
        setAnnotations(updatedAnnos); onAnnotationsChange(updatedAnnos);
        setCurrentRect(null);
    }, [isDrawing, currentRect, annotations, onAnnotationsChange]);

    const getTouchDistance = (t1, t2) => Math.sqrt(Math.pow(t1.clientX - t2.clientX, 2) + Math.pow(t1.clientY - t2.clientY, 2));
    const getTouchMidpoint = (t1, t2, canvas, canvasRect) => { /* ...sin cambios... */
        const clientX = (t1.clientX + t2.clientX) / 2; const clientY = (t1.clientY + t2.clientY) / 2;
        const dispX = clientX - canvasRect.left; const dispY = clientY - canvasRect.top;
        return { x: dispX * (canvas.width / canvasRect.width), y: dispY * (canvas.height / canvasRect.height) };
    };
    const boundPanOffset = useCallback((newX, newY, currentZoom, canvas, imgDim) => { /* ...sin cambios... */
        if (!canvas || !imgDim || imgDim.width === 0) return { x: 0, y: 0 };
        const imgSW = imgDim.width * currentZoom; const imgSH = imgDim.height * currentZoom;
        let bX = newX; let bY = newY;
        if (imgSW <= canvas.width) bX = (canvas.width - imgSW) / 2; else bX = Math.max(canvas.width - imgSW, Math.min(newX, 0));
        if (imgSH <= canvas.height) bY = (canvas.height - imgSH) / 2; else bY = Math.max(canvas.height - imgSH, Math.min(newY, 0));
        return { x: bX, y: bY };
    }, []);

    const handleTouchStart = useCallback((e) => { /* ...sin cambios en su lógica de modos... */
        e.preventDefault();
        const canvas = canvasRef.current; if (!canvas) return;
        const touches = e.touches;

        if (interactionMode === 'annotate') {
            if (touches.length === 1 && !touchState.isPinching) {
                internalHandleDrawStart(e);
            }
        } else if (interactionMode === 'pan') {
            if (touches.length === 1) {
                setIsPanningWithTouch(true);
                const rect = canvas.getBoundingClientRect();
                const dispX = touches[0].clientX - rect.left; const dispY = touches[0].clientY - rect.top;
                setLastPanPosition({ x: dispX * (canvas.width / rect.width), y: dispY * (canvas.height / rect.height) });
            } else if (touches.length === 2) {
                setIsPanningWithTouch(false);
                const rect = canvas.getBoundingClientRect();
                const dist = getTouchDistance(touches[0], touches[1]);
                const mid = getTouchMidpoint(touches[0], touches[1], canvas, rect);
                setTouchState({ isPinching: true, initialPinchDistance: dist, lastPinchMidpoint: mid, initialZoom: zoomLevel, initialPanOffset: panOffset });
            }
        }
    }, [interactionMode, internalHandleDrawStart, touchState.isPinching, zoomLevel, panOffset]);

    const handleTouchMove = useCallback((e) => { /* ...sin cambios en su lógica de modos... */
        e.preventDefault();
        const canvas = canvasRef.current; const imgDim = imageDimensionsRef.current;
        if (!canvas || imgDim.width === 0) return;
        const touches = e.touches;

        if (interactionMode === 'annotate') {
            if (isDrawing && touches.length === 1) {
                internalHandleDrawMove(e);
            }
        } else if (interactionMode === 'pan') {
            if (touches.length === 1 && isPanningWithTouch && lastPanPosition) {
                const rect = canvas.getBoundingClientRect();
                const curDispX = touches[0].clientX - rect.left; const curDispY = touches[0].clientY - rect.top;
                const curCanX = curDispX * (canvas.width / rect.width); const curCanY = curDispY * (canvas.height / rect.height);
                const dx = curCanX - lastPanPosition.x; const dy = curCanY - lastPanPosition.y;
                setPanOffset(prev => boundPanOffset(prev.x + dx, prev.y + dy, zoomLevel, canvas, imgDim));
                setLastPanPosition({ x: curCanX, y: curCanY });
            } else if (touches.length === 2 && touchState.isPinching) {
                const rect = canvas.getBoundingClientRect();
                const curDist = getTouchDistance(touches[0], touches[1]);
                if (touchState.initialPinchDistance === null || touchState.initialPinchDistance === 0) return;
                const scaleMult = curDist / touchState.initialPinchDistance;
                let newZoom = touchState.initialZoom * scaleMult;
                newZoom = Math.max(0.5, Math.min(newZoom, 10));
                const mid = touchState.lastPinchMidpoint;
                const newPanX = mid.x - (mid.x - touchState.initialPanOffset.x) * (newZoom / touchState.initialZoom);
                const newPanY = mid.y - (mid.y - touchState.initialPanOffset.y) * (newZoom / touchState.initialZoom);
                setZoomLevel(newZoom);
                setPanOffset(boundPanOffset(newPanX, newPanY, newZoom, canvas, imgDim));
            }
        }
    }, [interactionMode, isDrawing, internalHandleDrawMove, isPanningWithTouch, lastPanPosition, touchState, zoomLevel, boundPanOffset]);

    const handleTouchEnd = useCallback((e) => { /* ...sin cambios en su lógica de modos... */
        e.preventDefault();
        const wasPinching = touchState.isPinching;

        if (interactionMode === 'annotate') {
            if (isDrawing && (e.touches.length === 0)) {
                internalHandleDrawEnd();
            }
        } else if (interactionMode === 'pan') {
            if (wasPinching && e.touches.length < 2) {
                setTouchState(prev => ({ ...prev, isPinching: false, initialPinchDistance: null }));
            }
            if (isPanningWithTouch && e.touches.length === 0) {
                setIsPanningWithTouch(false); setLastPanPosition(null);
            }
            if (wasPinching && e.touches.length === 1) {
                const canvas = canvasRef.current; if (!canvas) return;
                const rect = canvas.getBoundingClientRect(); const touch = e.touches[0];
                const dispX = touch.clientX - rect.left; const dispY = touch.clientY - rect.top;
                setIsPanningWithTouch(true);
                setLastPanPosition({ x: dispX * (canvas.width / rect.width), y: dispY * (canvas.height / rect.height) });
            }
        }
        if (e.touches.length === 0) {
            if (isDrawing && interactionMode === 'annotate') { /* manejado arriba */ }
            else { setIsDrawing(false); }
            if (currentRect && !isDrawing) setCurrentRect(null);
        }
    }, [interactionMode, isDrawing, internalHandleDrawEnd, isPanningWithTouch, touchState, currentRect]);

    const handleMouseDown = useCallback((e) => { /* ...sin cambios... */
        if (e.button !== 0) return;
        if (interactionMode === 'annotate') {
            internalHandleDrawStart(e);
        } else if (interactionMode === 'pan') {
            setIsPanningWithMouse(true);
            const canvas = canvasRef.current; if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            const dispX = e.clientX - rect.left; const dispY = e.clientY - rect.top;
            setLastPanPosition({ x: dispX * (canvas.width / rect.width), y: dispY * (canvas.height / rect.height) });
        }
    }, [interactionMode, internalHandleDrawStart]);
    const handleMouseMove = useCallback((e) => { /* ...sin cambios... */
        const canvas = canvasRef.current; const imgDim = imageDimensionsRef.current;
        if (!canvas || imgDim.width === 0) return;
        if (interactionMode === 'annotate') {
            if (isDrawing) internalHandleDrawMove(e);
        } else if (interactionMode === 'pan') {
            if (isPanningWithMouse && lastPanPosition) {
                const rect = canvas.getBoundingClientRect();
                const curDispX = e.clientX - rect.left; const curDispY = e.clientY - rect.top;
                const curCanX = curDispX * (canvas.width / rect.width); const curCanY = curDispY * (canvas.height / rect.height);
                const dx = curCanX - lastPanPosition.x; const dy = curCanY - lastPanPosition.y;
                setPanOffset(prev => boundPanOffset(prev.x + dx, prev.y + dy, zoomLevel, canvas, imgDim));
                setLastPanPosition({ x: curCanX, y: curCanY });
            }
        }
    }, [interactionMode, isDrawing, internalHandleDrawMove, isPanningWithMouse, lastPanPosition, zoomLevel, boundPanOffset]);
    const handleMouseUpOrLeave = useCallback((e) => { /* ...sin cambios... */
        if (interactionMode === 'annotate') {
            if (isDrawing) internalHandleDrawEnd(e);
        } else if (interactionMode === 'pan') {
            if (isPanningWithMouse) {
                setIsPanningWithMouse(false); setLastPanPosition(null);
            }
        }
        if (isDrawing && interactionMode === 'annotate') { /* manejado arriba */ }
        else { setIsDrawing(false); }
        if (currentRect && !isDrawing) setCurrentRect(null);
    }, [interactionMode, isDrawing, internalHandleDrawEnd, isPanningWithMouse, currentRect]);
    const handleWheelZoom = useCallback((e) => { /* ...sin cambios... */
        e.preventDefault();
        const canvas = canvasRef.current; const imgDim = imageDimensionsRef.current;
        if (!canvas || imgDim.width === 0) return;
        const rect = canvas.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
        const mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
        const zoomIntensity = 0.1; const dir = e.deltaY < 0 ? 1 : -1;
        const oldZoom = zoomLevel; let newZoom = oldZoom * (1 + dir * zoomIntensity);
        newZoom = Math.max(0.5, Math.min(newZoom, 10));
        const newPanX = mouseX - (mouseX - panOffset.x) * (newZoom / oldZoom);
        const newPanY = mouseY - (mouseY - panOffset.y) * (newZoom / oldZoom);
        setZoomLevel(newZoom);
        setPanOffset(boundPanOffset(newPanX, newPanY, newZoom, canvas, imgDim));
    }, [zoomLevel, panOffset, boundPanOffset]);

    useEffect(() => {
        const canvas = canvasRef.current; if (!canvas) return;
        const options = { passive: false };
        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseup', handleMouseUpOrLeave);
        canvas.addEventListener('mouseleave', handleMouseUpOrLeave);
        canvas.addEventListener('touchstart', handleTouchStart, options);
        canvas.addEventListener('touchmove', handleTouchMove, options);
        canvas.addEventListener('touchend', handleTouchEnd, options);
        canvas.addEventListener('touchcancel', handleTouchEnd, options);
        canvas.addEventListener('wheel', handleWheelZoom, options);
        return () => {
            canvas.removeEventListener('mousedown', handleMouseDown);
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('mouseup', handleMouseUpOrLeave);
            canvas.removeEventListener('mouseleave', handleMouseUpOrLeave);
            canvas.removeEventListener('touchstart', handleTouchStart, options);
            canvas.removeEventListener('touchmove', handleTouchMove, options);
            canvas.removeEventListener('touchend', handleTouchEnd, options);
            canvas.removeEventListener('touchcancel', handleTouchEnd, options);
            canvas.removeEventListener('wheel', handleWheelZoom, options);
        };
    }, [handleMouseDown, handleMouseMove, handleMouseUpOrLeave, handleTouchStart, handleTouchMove, handleTouchEnd, handleWheelZoom]);

    const clearLastAnnotation = () => {
        if (annotations.length > 0) { const newAnnos = annotations.slice(0, -1); setAnnotations(newAnnos); onAnnotationsChange(newAnnos); }
    };
    const clearAllAnnotations = () => {
        setAnnotations([]); onAnnotationsChange([]);
    };

    if (!imageUrl) return null;


    return (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', touchAction: 'none', overflow: 'hidden' }}>
            <canvas
                ref={canvasRef}
                style={{
                    cursor: interactionMode === 'annotate' ? 'crosshair' : (isPanningWithMouse || isPanningWithTouch ? 'grabbing' : 'grab'),
                    display: 'block',
                    width: '100%',
                    height: '100%'
                }}
            />

            {/* Botones de cambio de modo */}
            <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 20, display: 'flex', gap: '16px', background: 'rgba(255,255,255,0.8)', padding: '5px', borderRadius: '16px' }} className='text-xl'>

                <Button
                    type="button"
                    onClick={() => handleModeChange('annotate')}
                    variant="outline"
                    size="sm"
                    className={interactionMode === 'annotate' ? 'bg-blue-500 text-white' : ''}
                >
                    Anotar
                </Button>
                <Button
                    type="button"
                    onClick={() => handleModeChange('pan')}
                    variant="outline"
                    size="sm"
                    className={interactionMode === 'pan' ? 'bg-blue-500 text-white' : ''}
                >
                    Mover/Zoom
                </Button>

            </div>

            <div style={{ position: 'absolute', bottom: '10px', left: '10px', zIndex: 20, display: 'flex', gap: '16px', background: 'rgba(255,255,255,0.8)', padding: '5px', borderRadius: '16px' }} className='text-xl'>


                <Button
                    type="button"
                    onClick={clearLastAnnotation}
                    variant="outline"
                    size="sm"
                >
                    Deshacer
                </Button>
                <Button
                    type="button"
                    onClick={clearAllAnnotations}
                    variant="outline"
                    size="sm"
                >
                    Limpiar
                </Button>
            </div>

        </div>
    );
}

