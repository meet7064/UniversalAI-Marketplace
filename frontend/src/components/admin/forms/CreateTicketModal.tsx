"use client";

import { useState, useEffect } from "react";
import { Plus, Loader2, Wrench } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export function CreateTicketModal({ onSuccess }: { onSuccess: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fleet, setFleet] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    asset_id: "",
    issue: "",
    priority: "Medium",
  });

  // Fetch the live fleet when the modal opens so you can select a robot
  useEffect(() => {
    if (isOpen) {
      fetch("http://127.0.0.1:8000/api/admin/fleet")
        .then(res => res.json())
        .then(data => setFleet(data))
        .catch(err => console.error("Failed to load fleet for dropdown:", err));
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.asset_id) return alert("Please select a robot");

    setIsLoading(true);

    // Find the specific robot's name based on the selected ID
    const selectedRobot = fleet.find(r => r.id === formData.asset_id);

    try {
      const payload = {
        asset_id: formData.asset_id,
        asset_name: selectedRobot ? selectedRobot.name : "Unknown Asset",
        issue: formData.issue,
        priority: formData.priority,
        reported_by: "Admin" // Hardcoded for the admin dashboard
      };

      const response = await fetch("http://127.0.0.1:8000/api/service/tickets/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to create ticket");

      setIsOpen(false);
      setFormData({ asset_id: "", issue: "", priority: "Medium" });
      onSuccess(); // Refresh the Kanban board!

    } catch (error) {
      console.error(error);
      alert("Something went wrong saving the ticket.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm shadow-blue-900/20"
      >
        <Plus className="mr-2 h-4 w-4" /> Create Ticket
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px] bg-zinc-950 border-zinc-800 text-zinc-100">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 bg-amber-500/10 rounded-lg flex items-center justify-center border border-amber-500/20">
                <Wrench className="text-amber-500" size={20} />
              </div>
              <div>
                <DialogTitle className="text-xl">Log Service Issue</DialogTitle>
                <p className="text-sm text-zinc-400 mt-1">Create a new maintenance ticket and send it to the queue.</p>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            
            <div className="space-y-2">
              <Label className="text-zinc-300">Select Asset</Label>
              <Select value={formData.asset_id} onValueChange={(val) => setFormData({ ...formData, asset_id: val })}>
                <SelectTrigger className="bg-zinc-900 border-zinc-800 focus:ring-blue-500">
                  <SelectValue placeholder="Select a robot..." />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-h-60">
                  {fleet.map(robot => (
                    <SelectItem key={robot.id} value={robot.id}>
                      {robot.name} ({robot.brand})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Issue Description</Label>
              <Input 
                required 
                placeholder="e.g., Joint 3 Servo Overheating"
                value={formData.issue} 
                onChange={(e) => setFormData({ ...formData, issue: e.target.value })} 
                className="bg-zinc-900 border-zinc-800 focus-visible:ring-blue-500" 
              />
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Priority Level</Label>
              <Select value={formData.priority} onValueChange={(val) => setFormData({ ...formData, priority: val })}>
                <SelectTrigger className="bg-zinc-900 border-zinc-800 focus:ring-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-4 border-t border-zinc-800/60 mt-4">
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-white">
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Submit Ticket"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}