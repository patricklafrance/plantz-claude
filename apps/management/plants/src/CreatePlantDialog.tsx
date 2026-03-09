import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Button, Input, Textarea, Label, Switch, Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue, DatePicker } from "@packages/components";
import { useState, useCallback, type ChangeEvent, type FormEvent } from "react";

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

    const handleSubmit = useCallback((e: FormEvent) => {
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
    }, [isValid, name, description, family, location, luminosity, mistLeaves, soilType, wateringFrequency, wateringQuantity, wateringType, firstWateringDate, onOpenChange]);

    const handleOpenChange = useCallback((nextOpen: boolean) => {
        if (!nextOpen) {
            resetForm();
        }
        onOpenChange(nextOpen);
    }, [onOpenChange]);

    const handleNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => setName(e.target.value), []);
    const handleDescriptionChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value), []);
    const handleFamilyChange = useCallback((e: ChangeEvent<HTMLInputElement>) => setFamily(e.target.value), []);
    const handleLocationChange = useCallback((v: string | null) => { if (v) setLocation(v); }, []);
    const handleLuminosityChange = useCallback((v: string | null) => { if (v) setLuminosity(v); }, []);
    const handleSoilTypeChange = useCallback((e: ChangeEvent<HTMLInputElement>) => setSoilType(e.target.value), []);
    const handleWateringFrequencyChange = useCallback((v: string | null) => { if (v) setWateringFrequency(v); }, []);
    const handleWateringTypeChange = useCallback((v: string | null) => { if (v) setWateringType(v); }, []);
    const handleWateringQuantityChange = useCallback((e: ChangeEvent<HTMLInputElement>) => setWateringQuantity(e.target.value), []);

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>New plant</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="create-name">Name *</Label>
                        <Input id="create-name" value={name} onChange={handleNameChange} placeholder="Plant name" aria-required="true" aria-invalid={name.trim() === "" && name !== ""} aria-describedby={name.trim() === "" && name !== "" ? "create-name-error" : undefined} />
                        {name.trim() === "" && name !== "" && <p id="create-name-error" role="alert" className="text-xs text-destructive">Name is required.</p>}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="create-description">Description</Label>
                        <Textarea id="create-description" value={description} onChange={handleDescriptionChange} placeholder="Optional description" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="create-family">Family</Label>
                        <Input id="create-family" value={family} onChange={handleFamilyChange} placeholder="Plant family" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <Label>Location *</Label>
                            <Select value={location} onValueChange={handleLocationChange}>
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
                            <Select value={luminosity} onValueChange={handleLuminosityChange}>
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
                        <Input id="create-soil" value={soilType} onChange={handleSoilTypeChange} placeholder="Soil type" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <Label>Watering frequency *</Label>
                            <Select value={wateringFrequency} onValueChange={handleWateringFrequencyChange}>
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
                            <Select value={wateringType} onValueChange={handleWateringTypeChange}>
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
                        <Input id="create-quantity" value={wateringQuantity} onChange={handleWateringQuantityChange} placeholder="e.g. 200ml" aria-required="true" aria-invalid={wateringQuantity.trim() === "" && wateringQuantity !== ""} aria-describedby={wateringQuantity.trim() === "" && wateringQuantity !== "" ? "create-quantity-error" : undefined} />
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
