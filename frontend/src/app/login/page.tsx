"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bot, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminStore } from "@/store/admin-store";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const setAdminUser = useAdminStore((state) => state.setAdminUser);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("http://127.0.0.1:8000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Invalid login credentials");
      }

      // 1. Set the secure browser cookie for Next.js Middleware
      document.cookie = `admin_session=${data.access_token}; path=/; max-age=86400; SameSite=Strict`;

      // 2. Hydrate the global Zustand store with the user's profile
      setAdminUser({
        email: email,
        role: data.role || "admin",
      });

      // 3. Trigger the navigation
      router.refresh(); // Forces Next.js to acknowledge the new cookie for Server Components
      router.push("/admin"); // Pushes the user to the secure layout
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-6 selection:bg-blue-500/30">
      <div className="w-full max-w-[400px] space-y-8">
        
        {/* Clean Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="h-14 w-14 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center">
            <Bot size={28} className="text-zinc-100" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Welcome back</h1>
            <p className="text-sm text-zinc-400 mt-1">Enter your credentials to access the command center</p>
          </div>
        </div>

        {/* Minimalist Form */}
        <form onSubmit={handleLogin} className="bg-zinc-950 border border-zinc-800/50 rounded-2xl p-6 shadow-sm space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium text-center">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-zinc-300 font-medium">Email Address</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="admin@vshop.com" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-blue-500"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-zinc-300 font-medium">Password</Label>
            </div>
            <Input 
              id="password" 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 bg-zinc-900 border-zinc-800 text-zinc-100 focus-visible:ring-1 focus-visible:ring-blue-500"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full h-11 bg-zinc-100 hover:bg-white text-zinc-900 font-medium text-base transition-colors mt-2"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign in"}
          </Button>
        </form>

        <div className="text-center text-sm text-zinc-500">
          Need an administrator node?{" "}
          <Link href="/register" className="text-zinc-300 hover:text-white underline underline-offset-4 transition-colors">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}