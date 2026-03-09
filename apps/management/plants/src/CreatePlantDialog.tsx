import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Button, Input, Textarea, Label, Switch, Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue, DatePicker } from "@packages/components";
import { useState, type FormEvent } from "react";

import { locations, luminosities, wateringFrequencies, wateringTypes } from "./constants.ts";
import { plantsCollection } from "./plantsCollection.ts";

interface CreatePlantDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

function tomorrow() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(0, 0, 0, 0);
    return d;
}

export function CreatePlantDialog({ open, onOpenChange }: CreatePlantDialogProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [family, setFamily] = useState("");
    const [location, setLocation] = useState("living-room");
    const [luminosity, setLuminosity] = useState("medium");
    const [mistLeaves, setMistLeaves] = useState(true);
    const [soilType, setSoilType] = useState("");
    const [wateringFrequency, setWateringFrequency] = useState("1-week");
    const [wateringQuantity, setWateringQuantity] = useState("");
    const [wateringType, setWateringType] = useState("surface");
    const [firstWateringDate, setFirstWateringDate] = useState<Date | undefined>(tomorrow());

    const isValid = name.trim() !== "" && wateringQuantity.trim() !== "" && firstWateringDate !== undefined;

    function resetForm() {
        setName("");
        setDescription("");
        setFamily("");
        setLocation("living-room");
        setLuminosity("medium");
        setMistLeaves(true);
        setSoilType("");
        setWateringFrequency("1-week");
        setWateringQuantity("");
        setWateringType("surface");
        setFirstWateringDate(tomorrow());
    }

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (!isValid) return;

        const now = new Date();
        plantsCollection.insert({
            id: crypto.randomUUID(),
            name: name.trim(),
            description: description.trim() || undefined,
            family: family.trim() || undefined,
            location,
            luminosity,
            mistLeaves,
            soilType: soilType.trim() || undefined,
            wateringFrequency,
            wateringQuantity: wateringQuantity.trim(),
            wateringType,
            nextWateringDate: firstWateringDate!,
            creationDate: now,
            lastUpdateDate: now,
        });

        resetForm();
        onOpenChange(false);
    }

    function handleOpenChange(nextOpen: boolean) {
        if (!nextOpen) {
            resetForm();
        }
        onOpenChange(nextOpen);
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>New plant</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="create-name">Name *</Label>
                        <Input id="create-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Plant name" aria-required="true" aria-invalid={name.trim() === "" && name !== ""} aria-describedby={name.trim() === "" && name !== "" ? "create-name-error" : undefined} />
                        {name.trim() === "" && name !== "" && <p id="create-name-error" role="alert" className="text-xs text-destructive">Name is required.</p>}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="create-description">Description</Label>
                        <Textarea id="create-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="create-family">Family</Label>
                        <Input id="create-family" value={family} onChange={(e) => setFamily(e.target.value)} placeholder="Plant family" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <Label>Location *</Label>
                            <Select value={location} onValueChange={(v) => { if (v) setLocation(v); }}>
                                <SelectTrigger className="w-full" aria-label="Location">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {locations.map((l) => (
                                            <SelectItem key={l.id} value={l.id}>
                                                {l.label}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label>Luminosity *</Label>
                            <Select value={luminosity} onValueChange={(v) => { if (v) setLuminosity(v); }}>
                                <SelectTrigger className="w-full" aria-label="Luminosity">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {luminosities.map((l) => (
                                            <SelectItem key={l.id} value={l.id}>
                                                {l.label}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Label htmlFor="create-mist">Mist leaves *</Label>
                        <Switch id="create-mist" checked={mistLeaves} onCheckedChange={setMistLeaves} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="create-soil">Soil type</Label>
                        <Input id="create-soil" value={soilType} onChange={(e) => setSoilType(e.target.value)} placeholder="Soil type" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <Label>Watering frequency *</Label>
                            <Select value={wateringFrequency} onValueChange={(v) => { if (v) setWateringFrequency(v); }}>
                                <SelectTrigger className="w-full" aria-label="Watering frequency">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {wateringFrequencies.map((f) => (
                                            <SelectItem key={f.id} value={f.id}>
                                                {f.label}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label>Watering type *</Label>
                            <Select value={wateringType} onValueChange={(v) => { if (v) setWateringType(v); }}>
                                <SelectTrigger className="w-full" aria-label="Watering type">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {wateringTypes.map((t) => (
                                            <SelectItem key={t.id} value={t.id}>
                                                {t.label}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="create-quantity">Watering quantity *</Label>
                        <Input id="create-quantity" value={wateringQuantity} onChange={(e) => setWateringQuantity(e.target.value)} placeholder="e.g. 200ml" aria-required="true" aria-invalid={wateringQuantity.trim() === "" && wateringQuantity !== ""} aria-describedby={wateringQuantity.trim() === "" && wateringQuantity !== "" ? "create-quantity-error" : undefined} />
                        {wateringQuantity.trim() === "" && wateringQuantity !== "" && <p id="create-quantity-error" role="alert" className="text-xs text-destructive">Watering quantity is required.</p>}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label>First watering date *</Label>
                        <DatePicker value={firstWateringDate} onChange={setFirstWateringDate} placeholder="Pick a date" aria-label="First watering date" />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={!isValid}>
                            Create plant
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
