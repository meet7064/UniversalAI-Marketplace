"use client";

import { useState, useEffect } from "react";
import { Loader2, ImagePlus, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AccessoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    accessory: any | null; 
}

export function AccessoryModal({ isOpen, onClose, onSuccess, accessory }: AccessoryModalProps) {
    const [isSaving, setIsSaving] = useState(false);
    
    // 1. Updated state to hold an array of files
    const initialFormState = {
        name: "", brand: "", category: "Gripper", price: "", stock_quantity: "", compatible_with: "Universal",
        imageFiles: [] as File[] 
    };
    
    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        if (isOpen) {
            if (accessory) {
                setFormData({
                    name: accessory.name,
                    brand: accessory.brand,
                    category: accessory.category,
                    price: accessory.price.toString(),
                    stock_quantity: accessory.stock_quantity.toString(),
                    compatible_with: accessory.compatible_with,
                    imageFiles: [] // Reset array when opening edit mode
                });
            } else {
                setFormData(initialFormState);
            }
        }
    }, [isOpen, accessory]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const formDataToSend = new FormData();
            
            const payload = {
                name: formData.name, 
                brand: formData.brand, 
                category: formData.category, 
                price: parseFloat(formData.price), 
                stock_quantity: parseInt(formData.stock_quantity) || 0, 
                compatible_with: formData.compatible_with,
                status: parseInt(formData.stock_quantity) > 0 ? "In Stock" : "Out of Stock"
            };
            
            formDataToSend.append("accessory_data", JSON.stringify(payload));
            
            // 2. Loop through the array and append each image to the FormData under the key "images"
            if (formData.imageFiles.length > 0) {
                formData.imageFiles.forEach((file) => {
                    formDataToSend.append("images", file); 
                });
            }

            const method = accessory ? "PATCH" : "POST";
            const url = accessory 
                ? `http://127.0.0.1:8000/api/admin/accessories/${accessory.id}`
                : "http://127.0.0.1:8000/api/admin/accessories";

            const response = await fetch(url, {
                method: method,
                body: formDataToSend, 
            });

            if (response.ok) {
                onClose();
                onSuccess(); 
            }
        } catch (error) {
            console.error("Error saving accessory:", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px] bg-zinc-950 border-zinc-800 text-zinc-100">
                <DialogHeader>
                    <DialogTitle>{accessory ? "Edit Accessory Details" : "Add New Accessory"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
                    
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-zinc-300">Part Name</Label>
                            <Input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="bg-zinc-900 border-zinc-800 focus-visible:ring-blue-500" placeholder="e.g. 2F-85 Gripper" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-zinc-300">Brand</Label>
                            <Input required value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} className="bg-zinc-900 border-zinc-800 focus-visible:ring-blue-500" />
                        </div>
                    </div>

                    {/* Dropdown & Compatibility */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-zinc-300">Category</Label>
                            <Select value={formData.category} onValueChange={(val) => setFormData({ ...formData, category: val })}>
                                <SelectTrigger className="bg-zinc-900 border-zinc-800 focus:ring-blue-500"><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                                    <SelectItem value="Gripper">Gripper / End-Effector</SelectItem>
                                    <SelectItem value="Sensor">Sensor / LiDAR</SelectItem>
                                    <SelectItem value="Battery">Power / Battery</SelectItem>
                                    <SelectItem value="Cable">Cables / Harness</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-zinc-300">Compatibility</Label>
                            <Input required value={formData.compatible_with} onChange={(e) => setFormData({ ...formData, compatible_with: e.target.value })} className="bg-zinc-900 border-zinc-800 focus-visible:ring-blue-500" placeholder="e.g. UR10e, Fanuc CRX" />
                        </div>
                    </div>

                    {/* Price & Stock */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-zinc-300">Unit Price ($)</Label>
                            <Input type="number" required value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="bg-zinc-900 border-zinc-800 focus-visible:ring-blue-500" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-zinc-300">Stock Quantity</Label>
                            <Input type="number" required value={formData.stock_quantity} onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })} className="bg-zinc-900 border-zinc-800 focus-visible:ring-blue-500" />
                        </div>
                    </div>

                    {/* IMAGE UPLOAD ZONE */}
                    <div className="pt-2 border-t border-zinc-800/60 mt-4">
                        <Label className="text-zinc-300 mb-2 block">
                            {accessory ? "Replace Part Images (Optional)" : "Part Images"}
                        </Label>
                        <input 
                            type="file" 
                            id="part-image-upload" 
                            accept="image/*" 
                            multiple // 3. Added multiple attribute!
                            className="hidden" 
                            onChange={(e) => { 
                                if (e.target.files && e.target.files.length > 0) {
                                    // Convert the FileList object to an actual Array
                                    setFormData({ ...formData, imageFiles: Array.from(e.target.files) }); 
                                } 
                            }}
                        />
                        <Label 
                            htmlFor="part-image-upload" 
                            className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${formData.imageFiles.length > 0 ? "border-emerald-500/50 bg-emerald-500/5 hover:bg-emerald-500/10" : "border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/50"}`}
                        >
                            {formData.imageFiles.length > 0 ? (
                                <>
                                    <CheckCircle2 className="text-emerald-500 mb-2" size={24} />
                                    <h3 className="text-zinc-100 font-medium text-sm">Images Ready</h3>
                                    <p className="text-zinc-400 text-xs mt-1">{formData.imageFiles.length} files selected</p>
                                    
                                    {/* Display pills for each selected file name */}
                                    <div className="flex flex-wrap justify-center gap-1 mt-3 max-w-full">
                                        {formData.imageFiles.map((file, idx) => (
                                            <span key={idx} className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] px-2 py-1 rounded truncate max-w-[120px]">
                                                {file.name}
                                            </span>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <ImagePlus className="text-blue-500 mb-2" size={24} />
                                    <h3 className="text-zinc-100 font-medium text-sm">Upload Photos</h3>
                                    <p className="text-zinc-500 text-xs mt-1 mb-3">Select multiple .JPG or .PNG files</p>
                                    <div className="bg-zinc-800 text-zinc-300 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-zinc-700">Browse Files</div>
                                </>
                            )}
                        </Label>
                    </div>

                    <DialogFooter className="pt-4 border-t border-zinc-800/60 mt-4">
                        <Button type="button" variant="ghost" onClick={onClose} className="text-zinc-400 hover:text-white">Cancel</Button>
                        <Button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white">
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (accessory ? "Save Changes" : "Save Part")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}