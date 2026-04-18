"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
    Cpu, ShoppingCart, ShieldCheck, ArrowLeft, Box, Activity, ChevronRight, Zap, CalendarClock 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useStore } from "@/store/useStore";

export default function AssetDetailPage() {
    const params = useParams();
    const router = useRouter();
    const addToCart = useStore((state) => state.addToCart);
    const isAuthenticated = useStore((state) => state.isAuthenticated);
    
    const [robot, setRobot] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeImage, setActiveImage] = useState<string>("");
    const [gallery, setGallery] = useState<string[]>([]);

    const [rentDuration, setRentDuration] = useState<number>(1);
    const [rentPeriod, setRentPeriod] = useState<string>("Months");

    useEffect(() => {
        const fetchAsset = async () => {
            try {
                const response = await fetch(`http://127.0.0.1:8000/api/public/catalog/${params.id}`);
                if (response.ok) {
                    const data = await response.json();
                    setRobot(data);
                    
                    const mainImage = data.image_url ? `http://127.0.0.1:8000${data.image_url}` : "";
                    setActiveImage(mainImage);
                    if (data.images && data.images.length > 0) {
                        setGallery(data.images.map((img: string) => `http://127.0.0.1:8000${img}`));
                    } else if (mainImage) {
                        setGallery([mainImage, mainImage, mainImage]); 
                    }
                }
            } catch (error) {
                console.error("Failed to load asset details:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (params.id) fetchAsset();
    }, [params.id]);

    const handleAddToCart = () => {
        if (!isAuthenticated) {
            alert("Please log in or create an account to add items to your cart.");
            router.push("/auth");
            return;
        }

        addToCart({
            id: robot.id, 
            name: robot.name, 
            price: Number(robot.price),
            category: robot.category, 
            image: robot.image_url,
            rentDuration: robot.category === "Rent" ? rentDuration : undefined,
            rentPeriod: robot.category === "Rent" ? rentPeriod : undefined,
        });
        alert(`${robot.name} added to cart!`);
    };

    // --- NEW: DYNAMIC RENTAL MATH ---
    const getRentalMultiplier = (period: string) => {
        if (period === "Days") return 1 / 30; // Pro-rate by day
        if (period === "Years") return 12;    // Multiply by 12 months
        return 1;                             // Default to monthly
    };

    const multiplier = getRentalMultiplier(rentPeriod);
    const totalContractValue = robot?.price ? (robot.price * multiplier * rentDuration) : 0;

    if (isLoading) return <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-zinc-500"><div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div></div>;
    if (!robot || robot.error) return <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center text-zinc-500"><h1 className="text-2xl font-bold text-white mb-2">Asset Not Found</h1></div>;

    return (
        <div className="min-h-screen bg-[#09090b] text-zinc-100 pb-24">
            <div className="border-b border-zinc-800/60 bg-zinc-950/50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center text-sm text-zinc-500">
                    <Link href="/shop" className="hover:text-zinc-300 transition-colors flex items-center"><ArrowLeft size={16} className="mr-2" /> Marketplace</Link>
                    <ChevronRight size={14} className="mx-2" /> <span className="text-zinc-300 font-medium">{robot.brand}</span>
                    <ChevronRight size={14} className="mx-2" /> <span className="text-white font-bold">{robot.name}</span>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    
                    <div className="space-y-6">
                        <div className="aspect-square bg-zinc-950 border border-zinc-800/60 rounded-2xl overflow-hidden flex items-center justify-center relative shadow-2xl">
                            {activeImage ? <img src={activeImage} alt={robot.name} className="w-full h-full object-cover" /> : <Cpu size={120} className="text-zinc-800" />}
                            <div className="absolute top-4 left-4"><Badge className="bg-blue-600 text-white font-bold px-3 py-1">{robot.category === "Rent" ? "For Rent" : "For Sale"}</Badge></div>
                        </div>

                        {gallery.length > 0 && (
                            <div className="flex gap-4 overflow-x-auto pb-2">
                                {gallery.map((img, idx) => (
                                    <button key={idx} onClick={() => setActiveImage(img)} className={`h-24 w-24 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${activeImage === img ? "border-blue-500 opacity-100" : "border-zinc-800 opacity-50 hover:opacity-100"}`}>
                                        <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/20 rounded-2xl p-6 flex items-center justify-between">
                            <div>
                                <h4 className="text-lg font-bold text-white flex items-center gap-2"><Box className="text-blue-400" size={20} /> Digital Twin Available</h4>
                                <p className="text-sm text-zinc-400 mt-1">Simulate kinematics and workspace reach in WebGL.</p>
                            </div>
                            <Button variant="outline" className="bg-blue-600/10 border-blue-500/30 text-blue-400 hover:bg-blue-600 hover:text-white">Launch 3D</Button>
                        </div>
                    </div>

                    <div className="flex flex-col">
                        <div className="mb-6">
                            <Badge variant="outline" className="bg-zinc-900 text-zinc-300 border-zinc-700 mb-4 uppercase tracking-widest text-xs font-bold px-3 py-1">{robot.brand}</Badge>
                            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4">{robot.name}</h1>
                            <p className="text-lg text-zinc-400 leading-relaxed">{robot.description || "Premium industrial kinematics hardware, fully certified and ready for immediate deployment in your automation pipeline."}</p>
                        </div>

                        <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-8">
                            <ShieldCheck className="text-emerald-500 shrink-0" size={24} />
                            <div>
                                <p className="text-sm font-bold text-emerald-400">V_Shop Certified {robot.condition || "Used"} Hardware</p>
                                <p className="text-xs text-emerald-500/80">Passed 50-point telemetry and joint stress diagnostics.</p>
                            </div>
                        </div>

                        {robot.key_features && robot.key_features.length > 0 && (
                            <div className="mb-10 pt-6 border-t border-zinc-800/60">
                                <h3 className="text-xl font-bold text-white mb-5">Key Features</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {robot.key_features.map((feature: any, idx: number) => (
                                        <div key={idx} className="bg-zinc-950/80 border border-zinc-800/60 p-4 rounded-xl flex items-center gap-4 hover:border-zinc-700 transition-colors">
                                            <div className="h-10 w-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                                                <Zap className="text-zinc-400" size={18} />
                                            </div>
                                            <div className="overflow-hidden">
                                                <p className="text-lg font-bold text-zinc-100 truncate leading-tight">{feature.value}</p>
                                                <p className="text-xs text-zinc-500 truncate mt-0.5">{feature.label}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10 pt-6 border-t border-zinc-800/60">
                            <div className="bg-zinc-950 border border-zinc-800/60 rounded-xl p-4">
                                <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Payload</p>
                                <p className="text-xl font-bold text-white">{robot.payload || 0} kg</p>
                            </div>
                            <div className="bg-zinc-950 border border-zinc-800/60 rounded-xl p-4">
                                <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Reach</p>
                                <p className="text-xl font-bold text-white">{robot.reach || 0} mm</p>
                            </div>
                            <div className="bg-zinc-950 border border-zinc-800/60 rounded-xl p-4">
                                <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Op Hours</p>
                                <p className="text-xl font-bold text-white flex items-center gap-2">
                                    <Activity size={16} className="text-blue-500" /> {robot.hours || 0}
                                </p>
                            </div>
                        </div>

                        {robot.category === "Rent" && (
                            <div className="bg-blue-900/10 border border-blue-500/20 rounded-2xl p-6 mb-8">
                                <h3 className="text-lg font-bold text-blue-400 flex items-center gap-2 mb-4">
                                    <CalendarClock size={20} /> Configure Rental Period
                                </h3>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <div className="flex-1 space-y-2">
                                        <label className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Duration</label>
                                        <Input 
                                            type="number" 
                                            min="1" 
                                            value={rentDuration} 
                                            onChange={(e) => setRentDuration(Math.max(1, Number(e.target.value)))}
                                            className="bg-zinc-950 border-zinc-800 text-white h-12 text-lg font-bold"
                                        />
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <label className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Timeframe</label>
                                        <select 
                                            value={rentPeriod}
                                            onChange={(e) => setRentPeriod(e.target.value)}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-md text-white h-12 px-3 outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="Days">Days</option>
                                            <option value="Months">Months</option>
                                            <option value="Years">Years</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-blue-500/20 flex items-center justify-between">
                                    {/* USE THE DYNAMIC CALCULATION HERE WITH FIXED DECIMALS */}
                                    <span className="text-sm text-zinc-300">Total Contract Value: <span className="font-mono font-bold text-white">${totalContractValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></span>
                                    <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">20% Due at Checkout</Badge>
                                </div>
                            </div>
                        )}

                        <div className="mt-auto bg-zinc-950 border border-zinc-800/60 rounded-2xl p-6 sm:p-8">
                            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-4">
                                <div>
                                    <p className="text-sm text-zinc-500 uppercase font-bold tracking-wider mb-2">{robot.category === "Rent" ? "Base Monthly Leasing Rate" : "Direct Purchase Price"}</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-5xl font-black text-white tracking-tighter">${Number(robot.price).toLocaleString()}</span>
                                        {robot.category === "Rent" && <span className="text-zinc-500 font-medium">/ mo</span>}
                                    </div>
                                </div>
                            </div>
                            <Button onClick={handleAddToCart} className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold shadow-xl shadow-blue-900/20">
                                <ShoppingCart className="mr-3 h-5 w-5" /> {isAuthenticated ? "Add to Cart" : "Log In to Purchase"}
                            </Button>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
}