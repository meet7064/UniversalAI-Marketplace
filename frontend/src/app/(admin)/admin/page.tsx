import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Database, DollarSign, Users } from "lucide-react";

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-100">Fleet Overview</h2>
        <p className="text-zinc-400 text-sm mt-1">Real-time metrics for your robotics marketplace.</p>
      </div>

      {/* KPI Cards Placeholder */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-zinc-950 border-zinc-800/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Total Fleet Value</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-100">$45,231.89</div>
            <p className="text-xs text-zinc-500 mt-1">+20.1% from last month</p>
          </CardContent>
        </Card>
        
        <Card className="bg-zinc-950 border-zinc-800/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Active Rentals</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-100">+2350</div>
            <p className="text-xs text-zinc-500 mt-1">+180.1% from last month</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-950 border-zinc-800/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Open Service Tickets</CardTitle>
            <Database className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-100">12</div>
            <p className="text-xs text-zinc-500 mt-1">3 critical priority</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-950 border-zinc-800/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Active Simulators</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-100">4</div>
            <p className="text-xs text-zinc-500 mt-1">Users testing Digital Twins</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}