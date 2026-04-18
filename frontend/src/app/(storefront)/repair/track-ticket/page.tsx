"use client";

import { useState } from "react";
import { 
    Search, Activity, CheckCircle2, Clock, Wrench, AlertCircle, Package, ArrowRight, ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

// These exactly match your Admin Kanban Columns!
const STATUS_PIPELINE = ["Queue", "Diagnostics", "In Repair", "Testing", "Ready"];

export default function TrackTicketPage() {
    const [ticketNumber, setTicketNumber] = useState("");
    const [email, setEmail] = useState("");
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [ticketData, setTicketData] = useState<any | null>(null);

    const handleTrack = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        setTicketData(null);

        try {
            const response = await fetch(`http://127.0.0.1:8000/api/public/repair/track?ticket_number=${encodeURIComponent(ticketNumber)}&email=${encodeURIComponent(email)}`);
            
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || "Failed to fetch ticket.");
            }

            const data = await response.json();
            setTicketData(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "Queue": return <Clock size={20} />;
            case "Diagnostics": return <Activity size={20} />;
            case "In Repair": return <Wrench size={20} />;
            case "Testing": return <AlertCircle size={20} />;
            case "Ready": return <Package size={20} />;
            default: return <Clock size={20} />;
        }
    };

    return (
        <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col">
            
            {/* Header */}
            <div className="bg-zinc-950 border-b border-zinc-800/60 py-12">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <Badge className="bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 mb-6 border border-blue-600/30">
                        <ShieldCheck size={14} className="mr-1.5 inline" /> Secure Portal
                    </Badge>
                    <h1 className="text-4xl font-bold tracking-tight text-white mb-4">Track Service Status</h1>
                    <p className="text-zinc-400 text-lg">
                        Enter your ticket number and email address to view real-time updates from our Service Operations team.
                    </p>
                </div>
            </div>

            <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full flex flex-col items-center">
                
                {/* Search Form */}
                <form onSubmit={handleTrack} className="bg-zinc-950 border border-zinc-800/60 p-6 md:p-8 rounded-3xl w-full shadow-xl mb-12">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        <div className="md:col-span-2 space-y-2">
                            <Label className="text-zinc-400 ml-1">Ticket Number</Label>
                            <Input 
                                required 
                                value={ticketNumber} 
                                onChange={(e) => setTicketNumber(e.target.value)} 
                                placeholder="e.g. SRV-4921" 
                                className="bg-zinc-900 border-zinc-800 h-12 uppercase focus-visible:ring-blue-500 text-lg" 
                            />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <Label className="text-zinc-400 ml-1">Email Address</Label>
                            <Input 
                                required 
                                type="email"
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                placeholder="name@company.com" 
                                className="bg-zinc-900 border-zinc-800 h-12 focus-visible:ring-blue-500" 
                            />
                        </div>
                        <Button 
                            type="submit" 
                            disabled={isLoading}
                            className="md:col-span-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold w-full"
                        >
                            {isLoading ? <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Track"}
                        </Button>
                    </div>

                    {error && (
                        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm font-medium">
                            <AlertCircle size={18} /> {error}
                        </div>
                    )}
                </form>

                {/* Tracking Result */}
                {ticketData && (
                    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-zinc-950 border border-zinc-800/60 rounded-3xl overflow-hidden shadow-2xl relative">
                            
                            <div className="p-8 border-b border-zinc-800/60 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-zinc-900/30">
                                <div>
                                    <h2 className="text-3xl font-black text-white mb-2">{ticketData.ticket_number}</h2>
                                    <p className="text-zinc-400 font-medium text-lg">{ticketData.asset_name || "Unknown Hardware"}</p>
                                </div>
                                <div className="text-left md:text-right">
                                    <Badge variant="outline" className="bg-zinc-900 border-zinc-700 text-zinc-300 mb-2">{ticketData.service_type}</Badge>
                                    <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold">
                                        Submitted: {new Date(ticketData.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            {/* DYNAMIC PIPELINE TIMELINE */}
                            <div className="p-8 pb-12 bg-zinc-950 relative overflow-hidden">
                                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-8">Service Pipeline Progress</h3>
                                
                                <div className="relative">
                                    {/* The connecting line */}
                                    <div className="absolute top-6 left-6 right-6 h-1 bg-zinc-800 rounded-full" />
                                    
                                    {/* The dynamic active progress line */}
                                    <div 
                                        className="absolute top-6 left-6 h-1 bg-blue-500 rounded-full transition-all duration-1000" 
                                        style={{ width: `${(STATUS_PIPELINE.indexOf(ticketData.status) / (STATUS_PIPELINE.length - 1)) * 100}%` }}
                                    />

                                    <div className="flex justify-between relative z-10">
                                        {STATUS_PIPELINE.map((stage, idx) => {
                                            const currentIdx = STATUS_PIPELINE.indexOf(ticketData.status);
                                            const isPast = idx < currentIdx;
                                            const isActive = idx === currentIdx;
                                            
                                            return (
                                                <div key={stage} className="flex flex-col items-center w-24">
                                                    <div className={`h-12 w-12 rounded-full border-4 flex items-center justify-center transition-all duration-500 shadow-xl ${
                                                        isPast 
                                                        ? "bg-blue-600 border-zinc-950 text-white" 
                                                        : isActive 
                                                        ? "bg-zinc-950 border-blue-500 text-blue-400 ring-4 ring-blue-500/20" 
                                                        : "bg-zinc-900 border-zinc-800 text-zinc-600"
                                                    }`}>
                                                        {isPast ? <CheckCircle2 size={24} /> : getStatusIcon(stage)}
                                                    </div>
                                                    <p className={`mt-4 text-[11px] uppercase tracking-widest font-bold text-center transition-colors ${isActive ? "text-blue-400" : isPast ? "text-zinc-300" : "text-zinc-600"}`}>
                                                        {stage}
                                                    </p>
                                                    {isActive && (
                                                        <div className="mt-2 text-xs font-medium text-emerald-400 animate-pulse bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">
                                                            Current Step
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 border-t border-zinc-800/60 bg-zinc-900/50">
                                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">Reported Issue</h3>
                                <p className="text-zinc-300 leading-relaxed max-w-3xl">
                                    {ticketData.issue}
                                </p>
                            </div>

                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}