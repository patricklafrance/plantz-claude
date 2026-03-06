import * as React from "react"
import type { Meta, StoryObj } from "storybook-react-rsbuild"
import { DatePicker } from "./date-picker.tsx"

const meta = {
    title: "Components/DatePicker",
    component: DatePicker,
    args: {
        placeholder: "Pick a date"
    }
} satisfies Meta<typeof DatePicker>

export default meta

type Story = StoryObj<typeof meta>

export const Default = {} satisfies Story

export const WithPreselectedDate: Story = {
    args: {
        value: new Date(2026, 2, 6)
    }
}

export const WithCustomPlaceholder: Story = {
    args: {
        placeholder: "Select watering date"
    }
}

export const Disabled: Story = {
    args: {
        disabled: true
    }
}

export const DisabledWithValue: Story = {
    args: {
        value: new Date(2026, 2, 6),
        disabled: true
    }
}

export const Controlled: Story = {
    render: () => {
        const [date, setDate] = React.useState<Date | undefined>(new Date(2026, 2, 6))

        return (
            <div className="flex flex-col gap-4">
                <DatePicker value={date} onChange={setDate} />
                <p className="text-sm text-muted-foreground">
                    Selected: {date ? date.toLocaleDateString() : "none"}
                </p>
            </div>
        )
    }
}

export const AllVariants: Story = {
    render: () => (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-muted-foreground">Default (no value)</span>
                <DatePicker />
            </div>
            <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-muted-foreground">With value</span>
                <DatePicker value={new Date(2026, 2, 6)} />
            </div>
            <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-muted-foreground">Custom placeholder</span>
                <DatePicker placeholder="Select watering date" />
            </div>
            <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-muted-foreground">Disabled (empty)</span>
                <DatePicker disabled />
            </div>
            <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-muted-foreground">Disabled (with value)</span>
                <DatePicker value={new Date(2026, 2, 6)} disabled />
            </div>
        </div>
    )
}
