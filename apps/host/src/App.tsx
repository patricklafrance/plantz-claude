import { AppRouter, useIsActiveRouteProtected, useIsBootstrapping, useProtectedDataQueries } from "@squide/firefly";
import { createBrowserRouter, Navigate, Outlet } from "react-router";
import { RouterProvider } from "react-router/dom";

import { AUTH_TOKEN_KEY, getAuthHeaders } from "@packages/plants-core";

import { AuthError } from "./AuthError.ts";
import { SessionProvider, type Session } from "./SessionContext.tsx";

function BootstrappingRoute() {
    const [session] = useProtectedDataQueries(
        [
            {
                queryKey: ["/api/auth/session"],
                queryFn: async () => {
                    const token = sessionStorage.getItem(AUTH_TOKEN_KEY);

                    if (!token) {
                        throw new AuthError(401);
                    }

                    const res = await fetch("/api/auth/session", {
                        headers: getAuthHeaders(),
                    });

                    if (!res.ok) {
                        throw new AuthError(res.status);
                    }

                    return (await res.json()) as Session;
                },
            },
        ],
        (error) => error instanceof AuthError && error.status === 401,
    );

    const isActiveRouteProtected = useIsActiveRouteProtected(true, { throwWhenThereIsNoMatch: false });

    if (useIsBootstrapping()) {
        return <div>Loading...</div>;
    }

    // On public routes (e.g. /login), render without requiring a session.
    if (!isActiveRouteProtected) {
        return <Outlet />;
    }

    if (!session) {
        return <Navigate to="/login" replace />;
    }

    return (
        <SessionProvider session={session}>
            <Outlet />
        </SessionProvider>
    );
}

export function App() {
    return (
        <AppRouter waitForProtectedData>
            {({ rootRoute, registeredRoutes, routerProps, routerProviderProps }) => (
                <RouterProvider
                    router={createBrowserRouter(
                        [
                            {
                                element: rootRoute,
                                children: [
                                    {
                                        element: <BootstrappingRoute />,
                                        children: registeredRoutes,
                                    },
                                ],
                            },
                        ],
                        routerProps,
                    )}
                    {...routerProviderProps}
                />
            )}
        </AppRouter>
    );
}
