"use client";

import { useState } from "react";
import { Plus, Loader2, Bot, ChevronRight, ChevronLeft, UploadCloud, CheckCircle2, ImagePlus, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function UniversalIntakeModal({ onSuccess }: { onSuccess: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    const initialFormState = {
        name: "", brand: "", category: "Buy", condition: "New", price: "",
        payload: "", reach: "", controller: "", hours: "",
        key_features: [] as { value: string, label: string }[],
        modelFile: null as File | null,
        imageFiles: [] as File[], // NOW AN ARRAY
    };

    const [formData, setFormData] = useState(initialFormState);

    const addFeature = () => setFormData({ ...formData, key_features: [...formData.key_features, { value: "", label: "" }] });
    const removeFeature = (index: number) => setFormData({ ...formData, key_features: formData.key_features.filter((_, i) => i !== index) });
    const updateFeature = (index: number, field: "value" | "label", val: string) => {
        const updated = [...formData.key_features];
        updated[index][field] = val;
        setFormData({ ...formData, key_features: updated });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (step < 3) return setStep(step + 1);
        setIsLoading(true);

        try {
            const assetPayload = {
                name: formData.name, brand: formData.brand, category: formData.category, condition: formData.condition,
                price: parseFloat(formData.price), payload: parseFloat(formData.payload), reach: parseFloat(formData.reach),
                controller: formData.controller, hours: parseInt(formData.hours) || 0,
                key_features: formData.key_features.filter(f => f.value && f.label) 
            };

            const response = await fetch("http://127.0.0.1:8000/api/admin/fleet", {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(assetPayload),
            });

            if (!response.ok) throw new Error("Failed to save asset");
            const newAsset = await response.json();

            if (formData.modelFile) {
                const fileData = new FormData(); fileData.append("file", formData.modelFile);
                await fetch(`http://127.0.0.1:8000/api/admin/fleet/${newAsset.id}/twin`, { method: "POST", body: fileData });
            }
            
            // LOOP THROUGH IMAGES array!
            if (formData.imageFiles.length > 0) {
                const imgData = new FormData();
                formData.imageFiles.forEach(file => imgData.append("images", file));
                await fetch(`http://127.0.0.1:8000/api/admin/fleet/${newAsset.id}/image`, { method: "POST", body: imgData });
            }

            setIsOpen(false);
            setStep(1);
            setFormData(initialFormState);
            onSuccess();
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const steps = [ { id: 1, name: "Basic Info" }, { id: 2, name: "Technical" }, { id: 3, name: "Media" } ];

    return (
        <>
            <Button onClick={() => setIsOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm shadow-blue-900/20">
                <Plus className="mr-2 h-4 w-4" /> Add New Assets
            </Button>

            <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) setStep(1); }}>
                <DialogContent className="sm:max-w-[600px] bg-[#09090b] border-zinc-800 text-zinc-100 p-0 overflow-hidden">
                    <div className="p-6 border-b border-zinc-800/60 bg-zinc-950">
                        <DialogHeader className="mb-6">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-blue-600/20 rounded-lg flex items-center justify-center border border-blue-500/30"><Bot className="text-blue-500" size={20} /></div>
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
                                            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${isActive || isPassed ? "bg-zinc-800 text-zinc-100" : "bg-zinc-900 text-zinc-600"}`}>{s.id}</div>
                                            <span className={`text-sm font-medium transition-colors ${isActive || isPassed ? "text-zinc-300" : "text-zinc-600"}`}>{s.name}</span>
                                        </div>
                                        <div className="h-0.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                                            <div className={`h-full transition-all duration-500 ${isActive ? "w-1/2 bg-blue-600" : isPassed ? "w-full bg-blue-600" : "w-0 bg-blue-600"}`} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">
                        {step === 1 && (
                            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="space-y-2"><Label className="text-zinc-300">Model Name</Label><Input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="bg-zinc-900 border-zinc-800 focus-visible:ring-blue-500" /></div>
                                <div className="space-y-2"><Label className="text-zinc-300">Manufacturer</Label><Input required value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} className="bg-zinc-900 border-zinc-800 focus-visible:ring-blue-500" /></div>
                                <div className="space-y-2"><Label className="text-zinc-300">Listing Type</Label><Select value={formData.category} onValueChange={(val) => setFormData({ ...formData, category: val })}><SelectTrigger className="bg-zinc-900 border-zinc-800"><SelectValue /></SelectTrigger><SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100"><SelectItem value="Buy">Direct Sale</SelectItem><SelectItem value="Rent">Monthly Lease</SelectItem></SelectContent></Select></div>
                                <div className="space-y-2"><Label className="text-zinc-300">Base Price ($)</Label><Input type="number" required value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="bg-zinc-900 border-zinc-800 focus-visible:ring-blue-500" /></div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2"><Label className="text-zinc-300">Payload Capacity (kg)</Label><Input type="number" required value={formData.payload} onChange={(e) => setFormData({ ...formData, payload: e.target.value })} className="bg-zinc-900 border-zinc-800 focus-visible:ring-blue-500" /></div>
                                    <div className="space-y-2"><Label className="text-zinc-300">Max Reach (mm)</Label><Input type="number" required value={formData.reach} onChange={(e) => setFormData({ ...formData, reach: e.target.value })} className="bg-zinc-900 border-zinc-800 focus-visible:ring-blue-500" /></div>
                                    <div className="space-y-2"><Label className="text-zinc-300">Controller Version</Label><Input required value={formData.controller} onChange={(e) => setFormData({ ...formData, controller: e.target.value })} className="bg-zinc-900 border-zinc-800 focus-visible:ring-blue-500" /></div>
                                    <div className="space-y-2"><Label className="text-zinc-300">Operating Hours</Label><Input type="number" required value={formData.hours} onChange={(e) => setFormData({ ...formData, hours: e.target.value })} className="bg-zinc-900 border-zinc-800 focus-visible:ring-blue-500" /></div>
                                </div>
                                <div className="pt-4 border-t border-zinc-800/60 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label className="text-zinc-300 font-bold uppercase tracking-wider text-xs">Custom Key Features</Label>
                                            <p className="text-[10px] text-zinc-500 mt-0.5">Highlight specific selling points</p>
                                        </div>
                                        <Button type="button" variant="outline" size="sm" onClick={addFeature} className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800 h-8"><Plus className="h-3 w-3 mr-1"/> Add Feature</Button>
                                    </div>
                                    <div className="space-y-3">
                                        {formData.key_features.map((feature, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <Input placeholder="Value (e.g. 23)" value={feature.value} onChange={(e) => updateFeature(idx, "value", e.target.value)} className="bg-zinc-950 border-zinc-800" />
                                                <Input placeholder="Label (e.g. DOF)" value={feature.label} onChange={(e) => updateFeature(idx, "label", e.target.value)} className="bg-zinc-950 border-zinc-800" />
                                                <Button type="button" variant="ghost" size="icon" onClick={() => removeFeature(idx)} className="text-zinc-500 hover:text-red-400 hover:bg-red-400/10 shrink-0"><Trash2 className="h-4 w-4" /></Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div>
                                    <input 
                                        type="file" id="image-upload" accept="image/*" multiple className="hidden" 
                                        onChange={(e) => { 
                                            if (e.target.files && e.target.files.length > 0) {
                                                const newFiles = Array.from(e.target.files);
                                                setFormData(prev => ({ ...prev, imageFiles: [...prev.imageFiles, ...newFiles] })); 
                                                e.target.value = '';
                                            } 
                                        }}
                                    />
                                    <Label htmlFor="image-upload" className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${formData.imageFiles.length > 0 ? "border-emerald-500/50 bg-emerald-500/5" : "border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/50"}`}>
                                        {formData.imageFiles.length > 0 ? (
                                            <>
                                                <CheckCircle2 className="text-emerald-500 mb-2" size={24} />
                                                <h3 className="text-zinc-100 font-medium text-sm">Images Ready</h3>
                                                <p className="text-zinc-400 text-xs mt-1">{formData.imageFiles.length} files selected</p>
                                            </>
                                        ) : (
                                            <>
                                                <ImagePlus className="text-blue-500 mb-2" size={24} />
                                                <h3 className="text-zinc-100 font-medium text-sm">Upload Photos</h3>
                                                <p className="text-zinc-500 text-xs mt-1">Select multiple .JPG or .PNG files</p>
                                            </>
                                        )}
                                    </Label>
                                    
                                    {formData.imageFiles.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-3 max-w-full">
                                            {formData.imageFiles.map((file, idx) => (
                                                <div key={idx} className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-700 text-zinc-300 text-[11px] pl-2 pr-1 py-1 rounded-md shadow-sm">
                                                    <span className="truncate max-w-[120px]">{file.name}</span>
                                                    <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFormData(prev => ({ ...prev, imageFiles: prev.imageFiles.filter((_, i) => i !== idx) })); }} className="hover:bg-red-500/20 hover:text-red-400 text-zinc-500 rounded p-0.5 transition-colors"><X size={12} /></button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <input type="file" id="3d-upload" accept=".glb,.gltf" className="hidden" onChange={(e) => { if (e.target.files && e.target.files[0]) setFormData({ ...formData, modelFile: e.target.files[0] }); }} />
                                <Label htmlFor="3d-upload" className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${formData.modelFile ? "border-emerald-500/50 bg-emerald-500/5 hover:bg-emerald-500/10" : "border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/50"}`}>
                                    {formData.modelFile ? (<><div className="h-12 w-12 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4"><CheckCircle2 className="text-emerald-500" size={24} /></div><h3 className="text-zinc-100 font-medium text-lg">Asset Ready</h3><p className="text-zinc-400 text-sm mt-1">{formData.modelFile.name}</p></>) : (<><div className="h-12 w-12 bg-blue-500/10 rounded-full flex items-center justify-center mb-4"><UploadCloud className="text-blue-500" size={24} /></div><h3 className="text-zinc-100 font-medium text-lg">Upload Digital Twin</h3><p className="text-zinc-500 text-sm mt-1 mb-4">Click to select .GLTF or .GLB file</p><div className="bg-zinc-800 text-zinc-300 px-4 py-2 rounded-md text-sm font-medium hover:bg-zinc-700">Browse Files</div></>)}
                                </Label>
                            </div>
                        )}

                        <div className="flex items-center justify-between pt-4 border-t border-zinc-800/60 mt-8">
                            <Button type="button" variant="ghost" onClick={() => step > 1 ? setStep(step - 1) : setIsOpen(false)} className="text-zinc-400 hover:text-white">{step > 1 ? <><ChevronLeft className="mr-2 h-4 w-4" /> Back</> : "Cancel"}</Button>
                            <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]">{isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : step < 3 ? <>Next Phase <ChevronRight className="ml-2 h-4 w-4" /></> : "Commit to Fleet"}</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}