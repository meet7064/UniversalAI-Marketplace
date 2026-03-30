"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bot, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess(false);

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please verify.");
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:8000/api/auth/register_admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to initialize new administrator");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2000);

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
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Create Access Node</h1>
            <p className="text-sm text-zinc-400 mt-1">Register your fleet command credentials</p>
          </div>
        </div>

        {/* Minimalist Form */}
        <form onSubmit={handleRegister} className="bg-zinc-950 border border-zinc-800/50 rounded-2xl p-6 shadow-sm space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium text-center">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium text-center">
              Node initialized successfully. Rerouting...
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
              disabled={isLoading || success}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-zinc-300 font-medium">Secure Key</Label>
            <Input 
              id="password" 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 bg-zinc-900 border-zinc-800 text-zinc-100 focus-visible:ring-1 focus-visible:ring-blue-500"
              disabled={isLoading || success}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-zinc-300 font-medium">Verify Secure Key</Label>
            <Input 
              id="confirmPassword" 
              type="password" 
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-11 bg-zinc-900 border-zinc-800 text-zinc-100 focus-visible:ring-1 focus-visible:ring-blue-500"
              disabled={isLoading || success}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full h-11 bg-zinc-100 hover:bg-white text-zinc-900 font-medium text-base transition-colors mt-4"
            disabled={isLoading || success}
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Initialize Account"}
          </Button>
        </form>

        <div className="text-center text-sm text-zinc-500">
          Already have an active node?{" "}
          <Link href="/login" className="text-zinc-300 hover:text-white underline underline-offset-4 transition-colors">
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
}