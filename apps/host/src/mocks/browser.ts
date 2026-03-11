import type { RequestHandler } from "msw";
import { setupWorker } from "msw/browser";

import { plantsDb, defaultSeedPlants } from "@packages/plants-core/db";

export async function startMsw(handlers: RequestHandler[]) {
    plantsDb.reset(defaultSeedPlants);
    const worker = setupWorker(...handlers);
    await worker.start({ onUnhandledRequest: "bypass" });
}
