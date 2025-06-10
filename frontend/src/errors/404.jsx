export function Custom404() {
    return (
        <div className="flex flex-col items-center justify-center py-16">
            <h2 className="text-2xl font-bold mb-4">Página no encontrada</h2>
            <p className="mb-6 text-gray-600">La página que buscas no existe o ha sido movida.</p>
            <a
                href="/"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
                Volver al inicio
            </a>
        </div>
    )
}