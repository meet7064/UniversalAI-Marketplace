"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
    Search, Filter, Cpu, ArrowRight, ShoppingCart, Zap, ShieldCheck 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/store/useStore"; // The Global Brain!
import { useRouter } from "next/navigation";

export default function MarketplacePage() {
    const [fleet, setFleet] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState("All");
    const router = useRouter();
    // Pull the addToCart function from Zustand
    const addToCart = useStore((state) => state.addToCart);
    const isAuthenticated = useStore((state) => state.isAuthenticated);
    

    // Fetch the live inventory from your new public catalog API
    useEffect(() => {
        const fetchPublicFleet = async () => {
            try {
                const response = await fetch("http://127.0.0.1:8000/api/public/catalog");
                if (response.ok) {
                    const data = await response.json();
                    setFleet(data);
                }
            } catch (error) {
                console.error("Failed to load storefront:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPublicFleet();
    }, []);

    // Safe Filter logic
    const filteredFleet = fleet.filter(robot => {
        const safeName = robot.name || "";
        const safeBrand = robot.brand || "";
        
        const matchesSearch = safeName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              safeBrand.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesCategory = activeCategory === "All" || robot.category === activeCategory;
        
        return matchesSearch && matchesCategory;
    });

    // Handler for adding to cart
    const handleAddToCart = (robot: any) => {

        // THE GATEKEEPER: If they aren't logged in, send them to the Auth page!
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
        
        // Optional: You could add a toast notification here!
        // alert(`${robot.name} added to cart!`);
    };

    return (
        <div className="flex-1 bg-[#09090b] text-zinc-100">
            
            {/* HEADER */}
            <div className="bg-zinc-950 border-b border-zinc-800/60 py-12">
                <div className="max-w-7xl mx-auto px-6">
                    <h1 className="text-4xl font-bold tracking-tight text-white mb-4">Hardware Marketplace</h1>
                    <p className="text-zinc-400 max-w-2xl text-lg">
                        Browse our certified fleet of collaborative and industrial robots. Available for purchase or monthly leasing.
                    </p>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-6 py-12">
                
                {/* TOOLBAR (Search & Filters) */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 pb-6 border-b border-zinc-800/60">
                    <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                        {["All", "Buy", "Rent"].map(cat => (
                            <button 
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-colors shrink-0 ${activeCategory === cat ? "bg-white text-black shadow-md" : "bg-zinc-900 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 border border-zinc-800"}`}
                            >
                                {cat === "All" ? "All Hardware" : cat === "Buy" ? "For Sale" : "For Rent"}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="relative flex-1 md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                            <Input 
                                placeholder="Search models or brands..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 bg-zinc-900 border-zinc-800 focus-visible:ring-blue-500 text-zinc-100 rounded-full h-11"
                            />
                        </div>
                        <Button variant="outline" className="bg-zinc-900 border-zinc-800 text-zinc-300 rounded-full h-11 px-6 shrink-0">
                            <Filter className="mr-2 h-4 w-4" /> Filters
                        </Button>
                    </div>
                </div>

                {/* LOADING STATE */}
                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-24 text-zinc-500">
                        <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="font-medium">Syncing global inventory...</p>
                    </div>
                )}

                {/* ROBOT GRID */}
                {!isLoading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredFleet.map((robot) => (
                            <div key={robot.id} className="bg-zinc-950 border border-zinc-800/60 rounded-2xl overflow-hidden hover:border-zinc-700 transition-all hover:shadow-[0_0_30px_rgba(59,130,246,0.05)] group flex flex-col">
                                
                                {/* Image Area */}
                                <div className="relative h-64 bg-zinc-900 flex items-center justify-center border-b border-zinc-800/60 overflow-hidden">
                                    {robot.image_url ? (
                                        <img src={`http://127.0.0.1:8000${robot.image_url}`} alt={robot.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                    ) : (
                                        <Cpu size={64} className="text-zinc-800" />
                                    )}
                                    
                                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                                        <Badge variant="secondary" className="bg-zinc-950/80 text-zinc-100 backdrop-blur-md border-zinc-700/80 px-3 py-1 font-semibold">
                                            {robot.brand || "Brand"}
                                        </Badge>
                                        <Badge variant="outline" className={`${robot.condition === "New" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20"} backdrop-blur-md px-3 py-1`}>
                                            {robot.condition || "Used"}
                                        </Badge>
                                    </div>
                                    <div className="absolute top-4 right-4">
                                        <Badge className="bg-white text-black px-3 py-1 font-bold shadow-lg">
                                            {robot.category === "Rent" ? "For Rent" : "For Sale"}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Content Area */}
                                <div className="p-6 flex-1 flex flex-col">
                                    <h3 className="text-2xl font-bold text-zinc-100 mb-1">{robot.name || "Unknown Model"}</h3>
                                    <p className="text-sm text-zinc-500 mb-6 flex items-center gap-1.5 font-medium">
                                        <ShieldCheck size={16} className="text-emerald-500" /> Multi-point Certified
                                    </p>

                                    {/* Specs Grid */}
                                    {/* Default Specs Grid */}
                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <div className="bg-zinc-900/50 rounded-xl p-3 border border-zinc-800/50">
                                            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-1">Payload</p>
                                            <p className="text-zinc-200 font-medium">{robot.payload || 0} kg</p>
                                        </div>
                                        <div className="bg-zinc-900/50 rounded-xl p-3 border border-zinc-800/50">
                                            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-1">Reach</p>
                                            <p className="text-zinc-200 font-medium">{robot.reach || 0} mm</p>
                                        </div>
                                    </div>

                                    {/* NEW: Dynamic Key Features Preview */}
                                    {robot.key_features && robot.key_features.length > 0 ? (
                                        <div className="flex flex-wrap gap-2 mb-6 mt-1">
                                            {robot.key_features.slice(0, 3).map((feature: any, idx: number) => (
                                                <div key={idx} className="bg-zinc-900 border border-zinc-800/60 rounded flex items-center gap-1.5 px-2 py-1 max-w-full">
                                                    <span className="text-zinc-100 text-xs font-bold truncate">{feature.value}</span>
                                                    <span className="text-zinc-500 text-[10px] uppercase tracking-wider truncate">{feature.label}</span>
                                                </div>
                                            ))}
                                            {robot.key_features.length > 3 && (
                                                <div className="flex items-center text-zinc-500 text-xs font-bold px-1">
                                                    +{robot.key_features.length - 3}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="mb-6"></div> /* Spacer for alignment */
                                    )}

                                    {/* Price & Actions */}
                                    <div className="mt-auto flex items-end justify-between">
                                        <div>
                                            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-1">
                                                {robot.category === "Rent" ? "Monthly Rate" : "Purchase Price"}
                                            </p>
                                            <p className="text-3xl font-black text-white tracking-tight">
                                                ${Number(robot.price).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-zinc-800/60">
                                        <Button 
                                            variant="outline" 
                                            className="w-full bg-zinc-900 border-zinc-700 text-white hover:bg-zinc-800"
                                            onClick={() => handleAddToCart(robot)}
                                        >
                                            <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
                                        </Button>
                                        
                                        {/* Link to the Product Detail Page */}
                                        <Link href={`/asset/${robot.id}`}>
                                            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-900/20">
                                                Specs <ArrowRight className="ml-2 h-4 w-4" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* EMPTY STATE */}
                {!isLoading && filteredFleet.length === 0 && (
                    <div className="text-center py-24 text-zinc-500 border-2 border-dashed border-zinc-800/50 rounded-3xl bg-zinc-950/50">
                        <Search className="mx-auto h-12 w-12 text-zinc-700 mb-4" />
                        <h3 className="text-xl font-bold text-zinc-300 mb-2">No hardware found</h3>
                        <p>Try adjusting your search terms or filter criteria.</p>
                    </div>
                )}
            </main>
        </div>
    );
}