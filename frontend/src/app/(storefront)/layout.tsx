"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { 
    Cpu, ShoppingCart, LogOut, Package, LayoutDashboard, Search 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
    DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useStore } from "@/store/useStore";

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname(); 
    
    const user = useStore((state) => state.user);
    const isAuthenticated = useStore((state) => state.isAuthenticated);
    const logout = useStore((state) => state.logout);
    const cart = useStore((state) => state.cart);

    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleLogout = () => {
        logout();
        router.push("/");
    };

    const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);
    const isAuthPage = pathname === "/auth";

    // --- NEW: SMART DISPLAY NAME HELPER ---
    // This safely handles the name, fallbacks to email, and ignores default "User" strings
    const getDisplayName = () => {
        if (user?.name && user.name.toLowerCase() !== "user" && user.name.trim() !== "") {
            return user.name;
        }
        if (user?.email) {
            return user.email.split('@')[0]; // Grabs the first part of the email
        }
        return "Customer";
    };

    const displayName = getDisplayName();
    const userInitial = displayName.charAt(0).toUpperCase();

    return (
        <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans selection:bg-yellow-500/30 flex flex-col">
            
            {!isAuthPage && (
                <>
                    {/* --- TOP THIN ANNOUNCEMENT --- */}
                    <div className="w-full bg-[#0a0a0a] border-b border-zinc-900 py-2 px-6">
                        <div className="max-w-7xl mx-auto flex justify-between items-center text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                            <div className="flex gap-4">
                                <span>Unitree Official Partner</span>
                                <span className="hidden md:inline">•</span>
                                <span className="hidden md:inline">Questions? Call 800-ROBO-STORE</span>
                            </div>
                            <div className="hover:text-yellow-500 cursor-pointer transition-colors">
                                Lead times vary by demand →
                            </div>
                        </div>
                    </div>

                    {/* --- MAIN NAVIGATION --- */}
                    <nav className="sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-xl border-b border-zinc-900/50">
                        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                            
                            {/* Brand Logo */}
                            <Link href="/" className="flex items-center gap-3 group">
                                <span className="text-xl font-black tracking-[0.3em] uppercase text-white group-hover:text-yellow-500 transition-colors">
                                    Robostore
                                </span>
                            </Link>
                            
                            {/* Centered Navigation Links */}
                            <div className="hidden lg:flex items-center gap-10 text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                <Link href="/shop" className="hover:text-white transition-colors">Humanoids</Link>
                                <Link href="/shop" className="hover:text-white transition-colors">Quadrupeds</Link>
                                <Link href="/accessories" className="hover:text-white transition-colors">Accessories</Link>
                                <Link href="/repair" className="hover:text-white transition-colors">Repair</Link>
                                <Link href="/trade-in" className="hover:text-white transition-colors">Trade-In</Link>
                            </div>

                            {/* Right Side Actions */}
                            <div className="flex items-center gap-3">
                                <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
                                    <Search size={18} />
                                </Button>
                                
                                {isMounted && (
                                    <Link href="/cart">
                                        <Button variant="ghost" size="icon" className="relative text-zinc-400 hover:text-white">
                                            <ShoppingCart size={18} />
                                            {cartItemCount > 0 && (
                                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-500 text-[9px] font-black text-black">
                                                    {cartItemCount}
                                                </span>
                                            )}
                                        </Button>
                                    </Link>
                                )}

                                <div className="h-4 w-[1px] bg-zinc-800 mx-2 hidden sm:block" />

                                {isMounted && isAuthenticated && user ? (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="flex items-center gap-2 hover:bg-zinc-900 rounded-full px-2">
                                                <div className="h-7 w-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] font-bold text-yellow-500 uppercase">
                                                    {/* Using the new Initial variable */}
                                                    {userInitial}
                                                </div>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-[#0c0c0c] border-zinc-800 text-zinc-400 w-56 mt-4 rounded-xl shadow-2xl">
                                            <div className="px-4 py-3">
                                                {/* Using the new Display Name variable */}
                                                <p className="text-xs font-black text-white uppercase tracking-widest truncate">{displayName}</p>
                                                <p className="text-[10px] text-zinc-600 truncate">{user?.email}</p>
                                            </div>
                                            <DropdownMenuSeparator className="bg-zinc-800/50" />
                                            
                                            <Link href="/">
                                                <DropdownMenuItem className="focus:bg-zinc-900 focus:text-white cursor-pointer py-2.5 text-xs font-bold uppercase tracking-tighter">
                                                    <LayoutDashboard className="mr-3 h-4 w-4" /> My Fleet
                                                </DropdownMenuItem>
                                            </Link>
                                            <Link href="/orders">
                                                <DropdownMenuItem className="focus:bg-zinc-900 focus:text-white cursor-pointer py-2.5 text-xs font-bold uppercase tracking-tighter">
                                                    <Package className="mr-3 h-4 w-4" /> Order History
                                                </DropdownMenuItem>
                                            </Link>
                                            <Link href="/profile">
                                                <DropdownMenuItem className="focus:bg-zinc-900 focus:text-white cursor-pointer py-2.5 text-xs font-bold uppercase tracking-tighter">
                                                    <Package className="mr-3 h-4 w-4" /> Profile Settings
                                                </DropdownMenuItem>
                                            </Link>

                                            {user.role === "admin" && (
                                                <>
                                                    <DropdownMenuSeparator className="bg-zinc-800/50" />
                                                    <Link href="/admin">
                                                        <DropdownMenuItem className="focus:bg-yellow-500/10 focus:text-yellow-500 text-yellow-500 cursor-pointer py-2.5 text-xs font-bold uppercase tracking-tighter">
                                                            <Cpu className="mr-3 h-4 w-4" /> Command Center
                                                        </DropdownMenuItem>
                                                    </Link>
                                                </>
                                            )}

                                            <DropdownMenuSeparator className="bg-zinc-800/50" />
                                            <DropdownMenuItem onClick={handleLogout} className="focus:bg-red-500/10 focus:text-red-500 text-red-500 cursor-pointer py-2.5 text-xs font-bold uppercase tracking-tighter">
                                                <LogOut className="mr-3 h-4 w-4" /> Logout
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                ) : isMounted ? (
                                    <Link href="/auth">
                                        <Button className="bg-white text-black hover:bg-zinc-200 text-[10px] font-black uppercase tracking-widest px-6 h-9 rounded-full">
                                            Access Portal
                                        </Button>
                                    </Link>
                                ) : null}
                            </div>
                        </div>
                    </nav>
                </>
            )}

            {/* --- PAGE CONTENT --- */}
            <main className="flex-1 flex flex-col">
                {children}
            </main>

            {/* CONDITIONAL RENDER: Also hide footer on auth page for a cleaner look! */}
            {!isAuthPage && (
                <footer className="bg-[#050505] border-t border-zinc-900 pt-24 pb-12">
                    <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-16">
                        <div className="col-span-1 md:col-span-2">
                            <span className="text-xl font-black tracking-[0.3em] uppercase text-white mb-6 block">
                                Robostore
                            </span>
                            <p className="text-sm text-zinc-500 max-w-sm leading-relaxed mb-8">
                                Official North American partner for high-performance robotics. 
                                Supplying humanoids, quadrupeds, and custom kinetic solutions 
                                to industry leaders and academic researchers worldwide.
                            </p>
                        </div>
                        
                        <div>
                            <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-6">Inventory</h4>
                            <ul className="space-y-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">
                                <li><Link href="/shop" className="hover:text-yellow-500 transition-colors">Humanoids</Link></li>
                                <li><Link href="/shop" className="hover:text-yellow-500 transition-colors">Quadrupeds</Link></li>
                                <li><Link href="/accessories" className="hover:text-yellow-500 transition-colors">Accessories</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-6">Support</h4>
                            <ul className="space-y-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">
                                <li><Link href="/trade-in" className="hover:text-yellow-500 transition-colors">Trade-In Portal</Link></li>
                                <li><Link href="/contact" className="hover:text-yellow-500 transition-colors">Technical Help</Link></li>
                                <li><Link href="/solutions" className="hover:text-yellow-500 transition-colors">Custom Integration</Link></li>
                            </ul>
                        </div>
                    </div>
                    <div className="max-w-7xl mx-auto px-6 mt-24 pt-8 border-t border-zinc-900 flex justify-between items-center text-[9px] font-black uppercase tracking-[0.3em] text-zinc-700">
                        <span>© 2026 Robostore North America</span>
                        <span>Designed for the Future</span>
                    </div>
                </footer>
            )}
        </div>
    );
}