import { UserMinus } from "lucide-react";

import { Button, Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@packages/components";
import type { HouseholdMember } from "@packages/core-module";
import { ResponsibilityBadge } from "@packages/core-plants";
import type { Plant } from "@packages/core-plants";

interface SharedPlantsListProps {
    plants: Plant[];
    members: HouseholdMember[];
    onUnshare: (plantId: string) => void;
    onAssign: (plantId: string, userId: string | null) => void;
    unsharingPlantId?: string | null;
}

export function SharedPlantsList({ plants, members, onUnshare, onAssign, unsharingPlantId }: SharedPlantsListProps) {
    if (plants.length === 0) {
        return (
            <div className="flex items-center justify-center py-4">
                <p className="text-muted-foreground text-sm">No plants shared with this household</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            {plants.map((plant) => (
                <div key={plant.id} className="flex items-center gap-3 rounded-lg border px-4 py-2.5">
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{plant.name}</span>
                    <ResponsibilityBadge assigneeName={plant.responsibilityUserName ?? null} />
                    <Select
                        value={plant.responsibilityUserId ?? "anyone"}
                        onValueChange={(v) => {
                            onAssign(plant.id, v === "anyone" ? null : v);
                        }}
                    >
                        <SelectTrigger className="w-32" aria-label={`Assign ${plant.name}`}>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectItem value="anyone">Anyone</SelectItem>
                                {members.map((m) => (
                                    <SelectItem key={m.userId} value={m.userId}>
                                        {m.userName}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon-xs" onClick={() => onUnshare(plant.id)} aria-label={`Unshare ${plant.name}`} disabled={unsharingPlantId === plant.id}>
                        <UserMinus />
                    </Button>
                </div>
            ))}
        </div>
    );
}
