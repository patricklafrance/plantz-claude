import "./storybook.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setupWorker } from "msw/browser";
import { Suspense, useEffect, useRef, useState } from "react";
import type { Preview } from "storybook-react-rsbuild";

import { managementPlantHandlers, plantsDb, defaultSeedPlants } from "../../management/plants/src/mocks/index.ts";
import { todayPlantHandlers } from "../../today/landing-page/src/mocks/index.ts";

const allHandlers = [...managementPlantHandlers, ...todayPlantHandlers];

const worker = setupWorker(...allHandlers);

let mswReady: Promise<unknown> | undefined;

function ensureMswStarted() {
    if (!mswReady) {
        plantsDb.reset(defaultSeedPlants);
        mswReady = worker.start({ onUnhandledRequest: "bypass" });
    }

    return mswReady;
}

// oxlint-disable-next-line @typescript-eslint/no-explicit-any -- Storybook decorator types are complex generic; using `any` for portability across storybook configs
const mswDecorator = (Story: any, context: any) => {
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

    const [ready, setReady] = useState(false);
    const storyHandlers = (context.parameters?.msw as { handlers?: unknown[] })?.handlers;

    useEffect(() => {
        ensureMswStarted()?.then(() => setReady(true));
    }, []);

    useEffect(() => {
        if (!ready) return;

        worker.resetHandlers(...allHandlers);
        plantsDb.reset(defaultSeedPlants);

        if (storyHandlers) {
            // oxlint-disable-next-line @typescript-eslint/no-explicit-any -- MSW handler types are complex
            worker.use(...(storyHandlers as any[]));
        }

        return () => {
            worker.resetHandlers(...allHandlers);
            plantsDb.reset(defaultSeedPlants);
        };
    }, [storyHandlers, ready]);

    if (!ready) return <></>;

    return (
        <QueryClientProvider client={queryClientRef.current}>
            <Suspense fallback="Loading...">
                <Story />
            </Suspense>
        </QueryClientProvider>
    );
};

const preview: Preview = {
    decorators: [mswDecorator],
};

export default preview;
