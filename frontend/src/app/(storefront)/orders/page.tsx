"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Package, Clock, CheckCircle2, Truck, ArrowRight, ShoppingCart, Receipt, Cpu, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/store/useStore";
import { useRouter } from "next/navigation";

export default function OrderHistoryPage() {
    const { user, isAuthenticated } = useStore();
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const router = useRouter();

    useEffect(() => {
        // If not authenticated, we don't fetch (middleware should catch this anyway)
        if (!isAuthenticated || !user?.email || !user?.token) return;

        const fetchOrders = async () => {
            try {
                const response = await fetch(`http://127.0.0.1:8000/api/customer/orders?email=${encodeURIComponent(user.email)}`, {
                    headers: {
                        "Authorization": `Bearer ${user.token}`
                    }
                });

                if (!response.ok) throw new Error("Failed to load order history.");

                const data = await response.json();
                console.log("Raw Order Data from Backend:", data);
                setOrders(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrders();
    }, [isAuthenticated, user]);

    const getStatusConfig = (status: string) => {
        switch (status.toLowerCase()) {
            case "processing":
                return { icon: <Clock size={14} />, color: "bg-amber-500/10 text-amber-500 border-amber-500/20" };
            case "shipped":
                return { icon: <Truck size={14} />, color: "bg-blue-500/10 text-blue-400 border-blue-500/20" };
            case "delivered":
                return { icon: <CheckCircle2 size={14} />, color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" };
            default:
                return { icon: <Package size={14} />, color: "bg-zinc-800 text-zinc-400 border-zinc-700" };
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center text-zinc-500">
                <div className="h-10 w-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="font-bold uppercase tracking-widest text-xs">Retrieving Fleet Orders...</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-6 py-12 w-full text-zinc-100">

            {/* Header */}
            <div className="flex items-center justify-between mb-10 pb-6 border-b border-zinc-900">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-[0.2em] mb-2">Order History</h1>
                    <p className="text-zinc-500 text-sm">Track your hardware procurements and accessory shipments.</p>
                </div>
                <div className="h-14 w-14 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-500">
                    <Receipt size={24} />
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-8 font-medium">
                    {error}
                </div>
            )}

            {/* Empty State */}
            {!isLoading && orders.length === 0 && !error && (
                <div className="bg-[#0a0a0a] border border-zinc-900 p-12 rounded-3xl text-center flex flex-col items-center justify-center">
                    <Package size={48} className="text-zinc-700 mb-6" />
                    <h3 className="text-xl font-black uppercase tracking-widest text-white mb-2">No active orders</h3>
                    <p className="text-zinc-500 max-w-md mb-8">You haven't procured any hardware or accessories from Robostore yet.</p>
                    <Link href="/shop">
                        <Button className="bg-yellow-500 hover:bg-yellow-600 text-black font-black uppercase tracking-widest px-8 h-12">
                            Deploy New Hardware
                        </Button>
                    </Link>
                </div>
            )}

            {/* Orders List */}
            <div className="space-y-6">
                {orders.map((order) => {
                    const statusConfig = getStatusConfig(order.status);

                    // --- LOGIC: Check if this is a managed rental awaiting payment ---
                    const isAwaitingPayment = order.status === "Awaiting Payment";
                    const isPendingDispatch = order.status === "Pending Dispatch";

                    return (
                        <div key={order.id} className="bg-[#0a0a0a] border border-zinc-900 rounded-2xl overflow-hidden hover:border-zinc-800 transition-colors">

                            {/* Order Header */}
                            <div className="bg-zinc-950/50 p-6 border-b border-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">
                                        Order Placed: {new Date(order.created_at).toLocaleDateString()}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <h3 className="text-lg font-mono font-bold text-white uppercase">
                                            {order.order_id}
                                        </h3>
                                        <Badge variant="outline" className={`${statusConfig.color} flex items-center gap-1.5 px-2.5 py-0.5`}>
                                            {statusConfig.icon} {order.status}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="text-left sm:text-right">
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Total Due</p>
                                    <p className="text-xl font-black text-yellow-500 font-mono">
                                        ${order.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                            </div>

                            {/* Order Items */}
                            <div className="p-6">
                                {/* --- NEW: OPERATOR ASSIGNMENT SECTION --- */}
                                {order.is_managed && (order.operator_name || isPendingDispatch) && (
                                    <div className={`mb-6 p-4 rounded-xl border ${isAwaitingPayment ? 'bg-blue-500/5 border-blue-500/20' : 'bg-zinc-900/50 border-zinc-800'}`}>
                                        {order.operator_name ? (
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-black text-xs">
                                                    {order.operator_name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-blue-400 font-black uppercase tracking-[0.2em]">Operator Assigned</p>
                                                    <p className="text-sm font-bold text-white">{order.operator_name}</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3 text-zinc-500">
                                                <Clock size={16} className="animate-pulse" />
                                                <p className="text-xs italic">Awaiting operator assignment from dispatch command...</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="space-y-4">
                                    {order.items.map((item: any, idx: number) => (
                                        <div key={idx} className="flex items-center justify-between bg-zinc-900/50 border border-zinc-800/50 p-3 rounded-xl">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 bg-zinc-950 border border-zinc-800 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                                                    {item.image ? (
                                                        <img
                                                            src={item.image.startsWith('http') ? item.image : `http://127.0.0.1:8000${item.image}`}
                                                            alt={item.name}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <Cpu size={20} className="text-zinc-600" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white">{item.name}</p>
                                                    <div className="flex gap-2 mt-1">
                                                        <p className="text-[9px] text-zinc-500 uppercase font-bold px-1.5 py-0.5 bg-zinc-800 rounded">Qty: {item.quantity}</p>
                                                        {item.rentDuration && (
                                                            <p className="text-[9px] text-blue-400 uppercase font-bold px-1.5 py-0.5 bg-blue-500/10 rounded">
                                                                {item.rentDuration} {item.rentPeriod}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-sm font-mono text-zinc-300 font-bold">
                                                ${(item.price * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                {/* Footer Actions */}
                                <div className="mt-6 pt-6 border-t border-zinc-900 flex flex-col sm:flex-row justify-between items-center gap-4">
                                    <div className="text-xs text-zinc-600 font-medium">
                                        {isAwaitingPayment && "✔ Payment gate unlocked by Admin"}
                                    </div>

                                    <div className="flex gap-3 w-full sm:w-auto">
                                        <Link href={`/orders/${order.order_id}/invoice`} className="flex-1 sm:flex-none">
                                            <Button variant="outline" className="w-full bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white px-6">
                                                Details
                                            </Button>
                                        </Link>

                                        {/* --- THE PAYMENT GATEWAY BUTTON --- */}
                                        {isAwaitingPayment && (
                                            <Button
                                            onClick={() => router.push(`/checkout?orderId=${order.order_id}`)}
                                                className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest px-8 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                                            >
                                                <CreditCard size={16} className="mr-2" /> Pay Now
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>

                        </div>
                    );
                })}
            </div>

        </div>
    );
}