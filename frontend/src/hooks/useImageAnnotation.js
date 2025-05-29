import { useState, useCallback, useEffect } from 'react';

function useImageAnnotation() {
    const [originalImage, setOriginalImage] = useState(null); // Store the original image URL/data
    const [annotations, setAnnotations] = useState([]); // Store annotation data (e.g., [{x, y, width, height}, ...])
    const [annotatedImageUrl, setAnnotatedImageUrl] = useState(null); // For preview

    // Function to draw annotations on the original image and return a new image Data URL or Blob
    const generateAnnotatedImage = useCallback(async (outputType = 'blob') => {
        if (!originalImage || annotations.length === 0) {
            return null;
        }

        return new Promise((resolve) => {
            const image = new Image();
            image.crossOrigin = "anonymous"; // Important if image is from another domain or for canvas security
            image.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = image.naturalWidth;
                canvas.height = image.naturalHeight;
                const ctx = canvas.getContext('2d');

                // Draw the original image
                ctx.drawImage(image, 0, 0);

                // Draw annotations
                annotations.forEach(anno => {
                    // Adjust annotation coordinates if they were relative to a scaled display
                    // For simplicity, assuming annotations are already in original image coordinates
                    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)'; // Example: semi-transparent red
                    ctx.fillRect(anno.x, anno.y, anno.width, anno.height);
                    ctx.strokeStyle = 'red';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(anno.x, anno.y, anno.width, anno.height);
                });

                if (outputType === 'blob') {
                    canvas.toBlob(blob => {
                        resolve(blob);
                    }, 'image/png');
                } else { // dataURL
                    resolve(canvas.toDataURL('image/png'));
                }
            };
            image.onerror = () => {
                console.error("Error loading image for annotation.");
                resolve(null);
            };
            image.src = originalImage;
        });
    }, [originalImage, annotations]);

    // Effect to update the preview URL when annotations or original image change
    useEffect(() => {
        if (originalImage && annotations.length > 0) {
            generateAnnotatedImage('dataURL').then(url => {
                setAnnotatedImageUrl(url);
            });
        } else if (!originalImage || annotations.length === 0) {
            setAnnotatedImageUrl(null); // Clear preview if no image or annotations
        }
    }, [originalImage, annotations, generateAnnotatedImage]);


    const getAnnotatedImageBlob = useCallback(async () => {
        return generateAnnotatedImage('blob');
    }, [generateAnnotatedImage]);

    return {
        originalImage,
        setOriginalImage,
        annotations: annotations, // Expose current annotations
        currentAnnotations: annotations, // Alias for clarity in ImageAnnotator
        setAnnotations,
        annotatedImageUrl, // For preview
        getAnnotatedImageBlob, // Function to get the final blob for sending
    };
}

export default useImageAnnotation;