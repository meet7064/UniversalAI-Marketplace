"use client";

import { useState, useEffect } from "react";
import { 
    Users, Zap, Wrench, DollarSign, ArrowUpRight, ArrowDownRight, Activity, Radio
} from "lucide-react";
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from "recharts";

// Mock Data for the Ecosystem Growth Chart (Keep this until you have historical revenue data)
const growthData = [
    { name: "Jan", users: 4000, robots: 2400, revenue: 2400 },
    { name: "Feb", users: 5000, robots: 1398, revenue: 3210 },
    { name: "Mar", users: 6800, robots: 4800, revenue: 5200 },
    { name: "Apr", users: 8200, robots: 3908, revenue: 7400 },
    { name: "May", users: 9500, robots: 4800, revenue: 9100 },
    { name: "Jun", users: 11200, robots: 3800, revenue: 12500 },
    { name: "Jul", users: 14500, robots: 4300, revenue: 16700 },
];

export default function FleetOverviewPage() {
    const [fleetValue, setFleetValue] = useState(0);
    const [openTickets, setOpenTickets] = useState(0);
    
    // NEW: State for live active users
    const [activeUsers, setActiveUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch live data for the dashboard stats
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // NEW: Added the activity pulse API to the Promise.all array
                const [fleetRes, ticketsRes, pulseRes] = await Promise.all([
                    fetch("http://127.0.0.1:8000/api/admin/fleet"),
                    fetch("http://127.0.0.1:8000/api/service/tickets/"),
                    fetch("http://127.0.0.1:8000/api/admin/activity").catch(() => null) // Catch in case endpoint isn't up yet
                ]);

                if (fleetRes.ok && ticketsRes.ok) {
                    const fleetData = await fleetRes.json();
                    const ticketsData = await ticketsRes.json();

                    // Calculate Total Fleet Value
                    const totalValue = fleetData.reduce((sum: number, robot: any) => sum + (Number(robot.price) || 0), 0);
                    setFleetValue(totalValue);

                    // Calculate Open Tickets
                    const unresolved = ticketsData.filter((t: any) => t.status !== "Ready").length;
                    setOpenTickets(unresolved);
                }

                // NEW: Set the live active users
                if (pulseRes && pulseRes.ok) {
                    const pulseData = await pulseRes.json();
                    setActiveUsers(pulseData);
                }

            } catch (error) {
                console.error("Failed to load dashboard data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
        
        // Optional: Refresh the pulse every 30 seconds to watch users move around!
        const interval = setInterval(fetchDashboardData, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-8 pb-12">
            
            {/* Page Header */}
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
                    <Activity className="text-blue-500" />
                    Command Center Overview
                </h2>
                <p className="text-zinc-400 mt-1">Real-time telemetry, financial valuation, and ecosystem analytics.</p>
            </div>

            {/* Top Stat Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* 1. Total Fleet Value (LIVE) */}
                <div className="bg-zinc-950 border border-zinc-800/60 p-6 rounded-xl shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <DollarSign size={64} />
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
                            <DollarSign size={20} />
                        </div>
                        <h3 className="font-medium text-zinc-400 text-sm tracking-wide uppercase">Total Fleet Value</h3>
                    </div>
                    <div className="text-3xl font-bold text-zinc-100">
                        {isLoading ? "..." : `$${fleetValue.toLocaleString()}`}
                    </div>
                    <div className="flex items-center gap-1 mt-2 text-sm text-emerald-400 font-medium">
                        <ArrowUpRight size={16} />
                        <span>+12.5%</span>
                        <span className="text-zinc-600 font-normal ml-1">from last month</span>
                    </div>
                </div>

                {/* 2. Active Users (LIVE COUNT) */}
                <div className="bg-zinc-950 border border-zinc-800/60 p-6 rounded-xl shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Users size={64} />
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-blue-500/10 rounded-lg text-blue-400 border border-blue-500/20">
                            <Users size={20} />
                        </div>
                        <h3 className="font-medium text-zinc-400 text-sm tracking-wide uppercase">Active Users</h3>
                    </div>
                    <div className="text-3xl font-bold text-zinc-100">
                        {isLoading ? "..." : activeUsers.length}
                    </div>
                    <div className="flex items-center gap-1 mt-2 text-sm text-emerald-400 font-medium">
                        <Radio size={16} className="animate-pulse" />
                        <span>Live Now</span>
                        <span className="text-zinc-600 font-normal ml-1">on platform</span>
                    </div>
                </div>

                {/* 3. Conversion Metric */}
                <div className="bg-zinc-950 border border-zinc-800/60 p-6 rounded-xl shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Zap size={64} />
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-purple-500/10 rounded-lg text-purple-400 border border-purple-500/20">
                            <Zap size={20} />
                        </div>
                        <h3 className="font-medium text-zinc-400 text-sm tracking-wide uppercase">Conversion Rate</h3>
                    </div>
                    <div className="text-3xl font-bold text-zinc-100">18.4%</div>
                    <div className="flex items-center gap-1 mt-2 text-sm text-emerald-400 font-medium">
                        <ArrowUpRight size={16} />
                        <span>+2.1%</span>
                        <span className="text-zinc-600 font-normal ml-1">vs industry avg</span>
                    </div>
                </div>

                {/* 4. Service OPS Open Tickets (LIVE) */}
                <div className="bg-zinc-950 border border-zinc-800/60 p-6 rounded-xl shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Wrench size={64} />
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-amber-500/10 rounded-lg text-amber-500 border border-amber-500/20">
                            <Wrench size={20} />
                        </div>
                        <h3 className="font-medium text-zinc-400 text-sm tracking-wide uppercase">Service OPS Queue</h3>
                    </div>
                    <div className="text-3xl font-bold text-zinc-100">
                        {isLoading ? "..." : openTickets}
                    </div>
                    <div className="flex items-center gap-1 mt-2 text-sm text-red-400 font-medium">
                        <ArrowDownRight size={16} />
                        <span>Needs Action</span>
                        <span className="text-zinc-600 font-normal ml-1">across all zones</span>
                    </div>
                </div>
            </div>

            {/* Bottom Grid: Chart + Active User Pulse */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Main Analytics Chart */}
                <div className="lg:col-span-2 bg-zinc-950 border border-zinc-800/60 p-6 rounded-xl shadow-sm flex flex-col">
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-zinc-100">Ecosystem Growth Analytics</h3>
                        <p className="text-zinc-400 text-sm">Monthly user acquisition vs platform revenue trajectory.</p>
                    </div>
                    
                    <div className="flex-1 min-h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={growthData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                <XAxis dataKey="name" stroke="#71717a" tick={{ fill: '#71717a', fontSize: 12 }} tickLine={false} axisLine={false} dy={10} />
                                <YAxis stroke="#71717a" tick={{ fill: '#71717a', fontSize: 12 }} tickLine={false} axisLine={false} dx={-10} />
                                <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px', color: '#f4f4f5' }} itemStyle={{ color: '#f4f4f5' }} />
                                <Area type="monotone" dataKey="users" name="Active Users" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                                <Area type="monotone" dataKey="revenue" name="Revenue Growth" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* LIVE Active User Pulse Widget */}
                <div className="bg-zinc-950 border border-zinc-800/60 p-6 rounded-xl shadow-sm flex flex-col">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                            Active User Pulse
                            <span className="relative flex h-3 w-3 ml-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                            </span>
                        </h3>
                        <button className="text-blue-500 font-semibold text-sm hover:underline">
                            Directory
                        </button>
                    </div>
                    
                    <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        {activeUsers.length > 0 ? (
                            activeUsers.map(user => (
                                <div key={user.id} className="flex justify-between items-center group cursor-pointer">
                                    <div className="flex items-center gap-4 overflow-hidden">
                                        <div className="h-14 w-14 rounded-2xl border border-blue-900/50 bg-[#111827] flex items-center justify-center text-blue-400 font-bold text-xl group-hover:bg-blue-900/20 transition-colors shrink-0">
                                            {user.initials}
                                        </div>
                                        <div className="truncate pr-2">
                                            <h4 className="text-zinc-100 font-bold text-[15px] leading-tight mb-1 truncate">{user.name}</h4>
                                            <p className="text-zinc-500 font-medium text-xs truncate">{user.company}</p>
                                        </div>
                                    </div>

                                    <div className="text-right shrink-0">
                                        <div className="flex items-center justify-end gap-2 mb-1">
                                            <div className={`h-2.5 w-2.5 rounded-full ${user.dotColor}`}></div>
                                            <span className={`text-[11px] font-bold tracking-widest uppercase ${user.statusColor}`}>
                                                {user.status}
                                            </span>
                                        </div>
                                        <p className="text-zinc-500 text-[11px] font-medium max-w-[120px] truncate" title={user.robot}>
                                            {user.robot}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-2 border-2 border-dashed border-zinc-800/50 rounded-xl py-8">
                                <Radio size={32} className="opacity-50" />
                                <p className="text-sm font-medium">No live heartbeat detected.</p>
                                <p className="text-xs">Waiting for customers to log in...</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}