import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Button, Input, Textarea, Label, Switch, Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue, DatePicker } from "@packages/components";
import { format } from "date-fns";
import { useState, useEffect, useRef, useCallback } from "react";

import { locations, luminosities, wateringFrequencies, wateringTypes } from "./constants.ts";
import type { Plant } from "./plantSchema.ts";
import { plantsCollection } from "./plantsCollection.ts";

interface EditPlantDialogProps {
    plant: Plant | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onDelete: (plant: Plant) => void;
}

export function EditPlantDialog({ plant, open, onOpenChange, onDelete }: EditPlantDialogProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [family, setFamily] = useState("");
    const [location, setLocation] = useState("");
    const [luminosity, setLuminosity] = useState("");
    const [mistLeaves, setMistLeaves] = useState(false);
    const [soilType, setSoilType] = useState("");
    const [wateringFrequency, setWateringFrequency] = useState("");
    const [wateringQuantity, setWateringQuantity] = useState("");
    const [wateringType, setWateringType] = useState("");
    const [saved, setSaved] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const plantIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (plant) {
            plantIdRef.current = plant.id;
            setName(plant.name);
            setDescription(plant.description ?? "");
            setFamily(plant.family ?? "");
            setLocation(plant.location);
            setLuminosity(plant.luminosity);
            setMistLeaves(plant.mistLeaves);
            setSoilType(plant.soilType ?? "");
            setWateringFrequency(plant.wateringFrequency);
            setWateringQuantity(plant.wateringQuantity);
            setWateringType(plant.wateringType);
            setSaved(false);
        }
    }, [plant]);

    const saveChanges = useCallback(() => {
        if (!plantIdRef.current) return;
        const id = plantIdRef.current;
        plantsCollection.update(id, (draft) => {
            draft.name = name.trim();
            draft.description = description.trim() || undefined;
            draft.family = family.trim() || undefined;
            draft.location = location;
            draft.luminosity = luminosity;
            draft.mistLeaves = mistLeaves;
            draft.soilType = soilType.trim() || undefined;
            draft.wateringFrequency = wateringFrequency;
            draft.wateringQuantity = wateringQuantity.trim();
            draft.wateringType = wateringType;
            draft.lastUpdateDate = new Date();
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    }, [name, description, family, location, luminosity, mistLeaves, soilType, wateringFrequency, wateringQuantity, wateringType]);

    useEffect(() => {
        if (!plant || !open) return;

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }
        debounceRef.current = setTimeout(() => {
            saveChanges();
        }, 500);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [name, description, family, location, luminosity, mistLeaves, soilType, wateringFrequency, wateringQuantity, wateringType, plant, open, saveChanges]);


    if (!plant) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <DialogTitle>Edit plant</DialogTitle>
                        <span role="status" aria-live="polite">{saved && <span className="text-xs text-muted-foreground animate-in fade-in">Saved</span>}</span>
                    </div>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="edit-name">Name *</Label>
                        <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="edit-description">Description</Label>
                        <Textarea id="edit-description" value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="edit-family">Family</Label>
                        <Input id="edit-family" value={family} onChange={(e) => setFamily(e.target.value)} />
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
                        <Label htmlFor="edit-mist">Mist leaves *</Label>
                        <Switch id="edit-mist" checked={mistLeaves} onCheckedChange={setMistLeaves} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="edit-soil">Soil type</Label>
                        <Input id="edit-soil" value={soilType} onChange={(e) => setSoilType(e.target.value)} />
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
                        <Label htmlFor="edit-quantity">Watering quantity *</Label>
                        <Input id="edit-quantity" value={wateringQuantity} onChange={(e) => setWateringQuantity(e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label>Next watering date</Label>
                        <DatePicker value={plant.nextWateringDate} disabled aria-label="Next watering date" />
                    </div>
                    <div className="text-xs text-muted-foreground">
                        Created: {format(plant.creationDate, "PPP")} · Last updated: {format(plant.lastUpdateDate, "PPP")}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="destructive" size="sm" onClick={() => { if (plant) onDelete(plant); }}>
                        Delete
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
