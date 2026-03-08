import { Button, Checkbox } from "@packages/components";
import { Droplets, Pencil, Trash2 } from "lucide-react";
import type { Plant } from "./plantSchema.ts";
import { locations, wateringTypes } from "./constants.ts";

interface PlantListItemProps {
    plant: Plant;
    selected: boolean;
    onToggleSelect: (id: string) => void;
    onEdit: (plant: Plant) => void;
    onDelete: (plant: Plant) => void;
}

function isDueForWatering(plant: Plant): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const next = new Date(plant.nextWateringDate);
    next.setHours(0, 0, 0, 0);
    return next <= today;
}

function getLabel(options: readonly { id: string; label: string }[], id: string): string {
    return options.find(o => o.id === id)?.label ?? id;
}

export function PlantListItem({ plant, selected, onToggleSelect, onEdit, onDelete }: PlantListItemProps) {
    const due = isDueForWatering(plant);

    return (
        <div className={`flex items-center gap-3 px-4 py-2.5 border-b border-border transition-colors ${due ? "bg-destructive/5" : "hover:bg-muted/50"}`}>
            <Checkbox
                checked={selected}
                onCheckedChange={() => onToggleSelect(plant.id)}
            />
            <div className="flex flex-1 items-center gap-4 min-w-0">
                <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{plant.name}</span>
                        {due && (
                            <Droplets className="size-3.5 text-destructive shrink-0" />
                        )}
                    </div>
                    <span className="text-xs text-muted-foreground truncate">
                        {plant.wateringQuantity} · {getLabel(wateringTypes, plant.wateringType)} · {getLabel(locations, plant.location)}
                    </span>
                </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon-xs" onClick={() => onEdit(plant)}>
                    <Pencil />
                </Button>
                <Button variant="ghost" size="icon-xs" onClick={() => onDelete(plant)}>
                    <Trash2 />
                </Button>
            </div>
        </div>
    );
}
