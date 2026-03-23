"use client";

import { useState, useEffect } from "react";
import { 
    Settings, User, Bell, Key, Shield, Save, Loader2, ServerCrash, Badge
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SystemSettingsPage() {
    const [activeTab, setActiveTab] = useState("profile");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    const [formData, setFormData] = useState({
        admin_name: "",
        admin_email: "",
        notifications_enabled: true,
        maintenance_mode: false,
        openai_api_key: ""
    });

    // Fetch existing settings on load
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch("http://127.0.0.1:8000/api/settings/");
                if (res.ok) {
                    const data = await res.json();
                    setFormData(data);
                }
            } catch (error) {
                console.error("Failed to load settings:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch("http://127.0.0.1:8000/api/settings/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });
            if (!res.ok) throw new Error("Failed to save");
            
            // Optional: Show a quick success toast here!
            alert("Settings saved successfully!");
        } catch (error) {
            console.error(error);
            alert("Error saving settings.");
        } finally {
            setIsSaving(false);
        }
    };

    // Helper for the simulated toggle switches
    const toggleSwitch = (key: keyof typeof formData) => {
        setFormData({ ...formData, [key]: !formData[key] });
    };

    if (isLoading) {
        return <div className="h-full flex items-center justify-center text-zinc-500"><Loader2 className="animate-spin h-8 w-8" /></div>;
    }

    return (
        <div className="space-y-6 pb-12 max-w-6xl mx-auto h-full flex flex-col">
            
            {/* Page Header */}
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
                    <Settings className="text-blue-500" />
                    System Settings
                </h2>
                <p className="text-zinc-400 mt-1">Manage your platform configuration, API integrations, and security.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-8 flex-1">
                
                {/* LEFT SIDEBAR NAVIGATION */}
                <div className="w-full md:w-64 shrink-0 space-y-1">
                    <button 
                        onClick={() => setActiveTab("profile")}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === "profile" ? "bg-blue-600/10 text-blue-400" : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"}`}
                    >
                        <User size={18} /> Admin Profile
                    </button>
                    <button 
                        onClick={() => setActiveTab("preferences")}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === "preferences" ? "bg-blue-600/10 text-blue-400" : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"}`}
                    >
                        <Bell size={18} /> Platform Preferences
                    </button>
                    <button 
                        onClick={() => setActiveTab("integrations")}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === "integrations" ? "bg-blue-600/10 text-blue-400" : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"}`}
                    >
                        <Key size={18} /> API Integrations
                    </button>
                    <button 
                        onClick={() => setActiveTab("security")}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === "security" ? "bg-blue-600/10 text-blue-400" : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"}`}
                    >
                        <Shield size={18} /> Security & Access
                    </button>
                </div>

                {/* RIGHT CONTENT AREA */}
                <div className="flex-1 bg-zinc-950 border border-zinc-800/60 rounded-2xl shadow-sm p-6 lg:p-8">
                    
                    {/* TAB 1: PROFILE */}
                    {activeTab === "profile" && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div>
                                <h3 className="text-lg font-bold text-zinc-100">Admin Profile</h3>
                                <p className="text-sm text-zinc-500">Update your primary account details.</p>
                            </div>
                            <div className="space-y-4 max-w-md">
                                <div className="space-y-2">
                                    <Label className="text-zinc-300">Display Name</Label>
                                    <Input 
                                        value={formData.admin_name} 
                                        onChange={(e) => setFormData({...formData, admin_name: e.target.value})} 
                                        className="bg-zinc-900 border-zinc-800 focus-visible:ring-blue-500" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-zinc-300">Email Address</Label>
                                    <Input 
                                        type="email"
                                        value={formData.admin_email} 
                                        onChange={(e) => setFormData({...formData, admin_email: e.target.value})} 
                                        className="bg-zinc-900 border-zinc-800 focus-visible:ring-blue-500" 
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: PLATFORM PREFERENCES */}
                    {activeTab === "preferences" && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div>
                                <h3 className="text-lg font-bold text-zinc-100">Platform Preferences</h3>
                                <p className="text-sm text-zinc-500">Control global settings for the V_Shop ecosystem.</p>
                            </div>
                            
                            <div className="space-y-6 max-w-xl pt-4">
                                {/* Simulated Toggle Switch 1 */}
                                <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
                                    <div>
                                        <h4 className="text-zinc-200 font-medium">System Notifications</h4>
                                        <p className="text-xs text-zinc-500 mt-0.5">Receive alerts when new service tickets are created.</p>
                                    </div>
                                    <button 
                                        onClick={() => toggleSwitch("notifications_enabled")}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.notifications_enabled ? 'bg-blue-600' : 'bg-zinc-700'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.notifications_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>

                                {/* Simulated Toggle Switch 2 (Danger Zone) */}
                                <div className="flex items-center justify-between p-4 bg-red-500/5 rounded-xl border border-red-500/20">
                                    <div>
                                        <h4 className="text-red-400 font-medium flex items-center gap-2">
                                            <ServerCrash size={16} /> Maintenance Mode
                                        </h4>
                                        <p className="text-xs text-zinc-500 mt-0.5">Lock down the public storefront. Only admins can log in.</p>
                                    </div>
                                    <button 
                                        onClick={() => toggleSwitch("maintenance_mode")}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.maintenance_mode ? 'bg-red-500' : 'bg-zinc-700'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.maintenance_mode ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: INTEGRATIONS */}
                    {activeTab === "integrations" && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div>
                                <h3 className="text-lg font-bold text-zinc-100">API Integrations</h3>
                                <p className="text-sm text-zinc-500">Connect your platform to external services.</p>
                            </div>
                            <div className="space-y-4 max-w-xl">
                                <div className="space-y-2">
                                    <Label className="text-zinc-300 flex items-center gap-2">
                                        OpenAI API Key <Badge className="text-[10px] bg-zinc-900 border border-zinc-700">For Appraisal Engine</Badge>
                                    </Label>
                                    <Input 
                                        type="password"
                                        placeholder="sk-..."
                                        value={formData.openai_api_key} 
                                        onChange={(e) => setFormData({...formData, openai_api_key: e.target.value})} 
                                        className="bg-zinc-900 border-zinc-800 font-mono focus-visible:ring-blue-500" 
                                    />
                                    <p className="text-xs text-zinc-500 mt-1">Leave blank to use the local simulated diagnostic engine.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Security Tab placeholder */}
                    {activeTab === "security" && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div>
                                <h3 className="text-lg font-bold text-zinc-100">Security</h3>
                                <p className="text-sm text-zinc-500">Security features will be available after configuring User Authentication.</p>
                            </div>
                        </div>
                    )}

                    {/* Universal Save Button */}
                    <div className="pt-8 mt-8 border-t border-zinc-800/60 flex justify-end">
                        <Button 
                            onClick={handleSave} 
                            disabled={isSaving}
                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-900/20 px-8"
                        >
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            {isSaving ? "Saving..." : "Save All Changes"}
                        </Button>
                    </div>

                </div>
            </div>
        </div>
    );
}