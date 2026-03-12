import { useLiveQuery } from "@tanstack/react-db";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useState, useRef, useMemo, useCallback } from "react";

import { applyPlantFilters, FilterBar, isDueForWatering, PlantListHeader, PlantListItem, usePlantFilters } from "@packages/plants-core";
import type { Plant } from "@packages/plants-core";

import { PlantDetailDialog } from "./PlantDetailDialog.tsx";
import { useTodayPlantsCollection } from "./TodayPlantsContext.tsx";

const scrollbarGutterStyle = { scrollbarGutter: "stable" as const };
const scrollContainerStyle = { height: "calc(100vh - 376px)", ...scrollbarGutterStyle };

export function LandingPage() {
    const { filters, updateFilter, clearFilters, hasActiveFilters } = usePlantFilters();
    const [detailPlant, setDetailPlant] = useState<Plant | null>(null);
    const parentRef = useRef<HTMLDivElement>(null);

    const collection = useTodayPlantsCollection();
    const { data: allPlants, isReady } = useLiveQuery((q) => q.from({ plant: collection }));

    const plants = useMemo(() => {
        if (!allPlants) return [];

        // First sort by name, then filter to only plants due for watering, then apply user filters
        const sorted = allPlants.toSorted((a, b) => a.name.localeCompare(b.name));
        const duePlants = sorted.filter((p) => isDueForWatering(p));

        return applyPlantFilters(duePlants, filters);
    }, [allPlants, filters]);

    const virtualizer = useVirtualizer({
        count: plants.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 49,
        overscan: 10,
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
            <div className="flex h-full items-center justify-center p-6">
                <p className="text-muted-foreground text-sm">Loading plants...</p>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col gap-4 p-6">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">Today</h1>
            </div>

            <FilterBar filters={filters} onFilterChange={updateFilter} onClear={clearFilters} hasActiveFilters={hasActiveFilters} showDueForWatering={false} />

            <div role="status" aria-live="polite" className="text-muted-foreground text-xs">
                {plants.length} plant{plants.length !== 1 ? "s" : ""} due for watering
            </div>

            <div className="border-border flex-1 overflow-hidden rounded-lg border">
                <div className="overflow-y-auto" style={scrollbarGutterStyle}>
                    <PlantListHeader />
                </div>
                <div ref={parentRef} className="overflow-auto" style={scrollContainerStyle}>
                    <div role="list" aria-label="Plants due for watering" style={virtualizerContainerStyle}>
                        {virtualizer.getVirtualItems().map((virtualRow) => {
                            const plant = plants[virtualRow.index]!;
                            // oxlint-disable-next-line react-perf/jsx-no-new-object-as-prop -- Virtual row positioning requires per-item inline styles
                            const rowStyle = {
                                position: "absolute" as const,
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: `${virtualRow.size}px`,
                                transform: `translateY(${virtualRow.start}px)`,
                            };
                            return (
                                <div key={plant.id} role="listitem" style={rowStyle}>
                                    <PlantListItem plant={plant} onClick={handleViewDetail} />
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <PlantDetailDialog plant={detailPlant} open={detailPlant !== null} onOpenChange={handleDetailOpenChange} />
        </div>
    );
}
