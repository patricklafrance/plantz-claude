import { initializeFireflyForStorybook, withFireflyDecorator } from "@squide/firefly-rsbuild-storybook";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMemo, type ReactNode } from "react";
import type { Decorator } from "storybook-react-rsbuild";

import { ManagementPlantsCollectionProvider } from "./ManagementPlantsContext.tsx";
import { createManagementPlantsCollection } from "./plantsCollection.ts";

const runtime = await initializeFireflyForStorybook();

export const fireflyDecorator = withFireflyDecorator(runtime);

function CollectionDecorator({ children }: { children: ReactNode }) {
    const queryClient = useMemo(
        () =>
            new QueryClient({
                defaultOptions: { queries: { retry: false, staleTime: Infinity } },
            }),
        [],
    );
    const collection = useMemo(() => createManagementPlantsCollection(queryClient), [queryClient]);

    return (
        <QueryClientProvider client={queryClient}>
            <ManagementPlantsCollectionProvider collection={collection}>{children}</ManagementPlantsCollectionProvider>
        </QueryClientProvider>
    );
}

export function withCollectionDecorator(): Decorator {
    return (story) => <CollectionDecorator>{story()}</CollectionDecorator>;
}

export const collectionDecorator = withCollectionDecorator();
