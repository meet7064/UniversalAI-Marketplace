"use client";

import { useState, useEffect } from "react";
import { 
    Wrench, AlertCircle, Clock, CheckCircle2, 
    MoreHorizontal, Search, Filter, Activity, Trash2, User, Mail, 
    Bot, FileText, Calendar, Tag
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

// Import our new Modal!
import { CreateTicketModal } from "@/components/admin/forms/CreateTicketModal";

const KANBAN_COLUMNS = ["Queue", "Diagnostics", "In Repair", "Testing", "Ready"];

export default function ServiceOperationsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [tickets, setTickets] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // NEW: Tab State & Details Modal State
    const [activeTab, setActiveTab] = useState<"User" | "Internal">("User");
    const [selectedTicket, setSelectedTicket] = useState<any | null>(null);

    const fetchTickets = async () => {
        try {
            const response = await fetch("http://127.0.0.1:8000/api/service/tickets/");
            if (response.ok) {
                const data = await response.json();
                setTickets(data);
            }
        } catch (error) {
            console.error("Failed to load tickets:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchTickets(); }, []);

    const moveTicket = async (ticketId: string, newStatus: string) => {
        setTickets(currentTickets => currentTickets.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
        try {
            await fetch(`http://127.0.0.1:8000/api/service/tickets/${ticketId}`, {
                method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }),
            });
        } catch (error) { fetchTickets(); }
    };

    const deleteTicket = async (ticketId: string) => {
        if (!window.confirm("Are you sure you want to permanently delete this service ticket?")) return;
        setTickets(currentTickets => currentTickets.filter(t => t.id !== ticketId));
        try {
            await fetch(`http://127.0.0.1:8000/api/service/tickets/${ticketId}`, { method: "DELETE" });
        } catch (error) { fetchTickets(); }
    };

    // --- NEW: ADVANCED FILTERING LOGIC ---
    const filteredTickets = tickets.filter(ticket => {
        // 1. Tab Split Logic (Check if it has public customer data)
        const isCustomerTicket = ticket.name || ticket.email || (ticket.reported_by && ticket.reported_by.includes("Customer"));
        
        if (activeTab === "User" && !isCustomerTicket) return false;
        if (activeTab === "Internal" && isCustomerTicket) return false;

        // 2. Search Logic (Checks Name, Email, Ticket Number, Issue, and Asset ID)
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const searchString = `
                ${ticket.name || ""} 
                ${ticket.email || ""} 
                ${ticket.ticket_number || ""} 
                ${ticket.asset_id || ""} 
                ${ticket.issue || ""}
                ${ticket.asset_name || ""}
            `.toLowerCase();

            if (!searchString.includes(query)) return false;
        }

        return true;
    });

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "High": return "bg-red-500/10 text-red-500 border-red-500/20";
            case "Medium": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
            case "Low": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
            case "Critical": return "bg-purple-500/10 text-purple-400 border-purple-500/20";
            default: return "bg-zinc-800 text-zinc-400 border-zinc-700";
        }
    };

    const getColumnIcon = (colName: string) => {
        switch (colName) {
            case "Queue": return <Clock size={16} className="text-zinc-500" />;
            case "Diagnostics": return <Activity size={16} className="text-amber-500" />;
            case "In Repair": return <Wrench size={16} className="text-blue-500" />;
            case "Testing": return <AlertCircle size={16} className="text-purple-500" />;
            case "Ready": return <CheckCircle2 size={16} className="text-emerald-500" />;
            default: return null;
        }
    };

    return (
        <div className="space-y-6 pb-12 h-full flex flex-col">
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight text-zinc-100">Service Operations</h2>
                    <p className="text-zinc-400 text-sm mt-1">Manage repair queues, diagnostics, and testing workflows.</p>
                </div>
                <CreateTicketModal onSuccess={fetchTickets} />
            </div>

            {/* TOOLBAR */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-950 p-4 rounded-xl border border-zinc-800/60 shadow-sm shrink-0">
                
                {/* NEW: Tab Toggle Switch */}
                <div className="flex items-center p-1 bg-zinc-900 border border-zinc-800 rounded-lg w-max shrink-0">
                    <button 
                        onClick={() => setActiveTab("User")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === "User" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"}`}
                    >
                        <User size={16} className={activeTab === "User" ? "text-blue-400" : ""} /> 
                        Customer Requests
                    </button>
                    <button 
                        onClick={() => setActiveTab("Internal")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === "Internal" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"}`}
                    >
                        <Bot size={16} className={activeTab === "Internal" ? "text-purple-400" : ""} /> 
                        Internal Fleet Ops
                    </button>
                </div>

                {/* Updated Search Bar */}
                <div className="flex items-center gap-4 flex-1 justify-end">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                        <Input 
                            placeholder={activeTab === "User" ? "Search name, email, or ticket ID..." : "Search internal assets or ticket IDs..."} 
                            value={searchQuery} 
                            onChange={(e) => setSearchQuery(e.target.value)} 
                            className="pl-9 bg-zinc-900 border-zinc-800 text-zinc-100 h-10 focus-visible:ring-1 focus-visible:ring-blue-500 w-full" 
                        />
                    </div>
                    <Button variant="outline" className="bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 shrink-0">
                        <Filter className="mr-2 h-4 w-4" /> Filters
                    </Button>
                </div>
            </div>

            {isLoading && (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 border border-zinc-800/60 rounded-xl bg-zinc-950">
                    <div className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-zinc-500 font-medium">Loading Service Queue...</p>
                </div>
            )}

            {/* KANBAN BOARD */}
            {!isLoading && (
                <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
                    <div className="flex gap-6 h-full min-w-max px-1">
                        {KANBAN_COLUMNS.map((column) => (
                            <div key={column} className="w-80 flex flex-col h-full bg-zinc-950/50 rounded-xl border border-zinc-800/60">
                                
                                <div className="p-4 border-b border-zinc-800/60 flex items-center justify-between bg-zinc-950 rounded-t-xl shrink-0">
                                    <div className="flex items-center gap-2">
                                        {getColumnIcon(column)}
                                        <h3 className="font-semibold text-zinc-200">{column}</h3>
                                    </div>
                                    <Badge variant="secondary" className="bg-zinc-900 text-zinc-400">
                                        {/* Use filteredTickets here! */}
                                        {filteredTickets.filter(t => t.status === column).length}
                                    </Badge>
                                </div>

                                <div className="p-3 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                                    {/* Use filteredTickets here! */}
                                    {filteredTickets.filter(t => t.status === column).map((ticket) => (
                                        <div 
                                            key={ticket.id} 
                                            onClick={() => setSelectedTicket(ticket)} 
                                            className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 p-4 rounded-lg shadow-sm cursor-pointer group transition-colors"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <Badge variant="outline" className={`${getPriorityColor(ticket.priority)}`}>
                                                    {ticket.priority}
                                                </Badge>
                                                
                                                <div onClick={(e) => e.stopPropagation()}>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-6 w-6 p-0 shrink-0 text-zinc-500 hover:text-zinc-200 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="bg-zinc-950 border-zinc-800 text-zinc-300">
                                                            <DropdownMenuLabel className="text-zinc-500 text-xs uppercase tracking-wider">Move To</DropdownMenuLabel>
                                                            <DropdownMenuSeparator className="bg-zinc-800" />
                                                            {KANBAN_COLUMNS.map(col => (
                                                                <DropdownMenuItem key={col} disabled={ticket.status === col} onClick={() => moveTicket(ticket.id, col)} className="focus:bg-zinc-900 focus:text-zinc-100 cursor-pointer">
                                                                    {col}
                                                                </DropdownMenuItem>
                                                            ))}
                                                            <DropdownMenuSeparator className="bg-zinc-800" />
                                                            <DropdownMenuItem onClick={() => deleteTicket(ticket.id)} className="focus:bg-red-500/10 focus:text-red-500 text-red-500 cursor-pointer">
                                                                <Trash2 className="mr-2 h-4 w-4" /> Delete Ticket
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </div>

                                            <h4 className="font-medium text-zinc-100 text-sm mb-1 line-clamp-2">{ticket.issue}</h4>
                                            
                                            <p className="text-xs text-zinc-400 font-mono mb-3">
                                                {ticket.asset_id?.slice(-6).toUpperCase() || "N/A"} • {ticket.asset_name}
                                            </p>

                                            {(ticket.name || ticket.email) && (
                                                <div className="mb-4 bg-zinc-950 border border-zinc-800/60 rounded-md p-2 space-y-1.5">
                                                    {ticket.name && (
                                                        <div className="flex items-center gap-2 text-xs text-zinc-300 font-medium"><User size={12} className="text-blue-400 shrink-0" /><span className="truncate">{ticket.name}</span></div>
                                                    )}
                                                    {ticket.email && (
                                                        <div className="flex items-center gap-2 text-[10px] text-zinc-500"><Mail size={12} className="text-zinc-500 shrink-0" /><span className="truncate">{ticket.email}</span></div>
                                                    )}
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between pt-3 border-t border-zinc-800/60 mt-auto">
                                                <span className="text-xs font-mono font-medium text-blue-400">{ticket.ticket_number}</span>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-6 w-6 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-[10px] font-bold text-blue-400" title={`Assigned to ${ticket.assignee}`}>
                                                        {ticket.assignee?.slice(0, 2).toUpperCase() || "UN"}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {filteredTickets.filter(t => t.status === column).length === 0 && (
                                        <div className="h-24 border-2 border-dashed border-zinc-800/50 rounded-lg flex items-center justify-center text-zinc-600 text-sm">
                                            No tickets
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* FULL TICKET DETAILS MODAL */}
            <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
                <DialogContent className="sm:max-w-[700px] bg-zinc-950 border-zinc-800 text-zinc-100 p-0 overflow-hidden">
                    {selectedTicket && (
                        <>
                            {/* Modal Header */}
                            <div className="p-6 border-b border-zinc-800/60 bg-zinc-900/30">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                                            {selectedTicket.ticket_number}
                                            <Badge variant="outline" className={getPriorityColor(selectedTicket.priority)}>
                                                {selectedTicket.priority} Priority
                                            </Badge>
                                        </DialogTitle>
                                        <DialogDescription className="text-zinc-400 mt-1 flex items-center gap-4">
                                            <span className="flex items-center gap-1.5"><Calendar size={14} /> {new Date(selectedTicket.created_at).toLocaleDateString()}</span>
                                            <span className="flex items-center gap-1.5"><Tag size={14} /> Status: {selectedTicket.status}</span>
                                        </DialogDescription>
                                    </div>
                                    <div className="h-10 w-10 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center text-blue-400">
                                        <Wrench size={20} />
                                    </div>
                                </div>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Contact Details Section */}
                                    <div className="space-y-3 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/60">
                                        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2 mb-4">
                                            <User size={16} className="text-blue-500" /> Contact Details
                                        </h3>
                                        <div>
                                            <p className="text-xs text-zinc-500 mb-0.5">Reporter / Customer Name</p>
                                            <p className="text-sm font-medium text-zinc-200">{selectedTicket.name || selectedTicket.reported_by || "System Admin"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-zinc-500 mb-0.5">Contact Email</p>
                                            <p className="text-sm font-medium text-zinc-200 flex items-center gap-2">
                                                {selectedTicket.email ? (
                                                    <><Mail size={14} className="text-zinc-400" /> {selectedTicket.email}</>
                                                ) : "N/A (Internal Ticket)"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Hardware Identity Section */}
                                    <div className="space-y-3 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/60">
                                        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2 mb-4">
                                            <Bot size={16} className="text-purple-500" /> Hardware Identity
                                        </h3>
                                        <div>
                                            <p className="text-xs text-zinc-500 mb-0.5">Hardware Model</p>
                                            <p className="text-sm font-medium text-zinc-200">{selectedTicket.asset_name || "Unknown Asset"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-zinc-500 mb-0.5">Asset ID / Serial</p>
                                            <p className="text-sm font-medium text-zinc-200 font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded w-max">
                                                {selectedTicket.asset_id || "PUBLIC-REQ"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-zinc-500 mb-0.5">Requested Service</p>
                                            <p className="text-sm font-medium text-zinc-200">{selectedTicket.service_type || "Repair"}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Issue Overview Section */}
                                <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/60">
                                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2 mb-4">
                                        <AlertCircle size={16} className="text-amber-500" /> Issue Overview
                                    </h3>
                                    <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                                        {selectedTicket.issue || selectedTicket.description || "No description provided."}
                                    </p>
                                </div>

                                {/* Telemetry/Log File */}
                                {selectedTicket.file_url && (
                                    <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <FileText className="text-blue-500" size={24} />
                                            <div>
                                                <p className="text-sm font-medium text-blue-400">Telemetry Log Attached</p>
                                                <p className="text-xs text-zinc-500">Customer uploaded diagnostic data</p>
                                            </div>
                                        </div>
                                        <a href={`http://127.0.0.1:8000${selectedTicket.file_url}`} target="_blank" rel="noreferrer">
                                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">Download Log</Button>
                                        </a>
                                    </div>
                                )}

                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

        </div>
    );
}