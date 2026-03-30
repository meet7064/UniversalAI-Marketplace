"use client";

import { useState, useEffect } from "react";
import { 
    Search, Filter, Plus, Edit, Trash2, Cpu, Battery, Cable, Package, Layers, MoreHorizontal 
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Import our new unified Modal
import { AccessoryModal } from "@/components/admin/forms/AccessoryModal";

export default function AccessoriesInventoryPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [accessories, setAccessories] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Modal State Control
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAccessory, setEditingAccessory] = useState<any | null>(null);

    const fetchAccessories = async () => {
        setIsLoading(true);
        try {
            const response = await fetch("http://127.0.0.1:8000/api/admin/accessories");
            if (response.ok) setAccessories(await response.json());
        } catch (error) {
            console.error("Failed to load accessories:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchAccessories(); }, []);

    const openAddModal = () => {
        setEditingAccessory(null); 
        setIsModalOpen(true);
    };

    const openEditModal = (item: any) => {
        setEditingAccessory(item); 
        setIsModalOpen(true);
    };

    const deleteAccessory = async (id: string) => {
        if (!window.confirm("Delete this part from inventory?")) return;
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/admin/accessories/${id}`, { method: "DELETE" });
            if (response.ok) fetchAccessories();
        } catch (error) { console.error("Error deleting accessory:", error); }
    };

    const getCategoryIcon = (cat: string, size = 14, classes = "") => {
        switch (cat) {
            case "Gripper": return <Layers size={size} className={classes || "text-blue-400"} />;
            case "Sensor": return <Cpu size={size} className={classes || "text-purple-400"} />;
            case "Battery": return <Battery size={size} className={classes || "text-emerald-400"} />;
            case "Cable": return <Cable size={size} className={classes || "text-amber-400"} />;
            default: return <Package size={size} className={classes || "text-zinc-400"} />;
        }
    };

    return (
        <div className="space-y-6 pb-12 h-full flex flex-col">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight text-zinc-100 flex items-center gap-2">
                        <Layers className="text-blue-500" /> Parts & Accessories
                    </h2>
                    <p className="text-zinc-400 text-sm mt-1">Manage end-effectors, modules, and spare parts inventory.</p>
                </div>
                <Button onClick={openAddModal} className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm shadow-blue-900/20">
                    <Plus className="mr-2 h-4 w-4" /> Add New Part
                </Button>
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4 bg-zinc-950 p-4 rounded-xl border border-zinc-800/60 shadow-sm shrink-0">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <Input placeholder="Search parts..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 bg-zinc-900 border-zinc-800 text-zinc-100 h-10" />
                </div>
                <Button variant="outline" className="bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800"><Filter className="mr-2 h-4 w-4" /> Filters</Button>
            </div>

            {/* Loading & Empty States */}
            {isLoading && (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 border border-zinc-800/60 rounded-xl bg-zinc-950 min-h-[300px]">
                    <div className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-zinc-500 font-medium">Syncing inventory...</p>
                </div>
            )}

            {!isLoading && accessories.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 border border-zinc-800/60 rounded-xl bg-zinc-950 min-h-[300px]">
                    <Package className="h-12 w-12 text-zinc-700" />
                    <p className="text-zinc-400 font-medium">No parts found in database.</p>
                </div>
            )}

            {/* Card Grid */}
            {!isLoading && accessories.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {accessories.map((item) => {
                        // Consolidate images into a single safe array
                        const imageArray = item.images && item.images.length > 0 
                            ? item.images 
                            : item.image_url ? [item.image_url] : [];

                        return (
                            <div key={item.id} className="bg-zinc-950 border border-zinc-800/60 rounded-xl flex flex-col overflow-hidden hover:border-zinc-700 transition-colors shadow-sm group">
                                
                                {/* DYNAMIC MULTI-IMAGE SCROLL AREA */}
                                <div className="relative h-48 bg-zinc-950 border-b border-zinc-800/60 overflow-hidden">
                                    {imageArray.length === 0 ? (
                                        <div className="flex h-full w-full items-center justify-center">
                                            {getCategoryIcon(item.category, 64, "text-zinc-800")}
                                        </div>
                                    ) : (
                                        // Scrollable Flex Container (Hides Scrollbar, Snaps cleanly to each image)
                                        <div className="flex h-full w-full overflow-x-auto snap-x snap-mandatory touch-pan-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                            {imageArray.map((img: string, idx: number) => (
                                                <img 
                                                    key={idx}
                                                    src={`http://127.0.0.1:8000${img}`} 
                                                    alt={`${item.name} - ${idx + 1}`} 
                                                    className="w-full h-full shrink-0 snap-center object-cover" 
                                                />
                                            ))}
                                        </div>
                                    )}

                                    {/* Indicator Dots for Multiple Images */}
                                    {imageArray.length > 1 && (
                                        <div className="absolute bottom-3 w-full flex justify-center gap-1.5 pointer-events-none z-10">
                                            {imageArray.map((_: string, i: number) => (
                                                <div key={i} className="h-1.5 w-1.5 rounded-full bg-white/70 shadow-[0_0_2px_rgba(0,0,0,0.5)]" />
                                            ))}
                                        </div>
                                    )}

                                    {/* Protected Overlay Badges */}
                                    <div className="absolute top-3 left-3 pointer-events-none">
                                        <div className="flex items-center gap-1.5 text-zinc-200 bg-zinc-950/80 backdrop-blur-md px-2.5 py-1 rounded-md border border-zinc-700/80 shadow-sm">
                                            {getCategoryIcon(item.category)} <span className="text-xs font-medium">{item.category}</span>
                                        </div>
                                    </div>
                                    <div className="absolute top-3 right-3 pointer-events-none">
                                        <Badge variant="secondary" className={`${item.stock_quantity > 0 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"} backdrop-blur-md shadow-sm`}>
                                            {item.stock_quantity > 0 ? `${item.stock_quantity} In Stock` : "Out of Stock"}
                                        </Badge>
                                    </div>
                                </div>

                                {/* CARD CONTENT */}
                                <div className="p-5 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="pr-2">
                                            <h3 className="font-semibold text-lg text-zinc-100 truncate">{item.name}</h3>
                                            <p className="text-zinc-400 text-sm mt-0.5 truncate">{item.brand}</p>
                                        </div>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0 shrink-0 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="bg-zinc-950 border-zinc-800 text-zinc-300">
                                                <DropdownMenuItem onClick={() => openEditModal(item)} className="focus:bg-zinc-900 focus:text-zinc-100 cursor-pointer">
                                                    <Edit className="mr-2 h-4 w-4" /> Edit Part
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator className="bg-zinc-800" />
                                                <DropdownMenuItem onClick={() => deleteAccessory(item.id)} className="focus:bg-red-500/10 focus:text-red-500 text-red-500 cursor-pointer">
                                                    <Trash2 className="mr-2 h-4 w-4" /> Delete Part
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    <div className="mb-4">
                                        <p className="text-zinc-500 text-[11px] uppercase tracking-wider mb-1.5">Compatible With</p>
                                        <Badge variant="outline" className="bg-zinc-900/50 border-zinc-700 text-zinc-300 font-normal truncate max-w-full">
                                            {item.compatible_with}
                                        </Badge>
                                    </div>

                                    <div className="pt-4 border-t border-zinc-800/60 flex justify-between items-center mt-auto">
                                        <span className="text-zinc-600 text-xs font-mono tracking-wider">
                                            ID: {item.id.length > 10 ? item.id.slice(-6).toUpperCase() : item.id}
                                        </span>
                                        <div className="text-xl font-bold text-zinc-100">
                                            ${Number(item.price).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <AccessoryModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSuccess={fetchAccessories}
                accessory={editingAccessory} 
            />
        </div>
    );
}