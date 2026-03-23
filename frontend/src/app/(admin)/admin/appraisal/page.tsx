"use client";

import { useState, useEffect } from "react";
import { 
    Activity, Cpu, Clock, AlertTriangle, CheckCircle2, Terminal, ArrowRight, RotateCcw, Bot
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AppraisalEnginePage() {
    const [status, setStatus] = useState<"IDLE" | "SCANNING" | "COMPLETE">("IDLE");
    
    // NEW: State to hold your live database robots
    const [fleet, setFleet] = useState<any[]>([]);
    const [selectedAssetId, setSelectedAssetId] = useState<string>("custom");

    const [formData, setFormData] = useState({
        brand: "",
        model: "",
        original_price: "",
        operating_hours: "",
        condition: "Good"
    });

    // Appraisal Results State
    const [result, setResult] = useState<any>(null);
    const [visibleLogs, setVisibleLogs] = useState<string[]>([]);
    const [isTransferring, setIsTransferring] = useState(false);
    const [transferComplete, setTransferComplete] = useState(false);

    // 1. Fetch your live Fleet data when the page loads
    useEffect(() => {
        const fetchFleet = async () => {
            try {
                const response = await fetch("http://127.0.0.1:8000/api/admin/fleet");
                if (response.ok) {
                    const data = await response.json();
                    setFleet(data);
                }
            } catch (error) {
                console.error("Failed to fetch fleet for appraisal:", error);
            }
        };
        fetchFleet();
    }, []);

    // 2. Auto-fill the form when you select a real robot from the dropdown
    const handleAssetSelect = (assetId: string) => {
        setSelectedAssetId(assetId);
        
        if (assetId !== "custom") {
            const robot = fleet.find(r => r.id === assetId);
            if (robot) {
                setFormData({
                    brand: robot.brand || "",
                    model: robot.name || "",
                    original_price: robot.price?.toString() || "0",
                    operating_hours: robot.hours?.toString() || "0",
                    condition: robot.condition || "Good"
                });
            }
        } else {
            // Clear it if they want to run a custom diagnostic
            setFormData({ brand: "", model: "", original_price: "", operating_hours: "", condition: "Good" });
        }
    };

    const runDiagnostics = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("SCANNING");
        setVisibleLogs([]);
        setResult(null);

        try {
            const response = await fetch("http://127.0.0.1:8000/api/appraisal/run", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    brand: formData.brand,
                    model: formData.model,
                    original_price: parseFloat(formData.original_price),
                    operating_hours: parseInt(formData.operating_hours),
                    condition: formData.condition
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setResult(data);
                streamLogs(data.diagnostic_logs);
            } else {
                setStatus("IDLE");
                alert("Diagnostics failed to connect. Check your FastAPI server.");
            }
        } catch (error) {
            console.error(error);
            setStatus("IDLE");
        }
    };

    // Creates the hacker terminal effect
    const streamLogs = (logs: string[]) => {
        let currentIndex = 0;
        const interval = setInterval(() => {
            if (currentIndex < logs.length) {
                setVisibleLogs(prev => {
                    // Prevent duplicate logs from React strict mode double-firing
                    if (!prev.includes(logs[currentIndex])) {
                        return [...prev, logs[currentIndex]];
                    }
                    return prev;
                });
                currentIndex++;
            } else {
                clearInterval(interval);
                setTimeout(() => setStatus("COMPLETE"), 800);
            }
        }, 600);
    };

    const resetEngine = () => {
        setStatus("IDLE");
        setResult(null);
        setVisibleLogs([]);
    };

    const handleInitiateTransfer = async () => {
        setIsTransferring(true);
        try {
            // If they didn't select a live database robot, use a placeholder ID
            const actualAssetId = selectedAssetId !== "custom" ? selectedAssetId : "CUSTOM-APPRAISAL";

            const payload = {
                asset_id: actualAssetId,
                asset_name: `${formData.brand} ${formData.model}`,
                issue: `Buy-Back Initiated. Agreed Value: $${result.estimated_value.toLocaleString()}`,
                priority: "High",
                reported_by: "Appraisal Engine" // Shows up as the user in the Kanban board!
            };

            const response = await fetch("http://127.0.0.1:8000/api/service/tickets/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                setTransferComplete(true);
            } else {
                alert("Failed to send transfer to Operations.");
            }
        } catch (error) {
            console.error("Transfer error:", error);
        } finally {
            setIsTransferring(false);
        }
    };

    return (
        <div className="space-y-6 pb-12 max-w-5xl mx-auto h-full flex flex-col">
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight text-zinc-100 flex items-center gap-2">
                        <Cpu className="text-blue-500" /> AI Appraisal Engine
                    </h2>
                    <p className="text-zinc-400 text-sm mt-1">Run diagnostic telemetry to determine fleet buy-back valuations.</p>
                </div>
                {status === "COMPLETE" && (
                    <Button onClick={resetEngine} variant="outline" className="bg-zinc-900 border-zinc-800 text-zinc-300">
                        <RotateCcw className="mr-2 h-4 w-4" /> Appraise Another Asset
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* LEFT SIDE: INPUT FORM */}
                <div className={`bg-zinc-950 border border-zinc-800/60 p-6 rounded-2xl shadow-sm transition-opacity duration-500 ${status !== "IDLE" ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
                    <h3 className="text-lg font-bold text-zinc-100 mb-6 flex items-center gap-2">
                        <Terminal size={18} className="text-zinc-500" /> Asset Parameters
                    </h3>
                    
                    <form onSubmit={runDiagnostics} className="space-y-5">
                        
                        {/* NEW: LIVE DATABASE DROPDOWN */}
                        <div className="space-y-2 pb-4 border-b border-zinc-800/60">
                            <Label className="text-emerald-400 flex items-center gap-2">
                                <Bot size={14} /> Link to Live Database Asset
                            </Label>
                            <Select value={selectedAssetId} onValueChange={handleAssetSelect}>
                                <SelectTrigger className="bg-emerald-500/5 border-emerald-500/20 text-emerald-100 focus:ring-emerald-500">
                                    <SelectValue placeholder="Select from fleet..." />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                                    <SelectItem value="custom" className="text-zinc-400 italic">-- Run Custom Appraisal --</SelectItem>
                                    {fleet.map((robot) => (
                                        <SelectItem key={robot.id} value={robot.id}>
                                            {robot.name} ({robot.brand}) - {robot.id.slice(-6).toUpperCase()}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-zinc-300">Manufacturer</Label>
                                <Input required value={formData.brand} onChange={(e) => setFormData({...formData, brand: e.target.value})} className="bg-zinc-900 border-zinc-800" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-zinc-300">Model Name</Label>
                                <Input required value={formData.model} onChange={(e) => setFormData({...formData, model: e.target.value})} className="bg-zinc-900 border-zinc-800" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-zinc-300">Original MSRP ($)</Label>
                                <Input type="number" required value={formData.original_price} onChange={(e) => setFormData({...formData, original_price: e.target.value})} className="bg-zinc-900 border-zinc-800" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-zinc-300">Operating Hours</Label>
                                <Input type="number" required value={formData.operating_hours} onChange={(e) => setFormData({...formData, operating_hours: e.target.value})} className="bg-zinc-900 border-zinc-800" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-zinc-300">Physical Condition</Label>
                            <Select value={formData.condition} onValueChange={(val) => setFormData({...formData, condition: val})}>
                                <SelectTrigger className="bg-zinc-900 border-zinc-800"><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                                    <SelectItem value="Excellent">Excellent (Minor cosmetic wear)</SelectItem>
                                    <SelectItem value="Good">Good (Standard factory wear)</SelectItem>
                                    <SelectItem value="Fair">Fair (Heavy wear, fully functional)</SelectItem>
                                    <SelectItem value="Needs Repair">Needs Repair (Faulty kinematics/servos)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg shadow-blue-900/20 mt-4 h-12">
                            <Activity className="mr-2 h-5 w-5" /> Execute AI Diagnostics
                        </Button>
                    </form>
                </div>

                {/* RIGHT SIDE: TERMINAL & RESULTS */}
                <div className="flex flex-col gap-6">
                    
                    {/* The Diagnostic Terminal */}
                    {(status === "SCANNING" || status === "COMPLETE") && (
                        <div className="bg-[#09090b] border border-zinc-800 rounded-2xl p-6 shadow-inner font-mono text-sm h-[320px] overflow-y-auto flex flex-col">
                            <div className="flex items-center gap-2 text-zinc-500 mb-4 border-b border-zinc-800/60 pb-2 shrink-0">
                                <Activity className="animate-pulse text-blue-500" size={16} /> 
                                <span>SYSTEM DIAGNOSTICS ACTIVE</span>
                            </div>
                            
                            <div className="space-y-2 flex-1">
                                {visibleLogs.map((log, idx) => (
                                    <div key={idx} className="text-emerald-400/90 animate-in fade-in slide-in-from-bottom-2">
                                        <span className="text-zinc-600 mr-2">{`>`}</span> {log}
                                    </div>
                                ))}
                                {status === "SCANNING" && (
                                    <div className="text-zinc-500 animate-pulse mt-2">
                                        <span className="text-zinc-600 mr-2">{`>`}</span> Processing telemetry...
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* The Final Financial Offer */}
                    {status === "COMPLETE" && result && (
                        <div className="bg-zinc-950 border border-emerald-500/30 p-6 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.05)] animate-in zoom-in-95 duration-500">
                            
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-zinc-400 text-sm font-bold tracking-wider uppercase mb-1">Generated Buy-Back Offer</h3>
                                    <div className="text-4xl font-black text-emerald-400 flex items-center">
                                        ${result.estimated_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                </div>
                                
                                <div className="text-right">
                                    <div className={`text-3xl font-bold ${result.ai_health_score > 80 ? "text-blue-400" : result.ai_health_score > 60 ? "text-amber-400" : "text-red-400"}`}>
                                        {result.ai_health_score}%
                                    </div>
                                    <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">AI Health Score</div>
                                </div>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-zinc-800/60">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-zinc-400 flex items-center gap-2"><Clock size={14}/> Wear & Tear Deduction</span>
                                    <span className="text-red-400 font-mono">-${result.deductions.wear_and_tear_loss.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-zinc-400 flex items-center gap-2"><AlertTriangle size={14}/> Condition Penalty</span>
                                    <span className="text-red-400 font-mono">{result.deductions.condition_penalty_pct}% Loss</span>
                                </div>
                                <div className="flex justify-between items-center text-sm pt-2">
                                    <span className="text-zinc-100 font-medium flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500"/> Diagnostics Verification</span>
                                    <span className="text-emerald-500 font-mono">PASSED</span>
                                </div>
                            </div>

                            {/* WIRED UP BUTTON */}
                            <Button 
                                onClick={handleInitiateTransfer}
                                disabled={isTransferring || transferComplete}
                                className={`w-full font-medium mt-6 h-12 transition-all duration-300 ${transferComplete ? "bg-zinc-900 border border-emerald-500/30 text-emerald-400 hover:bg-zinc-900" : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20"}`}
                            >
                                {isTransferring ? (
                                    <><div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" /> Processing Transfer...</>
                                ) : transferComplete ? (
                                    <><CheckCircle2 className="mr-2 h-5 w-5" /> Transfer Sent to Service Queue</>
                                ) : (
                                    <>Initiate Asset Transfer <ArrowRight className="ml-2 h-4 w-4" /></>
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}