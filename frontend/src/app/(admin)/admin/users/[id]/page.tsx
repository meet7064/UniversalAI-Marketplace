"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
    User, ShoppingCart, Key, RefreshCw, Wrench, 
    ArrowLeft, Calendar, DollarSign, Activity 
} from "lucide-react";

export default function UserDossierPage() {
    const params = useParams();
    const router = useRouter();
    const [history, setHistory] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchUserHistory = async () => {
            try {
                // Get the admin cookie function (reused from your activity page)
                const getCookie = (name: string) => {
                    const value = `; ${document.cookie}`;
                    const parts = value.split(`; ${name}=`);
                    if (parts.length === 2) return parts.pop()?.split(';').shift();
                    return null;
                };

                const token = getCookie("admin_session");
                if (!token) return router.push("/login");

                // Fetch the 360-degree data for THIS specific user
                const response = await fetch(`http://127.0.0.1:8000/api/admin/users/${params.id}/history`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    setHistory(data);
                }
            } catch (error) {
                console.error("Failed to load dossier", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (params.id) fetchUserHistory();
    }, [params.id, router]);

    if (isLoading) {
        return <div className="min-h-screen bg-[#06080D] p-8 text-zinc-500 flex justify-center items-center">Loading user dossier...</div>;
    }

    if (!history) {
        return <div className="min-h-screen bg-[#06080D] p-8 text-zinc-500 flex justify-center items-center">User record not found.</div>;
    }

    return (
        <div className="min-h-screen bg-[#06080D] p-8 text-zinc-100 font-sans pb-24">
            <div className="max-w-6xl mx-auto space-y-8">
                
                {/* Header & Back Button */}
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="h-10 w-10 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-3">
                            {history.profile.name} <span className="text-zinc-600 font-normal text-lg">| Client Dossier</span>
                        </h1>
                        <p className="text-sm text-zinc-500">{history.profile.email}</p>
                    </div>
                </div>

                {/* Quick Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-[#0B0E14] border border-zinc-800/60 p-5 rounded-2xl flex items-center gap-4">
                        <div className="h-12 w-12 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20">
                            <DollarSign className="text-emerald-400" size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Lifetime Value</p>
                            <p className="text-2xl font-black text-white">${history.stats.lifetime_value.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="bg-[#0B0E14] border border-zinc-800/60 p-5 rounded-2xl flex items-center gap-4">
                        <div className="h-12 w-12 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/20">
                            <Key className="text-blue-400" size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Active Rentals</p>
                            <p className="text-2xl font-black text-white">{history.stats.active_rentals}</p>
                        </div>
                    </div>
                    <div className="bg-[#0B0E14] border border-zinc-800/60 p-5 rounded-2xl flex items-center gap-4">
                        <div className="h-12 w-12 bg-amber-500/10 rounded-full flex items-center justify-center border border-amber-500/20">
                            <Wrench className="text-amber-400" size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Open Tickets</p>
                            <p className="text-2xl font-black text-white">{history.stats.open_tickets}</p>
                        </div>
                    </div>
                    <div className="bg-[#0B0E14] border border-zinc-800/60 p-5 rounded-2xl flex items-center gap-4">
                        <div className="h-12 w-12 bg-purple-500/10 rounded-full flex items-center justify-center border border-purple-500/20">
                            <Calendar className="text-purple-400" size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Client Since</p>
                            <p className="text-lg font-bold text-white mt-1">{history.profile.joined}</p>
                        </div>
                    </div>
                </div>

                {/* Detailed Logs Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Purchases & Assets Owned */}
                    <div className="bg-[#0B0E14] border border-zinc-800/60 rounded-2xl overflow-hidden">
                        <div className="p-5 border-b border-zinc-800/60 bg-zinc-900/20 flex items-center gap-2">
                            <ShoppingCart className="text-zinc-400" size={18} />
                            <h2 className="font-bold text-zinc-200">Purchased Assets</h2>
                        </div>
                        <div className="p-2">
                            {history.purchases.map((p: any) => (
                                <div key={p.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] rounded-xl transition-colors">
                                    <div>
                                        <p className="font-bold text-zinc-100">{p.item}</p>
                                        <p className="text-xs text-zinc-500 mt-1">Order {p.id} • {p.date}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-white">${p.amount.toLocaleString()}</p>
                                        <p className="text-xs text-emerald-400">{p.status}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Active Rentals */}
                    <div className="bg-[#0B0E14] border border-zinc-800/60 rounded-2xl overflow-hidden">
                        <div className="p-5 border-b border-zinc-800/60 bg-zinc-900/20 flex items-center gap-2">
                            <Key className="text-blue-400" size={18} />
                            <h2 className="font-bold text-zinc-200">Leased / Rented Fleet</h2>
                        </div>
                        <div className="p-2">
                            {history.rentals.map((r: any) => (
                                <div key={r.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] rounded-xl transition-colors">
                                    <div>
                                        <p className="font-bold text-zinc-100">{r.item}</p>
                                        <p className="text-xs text-zinc-500 mt-1">Lease {r.id} • Started {r.date}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-white">${r.monthly_rate.toLocaleString()}<span className="text-zinc-500 text-xs font-normal"> /mo</span></p>
                                        <p className="text-xs text-blue-400">{r.status}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Trade-in History */}
                    <div className="bg-[#0B0E14] border border-zinc-800/60 rounded-2xl overflow-hidden">
                        <div className="p-5 border-b border-zinc-800/60 bg-zinc-900/20 flex items-center gap-2">
                            <RefreshCw className="text-purple-400" size={18} />
                            <h2 className="font-bold text-zinc-200">Trade-In Appraisals</h2>
                        </div>
                        <div className="p-2">
                            {history.trade_ins.map((t: any) => (
                                <div key={t.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] rounded-xl transition-colors">
                                    <div>
                                        <p className="font-bold text-zinc-100">{t.item}</p>
                                        <p className="text-xs text-zinc-500 mt-1">Ticket {t.id} • {t.date}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-emerald-400">+${t.offer.toLocaleString()}</p>
                                        <p className="text-xs text-zinc-500">{t.status}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Repair Tickets */}
                    <div className="bg-[#0B0E14] border border-zinc-800/60 rounded-2xl overflow-hidden">
                        <div className="p-5 border-b border-zinc-800/60 bg-zinc-900/20 flex items-center gap-2">
                            <Wrench className="text-amber-400" size={18} />
                            <h2 className="font-bold text-zinc-200">Service & Repair Logs</h2>
                        </div>
                        <div className="p-2">
                            {history.repairs.map((r: any) => (
                                <div key={r.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] rounded-xl transition-colors">
                                    <div>
                                        <p className="font-bold text-zinc-100">{r.issue}</p>
                                        <p className="text-xs text-zinc-500 mt-1">{r.robot} • {r.date}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="px-2 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md text-xs font-bold uppercase tracking-wider">
                                            {r.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}