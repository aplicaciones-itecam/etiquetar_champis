import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { RootLayout } from "@/components/layout";


import { Custom404 } from "@/errors/404";
import { FormChampi } from "@/components/form";
import { HistoryList } from "@/components/history/history-list";
import { HistoryDetail } from "@/components/history/history-detail";



const router = createBrowserRouter([

    {
        path: "/champitech/",
        element: <RootLayout />,
        children: [
            {
                path: "",
                element: <FormChampi />,
            },
            {
        path: "/champitech/historial",
        element: <RootLayout />,
        children: [
            {
                path: "",
                element: <HistoryList />,
            },
            {
                path: ":historyId",
                element: <HistoryDetail />,
            },
        ]
    },
        ]
    },
    {
        path: "*",
        element: <Custom404 />,
    }
]);

export function Router() {
    return <RouterProvider router={router} />
}
