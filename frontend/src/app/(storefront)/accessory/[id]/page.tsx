"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
    ShoppingCart, ShieldCheck, ArrowLeft, ChevronRight, Package, CheckCircle2, XCircle, Layers, Cpu, Battery, Cable
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/store/useStore";

export default function AccessoryDetailPage() {
    const params = useParams();
    const router = useRouter();
    
    const addToCart = useStore((state) => state.addToCart);
    const isAuthenticated = useStore((state) => state.isAuthenticated);
    
    const [item, setItem] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeImage, setActiveImage] = useState<string>("");
    const [gallery, setGallery] = useState<string[]>([]);

    useEffect(() => {
        const fetchAccessory = async () => {
            try {
                const response = await fetch(`http://127.0.0.1:8000/api/public/accessories/${params.id}`);
                if (response.ok) {
                    const data = await response.json();
                    setItem(data);
                    
                    // Gallery Logic
                    const mainImage = data.image_url ? `http://127.0.0.1:8000${data.image_url}` : "";
                    
                    if (data.images && data.images.length > 0) {
                        const fullUrls = data.images.map((img: string) => `http://127.0.0.1:8000${img}`);
                        setGallery(fullUrls);
                        setActiveImage(fullUrls[0]);
                    } else if (mainImage) {
                        setGallery([mainImage]); 
                        setActiveImage(mainImage);
                    }
                }
            } catch (error) {
                console.error("Failed to load accessory details:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (params.id) fetchAccessory();
    }, [params.id]);

    const handleAddToCart = () => {
        if (!isAuthenticated) {
            alert("Please log in or create an account to purchase parts.");
            router.push("/auth");
            return;
        }

        addToCart({
            id: item.id,
            name: item.name,
            price: Number(item.price),
            category: item.category,
            image_url: gallery.length > 0 ? gallery[0].replace("http://127.0.0.1:8000", "") : ""
        });
        
        alert(`${item.name} added to cart!`);
    };

    const getCategoryIcon = (cat: string, size = 20) => {
        switch (cat) {
            case "Gripper": return <Layers size={size} className="text-blue-400" />;
            case "Sensor": return <Cpu size={size} className="text-purple-400" />;
            case "Battery": return <Battery size={size} className="text-emerald-400" />;
            case "Cable": return <Cable size={size} className="text-amber-400" />;
            default: return <Package size={size} className="text-zinc-400" />;
        }
    };

    if (isLoading) return <div className="min-h-screen bg-[#09090b] flex items-center justify-center"><div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;
    if (!item || item.error) return <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center text-zinc-500"><h1 className="text-2xl font-bold text-white mb-2">Part Not Found</h1><Link href="/accessories"><Button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white">Return to Parts</Button></Link></div>;

    const inStock = item.stock_quantity > 0;

    return (
        <div className="min-h-screen bg-[#09090b] text-zinc-100 pb-24">
            {/* Breadcrumb Navigation */}
            <div className="border-b border-zinc-800/60 bg-zinc-950/50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center text-sm text-zinc-500">
                    <Link href="/accessories" className="hover:text-zinc-300 transition-colors flex items-center">
                        <ArrowLeft size={16} className="mr-2" /> Parts & Accessories
                    </Link>
                    <ChevronRight size={14} className="mx-2" />
                    <span className="text-zinc-300 font-medium">{item.category}</span>
                    <ChevronRight size={14} className="mx-2" />
                    <span className="text-white font-bold truncate max-w-[200px] sm:max-w-md">{item.name}</span>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    
                    {/* LEFT COLUMN: Image Gallery */}
                    <div className="space-y-6">
                        <div className="aspect-square bg-zinc-950 border border-zinc-800/60 rounded-3xl overflow-hidden flex items-center justify-center relative shadow-2xl p-4">
                            {activeImage ? (
                                <img src={activeImage} alt={item.name} className="w-full h-full object-contain drop-shadow-2xl" />
                            ) : (
                                getCategoryIcon(item.category, 120)
                            )}
                        </div>

                        {gallery.length > 1 && (
                            <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                                {gallery.map((img, idx) => (
                                    <button 
                                        key={idx}
                                        onClick={() => setActiveImage(img)}
                                        className={`h-24 w-24 shrink-0 rounded-2xl overflow-hidden border-2 bg-zinc-950 transition-all ${activeImage === img ? "border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]" : "border-zinc-800 opacity-50 hover:opacity-100 hover:border-zinc-600"}`}
                                    >
                                        <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN: Details & Cart */}
                    <div className="flex flex-col">
                        <div className="mb-6">
                            <div className="flex items-center gap-3 mb-4">
                                <Badge variant="outline" className="bg-zinc-900 text-zinc-300 border-zinc-700 uppercase tracking-widest text-xs font-bold px-3 py-1">
                                    {item.brand}
                                </Badge>
                                <div className="flex items-center gap-1.5 text-zinc-400 text-sm font-medium">
                                    {getCategoryIcon(item.category, 16)} {item.category}
                                </div>
                            </div>
                            
                            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-6">
                                {item.name}
                            </h1>

                            <div className="flex items-center gap-2 mb-8">
                                {inStock ? (
                                    <span className="flex items-center text-sm font-bold text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-md border border-emerald-400/20">
                                        <CheckCircle2 size={16} className="mr-2" /> {item.stock_quantity} Available in Stock
                                    </span>
                                ) : (
                                    <span className="flex items-center text-sm font-bold text-red-400 bg-red-400/10 px-3 py-1 rounded-md border border-red-400/20">
                                        <XCircle size={16} className="mr-2" /> Currently Out of Stock
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Compatibility Box */}
                        <div className="bg-gradient-to-r from-blue-900/10 to-transparent border border-blue-500/20 rounded-2xl p-6 mb-10">
                            <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <ShieldCheck size={18} /> Hardware Compatibility
                            </h3>
                            <p className="text-zinc-200 font-medium text-lg leading-relaxed">
                                Guaranteed compatible with: <span className="text-white font-bold">{item.compatible_with}</span>
                            </p>
                            <p className="text-sm text-zinc-500 mt-2">
                                OEM Certified part. Requires standard firmware integration upon installation.
                            </p>
                        </div>

                        {/* Pricing & Checkout */}
                        <div className="mt-auto bg-zinc-950 border border-zinc-800/60 rounded-3xl p-6 sm:p-8 shadow-xl">
                            <div className="flex items-end justify-between mb-8">
                                <div>
                                    <p className="text-sm text-zinc-500 uppercase font-bold tracking-wider mb-2">Unit Price</p>
                                    <span className="text-5xl font-black text-white tracking-tighter">
                                        ${Number(item.price).toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            <Button 
                                onClick={handleAddToCart}
                                disabled={!inStock}
                                className={`w-full h-14 text-lg font-bold shadow-xl transition-all ${
                                    inStock 
                                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-900/20" 
                                    : "bg-zinc-800 text-zinc-500 hover:bg-zinc-800 cursor-not-allowed"
                                }`}
                            >
                                <ShoppingCart className="mr-3 h-5 w-5" /> 
                                {inStock ? (isAuthenticated ? "Add to Cart" : "Log In to Purchase") : "Out of Stock"}
                            </Button>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
}