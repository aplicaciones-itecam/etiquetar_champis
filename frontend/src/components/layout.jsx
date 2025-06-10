
import { Outlet } from "react-router";
import { ErrorBoundary } from "@/errors/error-boundary";
import StickyHeader from "@/components/header";

import eruda from 'eruda';
eruda.init();

export function RootLayout() {
    return (
        <ErrorBoundary>
            <StickyHeader />
            <main className="@container/main flex flex-1 flex-col gap-2 p-4 lg:max-w-7xl lg:mx-auto">
                <Outlet />
            </main>
        </ErrorBoundary>
    );
}

