'use client';

import { Button } from "@/components/ui/button";
import { CalendarSearch, Sparkles } from "lucide-react";
import { generateDemoAppointments } from "@/app/actions/appointment-actions";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function EmptyState() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const res = await generateDemoAppointments();
            if (res.success) {
                toast.success("Demo appointments generated!");
                router.refresh();
            } else {
                toast.error(res.error || "Failed to generate appointments");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        }
        setLoading(false);
    };

    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8 border border-dashed border-border/50 rounded-2xl bg-card/10 backdrop-blur-sm">
            <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center mb-6 ring-1 ring-primary/20">
                <CalendarSearch className="w-10 h-10 text-primary/80" />
            </div>
            <h3 className="text-2xl font-bold mb-3 tracking-tight">Your Calendar is Clear</h3>
            <p className="text-muted-foreground max-w-sm mb-8 leading-relaxed">
                You haven't scheduled any property viewings yet. Browse our exclusive collections or generate a demo schedule to see how it works.
            </p>
            <Button
                onClick={handleGenerate}
                disabled={loading}
                size="lg"
                className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all duration-300"
            >
                <Sparkles className="w-4 h-4" />
                {loading ? "Generating Experience..." : "Generate Demo Schedule"}
            </Button>
        </div>
    );
}
