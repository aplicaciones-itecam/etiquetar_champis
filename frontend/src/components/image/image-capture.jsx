import React, { useRef, useState } from 'react'; // useEffect ya no es necesario aquí

export function ImageCapture({ onImageCapture }) {
    return null;
    // Ya no se necesitan videoRef, canvasRef (para la cámara), stream, ni isVideoReady

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                onImageCapture(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div>
            <p>Upload an image:</p>
            <input type="file" accept="image/*" onChange={handleFileChange} />
            {/* El canvas que estaba oculto para takePicture ya no es necesario */}
        </div>
    );
}

export function ImageDisplay({ imageUrl, children }) {
    if (!imageUrl) return null;

    return (
        <div style={{ position: 'relative', maxWidth: '100%', maxHeight: '70vh', overflow: 'hidden' }}>
            <img src={imageUrl} alt="To annotate" style={{ display: 'block', maxWidth: '100%', maxHeight: '70vh' }} />
            {children} {/* For overlaying annotation tools */}
        </div>
    );
}
