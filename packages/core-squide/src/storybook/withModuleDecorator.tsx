import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import type { RequestHandler } from "msw";
import type { SetupWorker } from "msw/browser";
import { Suspense, useEffect, useState } from "react";

interface DecoratorContext {
    parameters?: {
        msw?: { handlers?: unknown[] };
        [key: string]: unknown;
    };
}

export interface ModuleDecoratorConfig {
    worker: SetupWorker;
    mswReady: Promise<unknown>;
    handlers: RequestHandler[];
    queryClient: QueryClient;
    resetDb: () => void;
    register: () => void;
}

export function withModuleDecorator({ worker, mswReady, handlers, queryClient, resetDb, register }: ModuleDecoratorConfig) {
    // oxlint-disable-next-line @typescript-eslint/no-explicit-any -- Storybook decorator signatures use complex generics that conflict with JSX usage of Story; `any` avoids TS2786
    return (Story: any, context: DecoratorContext) => {
        const [ready, setReady] = useState(false);
        // Each story declares its own handlers array literal, so reference
        // equality (Object.is) in the useEffect dep list is sufficient to
        // detect story switches. JSON.stringify was wrong here because MSW
        // RequestHandler objects contain functions, which serialize to
        // undefined — making every handler array look identical.
        const storyHandlers = (context.parameters?.msw as { handlers?: unknown[] })?.handlers;

        // Single effect: wait for MSW, then set up everything, then render.
        // register() MUST complete before setReady(true) so the collection
        // singleton exists when <Story /> mounts.
        useEffect(() => {
            let cancelled = false;

            setReady(false);

            mswReady
                .then(() => {
                    if (cancelled) return;

                    queryClient.clear();
                    worker.resetHandlers(...handlers);
                    resetDb();
                    register();

                    if (storyHandlers) {
                        // oxlint-disable-next-line @typescript-eslint/no-explicit-any -- MSW handler types are complex
                        worker.use(...(storyHandlers as any[]));
                    }

                    setReady(true);
                })
                .catch((error: unknown) => {
                    // oxlint-disable-next-line no-console -- intentional diagnostic output for MSW startup failures
                    console.error("MSW worker failed to start:", error);
                });

            return () => {
                cancelled = true;
            };
        }, [storyHandlers]);

        if (!ready) return <></>;

        return (
            <QueryClientProvider client={queryClient}>
                <Suspense fallback="Loading...">
                    <Story />
                </Suspense>
            </QueryClientProvider>
        );
    };
}
