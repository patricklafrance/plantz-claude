import { Plus, UserPlus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button, Separator } from "@packages/components";
import { useSession } from "@packages/core-module";
import type { Household, HouseholdMember } from "@packages/core-module";
import type { Plant } from "@packages/core-plants";

import { CreateHouseholdDialog } from "./CreateHouseholdDialog.tsx";
import * as api from "./householdApi.ts";
import { InviteMemberDialog } from "./InviteMemberDialog.tsx";
import { MembersList } from "./MembersList.tsx";
import { SharedPlantsList } from "./SharedPlantsList.tsx";

export function HouseholdPage() {
    const session = useSession();
    const [households, setHouseholds] = useState<Household[]>([]);
    const [members, setMembers] = useState<HouseholdMember[]>([]);
    const [plants, setPlants] = useState<Plant[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [createOpen, setCreateOpen] = useState(false);
    const [inviteOpen, setInviteOpen] = useState(false);
    const [removingUserId, setRemovingUserId] = useState<string | null>(null);
    const [unsharingPlantId, setUnsharingPlantId] = useState<string | null>(null);

    const household = households[0] ?? null;

    const loadData = useCallback(async () => {
        try {
            const fetchedHouseholds = await api.fetchHouseholds();
            setHouseholds(fetchedHouseholds);

            if (fetchedHouseholds.length > 0) {
                const hId = fetchedHouseholds[0]!.id;
                const [fetchedMembers, fetchedPlants] = await Promise.all([api.fetchHouseholdMembers(hId), api.fetchHouseholdPlants(hId)]);
                setMembers(fetchedMembers);
                setPlants(fetchedPlants);
            }
        } catch {
            // Silently handle — the user can reload.
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleCreateHousehold = useCallback(
        async (name: string) => {
            await api.createHousehold(name);
            await loadData();
        },
        [loadData],
    );

    const handleInviteMember = useCallback(
        async (email: string) => {
            if (!household) return;

            await api.inviteMember(household.id, email);
            await loadData();
        },
        [household, loadData],
    );

    const handleRemoveMember = useCallback(
        async (userId: string) => {
            if (!household) return;

            setRemovingUserId(userId);

            try {
                await api.removeMember(household.id, userId);
                await loadData();
            } finally {
                setRemovingUserId(null);
            }
        },
        [household, loadData],
    );

    const handleUnshare = useCallback(
        async (plantId: string) => {
            setUnsharingPlantId(plantId);

            try {
                await api.unsharePlant(plantId);
                await loadData();
            } finally {
                setUnsharingPlantId(null);
            }
        },
        [loadData],
    );

    const handleAssign = useCallback(
        async (plantId: string, userId: string | null) => {
            if (!household) return;

            await api.updatePlantAssignment(household.id, plantId, userId);
            await loadData();
        },
        [household, loadData],
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-6">
                <p className="text-muted-foreground text-sm">Loading household...</p>
            </div>
        );
    }

    if (!household) {
        return (
            <div className="flex flex-col gap-4 p-6">
                <h1 className="text-xl font-semibold">Household</h1>
                <div className="border-border flex flex-col items-center gap-4 rounded-lg border p-8">
                    <p className="text-muted-foreground text-sm">You don&apos;t have a household yet.</p>
                    <Button onClick={() => setCreateOpen(true)}>
                        <Plus data-icon="inline-start" />
                        Create Household
                    </Button>
                </div>
                <CreateHouseholdDialog open={createOpen} onOpenChange={setCreateOpen} onSubmit={handleCreateHousehold} />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                    <h1 className="text-xl font-semibold">{household.name}</h1>
                    <span className="text-muted-foreground text-xs">Created {household.creationDate.toLocaleDateString()}</span>
                </div>
            </div>

            <Separator />

            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium">Members</h2>
                    <Button size="sm" variant="outline" onClick={() => setInviteOpen(true)}>
                        <UserPlus data-icon="inline-start" />
                        Invite
                    </Button>
                </div>
                <MembersList members={members} currentUserId={session?.id ?? ""} onRemove={handleRemoveMember} removingUserId={removingUserId} />
            </div>

            <Separator />

            <div className="flex flex-col gap-3">
                <h2 className="text-lg font-medium">Shared Plants</h2>
                <SharedPlantsList plants={plants} members={members} onUnshare={handleUnshare} onAssign={handleAssign} unsharingPlantId={unsharingPlantId} />
            </div>

            <InviteMemberDialog open={inviteOpen} onOpenChange={setInviteOpen} onSubmit={handleInviteMember} />
        </div>
    );
}
