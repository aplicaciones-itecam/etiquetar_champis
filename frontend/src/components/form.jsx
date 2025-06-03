import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import React, { useState, useCallback, useMemo } from 'react'; // Añadir useMemo

import { AppInput, AppTextarea, AppSelect } from "@/components/ui/form-app";
import { Button } from "@/components/ui/button"
import {
    Form,

} from "@/components/ui/form"
import { SelectItem } from "@/components/ui/select"

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
})

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
            tempCompost: "", // O 0 si prefieres
            tempAmbiente: "",
            humedad: "",
            co2: "",
            circulacion: "",
            observaciones: "",
        },
    })

    // Usar el hook para la lógica de anotación de imagen
    const {
        originalImage,
        setOriginalImage,
        annotatedImageUrl, // Para la previsualización de la imagen anotada
        currentAnnotations,
        setAnnotations,
        getAnnotatedImageBlob,
    } = useImageAnnotation();

    const handleFileSelected = (event) => {
        event.preventDefault();
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageDataUrl = e.target?.result;
                if (typeof imageDataUrl === 'string') {
                    setOriginalImage(imageDataUrl); // Establece la imagen en el hook
                    setAnnotations([]); // Resetea anotaciones previas
                }
            };
            reader.readAsDataURL(file);

        } else {
            setOriginalImage(null); // Limpia la imagen si no se selecciona archivo
            setAnnotations([]);
        }
    };

    const handleAnnotationsChangeCallback = useCallback((newAnnotations) => {

        setAnnotations(newAnnotations);
    }, [setAnnotations]);

    async function onSubmit(data) {


        let pureBase64 = "";
        if (originalImage) {
            const parts = originalImage.split(',');
            if (parts.length === 2 && parts[0].startsWith('data:image') && parts[0].includes('base64')) {
                pureBase64 = parts[1];
            } else {
                console.error("originalImage no es una Data URL Base64 válida.");

                return; // Detener el envío si la imagen no es válida
            }
        } else {
            alert("La imagen no es válida")
            return; // Detener el envío si no hay imagen
        }

        const payload = {
            ...data, // Incluye todos los campos del formulario (diaEntrada, sala, etc.)
            annotatedImageFile: pureBase64,
            annotations: currentAnnotations
                ? currentAnnotations.map(ann => ann.coordsLLM)
                : [],
        };

        console.log("Payload a enviar (JSON):", payload);

        try {
            const response = await fetch('http://172.20.10.4:8000/upload-image/', { // Reemplaza con tu endpoint
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: response.statusText }));
                throw new Error(`Error en la API: ${response.status} ${errorData.detail || response.statusText}`);
            }

            const result = await response.json();
            console.log('Respuesta de la API:', result);


            location.reload();
        } catch (error) {
            console.error('Error al enviar el formulario:', error);

        }
    }

    const salasArray = useMemo(() => Array.from({ length: 14 }, (_, i) => ({
        value: (i + 1).toString(),
        label: `Sala ${i + 1}`,
    })), []);

    const muestrasArray = useMemo(() => Array.from({ length: 3 }, (_, i) => ({
        value: (i + 1).toString(),
        label: `Muestra ${i + 1}`,
    })), []);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4">

                <AppInput form={form} name="diaEntrada" label="Día de entrada" type="date" />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <AppSelect form={form} name="sala" label="Sala" placeholder="Seleccione una sala">
                        {salasArray.map((sala) => (
                            <SelectItem key={sala.value} value={sala.value}>
                                {sala.label}
                            </SelectItem>
                        ))}
                    </AppSelect>

                    <AppSelect form={form} name="muestra" label="Muestra" placeholder="Seleccione una muestra">
                        {muestrasArray.map((muestra) => (
                            <SelectItem key={muestra.value} value={muestra.value}>
                                {muestra.label}
                            </SelectItem>
                        ))}
                    </AppSelect>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <AppInput form={form} name="fecha" label="Fecha" type="date" />
                    <AppInput form={form} name="hora" label="Hora" type="time" />
                </div>

                {/* Input para la imagen */}
                <div>
                    <label htmlFor="imageUpload" className="block text-sm font-medium text-gray-700 mb-1">
                        Imagen
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
                    <div className="my-4 border rounded-md p-2">
                        <p className="text-sm font-medium mb-2">Anotar Imagen:</p>
                        <ImageDisplay imageUrl={originalImage}>
                            <AnnotationTool
                                imageUrl={originalImage}
                                onAnnotationsChange={handleAnnotationsChangeCallback}
                                existingAnnotations={currentAnnotations}
                            />
                        </ImageDisplay>
                    </div>
                )}



                <AppInput form={form} name="tempCompost" label="Temperatura Compost (ºC)" type="number" step="0.1" />
                <AppInput form={form} name="tempAmbiente" label="Temperatura Ambiente (ºC)" type="number" step="0.1" />
                <AppInput form={form} name="humedad" label="Humedad (%)" type="number" step="0.1" />
                <AppInput form={form} name="co2" label="CO2 (PPM)" type="number" />
                <AppInput form={form} name="circulacion" label="Circulación" type="number" />
                <AppTextarea form={form} name="observaciones" label="Observaciones" />

                <Button type="submit">Guardar registro</Button>
            </form>
        </Form>
    )
}