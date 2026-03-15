/**
 * Minimal Squide Firefly helpers for the packages storybook.
 *
 * Stripped-down version of the domain storybook firefly.tsx — no LaunchDarkly,
 * no environment variables, no MSW plugin. Only what shell component stories need.
 */

import { AppRouter, FireflyProvider, FireflyRuntime, type FireflyRuntimeOptions, FireflyRuntimeScope, type ModuleRegisterFunction, toLocalModuleDefinitions } from "@squide/firefly";
import type { Decorator } from "@storybook/react-vite";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";

// --- StorybookRuntime ---

class StorybookRuntime extends FireflyRuntime {
    constructor(options: FireflyRuntimeOptions = {}) {
        super(options);
    }

    override registerRoute() {
        // Ignore routes registration — doesn't matter for a Storybook host application.
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    override startScope(logger: any) {
        return new StorybookRuntimeScope(this, logger);
    }
}

class StorybookRuntimeScope extends FireflyRuntimeScope {}

// --- initializeFireflyForStorybook ---

export interface InitializeFireflyForStorybookOptions {
    localModules?: ModuleRegisterFunction<FireflyRuntime>[];
}

export async function initializeFireflyForStorybook(options: InitializeFireflyForStorybookOptions = {}): Promise<StorybookRuntime> {
    const { localModules = [] } = options;

    const runtime = new StorybookRuntime({
        mode: "development",
    });

    if (localModules.length > 0) {
        await runtime.moduleManager.registerModules([...toLocalModuleDefinitions(localModules)]);
    } else {
        runtime.moduleManager.setAsReady();
    }

    return runtime;
}

// --- withFireflyDecorator ---

export function withFireflyDecorator(runtime: FireflyRuntime): Decorator {
    return (story) => (
        <FireflyProvider runtime={runtime}>
            <AppRouter strictMode={false}>
                {({ rootRoute, routerProps, routerProviderProps }) => <RouterProvider router={createMemoryRouter([{ element: rootRoute, children: [{ path: "/story", element: story() }] }], { ...routerProps, initialEntries: ["/story"] })} {...routerProviderProps} />}
            </AppRouter>
        </FireflyProvider>
    );
}
