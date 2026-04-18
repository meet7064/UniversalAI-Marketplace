"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, Plus, Minus, ShoppingCart, CreditCard, ShieldCheck, Clock, MapPin, Info } from "lucide-react"; 
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"; 
import { useStore } from "@/store/useStore";

export default function CartPage() {
    const router = useRouter();
    const { cart, removeFromCart, updateQuantity, isAuthenticated, user, clearCart } = useStore();
    const [isProcessing, setIsProcessing] = useState(false);
    
    // --- NEW: MANAGED SERVICE STATE ---
    const [selectedZone, setSelectedZone] = useState("");
    const [availableZones] = useState(["San Diego, CA", "San Francisco, CA", "Austin, TX", "Medfield, MA"]); // In production, fetch this from /api/zones

    const getRentalMultiplier = (period?: string) => {
        if (period === "Days") return 1 / 30;
        if (period === "Years") return 12;
        return 1; 
    };

    // --- NEW: LOGIC TO DETECT 1-3 DAY RENTALS ---
    const needsOperator = cart.some(item => 
        item.category === "Rent" && 
        item.rentPeriod === "Days" && 
        (item.rentDuration ?? 0) <= 3 && // Fallback to 0 if undefined
        (item.rentDuration ?? 0) > 0    // Ensure it's not actually 0
    );

    const subtotal = cart.reduce((total, item) => {
        if (item.category === "Rent") {
            const multiplier = getRentalMultiplier(item.rentPeriod);
            
            // Use ?? 1 to ensure duration is at least 1 if undefined
            const rentalDuration = item.rentDuration ?? 1; 
            
            const fullContractValue = item.price * multiplier * rentalDuration * item.quantity;
            return total + (fullContractValue * 0.20); 
        } else {
            return total + (item.price * item.quantity); 
        }
    }, 0);
    
    const tax = subtotal * 0.08; 
    const total = subtotal + tax;

    // --- UPDATED: HANDLE CHECKOUT OR DISPATCH REQUEST ---
    const handleAction = async () => {
        if (!isAuthenticated) {
            alert("Please log in to proceed.");
            router.push("/auth");
            return;
        }
    
        if (needsOperator) {
            setIsProcessing(true);
            try {
                const response = await fetch("http://127.0.0.1:8000/api/public/checkout", {
                    method: "POST",
                    headers: { 
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${user?.token}`
                    },
                    body: JSON.stringify({ 
                        items: cart, 
                        total: total,
                        email: user?.email,
                        is_managed: true,
                        location_zone: selectedZone,
                        status: "Pending Dispatch" 
                    }),
                });
    
                const data = await response.json();
    
                if (response.ok) {
                    // SUCCESS LOGIC
                    console.log("Success:", data.message);
                    clearCart();
                    router.push("/orders"); // Ensure this path matches your app structure
                } else {
                    // ACTUAL ERROR LOGIC
                    console.error("Backend Error Details:", data);
                    alert(`Error: ${data.detail || "Failed to submit request"}`);
                }
            } catch (error) {
                console.error("Dispatch Request Failed", error);
                alert("Network error. Please try again.");
            } finally {
                setIsProcessing(false);
            }
        } else {
            router.push("/checkout");
        }
    };

    if (cart.length === 0) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center text-zinc-100 p-6">
                <div className="h-24 w-24 bg-zinc-900 rounded-full flex items-center justify-center text-zinc-700 mb-6">
                    <ShoppingCart size={48} />
                </div>
                <h2 className="text-3xl font-black uppercase tracking-widest mb-4">Your Fleet is Empty</h2>
                <Link href="/shop"><Button className="bg-yellow-500 hover:bg-yellow-600 text-black font-black uppercase tracking-widest px-8 h-12">Browse Hardware</Button></Link>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-6 py-12 w-full text-zinc-100">
            <h1 className="text-3xl font-black uppercase tracking-[0.2em] mb-8">Procurement Cart</h1>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                
                <div className="lg:col-span-8 space-y-6">
                    {/* Items List */}
                    {cart.map((item) => {
                        const multiplier = getRentalMultiplier(item.rentPeriod);
                        const fullContractValue = item.category === "Rent" 
                            ? (item.price * multiplier * (item.rentDuration || 1) * item.quantity) 
                            : (item.price * item.quantity);
                        const downPayment = fullContractValue * 0.20;

                        return (
                            <div key={item.id} className="flex items-center gap-6 bg-[#0a0a0a] border border-zinc-900 p-4 rounded-2xl transition-all hover:border-zinc-800">
                                <div className="h-24 w-24 bg-zinc-900 rounded-xl flex items-center justify-center shrink-0 border border-zinc-800 overflow-hidden">
                                    {item.image ? (
                                        <img src={item.image.startsWith('http') ? item.image : `http://127.0.0.1:8000${item.image}`} alt={item.name} className="object-cover h-full w-full" />
                                    ) : (
                                        <ShoppingCart className="text-zinc-700" size={32} />
                                    )}
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="text-[10px] text-yellow-500 font-bold uppercase tracking-widest">{item.category}</p>
                                        {item.category === "Rent" && (
                                            <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[9px] py-0">
                                                <Clock size={10} className="mr-1" /> {item.rentDuration} {item.rentPeriod}
                                            </Badge>
                                        )}
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2">{item.name}</h3>
                                    <p className="text-emerald-400 font-mono font-bold">
                                        ${(item.category === "Rent" ? downPayment : fullContractValue).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </p>
                                </div>

                                {/* Quantity Toggle */}
                                <div className="flex items-center gap-3 bg-zinc-950 border border-zinc-800 rounded-lg p-1 shrink-0">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus size={14} /></Button>
                                    <span className="w-6 text-center font-bold text-sm">{item.quantity}</span>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus size={14} /></Button>
                                </div>

                                <Button variant="ghost" size="icon" className="text-zinc-600 hover:text-red-500 shrink-0" onClick={() => removeFromCart(item.id)}><Trash2 size={18} /></Button>
                            </div>
                        );
                    })}
                </div>

                <div className="lg:col-span-4">
                    <div className="bg-[#0a0a0a] border border-zinc-900 p-6 rounded-2xl sticky top-28">
                        <h2 className="text-lg font-black uppercase tracking-widest border-b border-zinc-900 pb-4 mb-6">Summary</h2>
                        
                        {/* --- NEW: LOCATION SELECTION UI --- */}
                        {needsOperator && (
                            <div className="mb-8 p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                                <div className="flex items-center gap-2 mb-3">
                                    <MapPin className="text-blue-500" size={16} />
                                    <span className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Operator Dispatch Area</span>
                                </div>
                                <select 
                                    value={selectedZone}
                                    onChange={(e) => setSelectedZone(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 h-12 rounded-lg px-3 text-sm text-white focus:border-blue-500 outline-none"
                                >
                                    <option value="">Select Service Area...</option>
                                    {availableZones.map(zone => <option key={zone} value={zone}>{zone}</option>)}
                                </select>
                                <div className="flex items-start gap-2 mt-3 text-[10px] text-zinc-500 leading-relaxed">
                                    <Info size={12} className="shrink-0 mt-0.5" />
                                    <span>Rentals ≤ 3 days require a human operator. We will confirm operator availability after your request.</span>
                                </div>
                            </div>
                        )}

                        <div className="space-y-3 text-sm text-zinc-400 mb-6">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span className="text-white font-mono">${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Tax (8%)</span>
                                <span className="text-white font-mono">${tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>

                        <div className="border-t border-zinc-900 pt-4 mb-8 flex justify-between items-center">
                            <span className="font-bold text-white uppercase tracking-wider">Due Today</span>
                            <span className="text-2xl font-black text-yellow-500 font-mono">${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>

                        {/* --- UPDATED BUTTON ACTION --- */}
                        <Button 
                            onClick={handleAction} 
                            disabled={isProcessing || (needsOperator && !selectedZone)}
                            className={`w-full h-14 rounded-xl font-black uppercase tracking-widest transition-all ${
                                needsOperator 
                                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-[0_0_20px_rgba(37,99,235,0.2)]" 
                                : "bg-white hover:bg-zinc-200 text-black"
                            }`}
                        >
                            {isProcessing ? (
                                <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : needsOperator ? (
                                <><MapPin className="mr-2" size={18} /> Submit Dispatch Request</>
                            ) : (
                                <><CreditCard className="mr-2" size={18} /> Secure Checkout</>
                            )}
                        </Button>

                        <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-zinc-600 uppercase tracking-widest font-bold">
                            <ShieldCheck size={14} /> AES-256 Encrypted Checkout
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}