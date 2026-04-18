"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
    User, Mail, Activity, ArrowRight, Clock, Wrench, AlertCircle, Package, CheckCircle2, ShieldCheck, Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/store/useStore";

export default function UserProfilePage() {
    // Check if your Zustand store has user auth data.
    const isAuthenticated = useStore((state: any) => state.isAuthenticated);
    const user = useStore((state: any) => state.user); // Assuming user object exists
    
    // Fallback email state if they are a guest looking up their history
    const [lookupEmail, setLookupEmail] = useState(user?.email || "");
    const [hasSearched, setHasSearched] = useState(false);
    
    const [tickets, setTickets] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    // If the user is already logged in, automatically fetch their history on load!
    useEffect(() => {
        if (isAuthenticated && user?.email) {
            fetchHistory(user.email);
        }
    }, [isAuthenticated, user]);

    const fetchHistory = async (emailToSearch: string) => {
        setIsLoading(true);
        setError("");
        
        try {
            // CHANGED: Now hitting the dedicated profile route!
            const response = await fetch(`http://127.0.0.1:8000/api/public/profile/history?email=${encodeURIComponent(emailToSearch)}`);
            if (!response.ok) throw new Error("Failed to retrieve history.");
            
            const data = await response.json();
            setTickets(data);
            setHasSearched(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleManualLookup = (e: React.FormEvent) => {
        e.preventDefault();
        if (lookupEmail) fetchHistory(lookupEmail);
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "Queue": return <Clock size={16} className="text-zinc-500" />;
            case "Diagnostics": return <Activity size={16} className="text-amber-500" />;
            case "In Repair": return <Wrench size={16} className="text-blue-500" />;
            case "Testing": return <AlertCircle size={16} className="text-purple-500" />;
            case "Ready": return <CheckCircle2 size={16} className="text-emerald-500" />;
            default: return <Clock size={16} className="text-zinc-500" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Queue": return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
            case "Diagnostics": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
            case "In Repair": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
            case "Testing": return "bg-purple-500/10 text-purple-400 border-purple-500/20";
            case "Ready": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
            default: return "bg-zinc-800 text-zinc-400 border-zinc-700";
        }
    };

    return (
        <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col pb-24">
            
            {/* Header */}
            <div className="bg-zinc-950 border-b border-zinc-800/60 py-12">
                <div className="max-w-5xl mx-auto px-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-16 w-16 bg-blue-600/20 border border-blue-500/30 rounded-2xl flex items-center justify-center text-blue-500">
                            <User size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-white">
                                {isAuthenticated ? `Welcome, ${user?.name || "User"}` : "Service History Portal"}
                            </h1>
                            <p className="text-zinc-400 flex items-center gap-2">
                                <ShieldCheck size={14} className="text-emerald-500" /> 
                                {isAuthenticated ? user?.email : "Securely view your hardware support tickets"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-5xl mx-auto px-6 py-12 w-full">
                
                {/* Guest Email Lookup Box (Only shows if they aren't authenticated or haven't searched yet) */}
                {(!isAuthenticated && !hasSearched) && (
                    <div className="bg-zinc-950 border border-zinc-800/60 p-8 rounded-3xl shadow-xl max-w-xl mb-12">
                        <h2 className="text-xl font-bold text-white mb-2">Find Your Tickets</h2>
                        <p className="text-zinc-400 text-sm mb-6">Enter the email address you used to submit your repair request to view your full history.</p>
                        
                        <form onSubmit={handleManualLookup} className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                                <Input 
                                    required 
                                    type="email"
                                    value={lookupEmail} 
                                    onChange={(e) => setLookupEmail(e.target.value)} 
                                    placeholder="Enter your email address..." 
                                    className="pl-10 bg-zinc-900 border-zinc-800 h-12 focus-visible:ring-blue-500 text-base" 
                                />
                            </div>
                            <Button type="submit" disabled={isLoading} className="h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold px-8">
                                {isLoading ? <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Lookup"}
                            </Button>
                        </form>
                    </div>
                )}

                {/* Ticket History Dashboard */}
                {hasSearched && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between mb-6 border-b border-zinc-800/60 pb-4">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                <Activity className="text-blue-500" /> Support & Service History
                            </h2>
                            {!isAuthenticated && (
                                <Button variant="ghost" onClick={() => setHasSearched(false)} className="text-zinc-400 hover:text-white">
                                    <Search size={14} className="mr-2" /> Search Another Email
                                </Button>
                            )}
                        </div>

                        {tickets.length === 0 ? (
                            <div className="bg-zinc-950 border border-zinc-800/60 p-12 rounded-3xl text-center flex flex-col items-center justify-center">
                                <Package size={48} className="text-zinc-700 mb-4" />
                                <h3 className="text-xl font-bold text-zinc-200 mb-2">No Service Tickets Found</h3>
                                <p className="text-zinc-500 max-w-md">We couldn't find any maintenance or repair requests associated with {lookupEmail}.</p>
                                <Link href="/repair">
                                    <Button className="mt-6 bg-blue-600 hover:bg-blue-700 text-white">Submit a New Request</Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {tickets.map((ticket, idx) => (
                                    <div key={idx} className="bg-zinc-950 border border-zinc-800/60 hover:border-zinc-700 p-6 rounded-2xl shadow-sm transition-all group flex flex-col">
                                        
                                        <div className="flex justify-between items-start mb-4">
                                            <Badge variant="outline" className={`${getStatusColor(ticket.status)} flex items-center gap-1.5 px-3 py-1 font-bold shadow-sm`}>
                                                {getStatusIcon(ticket.status)} {ticket.status}
                                            </Badge>
                                            <span className="text-sm font-mono text-blue-400 font-bold">{ticket.ticket_number}</span>
                                        </div>

                                        <div className="mb-6 flex-1">
                                            <h3 className="text-lg font-bold text-zinc-100 mb-1">{ticket.asset_name}</h3>
                                            <p className="text-sm text-zinc-400 mb-3">{ticket.service_type}</p>
                                            
                                            <div className="flex items-center gap-4 text-xs font-medium text-zinc-500">
                                                <span className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-md">
                                                    <Clock size={12} /> {new Date(ticket.created_at).toLocaleDateString()}
                                                </span>
                                                <span className="uppercase tracking-wider">
                                                    Priority: <span className={ticket.priority === "Critical" ? "text-red-400" : "text-zinc-300"}>{ticket.priority}</span>
                                                </span>
                                            </div>
                                        </div>

                                        {/* Direct link to the live Tracking Portal we built earlier! */}
                                        <div className="pt-4 border-t border-zinc-800/60 mt-auto">
                                            <Link href={`/repair/track-ticket?ticket_number=${ticket.ticket_number}&email=${lookupEmail}`}>
                                                <Button className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 hover:bg-zinc-800 hover:text-white group-hover:border-zinc-600 transition-all">
                                                    Track Live Progress <ArrowRight size={16} className="ml-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                                                </Button>
                                            </Link>
                                        </div>

                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

            </main>
        </div>
    );
}