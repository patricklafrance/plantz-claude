import { Trash2 } from "lucide-react";

import { Badge, Button } from "@packages/components";
import type { HouseholdMember } from "@packages/core-module";

interface MembersListProps {
    members: HouseholdMember[];
    currentUserId: string;
    onRemove: (userId: string) => void;
    removingUserId?: string | null;
}

export function MembersList({ members, currentUserId, onRemove, removingUserId }: MembersListProps) {
    if (members.length === 0) {
        return (
            <div className="flex items-center justify-center py-4">
                <p className="text-muted-foreground text-sm">No members yet</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            {members.map((member) => (
                <div key={member.id} className="flex items-center gap-3 rounded-lg border px-4 py-2.5">
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{member.userName}</span>
                    <Badge variant="outline" className={member.role === "owner" ? "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" : "bg-muted text-muted-foreground border-transparent"}>
                        {member.role === "owner" ? "Owner" : "Member"}
                    </Badge>
                    {member.userId !== currentUserId && member.role !== "owner" && (
                        <Button variant="ghost" size="icon-xs" onClick={() => onRemove(member.userId)} aria-label={`Remove ${member.userName}`} disabled={removingUserId === member.userId}>
                            <Trash2 />
                        </Button>
                    )}
                </div>
            ))}
        </div>
    );
}
