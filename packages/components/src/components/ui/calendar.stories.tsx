/* oxlint-disable react-perf/jsx-no-new-function-as-prop, react-perf/jsx-no-new-object-as-prop -- Stories are dev-only; perf optimization is not applicable */
import * as React from "react";
import type { DateRange } from "react-day-picker";
import type { Meta, StoryObj } from "storybook-react-rsbuild";

import { Calendar } from "./calendar.tsx";

const meta = {
    title: "Components/Calendar",
    component: Calendar,
    args: {
        mode: "single",
    },
} satisfies Meta<typeof Calendar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {} satisfies Story;

export const WithSelectedDate: Story = {
    args: {
        mode: "single",
        selected: new Date(2026, 2, 6),
    },
};

export const WithOutsideDaysHidden: Story = {
    args: {
        showOutsideDays: false,
    },
};

export const WithMultipleMonths: Story = {
    args: {
        numberOfMonths: 2,
    },
};

export const WithDropdownCaption: Story = {
    args: {
        captionLayout: "dropdown",
        startMonth: new Date(2020, 0),
        endMonth: new Date(2030, 11),
    },
};

export const RangeSelection: Story = {
    render: () => {
        // oxlint-disable-next-line react/rules-of-hooks -- CSF3 render functions are valid React components
        const [range, setRange] = React.useState<DateRange>({
            from: new Date(2026, 2, 6),
            to: new Date(2026, 2, 12),
        });

        return (
            <Calendar
                mode="range"
                selected={range}
                onSelect={(value) => {
                    if (value) setRange(value);
                }}
            />
        );
    },
};

export const Disabled: Story = {
    args: {
        disabled: true,
    },
};

export const WithWeekNumbers: Story = {
    args: {
        showWeekNumber: true,
    },
};

export const AllVariants: Story = {
    render: () => (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-muted-foreground">Default (single)</span>
                <Calendar mode="single" selected={new Date(2026, 2, 6)} />
            </div>
            <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-muted-foreground">Range selection</span>
                <Calendar mode="range" selected={{ from: new Date(2026, 2, 6), to: new Date(2026, 2, 12) }} />
            </div>
            <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-muted-foreground">Multiple months</span>
                <Calendar mode="single" numberOfMonths={2} />
            </div>
            <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-muted-foreground">Dropdown caption</span>
                <Calendar mode="single" captionLayout="dropdown" startMonth={new Date(2020, 0)} endMonth={new Date(2030, 11)} />
            </div>
            <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-muted-foreground">Outside days hidden</span>
                <Calendar mode="single" showOutsideDays={false} />
            </div>
            <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-muted-foreground">With week numbers</span>
                <Calendar mode="single" showWeekNumber />
            </div>
        </div>
    ),
};
