import "./styles/globals.css";
import { FireflyProvider, initializeFirefly } from "@squide/firefly";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";

import { App } from "./App.tsx";
import { getActiveModules } from "./getActiveModules.tsx";
import { registerHost } from "./register.tsx";

const runtime = initializeFirefly({
    useMsw: true,
    localModules: [registerHost, ...getActiveModules(process.env.MODULES)],
    startMsw: async (x) => {
        return (await import("./mocks/browser.ts")).startMsw(x.requestHandlers);
    },
});

const queryClient = new QueryClient();
const root = createRoot(document.getElementById("root")!);

root.render(
    <FireflyProvider runtime={runtime}>
        <QueryClientProvider client={queryClient}>
            <App />
        </QueryClientProvider>
    </FireflyProvider>,
);
