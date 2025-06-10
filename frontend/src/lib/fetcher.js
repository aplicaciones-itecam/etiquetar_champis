/* export const fetcher = () => fetch(...args).then(res => res.json()) */

export const fetcher = async (...args) => {
    const res = await fetch(...args);

    if (!res.ok) {
        const error = new Error('Error en la respuesta de la API');
        error.status = res.status;
        error.info = await res.json().catch(() => ({})); // por si el cuerpo no es JSON
        throw error;
    }

    return res.json();
};