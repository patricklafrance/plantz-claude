import { Badge } from "@packages/components";

interface ResponsibilityBadgeProps {
    assigneeName: string | null;
}

export function ResponsibilityBadge({ assigneeName }: ResponsibilityBadgeProps) {
    return (
        <Badge variant="outline" className="border-transparent bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300">
            {assigneeName ?? "Anyone"}
        </Badge>
    );
}
