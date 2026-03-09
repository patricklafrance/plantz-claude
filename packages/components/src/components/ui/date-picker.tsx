/* oxlint-disable react-perf/jsx-no-jsx-as-prop, react-perf/jsx-no-new-function-as-prop -- Base UI render prop and DayPicker callback patterns */
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import * as React from "react";

import { cn } from "../../lib/utils.ts";
import { Button } from "./button.tsx";
import { Calendar } from "./calendar.tsx";
import { Popover, PopoverContent, PopoverTrigger } from "./popover.tsx";

function DatePicker({ value, onChange, placeholder = "Pick a date", disabled = false, className }: { value?: Date; onChange?: (date: Date | undefined) => void; placeholder?: string; disabled?: boolean; className?: string }) {
    const [open, setOpen] = React.useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger render={<Button variant="outline" disabled={disabled} className={cn("w-[240px] justify-start text-left font-normal", !value && "text-muted-foreground", className)} />}>
                <CalendarIcon data-icon="inline-start" />
                {value ? format(value, "PPP") : <span>{placeholder}</span>}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={value}
                    onSelect={(date) => {
                        onChange?.(date);
                        setOpen(false);
                    }}
                    autoFocus
                />
            </PopoverContent>
        </Popover>
    );
}

export { DatePicker };
