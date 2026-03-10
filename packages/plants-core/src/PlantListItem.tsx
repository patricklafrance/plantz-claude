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
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{plant.name}</span>
            {due ? (
                <span className="flex shrink-0 items-center gap-1">
                    <Droplets className="text-destructive size-3.5" aria-hidden="true" />
                    <span className="sr-only">Due for watering</span>
                </span>
            ) : (
                <span className="size-3.5 shrink-0" />
            )}
            <span className="text-muted-foreground w-24 shrink-0 truncate text-xs">{plant.wateringQuantity}</span>
            <span className="text-muted-foreground w-20 shrink-0 truncate text-xs">{getLabel(wateringTypes, plant.wateringType)}</span>
            <span className="text-muted-foreground w-24 shrink-0 truncate text-xs">{getLabel(locations, plant.location)}</span>
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
