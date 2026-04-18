// src/app/(admin)/admin/commerce/dispatch/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useAdminStore } from "@/store/admin-store";
import { Badge } from "@/components/ui/badge";
import { UserCheck, Clock, MapPin, AlertCircle } from "lucide-react";

export default function AdminDispatchPage() {
    const { adminUser } = useAdminStore();
    const [requests, setRequests] = useState<any[]>([]);
    const [operators, setOperators] = useState<any[]>([]); // This was empty!
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Fetch BOTH requests and the master operator list
        const loadAllData = async () => {
            setIsLoading(true);
            try {
                // 1. Fetch the Dispatch Requests (Orders)
                const reqRes = await fetch("http://127.0.0.1:8000/api/admin/dispatch/requests");
                const reqData = await reqRes.json();
                setRequests(reqData);

                // 2. Fetch the Master Operator List
                const opRes = await fetch("http://127.0.0.1:8000/api/admin/dispatch/list");
                const opData = await opRes.json();
                console.log("Operators Loaded:", opData);
                setOperators(opData);

            } catch (err) {
                console.error("Initialization Error:", err);
            } finally {
                setIsLoading(false);
            }
        };

        loadAllData();
    }, []);

    // Re-fetch only requests after an assignment
    const fetchRequests = async () => {
        const res = await fetch("http://127.0.0.1:8000/api/admin/dispatch/requests");
        const data = await res.json();
        setRequests(data);
    };

    const handleAssign = async (orderId: string, opId: string) => {
        if (!opId || opId === "" || opId.toLowerCase().includes("select")) return;

        try {
            const response = await fetch(`http://127.0.0.1:8000/api/admin/dispatch/assign/${orderId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ operator_id: opId })
            });

            if (response.ok) {
                alert("Success! Operator assigned.");
                fetchRequests(); 
            } else {
                const err = await response.json();
                alert(`Error: ${err.detail}`);
            }
        } catch (err) {
            alert("Network error: Backend might be down.");
        }
    };

    return (
        <div className="p-8 text-white max-w-6xl mx-auto">
            <h1 className="text-3xl font-black text-blue-500 uppercase tracking-widest mb-10">Dispatch Command</h1>

            {isLoading ? (
                <div className="flex justify-center p-20">
                    <Clock className="animate-spin text-zinc-700" size={40} />
                </div>
            ) : requests.length === 0 ? (
                <div className="border border-dashed border-zinc-800 p-20 text-center rounded-3xl">
                    <p className="text-zinc-500 uppercase tracking-widest text-xs font-bold">No pending dispatch requests</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {requests.map((req) => {
                        // Logic: Only show operators who cover this specific zone
                        const zoneOperators = operators.filter(op => 
                            op.zones && op.zones.some((z: string) => 
                                req.location_zone.toLowerCase().includes(z.toLowerCase()) || 
                                z.toLowerCase().includes(req.location_zone.toLowerCase())
                            )
                        );

                        return (
                            <div key={req.order_id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 flex items-center gap-1">
                                            <MapPin size={10} /> {req.location_zone}
                                        </Badge>
                                        <span className="text-zinc-500 font-mono text-xs">{req.order_id}</span>
                                    </div>
                                    <h3 className="text-lg font-bold">{req.email}</h3>
                                    <p className="text-sm text-zinc-400 italic">Rental Duration: {req.items[0].rentDuration} Days</p>
                                </div>

                                <div className="flex flex-col items-end gap-2">
                                    <select
                                        onChange={(e) => handleAssign(req.order_id, e.target.value)}
                                        className="bg-zinc-950 border border-zinc-700 text-xs font-bold uppercase p-3 rounded-xl text-white outline-none focus:border-blue-500 transition-colors"
                                    >
                                        <option value="">Select Operator for {req.location_zone}...</option>
                                        {zoneOperators.map((op: any) => (
                                            <option key={op.id} value={op.id}>
                                                {op.name}
                                            </option>
                                        ))}
                                    </select>
                                    
                                    {/* Show warning if no one covers this area */}
                                    {zoneOperators.length === 0 && (
                                        <p className="text-[10px] text-red-500 font-bold flex items-center gap-1 uppercase">
                                            <AlertCircle size={12} /> No operators registered for this zone
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}