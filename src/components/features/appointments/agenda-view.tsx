'use client';

import { Appointment } from "@/types/appointment";
import { format, isSameDay } from "date-fns";
import { AppointmentCard } from "./appointment-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { X, FilterX } from "lucide-react";
import { cn } from "@/lib/utils";

interface AgendaViewProps {
    appointments: Appointment[];
    selectedDate: Date | undefined;
    onClearSelection: () => void;
    className?: string;
}

export function AgendaView({ appointments, selectedDate, onClearSelection, className }: AgendaViewProps) {
    const filtered = selectedDate
        ? appointments.filter(a => isSameDay(new Date(a.scheduledAt), selectedDate))
        : appointments;

    const groupTitle = selectedDate
        ? format(selectedDate, "EEEE, d MMMM yyyy")
        : "Upcoming Appointments";

    return (
        <div className={cn("flex flex-col h-full space-y-6", className)}>
             <div className="flex items-center justify-between pb-4 border-b border-border/50">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">{selectedDate ? "Day Agenda" : "All Appointments"}</h2>
                    <p className="text-sm text-muted-foreground mt-1">{groupTitle}</p>
                </div>
                {selectedDate && (
                    <Button variant="ghost" size="sm" onClick={onClearSelection} className="gap-2 text-muted-foreground hover:text-foreground bg-secondary/50 hover:bg-secondary transition-colors">
                        <FilterX className="w-4 h-4" /> Show All
                    </Button>
                )}
            </div>

            <ScrollArea className="flex-1 pr-4 -mr-4 h-[calc(100vh-300px)] min-h-[400px]">
                <div className="space-y-4 pb-20">
                    {filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 border border-dashed border-border/50 rounded-xl bg-card/10">
                            <div className="p-4 rounded-full bg-muted/50 text-muted-foreground">
                                <X className="w-8 h-8 opacity-50" />
                            </div>
                            <div>
                                <h3 className="font-medium text-foreground">No appointments scheduled</h3>
                                <p className="text-sm text-muted-foreground">You are free on this day.</p>
                            </div>
                            <Button variant="outline" onClick={onClearSelection}>View All Upcoming</Button>
                        </div>
                    ) : (
                        filtered.map(app => (
                            <AppointmentCard key={app.id} appointment={app} />
                        ))
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
