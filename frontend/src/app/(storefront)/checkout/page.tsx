"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
    ShieldCheck, Lock, CreditCard, Truck, ArrowLeft, CheckCircle2, Package, Clock, MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/store/useStore";

// --- WRAPPER FOR SEARCH PARAMS ---
export default function CheckoutPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#050505]" />}>
            <CheckoutContent />
        </Suspense>
    );
}

function CheckoutContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const orderIdFromUrl = searchParams.get("orderId"); // Detect if paying for existing order

    const { cart, user, isAuthenticated, clearCart } = useStore();
    const [isProcessing, setIsProcessing] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    // --- NEW: STATE FOR DATA SOURCE ---
    const [displayItems, setDisplayItems] = useState<any[]>([]);
    const [totals, setTotals] = useState({ subtotal: 0, tax: 0, shipping: 0, total: 0 });
    const [isExistingOrder, setIsExistingOrder] = useState(false);
    const [existingOrderData, setExistingOrderData] = useState<any>(null);

    const [address, setAddress] = useState({
        street: "",
        city: "",
        state: "",
        zip: ""
    });

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Helper for rental math
    const getRentalMultiplier = (period?: string) => {
        if (period === "Days") return 1 / 30;
        if (period === "Years") return 12;
        return 1;
    };

    // --- LOGIC: FETCH ORDER OR CALCULATE CART ---
    useEffect(() => {
        if (!isMounted) return;

        if (orderIdFromUrl) {
            // CASE A: Paying for an existing order from History
            const fetchOrder = async () => {
                try {
                    const res = await fetch(`http://127.0.0.1:8000/api/customer/orders/${orderIdFromUrl}`);
                    if (res.ok) {
                        const data = await res.json();
                        setDisplayItems(data.items);
                        setTotals({
                            subtotal: data.subtotal,
                            tax: data.tax,
                            shipping: data.shipping || 0,
                            total: data.total
                        });
                        // Auto-fill address from the saved order
                        if (data.shipping_address) setAddress(data.shipping_address);
                        setExistingOrderData(data);
                        setIsExistingOrder(true);
                    }
                } catch (err) {
                    console.error("Failed to fetch order", err);
                }
            };
            fetchOrder();
        } else {
            // CASE B: Standard Checkout from Cart
            if (cart.length === 0) {
                router.push("/cart");
                return;
            }

            const sub = cart.reduce((total, item) => {
                if (item.category === "Rent") {
                    const multiplier = getRentalMultiplier(item.rentPeriod);
                    const duration = item.rentDuration || 1;
                    return total + (item.price * multiplier * duration * item.quantity * 0.20);
                }
                return total + (item.price * item.quantity);
            }, 0);

            const tx = sub * 0.08;
            const ship = sub > 10000 ? 0 : 250;
            setDisplayItems(cart);
            setTotals({ subtotal: sub, tax: tx, shipping: ship, total: sub + tx + ship });
            setIsExistingOrder(false);
        }
    }, [isMounted, orderIdFromUrl, cart, router]);

    const handlePaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);

        try {
            let response;
            if (isExistingOrder) {
                // Endpoint to finalize an existing pending order
                response = await fetch(`http://127.0.0.1:8000/api/customer/orders/${orderIdFromUrl}/finalize-payment`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: user?.email, shipping_address: address }),
                });
            } else {
                // Standard new checkout
                response = await fetch("http://127.0.0.1:8000/api/public/checkout", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${user?.token}`
                    },
                    body: JSON.stringify({
                        items: cart,
                        total: totals.total,
                        email: user?.email,
                        shipping_address: address
                    }),
                });
            }

            if (response.ok) {
                clearCart();
                router.push("/orders");
            } else {
                const errData = await response.json();
                throw new Error(errData.detail || "Transaction failed");
            }
        } catch (error: any) {
            alert(`Error: ${error.message}`);
            setIsProcessing(false);
        }
    };

    if (!isMounted || !isAuthenticated) return null;

    return (
        <div className="min-h-screen bg-[#050505] text-zinc-100 pb-24">
            {/* Header */}
            <div className="bg-[#0a0a0a] border-b border-zinc-900 py-6 sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
                    <Link href="/cart" className="text-zinc-500 hover:text-white flex items-center gap-2 text-sm font-bold uppercase tracking-widest transition-colors">
                        <ArrowLeft size={16} /> Back
                    </Link>
                    <div className="flex items-center gap-2 text-emerald-500 font-bold uppercase tracking-widest text-sm">
                        <Lock size={16} /> Secure Checkout {isExistingOrder && `[${orderIdFromUrl}]`}
                    </div>
                </div>
            </div>

            <main className="max-w-6xl mx-auto px-6 py-12">
                <form onSubmit={handlePaymentSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                    <div className="lg:col-span-7 space-y-8">
                        {/* Contact Information (Read-only if existing) */}
                        <div className="bg-[#0a0a0a] border border-zinc-900 rounded-2xl p-6 md:p-8">
                            <h2 className="text-lg font-black uppercase tracking-widest border-b border-zinc-900 pb-4 mb-6 flex items-center gap-3">
                                <CheckCircle2 className="text-emerald-500" size={20} /> Identity Verification
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-zinc-500 text-xs uppercase font-bold">Account Email</Label>
                                    <Input disabled value={user?.email || ""} className="bg-zinc-900 border-zinc-800 text-zinc-400" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-zinc-500 text-xs uppercase font-bold">Customer Name</Label>
                                    <Input disabled value={user?.name || ""} className="bg-zinc-900 border-zinc-800 text-zinc-400" />
                                </div>
                            </div>
                        </div>

                        {/* Shipping Address */}
                        <div className="bg-[#0a0a0a] border border-zinc-900 rounded-2xl p-6 md:p-8">
                            <h2 className="text-lg font-black uppercase tracking-widest border-b border-zinc-900 pb-4 mb-6 flex items-center gap-3">
                                <Truck className="text-blue-500" size={20} /> Delivery Point
                            </h2>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-zinc-400">Street Address</Label>
                                    <Input required value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} className="bg-zinc-900 border-zinc-800 h-12" />
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="md:col-span-2 space-y-2"><Label className="text-zinc-400">City</Label><Input required value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} className="bg-zinc-900 border-zinc-800 h-12" /></div>
                                    <div className="space-y-2"><Label className="text-zinc-400">State</Label><Input required value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} className="bg-zinc-900 border-zinc-800 h-12" /></div>
                                    <div className="space-y-2"><Label className="text-zinc-400">ZIP</Label><Input required value={address.zip} onChange={(e) => setAddress({ ...address, zip: e.target.value })} className="bg-zinc-900 border-zinc-800 h-12" /></div>
                                </div>
                            </div>
                        </div>

                        {/* Managed Service Note (Only if applicable) */}
                        {existingOrderData?.is_managed && (
                            <div className="bg-blue-500/5 border border-blue-500/10 p-6 rounded-2xl flex items-center gap-4">
                                <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center text-white shrink-0">
                                    <MapPin size={24} />
                                </div>
                                <div>
                                    <p className="text-xs text-blue-400 font-black uppercase tracking-widest">Operator Confirmed</p>
                                    <p className="text-sm font-bold">{existingOrderData.operator_name} has been assigned to your zone.</p>
                                </div>
                            </div>
                        )}

                        {/* Payment Details */}
                        <div className="bg-[#0a0a0a] border border-zinc-900 rounded-2xl p-6 md:p-8">
                            <h2 className="text-lg font-black uppercase tracking-widest border-b border-zinc-900 pb-4 mb-6 flex items-center gap-3">
                                <CreditCard className="text-yellow-500" size={20} /> Secure Payment
                            </h2>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-zinc-400">Card Number</Label>
                                    <Input required placeholder="•••• •••• •••• ••••" className="bg-zinc-900 border-zinc-800 h-12 font-mono" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <Input required placeholder="MM/YY" className="bg-zinc-900 border-zinc-800 h-12" />
                                    <Input required placeholder="CVC" type="password" className="bg-zinc-900 border-zinc-800 h-12" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Order Summary */}
                    <div className="lg:col-span-5">
                        <div className="bg-[#0a0a0a] border border-zinc-900 p-8 rounded-2xl sticky top-28">
                            <h2 className="text-lg font-black uppercase tracking-widest border-b border-zinc-900 pb-4 mb-6">Summary</h2>

                            <div className="space-y-4 mb-8">
                                {displayItems.map((item, idx) => {
                                    // --- SAFETY CHECK: Ensure image is a string before checking path ---
                                    const hasImage = item.image && typeof item.image === 'string';
                                    const imageSrc = hasImage
                                        ? (item.image.startsWith('http') ? item.image : `http://127.0.0.1:8000${item.image}`)
                                        : null;

                                    return (
                                        <div key={idx} className="flex items-center gap-4">
                                            <div className="h-12 w-12 bg-zinc-950 rounded-lg overflow-hidden border border-zinc-800 flex items-center justify-center shrink-0">
                                                {imageSrc ? (
                                                    <img
                                                        src={imageSrc}
                                                        alt={item.name}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    // Fallback icon if image is undefined or null
                                                    <Package className="text-zinc-700" size={20} />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-white line-clamp-1">{item.name}</p>
                                                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">
                                                    Qty: {item.quantity}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-mono text-zinc-300 font-bold">
                                                    ${(item.price * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="border-t border-zinc-900 pt-6 space-y-3 text-sm mb-6">
                                <div className="flex justify-between text-zinc-500"><span>Subtotal</span><span className="text-white">${totals.subtotal.toLocaleString()}</span></div>
                                <div className="flex justify-between text-zinc-500"><span>Tax</span><span className="text-white">${totals.tax.toLocaleString()}</span></div>
                                <div className="flex justify-between items-center pt-4 border-t border-zinc-900/50">
                                    <span className="font-black text-white uppercase">Total</span>
                                    <span className="text-3xl font-black text-yellow-500 font-mono">${totals.total.toLocaleString()}</span>
                                </div>
                            </div>

                            <Button type="submit" disabled={isProcessing} className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-black uppercase tracking-widest h-14 rounded-xl">
                                {isProcessing ? "Processing..." : <><Lock className="mr-2" size={18} /> Confirm Procurement</>}
                            </Button>
                        </div>
                    </div>
                </form>
            </main>
        </div>
    );
}