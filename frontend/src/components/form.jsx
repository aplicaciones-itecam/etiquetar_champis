import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'; // Añadir useEffect

import { AppInput, AppTextarea } from "@/components/ui/form-app"; // AppSelect no se usa directamente, sino los selects nativos
import { Button } from "@/components/ui/button";
import {
    Form,
} from "@/components/ui/form";
// import { SelectItem } from "@/components/ui/select"; // No se usa directamente

import { ImageDisplay } from './image/image-capture';
import { AnnotationTool } from './image/image-annotation';
import useImageAnnotation from '@/hooks/useImageAnnotation';

const formSchema = z.object({
    diaEntrada: z.string().min(1, "El día de entrada es requerido."),
    sala: z.string().min(1, "La sala es requerida."),
    muestra: z.string().min(1, "La muestra es requerida."),
    fecha: z.string().min(1, "La fecha es requerida."),
    hora: z.string().min(1, "La hora es requerida."),
    tempCompost: z.coerce.number().optional(),
    tempAmbiente: z.coerce.number().optional(),
    humedad: z.coerce.number().optional(),
    co2: z.coerce.number().optional(),
    circulacion: z.coerce.number().optional(),
    observaciones: z.string().optional(),
});

const today = new Date();

export function FormChampi() {
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            diaEntrada: "",
            sala: "",
            muestra: "",
            fecha: today.toISOString().split('T')[0],
            hora: today.toTimeString().split(' ')[0].substring(0, 5),
            tempCompost: "",
            tempAmbiente: "",
            humedad: "",
            co2: "",
            circulacion: "",
            observaciones: "",
        },
    });

    const {
        originalImage,
        setOriginalImage,
        // annotatedImageUrl, // No se usa para la lógica de 'dirty'
        currentAnnotations,
        setAnnotations,
        // getAnnotatedImageBlob, // No se usa para la lógica de 'dirty'
    } = useImageAnnotation();

    const [isFullscreen, setIsFullscreen] = useState(false);
    const annotationSectionRef = useRef(null);
    const isSafeNavigationRef = useRef(false); // Ref para controlar la recarga segura

    // Efecto para el aviso de 'beforeunload'
    useEffect(() => {
        const handleBeforeUnload = (event) => {
            if (isSafeNavigationRef.current) {
                isSafeNavigationRef.current = false; // Resetear para futuras navegaciones
                return;
            }

            const hasUnsavedImageOrAnnotations = !!originalImage || (currentAnnotations && currentAnnotations.length > 0);
            const isFormDirty = form.formState.isDirty;

            if (hasUnsavedImageOrAnnotations || isFormDirty) {
                event.preventDefault();
                event.returnValue = ''; // Requerido por el estándar, aunque el mensaje es genérico
                return ''; // Para algunos navegadores más antiguos
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [originalImage, currentAnnotations, form.formState.isDirty]); // Dependencias para que el closure capture los valores actualizados

    const handleFileSelected = (event) => {
        event.preventDefault();
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageDataUrl = e.target?.result;
                if (typeof imageDataUrl === 'string') {
                    setOriginalImage(imageDataUrl);
                    setAnnotations([]);
                }
            };
            reader.readAsDataURL(file);
        } else {
            setOriginalImage(null);
            setAnnotations([]);
        }
    };

    const handleAnnotationsChangeCallback = useCallback((newAnnotations) => {
        setAnnotations(newAnnotations);
    }, [setAnnotations]);

    const toggleFullscreen = () => {
        // ... (lógica de pantalla completa sin cambios)
        const element = annotationSectionRef.current;
        if (!element) return;

        if (!document.fullscreenElement &&
            !document.webkitFullscreenElement &&
            !document.mozFullScreenElement &&
            !document.msFullscreenElement) {

            let requestMethod =
                element.requestFullscreen ||
                element.webkitRequestFullscreen ||
                element.mozRequestFullScreen ||
                element.msRequestFullscreen;

            if (requestMethod) {
                requestMethod.call(element)
                    .then(() => setIsFullscreen(true))
                    .catch(err => {
                        console.error("Error al intentar activar pantalla completa:", err);
                        alert(`Error al intentar activar pantalla completa: ${err.message} (${err.name})`);
                    });
            } else {
                alert("La API de pantalla completa no es compatible con este navegador.");
            }
        } else {
            let exitMethod =
                document.exitFullscreen ||
                document.webkitExitFullscreen ||
                document.mozCancelFullScreen ||
                document.msExitFullscreen;

            if (exitMethod) {
                exitMethod.call(document)
                    .then(() => setIsFullscreen(false))
                    .catch(err => {
                        console.error("Error al intentar salir de pantalla completa:", err);
                        alert(`Error al intentar salir de pantalla completa: ${err.message} (${err.name})`);
                    });
            } else {
                alert("La API para salir de pantalla completa no es compatible con este navegador.");
            }
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange); // Safari
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);    // Firefox
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);     // IE/Edge
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
            document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
        };
    }, []);


    async function onSubmit(data) {
        let pureBase64 = "";
        if (originalImage) {
            const parts = originalImage.split(',');
            if (parts.length === 2 && parts[0].startsWith('data:image') && parts[0].includes('base64')) {
                pureBase64 = parts[1];
            } else {
                console.error("originalImage no es una Data URL Base64 válida.");
                alert("La imagen original no es válida. Por favor, vuelve a seleccionarla.");
                return;
            }
        } else {
            // Permitir envío sin imagen si es opcional, o mostrar alerta si es requerida
            // Para este ejemplo, si no hay imagen, pureBase64 quedará vacío.
            // Si la imagen fuera requerida, aquí deberías añadir:
            // alert("Por favor, selecciona una imagen.");
            // return;
        }

        const payload = {
            ...data,
            annotatedImageFile: pureBase64, // Puede estar vacío si no hay imagen
            annotations: currentAnnotations
                ? currentAnnotations.map(ann => ann.coordsLLM)
                : [],
        };

        console.log("Payload a enviar (JSON):", payload);

        try {
            const response = await fetch('http://192.168.15.12:8000/upload-image/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: response.statusText }));
                throw new Error(`Error en la API: ${response.status} ${errorData.detail || response.statusText}`);
            }

            const result = await response.json();
            console.log('Respuesta de la API:', result);
            alert("¡Formulario enviado con éxito!");


            form.reset();
            setOriginalImage(null);
            setAnnotations([]);

            // Marca la navegación como segura ANTES de recargar
            isSafeNavigationRef.current = true;
            location.reload();

        } catch (error) {
            console.error('Error al enviar el formulario:', error);
            alert(`Error al enviar el formulario: ${error.message}`);
            isSafeNavigationRef.current = false; // Asegura que se resetee en caso de error
        }
    }

    const salasArray = useMemo(() => Array.from({ length: 14 }, (_, i) => ({
        value: (i + 1).toString(), label: `Sala ${i + 1}`,
    })), []);
    const muestrasArray = useMemo(() => Array.from({ length: 3 }, (_, i) => ({
        value: (i + 1).toString(), label: `Muestra ${i + 1}`,
    })), []);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4">
                <AppInput form={form} name="diaEntrada" label="Día de entrada" type="date" />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                        <label htmlFor="sala-select" className="flex items-center gap-2 text-sm leading-none font-medium mb-2">
                            Sala
                        </label>
                        <select id="sala-select" className="border rounded-md p-2 w-full" {...form.register("sala")}>
                            <option value="">Seleccione una sala</option>
                            {salasArray.map((sala) => (
                                <option key={sala.value} value={sala.value}>
                                    {sala.label}
                                </option>
                            ))}
                        </select>
                        {form.formState.errors.sala && <p className="text-destructive text-sm mt-1">{form.formState.errors.sala.message}</p>}
                    </div>
                    <div>
                        <label htmlFor="muestra-select" className="flex items-center gap-2 text-sm leading-none font-medium mb-2">
                            Muestra
                        </label>
                        <select id="muestra-select" className="border rounded-md p-2 w-full" {...form.register("muestra")}>
                            <option value="">Seleccione una muestra</option>
                            {muestrasArray.map((muestra) => (
                                <option key={muestra.value} value={muestra.value}>
                                    {muestra.label}
                                </option>
                            ))}
                        </select>
                        {form.formState.errors.muestra && <p className="text-destructive text-sm mt-1">{form.formState.errors.muestra.message}</p>}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <AppInput form={form} name="fecha" label="Fecha" type="date" />
                    <AppInput form={form} name="hora" label="Hora" type="time" />
                </div>

                <div>
                    <label htmlFor="imageUpload" className="block text-sm font-medium text-gray-700 mb-1">
                        Imagen (Opcional)
                    </label>
                    <input
                        type="file"
                        id="imageUpload"
                        accept="image/*"
                        onChange={handleFileSelected}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                </div>

                {originalImage && (
                    <div ref={annotationSectionRef} className={`my-4 border rounded-md p-2 ${isFullscreen ? 'bg-white fixed inset-0 z-[100] overflow-auto' : ''}`}> {/* Aumentado z-index para fullscreen */}
                        <div className="flex justify-between items-center mb-2">
                            <p className="text-sm font-medium">Anotar Imagen:</p>
                            <Button type="button" onClick={toggleFullscreen} variant="outline" size="sm">
                                {isFullscreen ? 'Salir de Pantalla Completa' : 'Pantalla Completa'}
                            </Button>
                        </div>
                        <ImageDisplay imageUrl={originalImage}>
                            <AnnotationTool
                                imageUrl={originalImage}
                                onAnnotationsChange={handleAnnotationsChangeCallback}
                                existingAnnotations={currentAnnotations}
                            />
                        </ImageDisplay>
                    </div>
                )}

                <AppInput form={form} name="tempCompost" label="Temperatura Compost (ºC)" type="number" step="0.1" placeholder="Ej: 25.5" />
                <AppInput form={form} name="tempAmbiente" label="Temperatura Ambiente (ºC)" type="number" step="0.1" placeholder="Ej: 22.0" />
                <AppInput form={form} name="humedad" label="Humedad (%)" type="number" step="0.1" placeholder="Ej: 85.0" />
                <AppInput form={form} name="co2" label="CO2 (PPM)" type="number" placeholder="Ej: 800" />
                <AppInput form={form} name="circulacion" label="Circulación" type="number" placeholder="Ej: 100" />
                <AppTextarea form={form} name="observaciones" label="Observaciones" placeholder="Añade tus observaciones aquí..." />

                <Button type="submit">Guardar registro</Button>
            </form>
        </Form>
    );
}