import { Suspense } from "react";
import type { Preview } from "storybook-react-rsbuild";

const preview: Preview = {
    decorators: [
        Story => {
            return (
                <Suspense fallback="Loading...">
                    <Story />
                </Suspense>
            );
        }
    ]
};

export default preview;
