import React from 'react';
import errorLogger from '@/components/error-services';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render shows the fallback UI
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Log the error to our service
        errorLogger.captureException(error, {
            componentStack: errorInfo.componentStack,
            componentName: this.props.componentName || 'Unknown',
            props: this.props.logProps ? JSON.stringify(this.props) : undefined
        });
    }

    render() {
        if (this.state.hasError) {
            return <ErrorComponent />
        }

        return this.props.children;
    }
}

function ErrorComponent() {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
            <h1 className="text-4xl font-bold text-red-600">Error</h1>
            <p className="mt-4 text-lg text-gray-700">Ha ocurrido un error inespereado.</p>
            <a href="/" className="mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                Volver al inicio
            </a>

        </div>
    )
}

export default ErrorBoundary;

