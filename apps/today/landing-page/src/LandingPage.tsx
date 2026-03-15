import { useLiveQuery } from "@tanstack/react-db";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { useState, useRef, useMemo, useCallback } from "react";

import { applyPlantFilters, FilterBar, isDueForWatering, PlantListHeader, PlantListItem, usePlantFilters } from "@packages/core-plants";
import type { Plant } from "@packages/core-plants";

import { PlantDetailDialog } from "./PlantDetailDialog.tsx";
import { useTodayPlantsCollection } from "./TodayPlantsContext.tsx";

export function LandingPage() {
    const { filters, updateFilter, clearFilters, hasActiveFilters } = usePlantFilters();
    const [detailPlant, setDetailPlant] = useState<Plant | null>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const collection = useTodayPlantsCollection();
    const { data: allPlants, isReady } = useLiveQuery((q) => q.from({ plant: collection }));

    const plants = useMemo(() => {
        if (!allPlants) return [];

        // First sort by name, then filter to only plants due for watering, then apply user filters
        const sorted = allPlants.toSorted((a, b) => a.name.localeCompare(b.name));
        const duePlants = sorted.filter((p) => isDueForWatering(p));

        return applyPlantFilters(duePlants, filters);
    }, [allPlants, filters]);

    const virtualizer = useWindowVirtualizer({
        count: plants.length,
        estimateSize: () => 49,
        overscan: 10,
        scrollMargin: (listRef.current?.getBoundingClientRect().top ?? 0) + window.scrollY,
    });

    const handleViewDetail = useCallback((plant: Plant) => {
        setDetailPlant(plant);
    }, []);

    const handleDetailOpenChange = useCallback((open: boolean) => {
        if (!open) {
            setDetailPlant(null);
        }
    }, []);

    const totalSize = virtualizer.getTotalSize();
    const virtualizerContainerStyle = useMemo(
        () => ({
            height: `${totalSize}px`,
            width: "100%",
            position: "relative" as const,
        }),
        [totalSize],
    );

    if (!isReady) {
        return (
            <div className="flex items-center justify-center p-6">
                <p className="text-muted-foreground text-sm">Loading plants...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 p-6">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">Today</h1>
            </div>

            <FilterBar filters={filters} onFilterChange={updateFilter} onClear={clearFilters} hasActiveFilters={hasActiveFilters} showDueForWatering={false} />

            <div role="status" aria-live="polite" className="text-muted-foreground text-xs">
                {plants.length} plant{plants.length !== 1 ? "s" : ""} due for watering
            </div>

            <div className="border-border rounded-lg border">
                <PlantListHeader />
                <div ref={listRef} role="list" aria-label="Plants due for watering" style={virtualizerContainerStyle}>
                    {virtualizer.getVirtualItems().map((virtualRow) => {
                        const plant = plants[virtualRow.index]!;
                        // oxlint-disable-next-line react-perf/jsx-no-new-object-as-prop -- Virtual row positioning requires per-item inline styles
                        const rowStyle = {
                            position: "absolute" as const,
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: `${virtualRow.size}px`,
                            transform: `translateY(${virtualRow.start - virtualizer.options.scrollMargin}px)`,
                        };
                        return (
                            <div key={plant.id} role="listitem" style={rowStyle}>
                                <PlantListItem plant={plant} onClick={handleViewDetail} />
                            </div>
                        );
                    })}
                </div>
            </div>

            <PlantDetailDialog plant={detailPlant} open={detailPlant !== null} onOpenChange={handleDetailOpenChange} />
        </div>
    );
}
