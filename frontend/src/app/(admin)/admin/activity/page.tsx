"use client";

import { useState, useEffect } from "react";
import { Wrench, Box, ArrowUpRight, Activity } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminUserActivityDashboard() {
    const router = useRouter();
    const [activities, setActivities] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Helper function to extract a specific cookie by name
    const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return null;
    };

    useEffect(() => {
        const fetchLiveActivity = async () => {
            try {
                // Read the token directly from your secure admin_session cookie!
                const token = getCookie("admin_session");
                
                if (!token) {
                   
                    router.push("/login");
                    alert("Authentication token not found. Please log in again.");
                    return;
                }

                const response = await fetch("http://127.0.0.1:8000/api/admin/activity", {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setActivities(data);
                } else if (response.status === 401) {
                    // If the token is expired or invalid, kick them out to login
                    router.push("/login");
                }
            } catch (error) {
                console.error("Failed to fetch live activity telemetry", error);
            } finally {
                setIsLoading(false); 
            }
        };

        // 1. Fetch immediately
        fetchLiveActivity();

        // 2. Poll every 15 seconds
        const radarInterval = setInterval(fetchLiveActivity, 15000);

        return () => clearInterval(radarInterval);
    }, [router]);

    // Helper to render the glowing status dots
    const renderStatus = (status: string, timeAgo: string) => {
        let dotColor = "bg-zinc-500"; 
        let glowColor = "shadow-zinc-500/50";

        if (status === "Online") {
            dotColor = "bg-emerald-400";
            glowColor = "shadow-emerald-400/50";
        } else if (status === "Away") {
            dotColor = "bg-amber-400";
            glowColor = "shadow-amber-400/50";
        }

        return (
            <div className="flex items-center gap-2">
                <div className={`h-2.5 w-2.5 rounded-full ${dotColor} shadow-[0_0_8px] ${glowColor} opacity-80`}></div>
                <span className="font-semibold text-zinc-200">{status}</span>
                <span className="text-zinc-500 text-xs ml-1">({timeAgo})</span>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#06080D] p-8 text-zinc-100 font-sans">
            <div className="max-w-6xl mx-auto">
                
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        <Activity className="text-blue-500" /> Live Fleet Telemetry
                    </h1>
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Radar Active
                    </div>
                </div>

                <div className="bg-[#0B0E14] border border-zinc-800/60 rounded-2xl overflow-hidden shadow-2xl">
                    
                    {/* TABLE HEADER */}
                    <div className="grid grid-cols-12 gap-4 px-8 py-5 border-b border-zinc-800/60 text-xs font-bold text-zinc-500 tracking-wider uppercase">
                        <div className="col-span-3">Identity</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-3">Service Required</div>
                        <div className="col-span-3">Current Product</div>
                        <div className="col-span-1 text-right">Action</div>
                    </div>

                    {/* LOADING STATE */}
                    {isLoading && (
                        <div className="p-12 text-center text-zinc-500 flex flex-col items-center">
                            <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                            Syncing with global nodes...
                        </div>
                    )}

                    {/* EMPTY STATE */}
                    {!isLoading && activities.length === 0 && (
                        <div className="p-12 text-center text-zinc-500">
                            No active users found in the database.
                        </div>
                    )}

                    {/* TABLE BODY */}
                    {!isLoading && activities.length > 0 && (
                        <div className="flex flex-col">
                            {activities.map((user, idx) => (
                                <div 
                                    key={user.id} 
                                    className={`grid grid-cols-12 gap-4 px-8 py-5 items-center hover:bg-white/[0.02] transition-colors ${idx !== activities.length - 1 ? 'border-b border-zinc-800/40' : ''}`}
                                >
                                    {/* Identity */}
                                    <div className="col-span-3 flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-[#1A1D24] border border-zinc-700/50 flex items-center justify-center font-bold text-zinc-200 shadow-inner">
                                            {user.initials}
                                        </div>
                                        <div className="flex flex-col overflow-hidden">
                                            <span className="font-bold text-zinc-100 text-sm truncate">{user.name}</span>
                                            <span className="text-zinc-500 text-xs truncate">{user.email}</span>
                                        </div>
                                    </div>

                                    {/* Status (Updates live!) */}
                                    <div className="col-span-2">
                                        {renderStatus(user.status, user.time_ago)}
                                    </div>

                                    {/* Service Required */}
                                    <div className="col-span-3 flex items-center text-zinc-300 text-sm font-medium">
                                        <Wrench size={14} className="text-blue-400 mr-2 shrink-0" />
                                        <span className="truncate">{user.service}</span>
                                    </div>

                                    {/* Current Product */}
                                    <div className="col-span-3 flex items-center text-zinc-300 text-sm font-medium">
                                        <Box size={14} className="text-indigo-400 mr-2 shrink-0" />
                                        <span className="truncate">{user.product}</span>
                                    </div>

                                    {/* Action Button */}
                                    <div className="col-span-1 flex justify-end">
    <Link href={`/admin/users/${user.id}`}>
        <button className="h-9 w-9 rounded-xl bg-transparent border border-zinc-700 hover:border-blue-500 hover:bg-blue-500/10 flex items-center justify-center text-zinc-400 hover:text-blue-400 transition-all">
            <ArrowUpRight size={16} />
        </button>
    </Link>
</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}