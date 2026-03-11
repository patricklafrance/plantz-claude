import type { RequestHandler } from "msw";
import { setupWorker, type SetupWorker } from "msw/browser";

let worker: SetupWorker | undefined;
let mswReady: Promise<unknown> | undefined;

/**
 * Starts the MSW worker singleton with the given handlers.
 * Call once per domain setup file — the worker is shared across story files.
 * Collection registration is deferred to `withModuleDecorator` so it runs after MSW is ready.
 */
export function initializeFireflyForStorybook(handlers: RequestHandler[]) {
    if (!worker) {
        worker = setupWorker(...handlers);
        mswReady = worker.start({ onUnhandledRequest: "bypass" });
    }

    return { worker, mswReady: mswReady as Promise<unknown> };
}

// Reset singleton on HMR so handler changes take effect without a full page reload.
// oxlint-disable @typescript-eslint/no-explicit-any -- import.meta.hot is provided by the bundler at runtime
if ((import.meta as any).hot) {
    (import.meta as any).hot.dispose(async () => {
        if (worker) {
            await worker.stop();
            worker = undefined;
            mswReady = undefined;
        }
    });
}
