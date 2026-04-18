"use client";

import { useState, useEffect } from "react";
import { UserPlus, Trash2, MapPin, ShieldCheck, Users, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import AddOperatorModal from "@/components/admin/forms/AddOperatorModal";

export default function OperatorManagementPage() {
    const [operators, setOperators] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchOperators = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("http://127.0.0.1:8000/api/admin/dispatch/list");
            const data = await res.json();
            setOperators(data);
        } catch (error) {
            console.error("Failed to load operators", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? This will remove the operator from all future dispatch filters.")) return;

        try {
            const res = await fetch(`http://127.0.0.1:8000/api/admin/dispatch/${id}`, {
                method: "DELETE",
            });
            if (res.ok) fetchOperators();
        } catch (error) {
            alert("Delete failed.");
        }
    };

    useEffect(() => {
        fetchOperators();
    }, []);

    const filteredOperators = operators.filter(op => 
        op.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        op.zones.some((z: string) => z.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="p-8 max-w-7xl mx-auto text-white">
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-widest flex items-center gap-3 text-blue-500">
                        <Users size={32} /> Human Assets
                    </h1>
                    <p className="text-zinc-500 text-sm mt-2 font-medium uppercase tracking-wider">
                        Manage technicians and geographic service coverage
                    </p>
                </div>
                <Button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest px-8 h-12 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.2)]"
                >
                    <UserPlus className="mr-2" size={18} /> Add New Operator
                </Button>
            </div>

            {/* Search Bar */}
            <div className="relative mb-8 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                <Input 
                    placeholder="Search by name or zone..." 
                    className="bg-zinc-950 border-zinc-900 pl-12 h-12 rounded-xl"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Operator Table */}
            <div className="bg-[#0a0a0a] border border-zinc-900 rounded-3xl overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-zinc-950/50 border-b border-zinc-900">
                            <th className="p-6 text-[10px] uppercase font-black text-zinc-500 tracking-[0.2em]">Technician</th>
                            <th className="p-6 text-[10px] uppercase font-black text-zinc-500 tracking-[0.2em]">Assigned Zones</th>
                            <th className="p-6 text-[10px] uppercase font-black text-zinc-500 tracking-[0.2em]">Status</th>
                            <th className="p-6 text-[10px] uppercase font-black text-zinc-500 tracking-[0.2em] text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900/50">
                        {isLoading ? (
                            <tr><td colSpan={4} className="p-20 text-center text-zinc-600 font-bold uppercase text-xs animate-pulse">Synchronizing Data...</td></tr>
                        ) : filteredOperators.length === 0 ? (
                            <tr><td colSpan={4} className="p-20 text-center text-zinc-600 font-bold uppercase text-xs italic">No matching operators found in system.</td></tr>
                        ) : (
                            filteredOperators.map((op) => (
                                <tr key={op.id} className="hover:bg-zinc-900/30 transition-colors">
                                    <td className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 bg-zinc-900 rounded-full flex items-center justify-center text-zinc-400 font-bold border border-zinc-800">
                                                {op.name.charAt(0)}
                                            </div>
                                            <span className="font-bold text-white">{op.name}</span>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex flex-wrap gap-2">
                                            {op.zones.map((zone: string, idx: number) => (
                                                <Badge key={idx} variant="outline" className="bg-blue-500/5 text-blue-400 border-blue-500/20 text-[9px] px-2 py-0">
                                                    <MapPin size={8} className="mr-1" /> {zone}
                                                </Badge>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-black uppercase">
                                            Active
                                        </Badge>
                                    </td>
                                    <td className="p-6 text-right">
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl"
                                            onClick={() => handleDelete(op.id)}
                                        >
                                            <Trash2 size={18} />
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Security Note */}
            <div className="mt-8 flex items-center justify-center gap-2 text-[10px] text-zinc-600 uppercase tracking-widest font-black">
                <ShieldCheck size={14} /> Personnel Records Encrypted & Secured
            </div>

            {/* Modal Integration */}
            <AddOperatorModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onRefresh={fetchOperators} 
            />
        </div>
    );
}