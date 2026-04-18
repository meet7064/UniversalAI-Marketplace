"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, Bot, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/store/useStore";

export default function InvoicePage() {
    const params = useParams();
    const router = useRouter();
    const { user, isAuthenticated } = useStore();
    
    const [order, setOrder] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    
    const [isMounted, setIsMounted] = useState(false);

    const orderId = params.id as string;

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!isMounted) return;

        if (!isAuthenticated || !user?.email || !user?.token) {
            router.push("/auth");
            return;
        }

        const fetchInvoice = async () => {
            try {
                const response = await fetch(`http://127.0.0.1:8000/api/customer/orders?email=${encodeURIComponent(user.email)}`, {
                    headers: { "Authorization": `Bearer ${user.token}` }
                });

                if (!response.ok) throw new Error("Failed to load invoice data.");
                
                const data = await response.json();
                const specificOrder = data.find((o: any) => o.order_id === orderId);
                
                if (!specificOrder) throw new Error("Order not found.");
                
                setOrder(specificOrder);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInvoice();
    }, [isMounted, orderId, isAuthenticated, user, router]);

    const handlePrint = () => {
        window.print();
    };

    if (!isMounted || isLoading) {
        return (
            <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-zinc-500">
                <div className="h-10 w-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="font-bold uppercase tracking-widest text-xs">Securing Document...</p>
            </div>
        );
    }

    if (!user) return null;

    if (error || !order) {
        return (
            <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-zinc-500 p-6 text-center">
                <h1 className="text-2xl font-bold text-white mb-2">Invoice Unavailable</h1>
                <p className="mb-6">{error || "Could not locate this order record."}</p>
                <Link href="/orders"><Button variant="outline">Return to Orders</Button></Link>
            </div>
        );
    }

    // --- 1. RENTAL MATH HELPER ---
    const getRentalMultiplier = (period?: string) => {
        if (period === "Days") return 1 / 30;
        if (period === "Years") return 12;
        return 1; 
    };

    // --- 2. BULLETPROOF INVOICE MATH ---
    // Calculate the exact subtotal using the checkout logic
    const calcSubtotal = order.subtotal || order.items.reduce((total: number, item: any) => {
        if (item.category === "Rent") {
            const multiplier = getRentalMultiplier(item.rentPeriod);
            const rentalDuration = item.rentDuration || 1;
            const fullContractValue = item.price * multiplier * rentalDuration * item.quantity;
            return total + (fullContractValue * 0.20); 
        } else {
            return total + (item.price * item.quantity); 
        }
    }, 0);

    const calcTax = order.tax || (calcSubtotal * 0.08);
    const calcShipping = calcSubtotal > 10000 ? 0 : 250;
    
    // Force the final total to perfectly add up so the math is flawless on the receipt
    const finalTotal = calcSubtotal + calcTax + calcShipping;

    return (
        <div className="min-h-screen bg-[#050505] text-zinc-100 pb-24 print:bg-white print:text-black">
            
            <div className="max-w-4xl mx-auto px-6 py-8 flex items-center justify-between print:hidden">
                <Link href="/orders" className="text-zinc-500 hover:text-white flex items-center gap-2 text-sm font-bold uppercase tracking-widest transition-colors">
                    <ArrowLeft size={16} /> Back to Orders
                </Link>
                <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white font-bold tracking-widest uppercase">
                    <Download size={16} className="mr-2" /> Download PDF
                </Button>
            </div>

            <main className="max-w-4xl mx-auto px-6">
                <div className="bg-[#0a0a0a] border border-zinc-900 rounded-3xl p-8 md:p-16 print:border-none print:shadow-none print:bg-white print:text-black print:p-0">
                    
                    <div className="flex flex-col md:flex-row justify-between gap-8 mb-16 pb-8 border-b border-zinc-900 print:border-gray-200">
                        <div className="flex items-center gap-3">
                            <Bot className="text-yellow-500 print:text-black" size={40} />
                            <div>
                                <h1 className="text-3xl font-black tracking-[0.2em] uppercase text-white print:text-black">Robostore</h1>
                                <p className="text-sm text-zinc-500 print:text-gray-500 font-mono mt-1">Official Hardware Partner</p>
                            </div>
                        </div>
                        <div className="text-left md:text-right">
                            <h2 className="text-4xl font-black text-white print:text-black uppercase tracking-widest mb-2">Invoice</h2>
                            <p className="text-zinc-500 print:text-gray-500 font-mono">#{order.order_id}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
                        <div>
                            <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 print:text-gray-400 mb-3">Billed & Shipped To</p>
                            <h3 className="text-lg font-bold text-white print:text-black mb-1">{user?.name || "Customer"}</h3>
                            <p className="text-zinc-400 print:text-gray-600 text-sm mb-3">{order.email}</p>
                            
                            <div className="text-zinc-400 print:text-gray-600 text-sm">
                                {order.shipping_address ? (
                                    <>
                                        <p>{order.shipping_address.street || order.shipping_address}</p>
                                        {(order.shipping_address.city || order.shipping_address.state) && (
                                            <p>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zip}</p>
                                        )}
                                    </>
                                ) : (
                                    <p className="text-zinc-600 print:text-gray-400 italic text-xs">Digital Delivery / Address not recorded</p>
                                )}
                            </div>
                        </div>
                        <div className="text-left md:text-right">
                            <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 print:text-gray-400 mb-3">Remit To</p>
                            <h3 className="text-lg font-bold text-white print:text-black mb-1">Robostore North America</h3>
                            <p className="text-zinc-400 print:text-gray-600 text-sm mb-1">100 Automation Way</p>
                            <p className="text-zinc-400 print:text-gray-600 text-sm">Medfield, MA 02052, USA</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-8 mb-12 bg-zinc-950/50 print:bg-gray-50 p-6 rounded-2xl border border-zinc-900 print:border-gray-200">
                        <div>
                            <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 print:text-gray-500 mb-1">Date Issued</p>
                            <p className="font-mono text-white print:text-black font-bold">{new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 print:text-gray-500 mb-1">Status</p>
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 print:border-none print:text-black print:px-0">
                                {order.status}
                            </Badge>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 print:text-gray-500 mb-1">Payment Method</p>
                            <p className="font-mono text-white print:text-black font-bold">Encrypted Token</p>
                        </div>
                    </div>

                    <div className="mb-12 overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-zinc-900 print:border-gray-300">
                                    <th className="py-4 text-[10px] uppercase tracking-widest font-bold text-zinc-500 print:text-gray-500">Hardware / Description</th>
                                    <th className="py-4 text-[10px] uppercase tracking-widest font-bold text-zinc-500 print:text-gray-500 text-center">Qty</th>
                                    <th className="py-4 text-[10px] uppercase tracking-widest font-bold text-zinc-500 print:text-gray-500 text-right">Unit Price</th>
                                    <th className="py-4 text-[10px] uppercase tracking-widest font-bold text-zinc-500 print:text-gray-500 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-900/50 print:divide-gray-200">
                                {order.items.map((item: any, idx: number) => {
                                    
                                    // Calculate correct row lines based on Rental vs Buy
                                    let lineTotal = item.price * item.quantity;
                                    if (item.category === "Rent") {
                                        const multiplier = getRentalMultiplier(item.rentPeriod);
                                        const rentalDuration = item.rentDuration || 1;
                                        const fullContractValue = item.price * multiplier * rentalDuration * item.quantity;
                                        lineTotal = fullContractValue * 0.20; // 20% down payment
                                    }

                                    return (
                                        <tr key={idx} className="print:text-black">
                                            <td className="py-6">
                                                <p className="font-bold text-white print:text-black mb-1">{item.name}</p>
                                                <p className="text-xs text-zinc-500 print:text-gray-500 font-mono">{item.category}</p>
                                            </td>
                                            <td className="py-6 text-center text-white print:text-black font-mono">{item.quantity}</td>
                                            <td className="py-6 text-right text-zinc-400 print:text-gray-600 font-mono">
                                                ${Number(item.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="py-6 text-right font-bold text-white print:text-black font-mono">
                                                ${lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-end border-t border-zinc-900 print:border-gray-300 pt-8">
                        <div className="w-full md:w-1/2 space-y-4 text-sm">
                            <div className="flex justify-between text-zinc-400 print:text-gray-600">
                                <span>Subtotal</span>
                                <span className="font-mono">${calcSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-zinc-400 print:text-gray-600">
                                <span>Taxes (8%)</span>
                                <span className="font-mono">${calcTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-zinc-400 print:text-gray-600">
                                <span>Shipping & Handling</span>
                                <span className="font-mono">${calcShipping.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-xl font-black text-white print:text-black pt-4 border-t border-zinc-900 print:border-gray-300">
                                <span className="uppercase tracking-widest">Total USD</span>
                                <span className="text-yellow-500 print:text-black font-mono">${finalTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-24 pt-8 border-t border-zinc-900 print:border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-600 print:text-gray-400">
                        <div className="flex items-center gap-2">
                            <ShieldCheck size={16} /> 
                            <span>This is a computer-generated document. No signature is required.</span>
                        </div>
                        <p className="font-mono">support@robostore.com</p>
                    </div>

                </div>
            </main>
        </div>
    );
}