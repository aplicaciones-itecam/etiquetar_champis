import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_URL_BASE } from '@/lib/utils'
import { fetcher } from '@/lib/fetcher';
import useSWR from "swr"

export function HistoryList() {

    const { data, error, isLoading } = useSWR(`${API_URL_BASE}/images`, fetcher)

    if (error) return <div>Se ha producido un error cargando los registros</div>
    if (isLoading) return <div>Cargando registros...</div>
    if (!data || data.length === 0) return <div>No se han encontrado registros</div>

    const dataSorted = data.sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));


    return (
        <>
            <h2 className="text-2xl font-semibold mb-4">Historial de anotaciones</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dataSorted.map((record) => (
                    <Link
                        key={record.id}
                        to={`/historial/${record.id}`}
                        className="block bg-gray-50 rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden"
                    >
                        <div className="p-4">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-semibold">Sala {record.sala}, Muestra {record.muestra}</h3>
                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-lg">
                                    {new Date(record.fecha).toLocaleDateString() || "Sin fecha"}
                                </span>
                            </div>
                            <div className="text-sm text-gray-600">
                                {record.tempCompost && <p>Temp: {record.tempCompost}°C</p>}
                                {record.humedad && <p>Humedad: {record.humedad}%</p>}
                                {record.observaciones && (
                                    <p className="truncate">{record.observaciones}</p>
                                )}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </>
    )
}