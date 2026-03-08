import { useLiveQuery } from "@tanstack/react-db";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Plus } from "lucide-react";
import { useState, useRef, useMemo, useCallback } from "react";

import { Button, Checkbox } from "@packages/components";

import { CreatePlantDialog } from "./CreatePlantDialog.tsx";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog.tsx";
import { EditPlantDialog } from "./EditPlantDialog.tsx";
import { FilterBar } from "./FilterBar.tsx";
import { PlantListItem } from "./PlantListItem.tsx";
import type { Plant } from "./plantSchema.ts";
import { plantsCollection } from "./plantsCollection.ts";
import { usePlantFilters } from "./usePlantFilters.ts";

function isDueForWatering(plant: Plant): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const next = new Date(plant.nextWateringDate);
    next.setHours(0, 0, 0, 0);
    return next <= today;
}

export function PlantsPage() {
    const { filters, updateFilter, clearFilters, hasActiveFilters } = usePlantFilters();
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [createOpen, setCreateOpen] = useState(false);
    const [editPlant, setEditPlant] = useState<Plant | null>(null);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Plant[] | null>(null);
    const parentRef = useRef<HTMLDivElement>(null);

    const { data: allPlants } = useLiveQuery((q) => q.from({ plant: plantsCollection }).orderBy(({ plant }) => plant.name, "asc"));

    const plants = useMemo(() => {
        if (!allPlants) return [];
        let result = allPlants as Plant[];

        if (filters.name) {
            const needle = filters.name.toLowerCase();
            result = result.filter((p) => p.name.toLowerCase().includes(needle));
        }
        if (filters.location) {
            result = result.filter((p) => p.location === filters.location);
        }
        if (filters.luminosity) {
            result = result.filter((p) => p.luminosity === filters.luminosity);
        }
        if (filters.mistLeaves !== null) {
            result = result.filter((p) => p.mistLeaves === true);
        }
        if (filters.wateringFrequency) {
            result = result.filter((p) => p.wateringFrequency === filters.wateringFrequency);
        }
        if (filters.wateringType) {
            result = result.filter((p) => p.wateringType === filters.wateringType);
        }
        if (filters.dueForWatering) {
            result = result.filter((p) => isDueForWatering(p));
        }
        if (filters.soilType) {
            const needle = filters.soilType.toLowerCase();
            result = result.filter((p) => p.soilType?.toLowerCase().includes(needle));
        }

        return result;
    }, [allPlants, filters]);

    const virtualizer = useVirtualizer({
        count: plants.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 53,
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

    function handleDeleteSingle(plant: Plant) {
        setDeleteTarget([plant]);
    }

    function handleBulkDelete() {
        const selected = plants.filter((p) => selectedIds.has(p.id));
        if (selected.length > 0) {
            setDeleteTarget(selected);
        }
    }

    function confirmDelete() {
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
        if (editOpen && editPlant && deleteTarget.some((p) => p.id === editPlant.id)) {
            setEditOpen(false);
            setEditPlant(null);
        }
        setDeleteTarget(null);
    }

    function handleEditFromDialog(plant: Plant) {
        setEditOpen(false);
        setEditPlant(null);
        handleDeleteSingle(plant);
    }

    const selectedCount = plants.filter((p) => selectedIds.has(p.id)).length;

    return (
        <div className="flex h-full flex-col gap-4 p-6">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">Plants</h1>
                <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => setCreateOpen(true)}>
                        <Plus data-icon="inline-start" />
                        New plant
                    </Button>
                </div>
            </div>

            <FilterBar filters={filters} onFilterChange={updateFilter} onClear={clearFilters} hasActiveFilters={hasActiveFilters} />

            {selectedCount > 0 && (
                <div className="border-primary/20 bg-primary/5 flex items-center gap-3 rounded-lg border px-4 py-2">
                    <span className="text-sm font-medium">{selectedCount} selected</span>
                    <Button variant="destructive" size="xs" onClick={handleBulkDelete}>
                        Delete selected
                    </Button>
                </div>
            )}

            <div className="text-muted-foreground text-xs">
                {plants.length} plant{plants.length !== 1 ? "s" : ""}
            </div>

            <div className="border-border flex-1 overflow-hidden rounded-lg border">
                <div className="bg-muted/50 border-border flex items-center gap-3 border-b px-4 py-2">
                    <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                    <span className="text-muted-foreground flex-1 text-xs font-medium">Name</span>
                    <span className="text-muted-foreground w-20 text-right text-xs font-medium">Actions</span>
                </div>
                <div ref={parentRef} className="overflow-auto" style={{ height: "calc(100vh - 340px)" }}>
                    <div
                        style={{
                            height: `${virtualizer.getTotalSize()}px`,
                            width: "100%",
                            position: "relative",
                        }}
                    >
                        {virtualizer.getVirtualItems().map((virtualRow) => {
                            const plant = plants[virtualRow.index]!;
                            return (
                                <div
                                    key={plant.id}
                                    style={{
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        width: "100%",
                                        height: `${virtualRow.size}px`,
                                        transform: `translateY(${virtualRow.start}px)`,
                                    }}
                                >
                                    <PlantListItem
                                        plant={plant}
                                        selected={selectedIds.has(plant.id)}
                                        onToggleSelect={toggleSelect}
                                        onEdit={(plant) => {
                                            setEditPlant(plant);
                                            setEditOpen(true);
                                        }}
                                        onDelete={handleDeleteSingle}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <CreatePlantDialog open={createOpen} onOpenChange={setCreateOpen} />
            <EditPlantDialog plant={editPlant} open={editOpen} onOpenChange={setEditOpen} onDelete={handleEditFromDialog} />
            <DeleteConfirmDialog
                open={deleteTarget !== null}
                onOpenChange={(open) => {
                    if (!open) setDeleteTarget(null);
                }}
                plantNames={deleteTarget?.map((p) => p.name) ?? []}
                onConfirm={confirmDelete}
            />
        </div>
    );
}
