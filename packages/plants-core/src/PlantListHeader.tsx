import { PLANT_LIST_GRID } from "./plantListLayout.ts";

interface PlantListHeaderProps {
    showCheckbox?: boolean | undefined;
    showActions?: boolean | undefined;
}

export function PlantListHeader({ showCheckbox = false, showActions = false }: PlantListHeaderProps) {
    return (
        <div className="bg-muted/50 border-border hidden items-center gap-3 border-b px-4 py-2 md:flex">
            {showCheckbox && <span className="w-4 shrink-0" />}
            <div className={`min-w-0 flex-1 items-center gap-4 ${PLANT_LIST_GRID}`}>
                <span className="text-muted-foreground text-xs font-medium">Name</span>
                <span className="text-muted-foreground text-xs font-medium">Watering Qty</span>
                <span className="text-muted-foreground text-xs font-medium">Watering Type</span>
                <span className="text-muted-foreground text-xs font-medium">Location</span>
            </div>
            {showActions && (
                <div className="flex shrink-0 items-center gap-1">
                    <span className="w-6" />
                    <span className="w-6" />
                </div>
            )}
        </div>
    );
}
