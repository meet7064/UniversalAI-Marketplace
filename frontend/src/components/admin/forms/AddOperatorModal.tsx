"use client";

import { useState } from "react";
import { X, UserPlus, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AddOperatorModal({ isOpen, onClose, onRefresh }: any) {
    const [name, setName] = useState("");
    const [zones, setZones] = useState(""); // Use comma-separated for simplicity

    const handleSubmit = async () => {
        const zoneArray = zones.split(",").map(z => z.trim());
        
        const res = await fetch("http://127.0.0.1:8000/api/admin/dispatch/add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, assigned_zones: zoneArray })
        });

        if (res.ok) {
            onRefresh();
            onClose();
            setName("");
            setZones("");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#0a0a0a] border border-zinc-800 w-full max-w-md rounded-3xl p-8">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-black uppercase tracking-widest flex items-center gap-3">
                        <UserPlus className="text-blue-500" /> Add Operator
                    </h2>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white"><X /></button>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-2 block">Full Name</label>
                        <Input 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. John Doe"
                            className="bg-zinc-950 border-zinc-800 h-12"
                        />
                    </div>

                    <div>
                        <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-2 block">Service Zones (Comma Separated)</label>
                        <Input 
                            value={zones}
                            onChange={(e) => setZones(e.target.value)}
                            placeholder="San Diego, CA, Austin, TX"
                            className="bg-zinc-950 border-zinc-800 h-12"
                        />
                    </div>

                    <Button onClick={handleSubmit} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest h-14">
                        Register Operator
                    </Button>
                </div>
            </div>
        </div>
    );
}