"use client";

import { useState } from "react";
import Link from "next/link";
import { 
    Wrench, Activity, FileText, UploadCloud, CheckCircle2, AlertTriangle, 
    Zap, Bot, Send, Search, Copy, ArrowRight 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function RepairServicePage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [submittedTicket, setSubmittedTicket] = useState<string | null>(null); // NEW STATE
    
    const [formData, setFormData] = useState({
        name: "", email: "", brand: "", model: "", 
        service_type: "Repair", urgency: "Standard", description: "",
        logFile: null as File | null
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (formData.logFile) {
                await new Promise(resolve => setTimeout(resolve, 2500)); 
            }

            const data = new FormData();
            data.append("name", formData.name);
            data.append("email", formData.email);
            data.append("brand", formData.brand);
            data.append("model", formData.model);
            data.append("service_type", formData.service_type);
            data.append("urgency", formData.urgency);
            data.append("description", formData.description);
            if (formData.logFile) data.append("log_file", formData.logFile);

            const response = await fetch("http://127.0.0.1:8000/api/public/repair", {
                method: "POST",
                body: data, 
            });

            if (response.ok) {
                const resData = await response.json();
                setSubmittedTicket(resData.ticket_number); // CATCH THE NUMBER
                setIsSuccess(true);
            }
        } catch (error) {
            console.error("Failed to submit ticket:", error);
            alert("An error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- NEW: UPGRADED SUCCESS SCREEN ---
    if (isSuccess) {
        return (
            <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center text-zinc-100 p-6">
                <div className="bg-zinc-950 border border-zinc-800/60 p-8 md:p-12 rounded-3xl text-center max-w-lg shadow-2xl relative overflow-hidden w-full">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                    
                    <div className="mx-auto h-20 w-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle2 className="text-emerald-500" size={40} />
                    </div>
                    
                    <h2 className="text-3xl font-black text-white mb-2">Ticket Initialized</h2>
                    <p className="text-zinc-400 mb-8 leading-relaxed text-sm md:text-base">
                        Our technicians have received your request. We will reach out to <span className="text-zinc-200 font-semibold">{formData.email}</span> shortly. Please save your ticket number for tracking.
                    </p>

                    {/* NEW: TICKET NUMBER DISPLAY BOX */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-8 flex items-center justify-between shadow-inner">
                        <div className="text-left">
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Your Ticket Number</p>
                            <p className="text-3xl font-mono text-blue-400 font-black tracking-wider">{submittedTicket}</p>
                        </div>
                        <Button 
                            variant="ghost" 
                            title="Copy to clipboard"
                            onClick={() => {
                                navigator.clipboard.writeText(submittedTicket!);
                                alert("Ticket number copied!");
                            }} 
                            className="h-12 w-12 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 shrink-0"
                        >
                            <Copy size={20} />
                        </Button>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/repair/track-ticket" className="w-full sm:w-auto">
                            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 shadow-lg shadow-blue-900/20">
                                Track Status <ArrowRight size={18} className="ml-2" />
                            </Button>
                        </Link>
                        <Button onClick={() => window.location.reload()} variant="outline" className="w-full sm:w-auto bg-zinc-900 border-zinc-700 text-white hover:bg-zinc-800 h-12">
                            Submit Another
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#09090b] text-zinc-100 pb-24">
            
            {/* HERO SECTION */}
            <div className="relative bg-zinc-950 border-b border-zinc-800/60 py-16 overflow-hidden">
                <div className="absolute right-0 top-0 opacity-10 pointer-events-none translate-x-1/3 -translate-y-1/4">
                    <Wrench size={400} />
                </div>
                <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="max-w-2xl">
                        <Badge className="bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 mb-6 border border-blue-600/30">
                            <Activity size={14} className="mr-1.5 inline" /> Fleet Maintenance Center
                        </Badge>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4">
                            Service, Repair & Calibration
                        </h1>
                        <p className="text-zinc-400 text-lg">
                            Keep your automation pipeline running at peak efficiency. Request certified technician support, regular maintenance, or upload controller logs for instant AI-assisted diagnostics.
                        </p>
                    </div>

                    <div className="shrink-0 mt-4 md:mt-0">
                        <Link href="/repair/track-ticket">
                            <Button variant="outline" className="bg-zinc-900 border-zinc-700 text-zinc-100 hover:bg-zinc-800 hover:text-white h-12 px-6 rounded-xl shadow-lg">
                                <Search className="mr-2 h-4 w-4 text-blue-400" />
                                Track Existing Ticket
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-6 py-12">
                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    
                    {/* LEFT COLUMN: Hardware Details */}
                    <div className="lg:col-span-7 space-y-8">
                        <div className="bg-zinc-950 border border-zinc-800/60 rounded-2xl p-6 md:p-8">
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <FileText className="text-blue-500" size={20} /> Contact Details
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-zinc-300">Full Name</Label>
                                    <Input required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="bg-zinc-900 border-zinc-800 focus-visible:ring-blue-500 h-12" placeholder="John Doe" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-zinc-300">Enterprise Email</Label>
                                    <Input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="bg-zinc-900 border-zinc-800 focus-visible:ring-blue-500 h-12" placeholder="john@company.com" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-zinc-950 border border-zinc-800/60 rounded-2xl p-6 md:p-8">
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <Bot className="text-purple-500" size={20} /> Hardware Identity
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="space-y-2">
                                    <Label className="text-zinc-300">Manufacturer / Brand</Label>
                                    <Input required value={formData.brand} onChange={(e) => setFormData({...formData, brand: e.target.value})} className="bg-zinc-900 border-zinc-800 focus-visible:ring-blue-500 h-12" placeholder="e.g. Universal Robots" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-zinc-300">Model Number</Label>
                                    <Input required value={formData.model} onChange={(e) => setFormData({...formData, model: e.target.value})} className="bg-zinc-900 border-zinc-800 focus-visible:ring-blue-500 h-12" placeholder="e.g. UR10e" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-zinc-300">Service Required</Label>
                                <Select value={formData.service_type} onValueChange={(val) => setFormData({...formData, service_type: val})}>
                                    <SelectTrigger className="bg-zinc-900 border-zinc-800 h-12 focus:ring-blue-500 text-zinc-100">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                                        <SelectItem value="Repair">Physical Repair (Broken Part)</SelectItem>
                                        <SelectItem value="Maintenance">Routine Preventative Maintenance</SelectItem>
                                        <SelectItem value="Calibration">Kinematic Calibration</SelectItem>
                                        <SelectItem value="Diagnostic">AI Log Diagnostic Analysis</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Description & Upload */}
                    <div className="lg:col-span-5 space-y-8">
                        <div className="bg-zinc-950 border border-zinc-800/60 rounded-2xl p-6 md:p-8 h-full flex flex-col">
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <AlertTriangle className="text-amber-500" size={20} /> Issue Overview
                            </h3>

                            <div className="space-y-2 mb-6">
                                <Label className="text-zinc-300">Priority Level</Label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button type="button" onClick={() => setFormData({...formData, urgency: "Standard"})} className={`h-10 rounded-lg text-sm font-bold transition-all border ${formData.urgency === "Standard" ? "bg-zinc-800 text-white border-zinc-700" : "bg-zinc-900 text-zinc-500 border-zinc-800 hover:bg-zinc-800"}`}>
                                        Standard (3-5 Days)
                                    </button>
                                    <button type="button" onClick={() => setFormData({...formData, urgency: "Critical"})} className={`h-10 rounded-lg text-sm font-bold transition-all border ${formData.urgency === "Critical" ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-zinc-900 text-zinc-500 border-zinc-800 hover:bg-red-500/10"}`}>
                                        Critical (AOG)
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 mb-6 flex-1 flex flex-col">
                                <Label className="text-zinc-300">Detailed Description</Label>
                                <textarea 
                                    required
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    className="w-full flex-1 min-h-[120px] bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none custom-scrollbar"
                                    placeholder="Describe the fault, error codes, or physical damage..."
                                />
                            </div>

                            <div className="space-y-2 mb-8">
                                <div className="flex items-center justify-between">
                                    <Label className="text-zinc-300">Telemetry Logs (Optional)</Label>
                                    <Badge className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0">
                                        <Zap size={10} className="mr-1 inline" /> AI Appraised
                                    </Badge>
                                </div>
                                <input 
                                    type="file" id="log-upload" accept=".log,.txt,.csv,.zip" className="hidden" 
                                    onChange={(e) => { if (e.target.files && e.target.files[0]) setFormData({ ...formData, logFile: e.target.files[0] }); }}
                                />
                                <Label 
                                    htmlFor="log-upload" 
                                    className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${formData.logFile ? "border-purple-500/50 bg-purple-500/5" : "border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800"}`}
                                >
                                    {formData.logFile ? (
                                        <>
                                            <CheckCircle2 className="text-purple-400 mb-2" size={24} />
                                            <p className="text-zinc-100 font-medium text-sm">File Attached</p>
                                            <p className="text-zinc-500 text-xs mt-1 truncate max-w-xs">{formData.logFile.name}</p>
                                        </>
                                    ) : (
                                        <>
                                            <UploadCloud className="text-zinc-600 mb-2" size={24} />
                                            <p className="text-zinc-300 font-medium text-sm">Upload Controller Logs</p>
                                            <p className="text-zinc-600 text-xs mt-1">.TXT, .CSV, or .ZIP up to 50MB</p>
                                        </>
                                    )}
                                </Label>
                            </div>

                            <Button 
                                type="submit" 
                                disabled={isSubmitting} 
                                className={`w-full h-14 text-lg font-bold shadow-xl transition-all ${isSubmitting && formData.logFile ? "bg-purple-600 hover:bg-purple-700" : "bg-blue-600 hover:bg-blue-700"} text-white`}
                            >
                                {isSubmitting ? (
                                    formData.logFile ? (
                                        <><Zap className="mr-2 h-5 w-5 animate-pulse text-yellow-300" /> AI Analyzing Telemetry...</>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Transmitting...
                                        </div>
                                    )
                                ) : (
                                    <><Send className="mr-2 h-5 w-5" /> Initialize Ticket</>
                                )}
                            </Button>
                        </div>
                    </div>
                </form>
            </main>
        </div>
    );
}