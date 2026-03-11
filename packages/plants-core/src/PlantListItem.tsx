import { Droplets, Pencil, Trash2 } from "lucide-react";
import { memo, useCallback } from "react";

import { Button, Checkbox } from "@packages/components";

import { locations, wateringTypes } from "./constants.ts";
import type { Plant } from "./plantSchema.ts";
import { isDueForWatering } from "./plantUtils.ts";

interface PlantListItemProps {
    plant: Plant;
    selected: boolean;
    onToggleSelect: (id: string) => void;
    onEdit?: ((plant: Plant) => void) | undefined;
    onDelete: (plant: Plant) => void;
}

function getLabel(options: readonly { id: string; label: string }[], id: string): string {
    return options.find((o) => o.id === id)?.label ?? id;
}

export const PlantListItem = memo(function PlantListItem({ plant, selected, onToggleSelect, onEdit, onDelete }: PlantListItemProps) {
    const due = isDueForWatering(plant);

    const handleToggleSelect = useCallback(() => onToggleSelect(plant.id), [onToggleSelect, plant.id]);
    const handleEdit = useCallback(() => onEdit?.(plant), [onEdit, plant]);
    const handleDelete = useCallback(() => onDelete(plant), [onDelete, plant]);

    return (
        <div className={`border-border flex items-center gap-3 border-b px-4 py-2.5 transition-colors ${due ? "bg-destructive/5" : "hover:bg-muted/50"}`}>
            <Checkbox checked={selected} onCheckedChange={handleToggleSelect} aria-label={`Select ${plant.name}`} />
            <div className="flex min-w-0 flex-1 items-center gap-4">
                <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">{plant.name}</span>
                        {due && (
                            <>
                                <Droplets className="text-destructive size-3.5 shrink-0" aria-hidden="true" />
                                <span className="sr-only">Due for watering</span>
                            </>
                        )}
                    </div>
                    <span className="text-muted-foreground truncate text-xs">
                        {plant.wateringQuantity} · {getLabel(wateringTypes, plant.wateringType)} · {getLabel(locations, plant.location)}
                    </span>
                </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
                {onEdit && (
                    <Button variant="ghost" size="icon-xs" onClick={handleEdit} aria-label={`Edit ${plant.name}`}>
                        <Pencil />
                    </Button>
                )}
                <Button variant="ghost" size="icon-xs" onClick={handleDelete} aria-label={`Delete ${plant.name}`}>
                    <Trash2 />
                </Button>
            </div>
        </div>
    );
});
