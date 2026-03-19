import type { Decorator } from "@storybook/react-vite";
import { NoopLogger } from "@workleap/logging";

import { initializeFireflyForStorybook, withFireflyDecorator } from "../../storybook/firefly.tsx";

const runtime = await initializeFireflyForStorybook({
    loggers: [new NoopLogger()],
});

export const fireflyDecorator: Decorator = withFireflyDecorator(runtime);
