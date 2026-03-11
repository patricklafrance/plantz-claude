import { Droplets, Pencil, Trash2 } from "lucide-react";
import { memo, useCallback } from "react";

import { Button, Checkbox } from "@packages/components";

import { locations, wateringTypes } from "./constants.ts";
import type { Plant } from "./plantSchema.ts";
import { getOptionLabel, isDueForWatering } from "./plantUtils.ts";

interface PlantListItemProps {
    plant: Plant;
    selected?: boolean | undefined;
    onToggleSelect?: ((id: string) => void) | undefined;
    onEdit?: ((plant: Plant) => void) | undefined;
    onDelete?: ((plant: Plant) => void) | undefined;
}

export const PlantListItem = memo(function PlantListItem({ plant, selected = false, onToggleSelect, onEdit, onDelete }: PlantListItemProps) {
    const due = isDueForWatering(plant);

    const handleToggleSelect = useCallback(() => onToggleSelect?.(plant.id), [onToggleSelect, plant.id]);
    const handleEdit = useCallback(() => onEdit?.(plant), [onEdit, plant]);
    const handleDelete = useCallback(() => onDelete?.(plant), [onDelete, plant]);

    return (
        <div className={`border-border flex h-full items-center gap-3 border-b px-4 py-2.5 transition-colors ${due ? "bg-destructive/5" : "hover:bg-muted/50"}`}>
            {onToggleSelect && <Checkbox checked={selected} onCheckedChange={handleToggleSelect} aria-label={`Select ${plant.name}`} />}
            <div
                className={`flex min-w-0 flex-1 items-center gap-4 ${onEdit ? "cursor-pointer" : ""}`}
                role={onEdit ? "button" : undefined}
                tabIndex={onEdit ? 0 : undefined}
                onClick={onEdit ? handleEdit : undefined}
                onKeyDown={
                    onEdit
                        ? (e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  handleEdit();
                              }
                          }
                        : undefined
                }
            >
                <div className="flex min-w-0 flex-1 flex-col md:flex-row md:items-center md:gap-4">
                    <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">{plant.name}</span>
                        {due && (
                            <>
                                <Droplets className="text-destructive size-3.5 shrink-0" aria-hidden="true" />
                                <span className="sr-only">Due for watering</span>
                            </>
                        )}
                    </div>
                    <span className="text-muted-foreground truncate text-xs whitespace-nowrap">
                        {plant.wateringQuantity} · {getOptionLabel(wateringTypes, plant.wateringType)} · {getOptionLabel(locations, plant.location)}
                    </span>
                </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
                {onEdit && (
                    <Button variant="ghost" size="icon-xs" onClick={handleEdit} aria-label={`Edit ${plant.name}`}>
                        <Pencil />
                    </Button>
                )}
                {onDelete && (
                    <Button variant="ghost" size="icon-xs" onClick={handleDelete} aria-label={`Delete ${plant.name}`}>
                        <Trash2 />
                    </Button>
                )}
            </div>
        </div>
    );
});
