import { useLiveQuery } from "@tanstack/react-db";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useState, useRef, useMemo, useCallback } from "react";

import { Button, Checkbox } from "@packages/components";
import { applyPlantFilters, DeleteConfirmDialog, FilterBar, isDueForWatering, PlantListItem, plantsCollection, usePlantFilters } from "@packages/plants-core";
import type { Plant } from "@packages/plants-core";

const scrollContainerStyle = { height: "calc(100vh - 340px)" };

export function LandingPage() {
    const { filters, updateFilter, clearFilters, hasActiveFilters } = usePlantFilters();
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [deleteTarget, setDeleteTarget] = useState<Plant[] | null>(null);
    const parentRef = useRef<HTMLDivElement>(null);

    const { data: allPlants } = useLiveQuery((q) => q.from({ plant: plantsCollection }).orderBy(({ plant }) => plant.name, "asc"));

    const plants = useMemo(() => {
        if (!allPlants) return [];

        // First filter to only plants due for watering, then apply user filters
        const duePlants = (allPlants as Plant[]).filter((p) => isDueForWatering(p));
        return applyPlantFilters(duePlants, filters);
    }, [allPlants, filters]);

    const virtualizer = useVirtualizer({
        count: plants.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 41,
        overscan: 10,
    });

    const allSelected = plants.length > 0 && plants.every((p) => selectedIds.has(p.id));

    const toggleSelect = useCallback((id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    const toggleAll = useCallback(() => {
        if (allSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(plants.map((p) => p.id)));
        }
    }, [allSelected, plants]);

    const handleDeleteSingle = useCallback((plant: Plant) => {
        setDeleteTarget([plant]);
    }, []);

    const handleBulkDelete = useCallback(() => {
        const selected = plants.filter((p) => selectedIds.has(p.id));
        if (selected.length > 0) {
            setDeleteTarget(selected);
        }
    }, [plants, selectedIds]);

    const confirmDelete = useCallback(() => {
        if (!deleteTarget) return;
        for (const plant of deleteTarget) {
            plantsCollection.delete(plant.id);
        }
        setSelectedIds((prev) => {
            const next = new Set(prev);
            for (const plant of deleteTarget) {
                next.delete(plant.id);
            }
            return next;
        });
        setDeleteTarget(null);
    }, [deleteTarget]);

    const handleDeleteDialogOpenChange = useCallback((open: boolean) => {
        if (!open) setDeleteTarget(null);
    }, []);

    const selectedCount = plants.filter((p) => selectedIds.has(p.id)).length;

    const deleteTargetNames = deleteTarget?.map((p) => p.name) ?? [];

    const totalSize = virtualizer.getTotalSize();
    const virtualizerContainerStyle = useMemo(
        () => ({
            height: `${totalSize}px`,
            width: "100%",
            position: "relative" as const,
        }),
        [totalSize],
    );

    return (
        <div className="flex h-full flex-col gap-4 p-6">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">Today</h1>
            </div>

            <FilterBar filters={filters} onFilterChange={updateFilter} onClear={clearFilters} hasActiveFilters={hasActiveFilters} showDueForWatering={false} />

            {selectedCount > 0 && (
                <div role="status" className="border-primary/20 bg-primary/5 flex items-center gap-3 rounded-lg border px-4 py-2">
                    <span className="text-sm font-medium">{selectedCount} selected</span>
                    <Button variant="destructive" size="xs" onClick={handleBulkDelete}>
                        Delete selected
                    </Button>
                </div>
            )}

            <div role="status" aria-live="polite" className="text-muted-foreground text-xs">
                {plants.length} plant{plants.length !== 1 ? "s" : ""} due for watering
            </div>

            <div className="border-border flex-1 overflow-hidden rounded-lg border">
                <div className="bg-muted/50 border-border flex items-center gap-3 border-b px-4 py-2">
                    <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Select all plants" />
                    <span className="text-muted-foreground min-w-0 flex-1 text-xs font-medium" aria-hidden="true">
                        Name
                    </span>
                    <span className="size-3.5 shrink-0" aria-hidden="true" />
                    <span className="text-muted-foreground w-24 shrink-0 text-xs font-medium" aria-hidden="true">
                        Quantity
                    </span>
                    <span className="text-muted-foreground w-20 shrink-0 text-xs font-medium" aria-hidden="true">
                        Type
                    </span>
                    <span className="text-muted-foreground w-24 shrink-0 text-xs font-medium" aria-hidden="true">
                        Location
                    </span>
                    <span className="text-muted-foreground w-16 shrink-0 text-right text-xs font-medium" aria-hidden="true">
                        Actions
                    </span>
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
                                    <PlantListItem plant={plant} selected={selectedIds.has(plant.id)} onToggleSelect={toggleSelect} onDelete={handleDeleteSingle} />
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <DeleteConfirmDialog open={deleteTarget !== null} onOpenChange={handleDeleteDialogOpenChange} plantNames={deleteTargetNames} onConfirm={confirmDelete} />
        </div>
    );
}
