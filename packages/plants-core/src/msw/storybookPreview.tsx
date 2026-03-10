/**
 * Shared Storybook preview configuration for MSW + TanStack Query.
 *
 * Each storybook preview.tsx should import this and spread it into its own
 * preview config (after importing its local CSS).
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setupWorker } from "msw/browser";
import { useEffect, useRef, useState, Suspense } from "react";

import { plantsDb } from "./db.ts";
import { plantHandlers } from "./handlers.ts";
import { defaultSeedPlants } from "./seedData.ts";

const worker = setupWorker(...plantHandlers);

let mswReady: Promise<unknown> | undefined;

function ensureMswStarted() {
    if (!mswReady) {
        plantsDb.reset(defaultSeedPlants);
        mswReady = worker.start({ onUnhandledRequest: "bypass" });
    }

    return mswReady!;
}

function MswWrapper({ children, storyHandlers }: { children: React.ReactNode; storyHandlers?: unknown[] }) {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        ensureMswStarted().then(() => setReady(true));
    }, []);

    useEffect(() => {
        if (!ready) return;

        // Reset to default handlers first, then layer story-specific overrides on top.
        // worker.use() prepends handlers, so story handlers take priority over defaults.
        worker.resetHandlers(...plantHandlers);
        plantsDb.reset(defaultSeedPlants);

        if (storyHandlers) {
            // oxlint-disable-next-line @typescript-eslint/no-explicit-any -- MSW handler types are complex
            worker.use(...(storyHandlers as any[]));
        }

        return () => {
            worker.resetHandlers(...plantHandlers);
            plantsDb.reset(defaultSeedPlants);
        };
    }, [storyHandlers, ready]);

    if (!ready) return null;

    return <>{children}</>;
}

// oxlint-disable-next-line @typescript-eslint/no-explicit-any -- Storybook decorator types are complex generic; using `any` for portability across storybook configs
export const mswDecorator = (Story: any, context: any) => {
    const queryClientRef = useRef<QueryClient>(undefined!);
    if (!queryClientRef.current) {
        queryClientRef.current = new QueryClient({
            defaultOptions: {
                queries: {
                    retry: false,
                    staleTime: Infinity,
                },
            },
        });
    }

    const storyHandlers = (context.parameters?.msw as { handlers?: unknown[] })?.handlers;

    return (
        <MswWrapper storyHandlers={storyHandlers}>
            <QueryClientProvider client={queryClientRef.current}>
                <Suspense fallback="Loading...">
                    <Story />
                </Suspense>
            </QueryClientProvider>
        </MswWrapper>
    );
};
