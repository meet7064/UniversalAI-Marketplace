"use client";

import { useState, useEffect } from "react";
import { 
    Wrench, AlertCircle, Clock, CheckCircle2, 
    MoreHorizontal, Search, Filter, Activity, Trash2 // Added Trash2 import
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Import our new Modal!
import { CreateTicketModal } from "@/components/admin/forms/CreateTicketModal";

const KANBAN_COLUMNS = ["Queue", "Diagnostics", "In Repair", "Testing", "Ready"];

export default function ServiceOperationsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [tickets, setTickets] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

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

    useEffect(() => {
        fetchTickets();
    }, []);

    const moveTicket = async (ticketId: string, newStatus: string) => {
        // Optimistically update the UI instantly
        setTickets(currentTickets => 
            currentTickets.map(t => t.id === ticketId ? { ...t, status: newStatus } : t)
        );

        try {
            await fetch(`http://127.0.0.1:8000/api/service/tickets/${ticketId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
        } catch (error) {
            console.error("Failed to move ticket:", error);
            fetchTickets();
        }
    };

    // NEW: Delete Ticket Function
    const deleteTicket = async (ticketId: string) => {
        if (!window.confirm("Are you sure you want to permanently delete this service ticket?")) return;

        // Optimistically remove from UI instantly
        setTickets(currentTickets => currentTickets.filter(t => t.id !== ticketId));

        try {
            const response = await fetch(`http://127.0.0.1:8000/api/service/tickets/${ticketId}`, {
                method: "DELETE",
            });
            
            if (!response.ok) throw new Error("Delete failed on server");
        } catch (error) {
            console.error("Failed to delete ticket:", error);
            fetchTickets(); // Revert UI if the server failed
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "High": return "bg-red-500/10 text-red-500 border-red-500/20";
            case "Medium": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
            case "Low": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight text-zinc-100">Service Operations</h2>
                    <p className="text-zinc-400 text-sm mt-1">Manage repair queues, diagnostics, and testing workflows.</p>
                </div>
                <CreateTicketModal onSuccess={fetchTickets} />
            </div>

            <div className="flex items-center justify-between gap-4 bg-zinc-950 p-4 rounded-xl border border-zinc-800/60 shadow-sm shrink-0">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <Input placeholder="Search tickets or asset IDs..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 bg-zinc-900 border-zinc-800 text-zinc-100 h-10 focus-visible:ring-1 focus-visible:ring-blue-500" />
                </div>
                <Button variant="outline" className="bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100">
                    <Filter className="mr-2 h-4 w-4" /> Filters
                </Button>
            </div>

            {isLoading && (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 border border-zinc-800/60 rounded-xl bg-zinc-950">
                    <div className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-zinc-500 font-medium">Loading Service Queue...</p>
                </div>
            )}

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
                                        {tickets.filter(t => t.status === column).length}
                                    </Badge>
                                </div>

                                <div className="p-3 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                                    {tickets.filter(t => t.status === column).map((ticket) => (
                                        <div key={ticket.id} className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 p-4 rounded-lg shadow-sm cursor-pointer group transition-colors">
                                            
                                            <div className="flex justify-between items-start mb-2">
                                                <Badge variant="outline" className={`${getPriorityColor(ticket.priority)}`}>
                                                    {ticket.priority}
                                                </Badge>
                                                
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
                                                            <DropdownMenuItem 
                                                                key={col} 
                                                                disabled={ticket.status === col}
                                                                onClick={() => moveTicket(ticket.id, col)}
                                                                className="focus:bg-zinc-900 focus:text-zinc-100 cursor-pointer"
                                                            >
                                                                {col}
                                                            </DropdownMenuItem>
                                                        ))}
                                                        
                                                        {/* NEW: Delete Button placed in the dropdown */}
                                                        <DropdownMenuSeparator className="bg-zinc-800" />
                                                        <DropdownMenuItem 
                                                            onClick={() => deleteTicket(ticket.id)}
                                                            className="focus:bg-red-500/10 focus:text-red-500 text-red-500 cursor-pointer"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" /> Delete Ticket
                                                        </DropdownMenuItem>

                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>

                                            <h4 className="font-medium text-zinc-100 text-sm mb-1 line-clamp-2">{ticket.issue}</h4>
                                            
                                            <p className="text-xs text-zinc-400 font-mono mb-4">
                                                {ticket.asset_id.slice(-6).toUpperCase()} • {ticket.asset_name}
                                            </p>

                                            <div className="flex items-center justify-between pt-3 border-t border-zinc-800/60">
                                                <span className="text-xs font-mono font-medium text-blue-400">{ticket.ticket_number}</span>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-6 w-6 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-[10px] font-bold text-blue-400" title={`Assigned to ${ticket.assignee}`}>
                                                        {ticket.assignee.slice(0, 2).toUpperCase()}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {tickets.filter(t => t.status === column).length === 0 && (
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
        </div>
    );
}