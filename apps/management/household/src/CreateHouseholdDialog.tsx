import { useState, type FormEvent } from "react";

import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input, Label } from "@packages/components";

interface CreateHouseholdDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (name: string) => Promise<void>;
}

export function CreateHouseholdDialog({ open, onOpenChange, onSubmit }: CreateHouseholdDialogProps) {
    const [name, setName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isValid = name.trim() !== "";

    function resetForm() {
        setName("");
        setIsSubmitting(false);
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();

        if (!isValid || isSubmitting) return;

        setIsSubmitting(true);

        try {
            await onSubmit(name.trim());
            resetForm();
            onOpenChange(false);
        } catch {
            setIsSubmitting(false);
        }
    }

    function handleOpenChange(nextOpen: boolean) {
        if (!nextOpen) {
            resetForm();
        }

        onOpenChange(nextOpen);
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Create household</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="household-name">Household name *</Label>
                        <Input id="household-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Our Apartment" aria-required="true" />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" type="button" onClick={() => handleOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={!isValid || isSubmitting}>
                            {isSubmitting ? "Creating..." : "Create household"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
