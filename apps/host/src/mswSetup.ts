import { setupWorker } from "msw/browser";

import { plantHandlers, plantsDb, defaultSeedPlants } from "@packages/plants-core/msw";

const worker = setupWorker(...plantHandlers);

export async function enableMocking() {
    plantsDb.reset(defaultSeedPlants);
    await worker.start({ onUnhandledRequest: "bypass" });
}
