import { formatDistance, formatDistanceToNow } from "date-fns";

interface WateredByAttributionProps {
    actorName: string;
    eventDate: Date;
    now?: Date;
}

export function WateredByAttribution({ actorName, eventDate, now }: WateredByAttributionProps) {
    const timeAgo = now ? formatDistance(eventDate, now, { addSuffix: true }) : formatDistanceToNow(eventDate, { addSuffix: true });

    return (
        <span aria-live="polite" className="text-muted-foreground text-xs">
            Watered by {actorName} {timeAgo}
        </span>
    );
}
