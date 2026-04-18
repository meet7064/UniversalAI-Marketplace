"use client";

import { useState, useEffect } from "react";
import { 
    Search, Filter, ShoppingCart, Cpu, Battery, Cable, Layers, ShieldCheck, CheckCircle2, XCircle
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/store/useStore";
import { useRouter } from "next/navigation";

export default function PublicAccessoriesPage() {
    const [accessories, setAccessories] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState("All");
    
    const router = useRouter();
    const addToCart = useStore((state) => state.addToCart);
    const isAuthenticated = useStore((state) => state.isAuthenticated);

    useEffect(() => {
        const fetchPublicAccessories = async () => {
            try {
                const response = await fetch("http://127.0.0.1:8000/api/public/accessories");
                if (response.ok) {
                    const data = await response.json();
                    setAccessories(data);
                }
            } catch (error) {
                console.error("Failed to load accessories:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPublicAccessories();
    }, []);

    // Frontend Filtering Logic
    const filteredAccessories = accessories.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              item.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              item.compatible_with.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeCategory === "All" || item.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    const handleAddToCart = (item: any) => {
        if (!isAuthenticated) {
            alert("Please log in or create an account to purchase hardware.");
            router.push("/auth");
            return;
        }

        // We use the first image in the array for the cart thumbnail
        const primaryImage = (item.images && item.images.length > 0) ? item.images[0] : item.image_url;

        addToCart({
            id: item.id,
            name: item.name,
            price: Number(item.price),
            category: item.category,
            image_url: primaryImage
        });
        
        // Optional: Show a subtle toast here in the future
    };

    const getCategoryIcon = (cat: string, size = 16, classes = "") => {
        switch (cat) {
            case "Gripper": return <Layers size={size} className={classes || "text-blue-400"} />;
            case "Sensor": return <Cpu size={size} className={classes || "text-purple-400"} />;
            case "Battery": return <Battery size={size} className={classes || "text-emerald-400"} />;
            case "Cable": return <Cable size={size} className={classes || "text-amber-400"} />;
            default: return <Layers size={size} className={classes || "text-zinc-400"} />;
        }
    };

    const categories = ["All", "Gripper", "Sensor", "Battery", "Cable"];

    return (
        <div className="flex flex-col min-h-screen bg-[#09090b] text-zinc-100">
            
            {/* HEADER */}
            <div className="bg-zinc-950 border-b border-zinc-800/60 py-12">
                <div className="max-w-7xl mx-auto px-6">
                    <h1 className="text-4xl font-bold tracking-tight text-white mb-4">Parts & Accessories</h1>
                    <p className="text-zinc-400 max-w-2xl text-lg">
                        OEM-certified modules, end-effectors, and spare parts to expand your fleet's capabilities.
                    </p>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-6 py-12 w-full">
                
                {/* TOOLBAR */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 pb-6 border-b border-zinc-800/60">
                    <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 custom-scrollbar">
                        {categories.map(cat => (
                            <button 
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-colors shrink-0 flex items-center gap-2 ${activeCategory === cat ? "bg-white text-black shadow-md" : "bg-zinc-900 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 border border-zinc-800"}`}
                            >
                                {cat !== "All" && getCategoryIcon(cat, 16, activeCategory === cat ? "text-black" : "")}
                                {cat === "All" ? "All Parts" : cat}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="relative flex-1 md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                            <Input 
                                placeholder="Search parts or compatibility..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 bg-zinc-900 border-zinc-800 focus-visible:ring-blue-500 text-zinc-100 rounded-full h-11"
                            />
                        </div>
                    </div>
                </div>

                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-24 text-zinc-500">
                        <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="font-medium">Syncing inventory...</p>
                    </div>
                )}

                {/* GRID */}
                {!isLoading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredAccessories.map((item) => {
                            const imageArray = item.images && item.images.length > 0 
                                ? item.images 
                                : item.image_url ? [item.image_url] : [];
                            
                            const inStock = item.stock_quantity > 0;

                            return (
                                <div key={item.id} className="bg-zinc-950 border border-zinc-800/60 rounded-2xl overflow-hidden hover:border-zinc-700 transition-all hover:shadow-[0_0_30px_rgba(59,130,246,0.05)] group flex flex-col">
                                    
                                    {/* DYNAMIC MULTI-IMAGE SCROLL AREA */}
                                    <div className="relative h-56 bg-zinc-900 overflow-hidden">
                                        {imageArray.length === 0 ? (
                                            <div className="flex h-full w-full items-center justify-center">
                                                {getCategoryIcon(item.category, 64, "text-zinc-800")}
                                            </div>
                                        ) : (
                                            <div className="flex h-full w-full overflow-x-auto snap-x snap-mandatory touch-pan-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                                {imageArray.map((img: string, idx: number) => (
                                                    <img 
                                                        key={idx}
                                                        src={`http://127.0.0.1:8000${img}`} 
                                                        alt={`${item.name} - ${idx + 1}`} 
                                                        className="w-full h-full shrink-0 snap-center object-cover" 
                                                    />
                                                ))}
                                            </div>
                                        )}

                                        {/* Indicator Dots */}
                                        {imageArray.length > 1 && (
                                            <div className="absolute bottom-3 w-full flex justify-center gap-1.5 pointer-events-none z-10">
                                                {imageArray.map((_: any, i: number) => (
                                                    <div key={i} className="h-1.5 w-1.5 rounded-full bg-white/80 shadow-md" />
                                                ))}
                                            </div>
                                        )}

                                        {/* Overlays */}
                                        <div className="absolute top-3 left-3 pointer-events-none">
                                            <Badge variant="secondary" className="bg-zinc-950/80 text-zinc-100 backdrop-blur-md border-zinc-700/80 px-2.5 py-1 font-semibold shadow-sm">
                                                {item.brand}
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* CONTENT AREA */}
                                    <div className="p-5 flex-1 flex flex-col">
                                        <div className="mb-4">
                                            <h3 className="text-xl font-bold text-zinc-100 mb-1 leading-tight">{item.name}</h3>
                                            <div className="flex items-center gap-2">
                                                {inStock ? (
                                                    <span className="flex items-center text-[11px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-400/10 px-2 py-0.5 rounded-sm border border-emerald-400/20">
                                                        <CheckCircle2 size={12} className="mr-1" /> {item.stock_quantity} In Stock
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center text-[11px] font-bold text-red-400 uppercase tracking-wider bg-red-400/10 px-2 py-0.5 rounded-sm border border-red-400/20">
                                                        <XCircle size={12} className="mr-1" /> Out of Stock
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mb-6 bg-zinc-900/50 rounded-lg p-3 border border-zinc-800/50">
                                            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-1.5 flex items-center gap-1">
                                                <ShieldCheck size={12} className="text-blue-400" /> Compatible Hardware
                                            </p>
                                            <p className="text-sm font-medium text-zinc-300 leading-snug">
                                                {item.compatible_with}
                                            </p>
                                        </div>

                                        {/* PRICE & ACTION */}
                                        <div className="mt-auto flex flex-col gap-4">
                                            <div className="flex items-end justify-between border-t border-zinc-800/60 pt-4 mt-2">
                                                <div>
                                                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-0.5">Unit Price</p>
                                                    <p className="text-2xl font-black text-white tracking-tight">
                                                        ${Number(item.price).toLocaleString()}
                                                    </p>
                                                </div>
                                                <div className="bg-zinc-900 border border-zinc-800 rounded-md p-1.5 shadow-sm text-zinc-400">
                                                    {getCategoryIcon(item.category, 20)}
                                                </div>
                                            </div>

                                            {/* NEW: Two-button layout matching the Fleet cards */}
                                            <div className="grid grid-cols-2 gap-2">
                                                <Button 
                                                    onClick={() => handleAddToCart(item)}
                                                    disabled={!inStock}
                                                    variant="outline"
                                                    className={`w-full h-10 text-xs font-bold transition-all ${
                                                        inStock 
                                                        ? "bg-zinc-900 text-white border-zinc-700 hover:bg-zinc-800" 
                                                        : "bg-zinc-900/50 border-zinc-800 text-zinc-600 cursor-not-allowed hover:bg-zinc-900/50"
                                                    }`}
                                                >
                                                    <ShoppingCart className="mr-2 h-3 w-3" /> 
                                                    Cart
                                                </Button>
                                                
                                                <Link href={`/accessory/${item.id}`}>
                                                    <Button className="w-full h-10 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-900/20">
                                                        Details
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}