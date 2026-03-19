import { Badge } from "@packages/components";

interface SharedPlantBadgeProps {
    householdName?: string;
}

export function SharedPlantBadge({ householdName }: SharedPlantBadgeProps) {
    return (
        <Badge variant="outline" className="border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
            {householdName ? `Shared · ${householdName}` : "Shared"}
        </Badge>
    );
}
