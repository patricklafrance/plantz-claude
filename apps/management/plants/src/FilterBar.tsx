import { useCallback, type ChangeEvent } from "react";

import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue, Switch, Input, Button, Label } from "@packages/components";

import { locations, luminosities, wateringFrequencies, wateringTypes } from "./constants.ts";
import type { PlantFilters } from "./usePlantFilters.ts";

interface FilterBarProps {
    filters: PlantFilters;
    onFilterChange: <K extends keyof PlantFilters>(key: K, value: PlantFilters[K]) => void;
    onClear: () => void;
    hasActiveFilters: boolean;
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string | null; onChange: (value: string | null) => void; options: readonly { id: string; label: string }[] }) {
    const handleValueChange = useCallback((val: string | null) => onChange(!val || val === "" ? null : val), [onChange]);

    return (
        <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">{label}</Label>
            <Select value={value ?? ""} onValueChange={handleValueChange}>
                <SelectTrigger size="sm" className="w-32" aria-label={label}>
                    <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectItem value="">All</SelectItem>
                        {options.map((opt) => (
                            <SelectItem key={opt.id} value={opt.id}>
                                {opt.label}
                            </SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>
        </div>
    );
}

export function FilterBar({ filters, onFilterChange, onClear, hasActiveFilters }: FilterBarProps) {
    const handleNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => onFilterChange("name", e.target.value), [onFilterChange]);
    const handleLocationChange = useCallback((v: string | null) => onFilterChange("location", v), [onFilterChange]);
    const handleLuminosityChange = useCallback((v: string | null) => onFilterChange("luminosity", v), [onFilterChange]);
    const handleMistChange = useCallback((checked: boolean) => onFilterChange("mistLeaves", checked ? true : null), [onFilterChange]);
    const handleSoilChange = useCallback((e: ChangeEvent<HTMLInputElement>) => onFilterChange("soilType", e.target.value), [onFilterChange]);
    const handleFrequencyChange = useCallback((v: string | null) => onFilterChange("wateringFrequency", v), [onFilterChange]);
    const handleTypeChange = useCallback((v: string | null) => onFilterChange("wateringType", v), [onFilterChange]);
    const handleDueChange = useCallback((checked: boolean) => onFilterChange("dueForWatering", checked), [onFilterChange]);

    return (
        <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-muted/30 p-3">
            <div className="flex items-center gap-2">
                <Label htmlFor="filter-name" className="text-xs text-muted-foreground whitespace-nowrap">Name</Label>
                <Input id="filter-name" className="h-7 w-36 text-xs" placeholder="Filter by name..." value={filters.name} onChange={handleNameChange} />
            </div>
            <FilterSelect label="Location" value={filters.location} onChange={handleLocationChange} options={locations} />
            <FilterSelect label="Luminosity" value={filters.luminosity} onChange={handleLuminosityChange} options={luminosities} />
            <div className="flex items-center gap-2">
                <Label htmlFor="filter-mist" className="text-xs text-muted-foreground whitespace-nowrap">Mist leaves</Label>
                <Switch id="filter-mist" size="sm" checked={filters.mistLeaves === true} onCheckedChange={handleMistChange} />
            </div>
            <div className="flex items-center gap-2">
                <Label htmlFor="filter-soil" className="text-xs text-muted-foreground whitespace-nowrap">Soil type</Label>
                <Input id="filter-soil" className="h-7 w-28 text-xs" placeholder="Filter..." value={filters.soilType} onChange={handleSoilChange} />
            </div>
            <FilterSelect label="Frequency" value={filters.wateringFrequency} onChange={handleFrequencyChange} options={wateringFrequencies} />
            <FilterSelect label="Type" value={filters.wateringType} onChange={handleTypeChange} options={wateringTypes} />
            <div className="flex items-center gap-2">
                <Label htmlFor="filter-due" className="text-xs text-muted-foreground whitespace-nowrap">Due for watering</Label>
                <Switch id="filter-due" size="sm" checked={filters.dueForWatering} onCheckedChange={handleDueChange} />
            </div>
            {hasActiveFilters && (
                <Button variant="ghost" size="xs" onClick={onClear}>
                    Clear filters
                </Button>
            )}
        </div>
    );
}
