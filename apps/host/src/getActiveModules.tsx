import { registerManagementPlants } from "@modules/management-plants";
import { registerTodayLandingPage } from "@modules/today-landing-page";
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";

const ModuleRegistry: Record<string, ModuleRegisterFunction<FireflyRuntime>> = {
    "management/plants": registerManagementPlants,
    "today/landing-page": registerTodayLandingPage,
};

export function getActiveModules(filter?: string): ModuleRegisterFunction<FireflyRuntime>[] {
    if (!filter) {
        return Object.values(ModuleRegistry);
    }

    return filter
        .split(",")
        .map((m) => m.trim())
        .filter((m) => {
            if (!ModuleRegistry[m]) {
                // oxlint-disable-next-line eslint/no-console -- Runtime warning for misconfigured MODULES env var
                console.warn(`[host] Unknown module "${m}". Available: ${Object.keys(ModuleRegistry).join(", ")}`);
                return false;
            }
            return true;
        })
        .map((m) => ModuleRegistry[m]);
}
