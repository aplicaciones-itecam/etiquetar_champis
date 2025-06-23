import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { API_URL_BASE } from '@/lib/utils'
import { fetcher } from '@/lib/fetcher';
import useSWR from "swr"

export function HistoryList() {

    const { data, error, isLoading } = useSWR(`${API_URL_BASE}/images`, fetcher)
    const [selectedSala, setSelectedSala] = useState(null);


    const salasArray = useMemo(() => {
        if (!data) return [];
        const salasUnicas = [...new Set(data.map(record => record.sala))];
        salasUnicas.sort((a, b) => a - b);
        return salasUnicas.map(sala => ({
            value: sala.toString(),
            label: `Sala ${sala}`
        }));
    }, [data]);

    if (error) return <div>Se ha producido un error cargando los registros</div>
    if (isLoading) return <div>Cargando registros...</div>
    if (!data || data.length === 0) return <div>No se han encontrado registros</div>

    const dataSorted = data.sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));

    const filteredData = selectedSala
        ? dataSorted.filter(record => record.sala.toString() === selectedSala)
        : dataSorted;



    return (
        <>
            <h2 className="text-2xl font-semibold mb-4">Historial de anotaciones</h2>

            <h4 className='text-sm font-semibold'>Filtro por sala</h4>
            <div className='flex flex-row max-w-full overflow-auto gap-4 mb-6 text-sm'>

                <span
                    key={"all-salas"}
                    className="block bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-center rounded-lg shadow p-4 transition-colors"
                    onClick={() => setSelectedSala(selectedSala ? null : "all")}
                >
                    Todas las salas
                </span>

                {salasArray.map((sala) => (
                    <span
                        key={sala.value}
                        className="block bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-center rounded-lg shadow p-4 transition-colors"
                        onClick={() => setSelectedSala(sala.value === selectedSala ? null : sala.value)}
                    >
                        {sala.label}
                    </span>
                ))}

            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredData.map((record) => (
                    <Link
                        key={record.id}
                        to={`/historial/${record.id}`}
                        className="block bg-gray-50 rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden"
                    >
                        <div className="p-4">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-semibold">Sala {record.sala}, Muestra {record.muestra}</h3>
                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-lg">
                                    {`${new Date(record.fecha).toLocaleDateString()} ${record.hora}` || "Sin fecha"}
                                </span>
                                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-lg">
                                    {Math.floor((new Date(record.fecha) - new Date(record.diaEntrada)) / (1000 * 60 * 60 * 24))}º día
                                </span>
                            </div>
                            <div className="text-sm text-gray-600">
                                {record.tempAmbiente ? (
                                    <>
                                        {record.tempAmbiente && <p>Tª: {record.tempAmbiente}°C</p>}
                                        {record.humedad && <p>Humedad: {record.humedad}%</p>}
                                        {record.observaciones && (
                                            <p className="truncate">Notas: {record.observaciones}</p>
                                        )}
                                    </>
                                ) : (
                                    <p>No hay datos disponibles</p>
                                )}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </>
    )
}