import { Droplets, Pencil, Trash2 } from "lucide-react";
import { memo, useCallback, type MouseEvent } from "react";

import { Button, Checkbox } from "@packages/components";

import { locations, wateringTypes } from "./constants.ts";
import type { Plant } from "./plantSchema.ts";
import { getOptionLabel, isDueForWatering } from "./plantUtils.ts";

function stopPropagation(e: MouseEvent) {
    e.stopPropagation();
}

interface PlantListItemProps {
    plant: Plant;
    selected?: boolean | undefined;
    onClick?: ((plant: Plant) => void) | undefined;
    onToggleSelect?: ((id: string) => void) | undefined;
    onEdit?: ((plant: Plant) => void) | undefined;
    onDelete?: ((plant: Plant) => void) | undefined;
}

export const PlantListItem = memo(function PlantListItem({ plant, selected = false, onClick, onToggleSelect, onEdit, onDelete }: PlantListItemProps) {
    const due = isDueForWatering(plant);

    const isClickable = !!(onClick || onEdit);

    const handleToggleSelect = useCallback(() => onToggleSelect?.(plant.id), [onToggleSelect, plant.id]);
    const handleClick = useCallback(() => (onClick ?? onEdit)?.(plant), [onClick, onEdit, plant]);
    const handleEdit = useCallback(
        (e: MouseEvent) => {
            e.stopPropagation();
            onEdit?.(plant);
        },
        [onEdit, plant],
    );
    const handleDelete = useCallback(
        (e: MouseEvent) => {
            e.stopPropagation();
            onDelete?.(plant);
        },
        [onDelete, plant],
    );

    return (
        <div
            className={`border-border flex h-full items-center gap-3 border-b px-4 py-2.5 transition-colors ${due ? "bg-destructive/5" : "hover:bg-muted/50"}`}
            role={isClickable ? "button" : undefined}
            tabIndex={isClickable ? 0 : undefined}
            onClick={isClickable ? handleClick : undefined}
            onKeyDown={
                isClickable
                    ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              handleClick();
                          }
                      }
                    : undefined
            }
        >
            {onToggleSelect && (
                // oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- stopPropagation prevents row click; checkbox handles its own keyboard events
                <span onClick={stopPropagation}>
                    <Checkbox checked={selected} onCheckedChange={handleToggleSelect} aria-label={`Select ${plant.name}`} />
                </span>
            )}
            <div className="flex min-w-0 flex-1 items-center gap-4">
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
