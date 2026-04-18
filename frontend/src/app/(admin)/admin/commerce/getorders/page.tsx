"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
    Package, CheckCircle2, Truck, XCircle, Clock, ShieldAlert
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAdminStore } from "@/store/admin-store"; 

export default function AdminOrdersPage() {
    const router = useRouter();
    const { adminUser } = useAdminStore(); 
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // 1. Patient Security Check
    useEffect(() => {
        // We use a 150ms timeout to give Zustand time to read from Local Storage
        // before we aggressively kick the user out.
        const authTimer = setTimeout(() => {
            if (!adminUser) {
                console.warn("Security check failed: No admin session found. Redirecting...");
                router.push("/login"); // Make sure this is your EXACT login route!
            } else {
                // User is verified, fetch the data!
                fetchAdminOrders();
            }
        }, 150);

        // Cleanup timer if the component unmounts quickly
        return () => clearTimeout(authTimer);
    }, [adminUser, router]); // Re-runs instantly when adminUser loads from storage!

    const fetchAdminOrders = async () => {
        try {
            const response = await fetch("http://127.0.0.1:8000/api/admin/orders", {
                headers: { "Authorization": `Bearer ${adminUser?.token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setOrders(data);
            }
        } catch (error) {
            console.error("Failed to load global orders", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        setOrders(prevOrders => 
            prevOrders.map(order => 
                order.order_id === orderId ? { ...order, status: newStatus } : order
            )
        );

        try {
            const response = await fetch(`http://127.0.0.1:8000/api/admin/orders/${orderId}/status`, {
                method: "PATCH",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${adminUser?.token}` 
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) {
                throw new Error("Failed to update status on server");
            }
        } catch (error) {
            console.error(error);
            alert("Network error: Status change may not have saved.");
            fetchAdminOrders(); 
        }
    };

    const getStatusUI = (status: string) => {
        switch (status) {
            case "Pending Approval": return { icon: <Clock size={14} />, color: "bg-amber-500/10 text-amber-500 border-amber-500/20" };
            case "Approved": return { icon: <ShieldAlert size={14} />, color: "bg-blue-500/10 text-blue-400 border-blue-500/20" };
            case "Shipped": return { icon: <Truck size={14} />, color: "bg-purple-500/10 text-purple-400 border-purple-500/20" };
            case "Delivered": return { icon: <CheckCircle2 size={14} />, color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" };
            case "Rejected": return { icon: <XCircle size={14} />, color: "bg-red-500/10 text-red-400 border-red-500/20" };
            default: return { icon: <Package size={14} />, color: "bg-zinc-800 text-zinc-400 border-zinc-700" };
        }
    };

    // Show spinner while waiting for the auth timer OR the fetch request
    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center">
                <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-zinc-500 text-xs font-bold tracking-widest uppercase">Securing Connection...</p>
            </div>
        );
    }

    // Double check to prevent UI flashing
    if (!adminUser) return null;

    return (
        <div className="max-w-7xl mx-auto px-6 py-6 w-full text-zinc-100 min-h-screen">
            
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-zinc-800/60">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-[0.2em] mb-2 text-blue-500">Command Center</h1>
                    <p className="text-zinc-500 text-sm">Global order fulfillment and logistics management.</p>
                </div>
            </div>

            <div className="bg-[#0a0a0a] border border-zinc-800/60 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-[10px] text-zinc-500 uppercase tracking-widest bg-zinc-950/50 border-b border-zinc-800/60">
                            <tr>
                                <th className="px-6 py-4 font-bold">Order ID & Date</th>
                                <th className="px-6 py-4 font-bold">Customer Email</th>
                                <th className="px-6 py-4 font-bold">Contract Value</th>
                                <th className="px-6 py-4 font-bold">Current Status</th>
                                <th className="px-6 py-4 font-bold text-right">Admin Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60">
                            {orders.map((order) => {
                                const ui = getStatusUI(order.status);
                                
                                return (
                                    <tr key={order.id} className="hover:bg-zinc-900/40 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-mono font-bold text-white mb-1">{order.order_id}</p>
                                            <p className="text-[10px] text-zinc-500">{new Date(order.created_at).toLocaleDateString()}</p>
                                        </td>
                                        <td className="px-6 py-4 text-zinc-400 font-medium">{order.email}</td>
                                        <td className="px-6 py-4 font-mono font-bold text-zinc-300">
                                            ${order.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant="outline" className={`${ui.color} flex items-center gap-1.5 w-max px-2.5 py-1`}>
                                                {ui.icon} {order.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <select 
                                                className="bg-zinc-950 border border-zinc-800 text-xs font-bold uppercase tracking-widest text-zinc-300 rounded-md py-2 px-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                                                value={order.status}
                                                onChange={(e) => handleStatusChange(order.order_id, e.target.value)}
                                            >
                                                <option value="Pending Approval">Pending Approval</option>
                                                <option value="Approved">Approve Order</option>
                                                <option value="Shipped">Mark Shipped</option>
                                                <option value="Delivered">Mark Delivered</option>
                                                <option value="Rejected">Reject Order</option>
                                            </select>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}