"use client";

import { useState } from "react";
import { Plus, Loader2, Bot, ChevronRight, ChevronLeft, UploadCloud, CheckCircle2, ImagePlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// 1. Add the onSuccess prop to the component
export function UniversalIntakeModal({ onSuccess }: { onSuccess: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    const initialFormState = {
        name: "", brand: "", category: "Buy", condition: "New", price: "",
        payload: "", reach: "", controller: "", hours: "",
        modelFile: null as File | null,
        imageFile: null as File | null,
    };

    const [formData, setFormData] = useState(initialFormState);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (step < 3) {
            setStep(step + 1);
            return;
        }

        setIsLoading(true);

        try {
            // 1. Format the data to match your FastAPI Pydantic schema
            const assetPayload = {
                name: formData.name,
                brand: formData.brand,
                category: formData.category,
                condition: formData.condition,
                price: parseFloat(formData.price),
                payload: parseFloat(formData.payload),
                reach: parseFloat(formData.reach),
                controller: formData.controller,
                hours: parseInt(formData.hours) || 0,
            };

            // 2. Send the JSON to create the robot in MongoDB
            const response = await fetch("http://127.0.0.1:8000/api/admin/fleet", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(assetPayload),
            });

            if (!response.ok) throw new Error("Failed to save asset to database");
            const newAsset = await response.json();

            // 3. If a 3D model was attached, upload it to the new asset's ID
            if (formData.modelFile) {
                const fileData = new FormData();
                fileData.append("file", formData.modelFile);

                const twinResponse = await fetch(`http://127.0.0.1:8000/api/admin/fleet/${newAsset.id}/twin`, {
                    method: "POST",
                    body: fileData, // Note: Do NOT set Content-Type here, the browser sets the multipart boundary automatically
                });

                if (!twinResponse.ok) console.error("Failed to upload 3D Twin");
            }
            // 4. NEW: Upload standard 2D Image
            if (formData.imageFile) {
                const imgData = new FormData();
                imgData.append("file", formData.imageFile);
                await fetch(`http://127.0.0.1:8000/api/admin/fleet/${newAsset.id}/image`, {
                    method: "POST", body: imgData,
                });
            }

            // 4. Close modal, reset form, and tell the table to refresh
            setIsOpen(false);
            setStep(1);
            setFormData(initialFormState);
            onSuccess();

        } catch (error) {
            console.error(error);
            alert("Something went wrong saving the asset.");
        } finally {
            setIsLoading(false);
        }
    };

    const steps = [
        { id: 1, name: "Basic Info" },
        { id: 2, name: "Technical" },
        { id: 3, name: "3D Twin" },
    ];

    return (
        <>
            <Button
                onClick={() => setIsOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm shadow-blue-900/20"
            >
                <Plus className="mr-2 h-4 w-4" /> Add New Assets
            </Button>

            <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) setStep(1); }}>
                <DialogContent className="sm:max-w-[600px] bg-[#09090b] border-zinc-800 text-zinc-100 p-0 overflow-hidden">

                    <div className="p-6 border-b border-zinc-800/60 bg-zinc-950">
                        <DialogHeader className="mb-6">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-blue-600/20 rounded-lg flex items-center justify-center border border-blue-500/30">
                                    <Bot className="text-blue-500" size={20} />
                                </div>
                                <div>
                                    <DialogTitle className="text-xl">Universal Asset Intake</DialogTitle>
                                    <p className="text-sm text-zinc-400 mt-1">Register hardware and digital twin data.</p>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="flex items-center justify-between gap-4">
                            {steps.map((s) => {
                                const isActive = step === s.id;
                                const isPassed = step > s.id;
                                return (
                                    <div key={s.id} className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${isActive || isPassed ? "bg-zinc-800 text-zinc-100" : "bg-zinc-900 text-zinc-600"}`}>
                                                {s.id}
                                            </div>
                                            <span className={`text-sm font-medium transition-colors ${isActive || isPassed ? "text-zinc-300" : "text-zinc-600"}`}>
                                                {s.name}
                                            </span>
                                        </div>
                                        <div className="h-0.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                                            <div className={`h-full transition-all duration-500 ${isActive ? "w-1/2 bg-blue-600" : isPassed ? "w-full bg-blue-600" : "w-0 bg-blue-600"}`} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">

                        {step === 1 && (
                            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="space-y-2">
                                    <Label className="text-zinc-300">Model Name</Label>
                                    <Input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="bg-zinc-900 border-zinc-800 focus-visible:ring-blue-500" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-zinc-300">Manufacturer</Label>
                                    <Input required value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} className="bg-zinc-900 border-zinc-800 focus-visible:ring-blue-500" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-zinc-300">Listing Type</Label>
                                    <Select value={formData.category} onValueChange={(val) => setFormData({ ...formData, category: val })}>
                                        <SelectTrigger className="bg-zinc-900 border-zinc-800 focus:ring-blue-500"><SelectValue /></SelectTrigger>
                                        <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                                            <SelectItem value="Buy">Direct Sale</SelectItem>
                                            <SelectItem value="Rent">Monthly Lease</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-zinc-300">Base Price ($)</Label>
                                    <Input type="number" required value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="bg-zinc-900 border-zinc-800 focus-visible:ring-blue-500" />
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="space-y-2">
                                    <Label className="text-zinc-300">Payload Capacity (kg)</Label>
                                    <Input type="number" required value={formData.payload} onChange={(e) => setFormData({ ...formData, payload: e.target.value })} className="bg-zinc-900 border-zinc-800 focus-visible:ring-blue-500" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-zinc-300">Max Reach (mm)</Label>
                                    <Input type="number" required value={formData.reach} onChange={(e) => setFormData({ ...formData, reach: e.target.value })} className="bg-zinc-900 border-zinc-800 focus-visible:ring-blue-500" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-zinc-300">Controller Version</Label>
                                    <Input required value={formData.controller} onChange={(e) => setFormData({ ...formData, controller: e.target.value })} className="bg-zinc-900 border-zinc-800 focus-visible:ring-blue-500" placeholder="e.g. R-30iB Plus" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-zinc-300">Operating Hours</Label>
                                    <Input type="number" required value={formData.hours} onChange={(e) => setFormData({ ...formData, hours: e.target.value })} className="bg-zinc-900 border-zinc-800 focus-visible:ring-blue-500" />
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">

                                {/* 2D Image Upload */}
                                <div>
                                    <input
                                        type="file" id="image-upload" accept="image/*" className="hidden"
                                        onChange={(e) => { if (e.target.files && e.target.files[0]) setFormData({ ...formData, imageFile: e.target.files[0] }); }}
                                    />
                                    <Label
                                        htmlFor="image-upload"
                                        className={`h-48 border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${formData.imageFile ? "border-emerald-500/50 bg-emerald-500/5" : "border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/50"}`}
                                    >
                                        {formData.imageFile ? (
                                            <div className="text-emerald-500 font-medium break-all text-xs">{formData.imageFile.name}</div>
                                        ) : (
                                            <>
                                                <ImagePlus className="text-blue-500 mb-2" size={24} />
                                                <h3 className="text-zinc-100 font-medium text-sm">Robot Photo</h3>
                                                <p className="text-zinc-500 text-xs mt-1">.JPG or .PNG</p>
                                            </>
                                        )}
                                    </Label>
                                </div>
                                {/* Hidden real file input */}
                                <input
                                    type="file"
                                    id="3d-upload"
                                    accept=".glb,.gltf"
                                    className="hidden"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            setFormData({ ...formData, modelFile: e.target.files[0] });
                                        }
                                    }}
                                />

                                {/* Stylized Label that acts as the dropzone button */}
                                <Label
                                    htmlFor="3d-upload"
                                    className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${formData.modelFile ? "border-emerald-500/50 bg-emerald-500/5 hover:bg-emerald-500/10" : "border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/50"}`}
                                >
                                    {formData.modelFile ? (
                                        <>
                                            <div className="h-12 w-12 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
                                                <CheckCircle2 className="text-emerald-500" size={24} />
                                            </div>
                                            <h3 className="text-zinc-100 font-medium text-lg">Asset Ready</h3>
                                            <p className="text-zinc-400 text-sm mt-1">{formData.modelFile.name}</p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="h-12 w-12 bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
                                                <UploadCloud className="text-blue-500" size={24} />
                                            </div>
                                            <h3 className="text-zinc-100 font-medium text-lg">Upload Digital Twin</h3>
                                            <p className="text-zinc-500 text-sm mt-1 mb-4">Click to select .GLTF or .GLB file</p>
                                            <div className="bg-zinc-800 text-zinc-300 px-4 py-2 rounded-md text-sm font-medium hover:bg-zinc-700">
                                                Browse Files
                                            </div>
                                        </>
                                    )}
                                </Label>
                            </div>
                        )}

                        <div className="flex items-center justify-between pt-4 border-t border-zinc-800/60 mt-8">
                            <Button type="button" variant="ghost" onClick={() => step > 1 ? setStep(step - 1) : setIsOpen(false)} className="text-zinc-400 hover:text-white">
                                {step > 1 ? <><ChevronLeft className="mr-2 h-4 w-4" /> Back</> : "Cancel"}
                            </Button>

                            <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]">
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> :
                                    step < 3 ? <>Next Phase <ChevronRight className="ml-2 h-4 w-4" /></> :
                                        "Commit to Fleet"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}