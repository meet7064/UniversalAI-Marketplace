"use client";

import { useState, useEffect } from "react";
import {
    Search, Filter, MoreHorizontal, Edit, Trash2, 
    ShieldCheck, Ban, Box, Bot, Activity, Loader2, UploadCloud, ImagePlus, Plus, X
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { UniversalIntakeModal } from "@/components/admin/forms/UniversalIntakeModal";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, useGLTF, ContactShadows, Center } from "@react-three/drei";

function RobotModel({ url }: { url: string }) {
    const { scene } = useGLTF(url);
    return <primitive object={scene} />;
}

function DigitalTwinViewer({ robotName, modelUrl }: { robotName: string, modelUrl: string }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <button className="hover:text-blue-400 hover:underline transition-colors text-left font-semibold text-lg text-zinc-100 truncate">
                    {robotName}
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] bg-zinc-950 border-zinc-800 text-zinc-100 p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-0 absolute top-0 left-0 z-10 pointer-events-none">
                    <DialogTitle className="flex items-center gap-2 text-xl drop-shadow-md">
                        <Box className="text-blue-500" /> Digital Twin: {robotName}
                    </DialogTitle>
                </DialogHeader>

                <div className="h-[500px] w-full bg-zinc-900 relative cursor-move">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

                    <Canvas shadows camera={{ position: [0, 2, 5], fov: 45 }}>
                        <ambientLight intensity={0.5} />
                        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
                        <Suspense fallback={null}>
                            <Center><RobotModel url={modelUrl} /></Center>
                            <Environment preset="city" />
                            <ContactShadows position={[0, -1.5, 0]} opacity={0.4} scale={10} blur={2} far={4} />
                        </Suspense>
                        <OrbitControls makeDefault autoRotate autoRotateSpeed={0.5} />
                    </Canvas>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default function FleetCommandPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [fleet, setFleet] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [editingRobot, setEditingRobot] = useState<any | null>(null);
    const [isEditSaving, setIsEditSaving] = useState(false);
    const [editForm, setEditForm] = useState({
        name: "", brand: "", category: "Buy", condition: "New", price: "",
        payload: "", reach: "", controller: "", hours: "",
        key_features: [] as { value: string, label: string }[], 
        imageFiles: [] as File[], // NOW AN ARRAY
        modelFile: null as File | null  
    });

    const fetchFleet = async () => {
        setIsLoading(true);
        try {
            const response = await fetch("http://127.0.0.1:8000/api/admin/fleet");
            if (response.ok) setFleet(await response.json());
        } catch (error) { console.error(error); } finally { setIsLoading(false); }
    };

    useEffect(() => { fetchFleet(); }, []);

    const updateStatus = async (id: string, newStatus: string) => {
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/admin/fleet/${id}`, {
                method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }),
            });
            if (response.ok) fetchFleet();
        } catch (error) { console.error(error); }
    };

    const deleteAsset = async (id: string) => {
        if (!window.confirm("WARNING: Are you sure you want to permanently delete this asset? This cannot be undone.")) return;
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/admin/fleet/${id}`, { method: "DELETE" });
            if (response.ok) fetchFleet();
        } catch (error) { console.error(error); }
    };

    const openEditModal = (robot: any) => {
        setEditingRobot(robot);
        setEditForm({
            name: robot.name, brand: robot.brand, category: robot.category, condition: robot.condition,
            price: robot.price.toString(), payload: robot.payload.toString(), reach: robot.reach.toString(),
            controller: robot.controller, hours: robot.hours.toString(),
            key_features: robot.key_features || [], 
            imageFiles: [], 
            modelFile: null  
        });
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingRobot) return;
        setIsEditSaving(true);
        
        try {
            const payload = {
                name: editForm.name, brand: editForm.brand, category: editForm.category, condition: editForm.condition,
                price: parseFloat(editForm.price), payload: parseFloat(editForm.payload), reach: parseFloat(editForm.reach),
                controller: editForm.controller, hours: parseInt(editForm.hours) || 0,
                key_features: editForm.key_features.filter((f) => f.value && f.label)
            };

            const response = await fetch(`http://127.0.0.1:8000/api/admin/fleet/${editingRobot.id}`, {
                method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
            });

            if (response.ok) {
                if (editForm.imageFiles.length > 0) {
                    const imgData = new FormData();
                    editForm.imageFiles.forEach(file => imgData.append("images", file));
                    await fetch(`http://127.0.0.1:8000/api/admin/fleet/${editingRobot.id}/image`, { method: "POST", body: imgData });
                }

                if (editForm.modelFile) {
                    const twinData = new FormData();
                    twinData.append("file", editForm.modelFile);
                    await fetch(`http://127.0.0.1:8000/api/admin/fleet/${editingRobot.id}/twin`, { method: "POST", body: twinData });
                }

                setEditingRobot(null);
                fetchFleet(); 
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsEditSaving(false);
        }
    };

    return (
        <div className="space-y-6 pb-12">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight text-zinc-100">Fleet Command</h2>
                    <p className="text-zinc-400 text-sm mt-1">Manage robot inventory, adjust pricing, and control asset statuses.</p>
                </div>
                <UniversalIntakeModal onSuccess={fetchFleet} />
            </div>

            <div className="flex items-center justify-between gap-4 bg-zinc-950 p-4 rounded-xl border border-zinc-800/60 shadow-sm">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <Input placeholder="Search by ID, Name, or Brand..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 bg-zinc-900 border-zinc-800 text-zinc-100 h-10 focus-visible:ring-1 focus-visible:ring-blue-500" />
                </div>
                <Button variant="outline" className="bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100">
                    <Filter className="mr-2 h-4 w-4" /> Filters
                </Button>
            </div>

            {isLoading && (
                <div className="h-64 flex flex-col items-center justify-center gap-3 border border-zinc-800/60 rounded-xl bg-zinc-950">
                    <div className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-zinc-500 font-medium">Syncing with Fleet Database...</p>
                </div>
            )}

            {!isLoading && fleet.length === 0 && (
                <div className="h-64 flex flex-col items-center justify-center gap-3 border border-zinc-800/60 rounded-xl bg-zinc-950">
                    <Bot className="h-12 w-12 text-zinc-700" />
                    <p className="text-zinc-400 font-medium">No assets found in database.</p>
                </div>
            )}

            {!isLoading && fleet.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                    {fleet.map((robot) => {
                        const imageArray = robot.images && robot.images.length > 0 
                            ? robot.images 
                            : robot.image_url ? [robot.image_url] : [];

                        return (
                        <div key={robot.id} className="bg-zinc-950 border border-zinc-800/60 rounded-xl flex flex-col overflow-hidden hover:border-zinc-700 transition-colors shadow-sm group">
                            
                            {/* DYNAMIC MULTI-IMAGE SCROLL AREA */}
                            <div className="relative h-56 bg-zinc-900 flex items-center justify-center border-b border-zinc-800/60 overflow-hidden">
                                {imageArray.length === 0 ? (
                                    <Bot className="h-16 w-16 text-zinc-800" />
                                ) : (
                                    <div className="flex h-full w-full overflow-x-auto snap-x snap-mandatory touch-pan-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                        {imageArray.map((img: string, idx: number) => (
                                            <img 
                                                key={idx}
                                                src={`http://127.0.0.1:8000${img}`} 
                                                alt={`${robot.name} - ${idx + 1}`} 
                                                className="w-full h-full shrink-0 snap-center object-cover" 
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* Indicator Dots */}
                                {imageArray.length > 1 && (
                                    <div className="absolute bottom-3 w-full flex justify-center gap-1.5 pointer-events-none z-10">
                                        {imageArray.map((_: string, i: number) => (
                                            <div key={i} className="h-1.5 w-1.5 rounded-full bg-white/70 shadow-[0_0_2px_rgba(0,0,0,0.5)]" />
                                        ))}
                                    </div>
                                )}

                                <div className="absolute top-3 left-3 pointer-events-none">
                                    <Badge variant="outline" className="bg-zinc-950/80 backdrop-blur-md border-zinc-700/80 text-zinc-200">{robot.category}</Badge>
                                </div>
                                <div className="absolute top-3 right-3 flex flex-col gap-2 pointer-events-none">
                                    {robot.certified && <div className="bg-blue-500/10 text-blue-500 p-1.5 rounded-full backdrop-blur-md border border-blue-500/20 shadow-lg"><ShieldCheck size={16} /></div>}
                                    {robot.model_url && <div className="bg-purple-500/10 text-purple-400 p-1.5 rounded-full backdrop-blur-md border border-purple-500/20 shadow-lg"><Box size={16} /></div>}
                                </div>
                            </div>

                            <div className="p-5 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="overflow-hidden pr-2">
                                        <DigitalTwinViewer robotName={robot.name} modelUrl={robot.model_url ? `http://127.0.0.1:8000${robot.model_url}` : "https://modelviewer.dev/shared-assets/models/Astronaut.glb"} />
                                        <p className="text-zinc-400 text-sm mt-0.5 truncate">{robot.brand}</p>
                                    </div>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0 shrink-0 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-zinc-950 border-zinc-800 text-zinc-300">
                                            <DropdownMenuItem onClick={() => openEditModal(robot)} className="focus:bg-zinc-900 focus:text-zinc-100 cursor-pointer">
                                                <Edit className="mr-2 h-4 w-4" /> Edit Details
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => updateStatus(robot.id, "Available")} className="focus:bg-zinc-900 focus:text-emerald-400 cursor-pointer">
                                                <ShieldCheck className="mr-2 h-4 w-4" /> Mark Available
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => updateStatus(robot.id, "Out of Stock")} className="focus:bg-zinc-900 focus:text-red-400 cursor-pointer">
                                                <Ban className="mr-2 h-4 w-4" /> Mark Out of Stock
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator className="bg-zinc-800" />
                                            <DropdownMenuItem onClick={() => deleteAsset(robot.id)} className="focus:bg-red-500/10 focus:text-red-500 text-red-500 cursor-pointer">
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete Asset
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <div className="flex items-center gap-2 mb-5">
                                    <Badge variant="secondary" className={`font-medium px-2.5 py-0.5 ${robot.status === "Available" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                                        {robot.status || "Available"}
                                    </Badge>
                                    <span className="text-zinc-600 text-xs">•</span>
                                    <span className="text-zinc-400 text-sm truncate">{robot.condition}</span>
                                </div>

                                <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm mb-6 bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">
                                    <div>
                                        <p className="text-zinc-500 text-[11px] uppercase tracking-wider mb-1">Kinematics</p>
                                        <p className="text-zinc-200 font-medium truncate">{robot.payload}kg / {robot.reach}mm</p>
                                    </div>
                                    <div>
                                        <p className="text-zinc-500 text-[11px] uppercase tracking-wider mb-1">Telemetry</p>
                                        <div className="flex items-center gap-1.5 text-zinc-200 font-medium">
                                            <Activity size={14} className="text-zinc-500" />
                                            <span className="truncate">{robot.hours} hrs</span>
                                        </div>
                                    </div>
                                </div>

                                {robot.key_features && robot.key_features.length > 0 ? (
                                    <div className="flex flex-wrap gap-2 mb-6 mt-1">
                                        {robot.key_features.slice(0, 3).map((feature: any, idx: number) => (
                                            <div key={idx} className="bg-zinc-900 border border-zinc-800/60 rounded flex items-center gap-1.5 px-2 py-1 max-w-full">
                                                <span className="text-zinc-100 text-xs font-bold truncate">{feature.value}</span>
                                                <span className="text-zinc-500 text-[10px] uppercase tracking-wider truncate">{feature.label}</span>
                                            </div>
                                        ))}
                                        {robot.key_features.length > 3 && (
                                            <div className="flex items-center text-zinc-500 text-xs font-bold px-1">
                                                +{robot.key_features.length - 3}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="mb-6"></div> 
                                )}

                                <div className="pt-4 border-t border-zinc-800/60 flex justify-between items-center mt-auto">
                                    <span className="text-zinc-600 text-xs font-mono tracking-wider">ID: {robot.id.length > 10 ? robot.id.slice(-6).toUpperCase() : robot.id}</span>
                                    <div className="text-lg font-bold text-zinc-100">
                                        ${Number(robot.price).toLocaleString()}
                                        {robot.category === "Rent" && <span className="text-zinc-500 text-sm font-normal">/mo</span>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )})}
                </div>
            )}

            <Dialog open={!!editingRobot} onOpenChange={(open) => !open && setEditingRobot(null)}>
                <DialogContent className="sm:max-w-[600px] bg-zinc-950 border-zinc-800 text-zinc-100">
                    <DialogHeader>
                        <DialogTitle>Edit Asset Details</DialogTitle>
                    </DialogHeader>
                    
                    <form onSubmit={handleEditSubmit} className="space-y-6 py-4 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Basic Information</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-zinc-300">Model Name</Label>
                                    <Input required value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="bg-zinc-900 border-zinc-800 focus-visible:ring-blue-500" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-zinc-300">Manufacturer</Label>
                                    <Input required value={editForm.brand} onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })} className="bg-zinc-900 border-zinc-800 focus-visible:ring-blue-500" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-zinc-300">Listing Type</Label>
                                    <Select value={editForm.category} onValueChange={(val) => setEditForm({ ...editForm, category: val })}>
                                        <SelectTrigger className="bg-zinc-900 border-zinc-800 focus:ring-blue-500"><SelectValue /></SelectTrigger>
                                        <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                                            <SelectItem value="Buy">Direct Sale</SelectItem>
                                            <SelectItem value="Rent">Monthly Lease</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-zinc-300">Current Condition</Label>
                                    <Select value={editForm.condition} onValueChange={(val) => setEditForm({ ...editForm, condition: val })}>
                                        <SelectTrigger className="bg-zinc-900 border-zinc-800 focus:ring-blue-500"><SelectValue /></SelectTrigger>
                                        <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                                            <SelectItem value="New">Factory New</SelectItem>
                                            <SelectItem value="Used - Excellent">Pre-Owned (Certified)</SelectItem>
                                            <SelectItem value="Needs Repair">Requires Maintenance</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-zinc-300">{editForm.category === "Rent" ? "Monthly Rate ($)" : "Base Price ($)"}</Label>
                                    <Input type="number" required value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} className="bg-zinc-900 border-zinc-800 focus-visible:ring-blue-500" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-zinc-800/60">
                            <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Technical Specifications</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-zinc-300">Payload (kg)</Label>
                                    <Input type="number" required value={editForm.payload} onChange={(e) => setEditForm({ ...editForm, payload: e.target.value })} className="bg-zinc-900 border-zinc-800 focus-visible:ring-blue-500" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-zinc-300">Reach (mm)</Label>
                                    <Input type="number" required value={editForm.reach} onChange={(e) => setEditForm({ ...editForm, reach: e.target.value })} className="bg-zinc-900 border-zinc-800 focus-visible:ring-blue-500" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-zinc-300">Controller Version</Label>
                                    <Input required value={editForm.controller} onChange={(e) => setEditForm({ ...editForm, controller: e.target.value })} className="bg-zinc-900 border-zinc-800 focus-visible:ring-blue-500" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-zinc-300">Operating Hours</Label>
                                    <Input type="number" required value={editForm.hours} onChange={(e) => setEditForm({ ...editForm, hours: e.target.value })} className="bg-zinc-900 border-zinc-800 focus-visible:ring-blue-500" />
                                </div>
                            </div>
                        </div>
                                
                        <div className="space-y-4 pt-4 border-t border-zinc-800/60">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Custom Key Features</h3>
                                <Button 
                                    type="button" variant="outline" size="sm" 
                                    className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800 h-8 text-zinc-300"
                                    onClick={() => setEditForm({...editForm, key_features: [...editForm.key_features, { value: "", label: "" }]})}
                                >
                                    <Plus className="h-3 w-3 mr-1"/> Add
                                </Button>
                            </div>
                            
                            <div className="space-y-3">
                                {editForm.key_features.map((feature, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <Input 
                                            placeholder="Value (e.g. 23)" value={feature.value} 
                                            onChange={(e) => {
                                                const newFeatures = [...editForm.key_features];
                                                newFeatures[idx].value = e.target.value;
                                                setEditForm({...editForm, key_features: newFeatures});
                                            }} 
                                            className="bg-zinc-950 border-zinc-800" 
                                        />
                                        <Input 
                                            placeholder="Label (e.g. DOF)" value={feature.label} 
                                            onChange={(e) => {
                                                const newFeatures = [...editForm.key_features];
                                                newFeatures[idx].label = e.target.value;
                                                setEditForm({...editForm, key_features: newFeatures});
                                            }} 
                                            className="bg-zinc-950 border-zinc-800" 
                                        />
                                        <Button 
                                            type="button" variant="ghost" size="icon" 
                                            onClick={() => {
                                                const newFeatures = editForm.key_features.filter((_, i) => i !== idx);
                                                setEditForm({...editForm, key_features: newFeatures});
                                            }} 
                                            className="text-zinc-500 hover:text-red-400 hover:bg-red-400/10 shrink-0"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-zinc-800/60">
                            <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Update Media Assets</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <input 
                                        type="file" id="edit-image-upload" accept="image/*" multiple className="hidden" 
                                        onChange={(e) => { 
                                            if (e.target.files && e.target.files.length > 0) {
                                                const newFiles = Array.from(e.target.files);
                                                setEditForm(prev => ({ ...prev, imageFiles: [...prev.imageFiles, ...newFiles] })); 
                                                e.target.value = '';
                                            } 
                                        }}
                                    />
                                    <Label 
                                        htmlFor="edit-image-upload" 
                                        className={`h-32 border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${editForm.imageFiles.length > 0 ? "border-emerald-500/50 bg-emerald-500/5" : "border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/50"}`}
                                    >
                                        {editForm.imageFiles.length > 0 ? (
                                            <>
                                                <ImagePlus className="text-emerald-500 mb-2" size={20} />
                                                <div className="text-emerald-500 font-medium break-all text-xs">{editForm.imageFiles.length} files selected</div>
                                            </>
                                        ) : (
                                            <>
                                                <ImagePlus className="text-blue-500 mb-2" size={20} />
                                                <h3 className="text-zinc-100 font-medium text-xs">Replace Photos</h3>
                                                <p className="text-zinc-500 text-[10px] mt-1">Select multiple</p>
                                            </>
                                        )}
                                    </Label>
                                    
                                    {editForm.imageFiles.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2 max-w-full">
                                            {editForm.imageFiles.map((file, idx) => (
                                                <div key={idx} className="flex items-center gap-1 bg-zinc-900 border border-zinc-700 text-zinc-300 text-[10px] pl-1.5 pr-0.5 py-0.5 rounded shadow-sm">
                                                    <span className="truncate max-w-[80px]">{file.name}</span>
                                                    <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditForm(prev => ({ ...prev, imageFiles: prev.imageFiles.filter((_, i) => i !== idx) })); }} className="hover:text-red-400 text-zinc-500 rounded p-0.5"><X size={10} /></button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <input 
                                        type="file" id="edit-3d-upload" accept=".glb,.gltf" className="hidden" 
                                        onChange={(e) => { if (e.target.files && e.target.files[0]) setEditForm({ ...editForm, modelFile: e.target.files[0] }); }}
                                    />
                                    <Label 
                                        htmlFor="edit-3d-upload" 
                                        className={`h-32 border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${editForm.modelFile ? "border-emerald-500/50 bg-emerald-500/5" : "border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/50"}`}
                                    >
                                        {editForm.modelFile ? (
                                            <div className="text-emerald-500 font-medium break-all text-xs">{editForm.modelFile.name}</div>
                                        ) : (
                                            <>
                                                <UploadCloud className="text-purple-500 mb-2" size={20} />
                                                <h3 className="text-zinc-100 font-medium text-xs">Replace 3D Twin</h3>
                                                <p className="text-zinc-500 text-[10px] mt-1">.GLB or .GLTF</p>
                                            </>
                                        )}
                                    </Label>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="pt-4 border-t border-zinc-800/60">
                            <Button type="button" variant="ghost" onClick={() => setEditingRobot(null)} className="text-zinc-400 hover:text-white">Cancel</Button>
                            <Button type="submit" disabled={isEditSaving} className="bg-blue-600 hover:bg-blue-700 text-white">
                                {isEditSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Changes"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}