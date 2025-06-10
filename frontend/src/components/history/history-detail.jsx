import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { API_URL_BASE } from '@/lib/utils'
import { fetcher } from '@/lib/fetcher';
import useSWR from "swr"
import { AnnotationViewer } from '@/components/image/annotation-viewer';
import { Link } from 'react-router';

export function HistoryDetail() {
    const { historyId } = useParams();
    const { data, error, isLoading } = useSWR(`${API_URL_BASE}/images/${historyId}`, fetcher)


    if (isLoading) return <div>Cargando registros...</div>

    if (error) {
        if (error?.status === 404) {
            return <p>No se ha encontrado el historial.</p>;
        }
        return <p>Error {error.status || ''}: {error.message}</p>;
    }
    if (!data || data.length === 0) return <div>No se han encontrado registros</div>


    return (
        <div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="p-6">
                    <Link
                        to="/historial"
                        className="mt-4 inline-block text-sm hover:underline bg-blue-500 py-3 px-5 text-white rounded-lg">
                        Volver al historial
                    </Link>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Columna de la imagen */}
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Imagen Anotada</h3>
                            <AnnotationViewer
                                imageUrl={`${API_URL_BASE}${data.imageUrl}`}

                                annotations={data.annotations}
                                className="mb-4"
                                showAsCircle={true}
                            />

                        </div>

                        {/* Columna de datos */}
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Información</h3>
                            <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                                {data.sala && (
                                    <>
                                        <dt className="text-gray-600">Sala:</dt>
                                        <dd className="font-medium">Sala {data.sala}</dd>
                                    </>
                                )}

                                {data.muestra && (
                                    <>
                                        <dt className="text-gray-600">Muestra:</dt>
                                        <dd className="font-medium">Muestra {data.muestra}</dd>
                                    </>
                                )}

                                {data.fecha && (
                                    <>
                                        <dt className="text-gray-600">Fecha:</dt>
                                        <dd className="font-medium">{new Date(data.fecha).toLocaleDateString()}</dd>
                                    </>
                                )}

                                {data.hora && (
                                    <>
                                        <dt className="text-gray-600">Hora:</dt>
                                        <dd className="font-medium">{data.hora}</dd>
                                    </>
                                )}

                                {data.tempCompost !== undefined && data.tempCompost !== null && (
                                    <>
                                        <dt className="text-gray-600">Temp. Compost:</dt>
                                        <dd className="font-medium">{data.tempCompost}°C</dd>
                                    </>
                                )}

                                {data.tempAmbiente !== undefined && data.tempAmbiente !== null && (
                                    <>
                                        <dt className="text-gray-600">Temp. Ambiente:</dt>
                                        <dd className="font-medium">{data.tempAmbiente}°C</dd>
                                    </>
                                )}

                                {data.humedad !== undefined && data.humedad !== null && (
                                    <>
                                        <dt className="text-gray-600">Humedad:</dt>
                                        <dd className="font-medium">{data.humedad}%</dd>
                                    </>
                                )}

                                {data.co2 !== undefined && data.co2 !== null && (
                                    <>
                                        <dt className="text-gray-600">CO<sub>2</sub>:</dt>
                                        <dd className="font-medium">{data.co2} PPM</dd>
                                    </>
                                )}

                                {data.circulacion !== undefined && data.circulacion !== null && (
                                    <>
                                        <dt className="text-gray-600">Circulación:</dt>
                                        <dd className="font-medium">{data.circulacion}</dd>
                                    </>
                                )}
                            </dl>

                            {data.observaciones && (
                                <div className="mt-4">
                                    <h4 className="font-medium text-gray-700">Observaciones:</h4>
                                    <p className="mt-1 whitespace-pre-line">{data.observaciones}</p>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}