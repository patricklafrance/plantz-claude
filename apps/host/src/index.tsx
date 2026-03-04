import { createRoot } from "react-dom/client";
import { FireflyProvider, initializeFirefly } from "@squide/firefly";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "./App.tsx";
import { registerHost } from "./register.tsx";
import { getActiveModules } from "./getActiveModules.tsx";

const runtime = initializeFirefly({
    localModules: [registerHost, ...getActiveModules(process.env.MODULES)]
});

const queryClient = new QueryClient();
const root = createRoot(document.getElementById("root")!);

root.render(
    <FireflyProvider runtime={runtime}>
        <QueryClientProvider client={queryClient}>
            <App />
        </QueryClientProvider>
    </FireflyProvider>
);
