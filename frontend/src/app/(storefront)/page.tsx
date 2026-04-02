"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Cpu, ShoppingCart, ShieldCheck, PlayCircle, Layers, Zap, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/store/useStore";
import { useRouter } from "next/navigation";

export default function DirectStorefrontPage() {
    const [featuredFleet, setFeaturedFleet] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const addToCart = useStore((state) => state.addToCart);
    const isAuthenticated = useStore((state) => state.isAuthenticated);

    useEffect(() => {
        const fetchFeatured = async () => {
            try {
                const response = await fetch("http://127.0.0.1:8000/api/public/catalog?limit=6");
                if (response.ok) {
                    const data = await response.json();
                    setFeaturedFleet(data);
                }
            } catch (error) {
                console.error("Failed to load featured robots", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchFeatured();
    }, []);

    const handleAddToCart = (robot: any) => {
        if (!isAuthenticated) {
            alert("Please log in or create an account to purchase hardware.");
            router.push("/auth");
            return;
        }
        addToCart({
            id: robot.id,
            name: robot.name,
            price: Number(robot.price),
            category: robot.category,
            image_url: robot.image_url
        });
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#050505] text-zinc-100 selection:bg-yellow-500/30">
            
            {/* --- HERO SECTION --- */}
            {/* Changed from h-[90vh] to min-h-screen to ensure content fits on mobile */}
            <header className="relative w-full min-h-screen flex flex-col items-center overflow-hidden border-b border-zinc-900">
                
                {/* Background Layer */}
                <div className="absolute inset-0 z-0">
                    <img 
                        src="https://images.unsplash.com/photo-1546776310-eef45dd6d63c?auto=format&fit=crop&q=80&w=2000" 
                        className="w-full h-full object-cover opacity-20 grayscale brightness-50"
                        alt="Hero background"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-black/60" />
                </div>

                {/* Hero Text Content */}
                <div className="relative z-10 max-w-5xl px-6 text-center pt-32 pb-20">
                    <Badge variant="outline" className="mb-8 border-yellow-500/50 text-yellow-500 rounded-full px-4 py-1.5 bg-yellow-500/5 backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-700">
                        Official North American Unitree Partner
                    </Badge>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8 leading-[1.1] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                        Delivering Humanoids & <br/>
                        <span className="text-zinc-500">Quadrupeds for Industry</span>
                    </h1>
                    <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed font-light animate-in fade-in duration-1000 delay-300">
                        Unitree humanoid and quadruped robots for education, research, and industry. 
                        Official U.S. distribution with domestic technical support.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-24">
                        <Button className="rounded-full bg-zinc-100 text-black hover:bg-white px-10 h-14 font-bold text-lg transition-transform hover:scale-105 active:scale-95">
                            Discover the Lineup
                        </Button>
                        <Button variant="outline" className="rounded-full border-zinc-700 hover:bg-zinc-800/50 px-10 h-14 font-bold text-lg backdrop-blur-sm">
                            Speak to an expert <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </div>

                    {/* --- CATEGORY CARDS (Now part of normal flow to prevent overlap) --- */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-6xl mx-auto w-full px-2">
                        {[
                            { name: "Humanoids", icon: <Layers size={16}/> },
                            { name: "Quadrupeds", icon: <Zap size={16}/> },
                            { name: "Arms & Manipulators", icon: <Cpu size={16}/> },
                            { name: "Accessories", icon: <Shield size={16}/> }
                        ].map((cat, i) => (
                            <div key={i} className="group relative aspect-[3/4] bg-zinc-900/40 backdrop-blur-xl border border-zinc-800 rounded-2xl p-1 transition-all hover:border-yellow-500/60 overflow-hidden">
                                <div className="w-full h-full rounded-xl overflow-hidden relative">
                                    <img src={`https://images.unsplash.com/photo-1531746790731-6c087fecd05a?w=400&sig=${i}`} className="w-full h-full object-cover grayscale opacity-40 group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700" alt={cat.name} />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                                        <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-300">{cat.name}</span>
                                        <ArrowRight size={14} className="text-zinc-600 group-hover:text-yellow-500 transition-colors" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </header>

            {/* --- PRODUCT GRID SECTION --- */}
            <main className="max-w-7xl mx-auto px-6 py-24 w-full">
                
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6 border-b border-zinc-900 pb-8">
                    <div>
                        <div className="h-1 w-12 bg-yellow-500 mb-4" />
                        <h2 className="text-4xl font-black text-white tracking-tighter">Live Inventory</h2>
                        <p className="text-zinc-500 mt-2">Systems ready for immediate North American dispatch.</p>
                    </div>
                    <Link href="/shop" className="group flex items-center text-sm font-bold text-yellow-500">
                        Explore Full Catalog <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-2 transition-transform" />
                    </Link>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center py-32">
                        <div className="h-12 w-12 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="text-zinc-600 font-mono text-xs tracking-widest">SYNCING DATABASE...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {featuredFleet.map((robot) => (
                            <div key={robot.id} className="flex flex-col bg-[#0c0c0c] border border-zinc-900 rounded-[2rem] overflow-hidden hover:border-zinc-700 transition-all group">
                                {/* Image Box */}
                                <div className="relative h-64 bg-zinc-950 flex items-center justify-center overflow-hidden">
                                    {robot.image_url ? (
                                        <img 
                                            src={`http://127.0.0.1:8000${robot.image_url}`} 
                                            alt={robot.name} 
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100" 
                                        />
                                    ) : (
                                        <Cpu size={60} className="text-zinc-800" />
                                    )}
                                    <Badge className="absolute top-6 right-6 bg-white text-black font-black text-[10px] px-3 py-1">
                                        {robot.category === "Rent" ? "RENTAL" : "UNIT AVAILABLE"}
                                    </Badge>
                                </div>

                                {/* Content Box */}
                                <div className="p-8 flex-1 flex flex-col">
                                    <h3 className="text-2xl font-bold text-white mb-2 leading-tight">{robot.name || "Enterprise System"}</h3>
                                    <div className="flex items-center gap-4 text-[11px] font-bold text-zinc-500 mb-8 uppercase tracking-wider">
                                        <span className="flex items-center gap-1.5 text-emerald-500">
                                            <ShieldCheck size={14} /> Certified
                                        </span>
                                        <span>•</span>
                                        <span>Payload {robot.payload || 0}kg</span>
                                    </div>

                                    <div className="mt-auto pt-6 border-t border-zinc-900 flex items-center justify-between">
                                        <div>
                                            <span className="text-[10px] text-zinc-600 uppercase font-black block mb-1">MSRP Starting at</span>
                                            <span className="text-3xl font-black text-white tracking-tighter">${Number(robot.price).toLocaleString()}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button 
                                                variant="outline" 
                                                className="w-12 h-12 rounded-full border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 p-0" 
                                                onClick={() => handleAddToCart(robot)}
                                            >
                                                <ShoppingCart size={18} />
                                            </Button>
                                            <Link href={`/asset/${robot.id}`}>
                                                <Button className="h-12 rounded-full bg-zinc-100 text-black hover:bg-white px-6 font-bold text-sm">
                                                    Specs
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* --- WHY ROBOSTORE (No-Overlap Design) --- */}
            <section className="max-w-7xl mx-auto px-6 mb-32">
                <div className="relative rounded-[3rem] bg-gradient-to-br from-[#0c0c0c] to-[#050505] border border-zinc-900 p-10 md:p-20 overflow-hidden flex flex-col md:flex-row items-center gap-12">
                    <div className="relative z-10 flex-1">
                        <h2 className="text-4xl md:text-6xl font-black text-white mb-8 leading-tight">
                            Why Robostore?
                        </h2>
                        <p className="text-zinc-400 text-lg leading-relaxed mb-10 max-w-xl">
                            We are the official North American partner of Unitree Robotics. 
                            From academic research to industrial automation, we provide the 
                            hardware, software integration, and domestic support you need.
                        </p>
                        <Button className="rounded-full bg-yellow-500 text-black hover:bg-yellow-400 h-14 px-10 font-bold text-lg transition-transform hover:scale-105">
                            Speak to an expert
                        </Button>
                    </div>
                    <div className="flex-1 w-full relative">
                         <div className="aspect-video rounded-2xl overflow-hidden border border-zinc-800 relative group">
                            <img 
                                src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800" 
                                className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                                alt="Demo video" 
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:scale-110 transition-transform">
                                    <PlayCircle size={40} className="text-white" />
                                </div>
                            </div>
                         </div>
                    </div>
                </div>
            </section>
        </div>
    );
}