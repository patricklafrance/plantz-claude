import { useState, type FormEvent } from "react";

import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Label, Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@packages/components";
import type { HouseholdMember } from "@packages/core-module";
import type { Plant } from "@packages/core-plants";

interface SharePlantDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    plant: Plant | null;
    households: Array<{ id: string; name: string }>;
    members: HouseholdMember[];
    onShare: (plantId: string, householdId: string, responsibilityUserId: string | null) => void;
}

export function SharePlantDialog({ open, onOpenChange, plant, households, members, onShare }: SharePlantDialogProps) {
    const [householdId, setHouseholdId] = useState<string>(households[0]?.id ?? "");
    const [responsibilityUserId, setResponsibilityUserId] = useState<string>("anyone");

    function resetForm() {
        setHouseholdId(households[0]?.id ?? "");
        setResponsibilityUserId("anyone");
    }

    function handleSubmit(e: FormEvent) {
        e.preventDefault();

        if (!plant || !householdId) return;

        onShare(plant.id, householdId, responsibilityUserId === "anyone" ? null : responsibilityUserId);
        resetForm();
        onOpenChange(false);
    }

    function handleOpenChange(nextOpen: boolean) {
        if (!nextOpen) {
            resetForm();
        }

        onOpenChange(nextOpen);
    }

    if (!plant) return null;

    const isAlreadyShared = !!plant.householdId;

    const householdMembers = members.filter((m) => m.householdId === householdId);

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{isAlreadyShared ? "Update sharing" : "Share to household"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium">{plant.name}</span>
                    </div>
                    {households.length > 1 && (
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="share-household">Household</Label>
                            <Select
                                value={householdId}
                                onValueChange={(v) => {
                                    if (v) setHouseholdId(v);
                                }}
                            >
                                <SelectTrigger id="share-household" className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {households.map((h) => (
                                            <SelectItem key={h.id} value={h.id}>
                                                {h.name}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    {households.length === 1 && (
                        <div className="flex flex-col gap-1">
                            <span className="text-muted-foreground text-xs">Sharing with</span>
                            <span className="text-sm">{households[0]?.name}</span>
                        </div>
                    )}
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="share-responsibility">Assign responsibility</Label>
                        <Select
                            value={responsibilityUserId}
                            onValueChange={(v) => {
                                if (v) setResponsibilityUserId(v);
                            }}
                        >
                            <SelectTrigger id="share-responsibility" className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectItem value="anyone">Anyone</SelectItem>
                                    {householdMembers.map((m) => (
                                        <SelectItem key={m.userId} value={m.userId}>
                                            {m.userName}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" type="button" onClick={() => handleOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={!householdId}>
                            {isAlreadyShared ? "Update" : "Share"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
