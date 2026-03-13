import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";

import { Button } from "@packages/components";
import { AUTH_TOKEN_KEY } from "@packages/plants-core";

import { useSession } from "./SessionContext.tsx";

function getInitials(name: string): string {
    return name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

export function UserRibbon() {
    const session = useSession();
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    if (!session) {
        return null;
    }

    function handleLogout() {
        sessionStorage.removeItem(AUTH_TOKEN_KEY);
        queryClient.clear();
        navigate("/login");
    }

    return (
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
                <span className="bg-primary text-primary-foreground flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium">{getInitials(session.name)}</span>
                <span className="text-foreground text-sm">{session.name}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
                Log out
            </Button>
        </div>
    );
}
