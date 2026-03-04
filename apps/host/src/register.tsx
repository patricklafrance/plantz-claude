import { PublicRoutes, ProtectedRoutes, type ModuleRegisterFunction, type FireflyRuntime } from "@squide/firefly";
import { RootLayout } from "./RootLayout.tsx";
import { HomePage } from "./HomePage.tsx";
import { NotFoundPage } from "./NotFoundPage.tsx";

export const registerHost: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerRoute({
        element: <RootLayout />,
        children: [PublicRoutes, ProtectedRoutes]
    }, { hoist: true });

    runtime.registerRoute({
        index: true,
        element: <HomePage />
    });

    runtime.registerPublicRoute({
        path: "*",
        element: <NotFoundPage />
    });
};
