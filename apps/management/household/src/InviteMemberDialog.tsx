import { useState, type FormEvent } from "react";

import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input, Label } from "@packages/components";

interface InviteMemberDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (email: string) => Promise<void>;
}

function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function InviteMemberDialog({ open, onOpenChange, onSubmit }: InviteMemberDialogProps) {
    const [email, setEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [touched, setTouched] = useState(false);

    const isValid = isValidEmail(email.trim());
    const showError = touched && email.trim() !== "" && !isValid;

    function resetForm() {
        setEmail("");
        setIsSubmitting(false);
        setTouched(false);
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();

        if (!isValid || isSubmitting) return;

        setIsSubmitting(true);

        try {
            await onSubmit(email.trim());
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
                    <DialogTitle>Invite member</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="invite-email">Email address *</Label>
                        <Input id="invite-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => setTouched(true)} placeholder="member@example.com" aria-required="true" aria-invalid={showError} aria-describedby={showError ? "invite-email-error" : undefined} />
                        {showError && (
                            <p id="invite-email-error" role="alert" className="text-destructive text-xs">
                                Please enter a valid email address.
                            </p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" type="button" onClick={() => handleOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={!isValid || isSubmitting}>
                            {isSubmitting ? "Inviting..." : "Invite"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
