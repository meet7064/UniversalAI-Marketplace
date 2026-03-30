"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Cpu, ShoppingCart, Zap, Tag, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/store/useStore";
import { useRouter } from "next/navigation";

export default function DirectStorefrontPage() {
    const [featuredFleet, setFeaturedFleet] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    // Pull the addToCart function from Zustand so they can buy directly from the homepage!
    const addToCart = useStore((state) => state.addToCart);
    const isAuthenticated = useStore((state) => state.isAuthenticated);

    // Fetch the top 6 live robots
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
            return; // Stop the function here
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
        <div className="flex flex-col min-h-screen bg-[#09090b] text-zinc-100">
            
            {/* --- TOP ADVERTISEMENT BANNER --- */}
            <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 border-b border-blue-700/50">
                <div className="max-w-7xl mx-auto px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
                            <Tag size={16} className="text-white" />
                        </div>
                        <div>
                            <p className="font-bold text-white text-sm sm:text-base">Q1 Automation Drive Special</p>
                            <p className="text-blue-200 text-xs sm:text-sm">0% APR on all 6-Axis Collaborative Leases this month.</p>
                        </div>
                    </div>
                    <Link href="/shop">
                        <Button size="sm" className="bg-white text-blue-900 hover:bg-zinc-200 font-bold whitespace-nowrap">
                            Claim Offer <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            </div>

            {/* --- MAIN CONTENT AREA --- */}
            <main className="max-w-7xl mx-auto px-6 py-8 w-full">
                
                {/* HEADER ROW */}
                <div className="flex items-end justify-between mb-8 pb-4 border-b border-zinc-800/60">
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tight mb-1">Featured Hardware</h2>
                        <p className="text-sm text-zinc-500">Live inventory from our global fulfillment centers.</p>
                    </div>
                    <Link href="/shop" className="hidden sm:flex items-center text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors">
                        View Full Catalog <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                </div>

                {/* LOADING STATE */}
                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-24 text-zinc-500">
                        <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="font-medium">Loading live inventory...</p>
                    </div>
                )}

                {/* PRODUCT GRID (Reused from Shop for consistency) */}
                {!isLoading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                        {featuredFleet.map((robot) => (
                            <div key={robot.id} className="bg-zinc-950 border border-zinc-800/60 rounded-xl overflow-hidden hover:border-zinc-700 transition-all group flex flex-col">
                                
                                {/* Image Area */}
                                <div className="relative h-56 bg-zinc-900 flex items-center justify-center border-b border-zinc-800/60 overflow-hidden">
                                    {robot.image_url ? (
                                        <img src={`http://127.0.0.1:8000${robot.image_url}`} alt={robot.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <Cpu size={48} className="text-zinc-800" />
                                    )}
                                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                                        <Badge variant="secondary" className="bg-zinc-950/80 text-zinc-100 backdrop-blur-md border-zinc-700/80 font-semibold shadow-sm">
                                            {robot.brand || "Brand"}
                                        </Badge>
                                    </div>
                                    <div className="absolute top-3 right-3">
                                        <Badge className="bg-white text-black font-bold shadow-md">
                                            {robot.category === "Rent" ? "For Rent" : "For Sale"}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Content Area */}
                                <div className="p-5 flex-1 flex flex-col">
                                    <h3 className="text-xl font-bold text-zinc-100 mb-1 truncate">{robot.name || "Unknown Model"}</h3>
                                    
                                    <div className="flex items-center gap-4 text-xs text-zinc-500 mb-4">
                                        <span className="flex items-center gap-1"><ShieldCheck size={14} className="text-emerald-500" /> Certified</span>
                                        <span>•</span>
                                        <span>Payload: {robot.payload || 0}kg</span>
                                    </div>
                                    {/* NEW: Dynamic Key Features Preview */}
                                    {robot.key_features && robot.key_features.length > 0 ? (
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {robot.key_features.slice(0, 2).map((feature: any, idx: number) => (
                                                <div key={idx} className="bg-zinc-900 border border-zinc-800/60 rounded flex items-center gap-1 px-1.5 py-0.5 max-w-full">
                                                    <span className="text-zinc-200 text-[11px] font-bold truncate">{feature.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="mb-4"></div> /* Spacer */
                                    )}

                                    {/* Price & Actions */}
                                    <div className="mt-auto flex items-end justify-between mb-4">
                                        <div>
                                            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-0.5">
                                                {robot.category === "Rent" ? "Monthly" : "Price"}
                                            </p>
                                            <p className="text-2xl font-black text-white tracking-tight">
                                                ${Number(robot.price).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <Button variant="outline" className="w-full bg-zinc-900 border-zinc-700 hover:bg-zinc-800 text-xs h-9" onClick={() => handleAddToCart(robot)}>
                                            <ShoppingCart className="mr-2 h-3 w-3" /> Add to Cart
                                        </Button>
                                        <Link href={`/asset/${robot.id}`}>
                                            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs h-9">
                                                Details
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* --- MID-PAGE ADVERTISEMENT (Trade-In) --- */}
                <div className="relative rounded-2xl overflow-hidden border border-zinc-800/60 bg-zinc-950 mt-4 mb-12">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-900/40 to-blue-900/20 z-0"></div>
                    <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="max-w-xl text-center md:text-left">
                            <Badge className="bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 mb-4 border border-purple-500/30">
                                <Zap size={14} className="mr-1.5 inline" /> AI Diagnostic Tool
                            </Badge>
                            <h3 className="text-3xl font-black text-white mb-3 tracking-tight">Got old hardware gathering dust?</h3>
                            <p className="text-zinc-400 text-lg">
                                Upload your robot's controller log files. Our AI will appraise its health and generate an instant, guaranteed cash or trade-in offer within seconds.
                            </p>
                        </div>
                        <div className="shrink-0 w-full md:w-auto">
                            <Link href="/trade-in">
                                <Button className="w-full md:w-auto h-14 px-8 bg-white text-black hover:bg-zinc-200 font-bold text-lg rounded-xl shadow-xl shadow-purple-900/20">
                                    Appraise My Robot Now
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
}