"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Cpu, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/store/useStore"; // Your new global brain

export default function AuthPage() {
    const router = useRouter();
    const login = useStore((state) => state.login); // Extract the login action

    const [isLoginView, setIsLoginView] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    
    const [formData, setFormData] = useState({ 
        name: "", 
        username: "", 
        email: "", 
        password: "" 
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        const endpoint = isLoginView ? "/api/user/customer_auth/login" : "/api/user/customer_auth/register";
        
        try {
            const response = await fetch(`http://127.0.0.1:8000${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || "Authentication failed");
            }

            if (isLoginView) {
                // Decode the JWT slightly just to grab the name/username if needed, 
                // OR rely on what you know from the login payload.
                // Since your TokenResponse returns the token and role, we pass that to Zustand.
                
                login({
                    name: "User", // You can decode the JWT here to get the real name, or update backend to return it
                    username: formData.email.split("@")[0], 
                    email: formData.email,
                    role: data.role,
                    token: data.access_token
                });
                document.cookie = `universalAI_marketplace_token=${data.access_token}; path=/; max-age=604800; SameSite=Lax`;
                router.push("/"); // Send them to the marketplace
            } else {
                // Successful registration
                setIsLoginView(true);
                setFormData({ ...formData, password: "" }); // Clear password for safety
                alert("Account created! Please sign in.");
            }
        } catch (err: any) {
            setError(err.message); 
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-6 text-zinc-100 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="w-full max-w-md bg-zinc-950/80 backdrop-blur-xl border border-zinc-800/60 p-8 rounded-2xl shadow-2xl relative z-10">
                <div className="flex justify-center mb-8">
                    <div className="h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/50">
                        <Cpu className="text-white" size={24} />
                    </div>
                </div>
                
                <h2 className="text-2xl font-bold text-center mb-2">
                    {isLoginView ? "Welcome back to V_Shop" : "Join the Robotics Economy"}
                </h2>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm mb-6 text-center mt-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 mt-6">
                    {!isLoginView && (
                        <>
                            <div className="space-y-2">
                                <Label className="text-zinc-300">Full Name</Label>
                                <Input required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="bg-zinc-900 border-zinc-800 focus-visible:ring-blue-500" placeholder="Meet Panchal" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-zinc-300">Username</Label>
                                <Input required value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} className="bg-zinc-900 border-zinc-800 focus-visible:ring-blue-500" placeholder="robotics_expert" />
                            </div>
                        </>
                    )}
                    
                    <div className="space-y-2">
                        <Label className="text-zinc-300">Email Address</Label>
                        <Input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="bg-zinc-900 border-zinc-800 focus-visible:ring-blue-500" placeholder="engineer@company.com" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-zinc-300">Password</Label>
                        <Input required type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="bg-zinc-900 border-zinc-800 focus-visible:ring-blue-500" placeholder="••••••••" />
                    </div>

                    <Button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 mt-4">
                        {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : (isLoginView ? "Sign In" : "Create Account")}
                        {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
                    </Button>
                </form>

                <div className="mt-6 pt-6 border-t border-zinc-800/60 text-center">
                    <p className="text-sm text-zinc-500">
                        {isLoginView ? "New to V_Shop? " : "Already have an account? "}
                        <button type="button" onClick={() => { setIsLoginView(!isLoginView); setError(""); }} className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
                            {isLoginView ? "Create an account" : "Log in here"}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}