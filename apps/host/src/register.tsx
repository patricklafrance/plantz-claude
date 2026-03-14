import { PublicRoutes, ProtectedRoutes, type ModuleRegisterFunction, type FireflyRuntime } from "@squide/firefly";

import { NotFoundPage } from "./NotFoundPage.tsx";
import { RootLayout } from "./RootLayout.tsx";

export const registerHost: ModuleRegisterFunction<FireflyRuntime> = async (runtime) => {
    runtime.registerRoute(
        {
            element: <RootLayout />,
            children: [PublicRoutes, ProtectedRoutes],
        },
        { hoist: true },
    );

    runtime.registerPublicRoute({
        path: "/login",
        lazy: async () => {
            const { LoginPage } = await import("./LoginPage.tsx");

            return { element: <LoginPage /> };
        },
    });

    runtime.registerRoute({
        path: "/profile",
        lazy: async () => {
            const { ProfilePage } = await import("./ProfilePage.tsx");

            return { element: <ProfilePage /> };
        },
    });

    runtime.registerPublicRoute({
        path: "*",
        element: <NotFoundPage />,
    });

    if (runtime.isMswEnabled) {
        const { authHandlers } = await import("./mocks/authHandlers.ts");
        runtime.registerRequestHandlers(authHandlers);
    }
};
