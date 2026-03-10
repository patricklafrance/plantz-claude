import { PublicRoutes, ProtectedRoutes, type ModuleRegisterFunction, type FireflyRuntime } from "@squide/firefly";
import { Navigate } from "react-router";

import { NotFoundPage } from "./NotFoundPage.tsx";
import { RootLayout } from "./RootLayout.tsx";

export const registerHost: ModuleRegisterFunction<FireflyRuntime> = (runtime) => {
    runtime.registerRoute(
        {
            element: <RootLayout />,
            children: [PublicRoutes, ProtectedRoutes],
        },
        { hoist: true },
    );

    runtime.registerRoute({
        index: true,
        element: <Navigate to="/management/plants" replace />,
    });

    runtime.registerPublicRoute({
        path: "*",
        element: <NotFoundPage />,
    });
};
