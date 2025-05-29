import React, { useState, useCallback } from 'react';
import { ImageCapture, ImageDisplay } from './image-capture';
import { AnnotationTool } from './image-annotation';
import useImageAnnotation from '@/hooks/useImageAnnotation';

export function ImageAnnotator() {
    const [capturedImage, setCapturedImage] = useState(null);
    const {
        annotatedImageUrl,
        setOriginalImage,
        setAnnotations,
        getAnnotatedImageBlob,
        currentAnnotations
    } = useImageAnnotation(); // Use the custom hook

    const handleImageCapture = (imageDataUrl) => {
        console.log(imageDataUrl)
        setCapturedImage(imageDataUrl);
        setOriginalImage(imageDataUrl); // Set in hook
        setAnnotations([]); // Reset annotations for new image
    };

    const handleAnnotationsChange = useCallback((newAnnotations) => {
        setAnnotations(newAnnotations); // Update annotations in hook
    }, [setAnnotations]);

    const handleSubmit = async () => {
        if (!capturedImage || currentAnnotations.length === 0) {
            alert("Please capture an image and add annotations.");
            return;
        }
        try {
            const imageBlob = await getAnnotatedImageBlob(); // Get blob from hook
            if (imageBlob) {
                /* const response = await sendAnnotatedImage(imageBlob); */
                const response = {}
                console.log("API Response:", response);
                alert("Image submitted successfully!");
                // Optionally reset state
                setCapturedImage(null);
                setOriginalImage(null);
                setAnnotations([]);
            }
        } catch (error) {
            console.error("Error submitting image:", error);
            alert("Failed to submit image.");
        }
    };

    const handleRetake = () => {
        setCapturedImage(null);
        setOriginalImage(null);
        setAnnotations([]);
    };

    return (
        <div>
            {!capturedImage ? (
                <ImageCapture onImageCapture={handleImageCapture} />
            ) : (
                <>
                    <ImageDisplay imageUrl={capturedImage}>
                        <AnnotationTool
                            imageUrl={capturedImage}
                            onAnnotationsChange={handleAnnotationsChange}
                            existingAnnotations={currentAnnotations}
                        />
                    </ImageDisplay>
                    <div style={{ marginTop: '10px' }}>
                        <button onClick={handleSubmit} disabled={currentAnnotations.length === 0}>
                            Submit Annotated Image
                        </button>
                        <button onClick={handleRetake} style={{ marginLeft: '10px' }}>
                            Retake/Re-upload
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}