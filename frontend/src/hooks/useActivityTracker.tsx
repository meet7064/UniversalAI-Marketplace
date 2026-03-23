import { useEffect } from "react";

export function useActivityTracker(userId: string, name: string, company: string, currentAction: string) {
    useEffect(() => {
        // Function to shoot data to FastAPI
        const sendHeartbeat = async () => {
            if (!userId) return;
            try {
                await fetch("http://127.0.0.1:8000/api/activity/heartbeat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        user_id: userId,
                        name: name,
                        company: company,
                        current_action: currentAction
                    })
                });
            } catch (error) {
                console.error("Heartbeat failed", error);
            }
        };

        // Send immediately on page load
        sendHeartbeat();

        // Then send every 60 seconds
        const interval = setInterval(sendHeartbeat, 60000);

        // Cleanup if they leave the page
        return () => clearInterval(interval);
    }, [userId, name, company, currentAction]);
}