"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
    Cpu, ShoppingCart, User, LogOut, Settings, Package, LayoutDashboard 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
    DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useStore } from "@/store/useStore"; // The Global Brain

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    
    // 1. Pull data from our Zustand global store
    const user = useStore((state) => state.user);
    const isAuthenticated = useStore((state) => state.isAuthenticated);
    const logout = useStore((state) => state.logout);
    const cart = useStore((state) => state.cart);

    // 2. Hydration trick to prevent Next.js server/client mismatch
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleLogout = () => {
        logout();
        router.push("/");
    };

    // The Heartbeat Engine
    useEffect(() => {
        // Only ping if the user is actually logged in
        if (!isAuthenticated || !user?.token) return;

        const sendHeartbeat = async () => {
            try {
                await fetch("http://127.0.0.1:8000/api/customer/activity/heartbeat", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${user.token}`, // Must pass the Zustand token
                        "Content-Type": "application/json"
                    }
                });
            } catch (error) {
                // Fail silently so it doesn't bother the user
                console.error("Heartbeat failed", error);
            }
        };

        // 1. Send an immediate heartbeat when they load the page
        sendHeartbeat();

        // 2. Set an interval to ping every 2 minutes (120,000 milliseconds)
        const intervalId = setInterval(sendHeartbeat, 120000);

        // Cleanup interval if they close the tab
        return () => clearInterval(intervalId);
    }, [isAuthenticated, user]);

    // Calculate total items in the cart
    const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

    return (
        <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-blue-500/30 flex flex-col">
            
            {/* --- GLOBAL NAVIGATION BAR --- */}
            <nav className="border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    
                    {/* Brand Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20">
                            <Cpu className="text-white" size={18} />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-white">V_Shop</span>
                    </Link>
                    
                    {/* Main Links (Maps to your Flowchart) */}
                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
                        <Link href="/shop" className="hover:text-zinc-100 transition-colors">Marketplace</Link>
                        <Link href="/accessories" className="hover:text-zinc-100 transition-colors">Accessories</Link>
                        <Link href="/trade-in" className="hover:text-zinc-100 transition-colors">Trade-In</Link>
                    </div>

                    {/* Dynamic User & Cart Actions */}
                    <div className="flex items-center gap-4">
                        
                        {/* 1. The Dynamic Cart Icon */}
                        {isMounted && (
                            <Link href="/cart">
                                <Button variant="ghost" size="icon" className="relative text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full">
                                    <ShoppingCart size={20} />
                                    {cartItemCount > 0 && (
                                        <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white shadow-sm border-2 border-zinc-950">
                                            {cartItemCount}
                                        </span>
                                    )}
                                </Button>
                            </Link>
                        )}

                        {/* 2. Authentication UI */}
                        {isMounted && isAuthenticated && user ? (
                            // LOGGED IN: Show User Dropdown
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="bg-zinc-900 border-zinc-800 text-zinc-100 flex items-center gap-2 hover:bg-zinc-800 rounded-full pl-2 pr-4">
                                        <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold uppercase">
                                            {user.username ? user.username.charAt(0) : "U"}
                                        </div>
                                        <span className="text-sm font-medium truncate max-w-[100px]">
                                            {user.username || user.name}
                                        </span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-zinc-950 border-zinc-800 text-zinc-300 w-56 mt-2">
                                    <div className="px-3 py-2">
                                        <p className="text-sm font-medium text-white truncate">{user.name}</p>
                                        <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                                    </div>
                                    <DropdownMenuSeparator className="bg-zinc-800" />
                                    
                                    {/* Dashboard Link */}
                                    <Link href="/dashboard">
                                        <DropdownMenuItem className="focus:bg-zinc-900 focus:text-white cursor-pointer py-2">
                                            <LayoutDashboard className="mr-2 h-4 w-4" /> My Dashboard
                                        </DropdownMenuItem>
                                    </Link>
                                    <Link href="/dashboard/orders">
                                        <DropdownMenuItem className="focus:bg-zinc-900 focus:text-white cursor-pointer py-2">
                                            <Package className="mr-2 h-4 w-4" /> Order History
                                        </DropdownMenuItem>
                                    </Link>

                                    {/* Command Center Link (Admins Only!) */}
                                    {user.role === "admin" && (
                                        <>
                                            <DropdownMenuSeparator className="bg-zinc-800" />
                                            <Link href="/admin">
                                                <DropdownMenuItem className="focus:bg-blue-500/10 focus:text-blue-400 text-blue-400 cursor-pointer py-2 font-medium">
                                                    <Cpu className="mr-2 h-4 w-4" /> Command Center
                                                </DropdownMenuItem>
                                            </Link>
                                        </>
                                    )}

                                    <DropdownMenuSeparator className="bg-zinc-800" />
                                    <DropdownMenuItem onClick={handleLogout} className="focus:bg-red-500/10 focus:text-red-500 text-red-500 cursor-pointer py-2">
                                        <LogOut className="mr-2 h-4 w-4" /> Log Out
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : isMounted ? (
                            // LOGGED OUT: Show Auth Links
                            <>
                                <Link href="/auth">
                                    <Button variant="ghost" className="text-zinc-400 hover:text-white hover:bg-zinc-800">
                                        Log In
                                    </Button>
                                </Link>
                                <Link href="/auth">
                                    <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-900/20 rounded-full px-6">
                                        Sign Up
                                    </Button>
                                </Link>
                            </>
                        ) : null}
                    </div>
                </div>
            </nav>

            {/* --- PAGE CONTENT INJECTED HERE --- */}
            <main className="flex-1 flex flex-col">
                {children}
            </main>

            {/* --- GLOBAL FOOTER --- */}
            <footer className="border-t border-zinc-800/60 bg-zinc-950 py-12 mt-auto">
                <div className="max-w-7xl mx-auto px-6 text-center md:text-left grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div>
                        <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
                            <Cpu className="text-blue-500" size={20} />
                            <span className="text-lg font-bold text-white">V_Shop</span>
                        </div>
                        <p className="text-sm text-zinc-500">The next-generation marketplace for industrial kinematics and collaborative robotics.</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-zinc-100 mb-4">Platform</h4>
                        <ul className="space-y-2 text-sm text-zinc-400">
                            <li><Link href="/shop" className="hover:text-blue-400 transition-colors">Marketplace</Link></li>
                            <li><Link href="/trade-in" className="hover:text-blue-400 transition-colors">Trade-In Portal</Link></li>
                            <li><Link href="/accessories" className="hover:text-blue-400 transition-colors">Parts & Extras</Link></li>
                        </ul>
                    </div>
                </div>
            </footer>
        </div>
    );
}