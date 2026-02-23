'use client';

import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface CalendarViewProps {
    date: Date | undefined;
    setDate: (date: Date | undefined) => void;
    highlightedDates: Date[];
    className?: string;
}

export function CalendarView({ date, setDate, highlightedDates, className }: CalendarViewProps) {
    // Ensure highlighted dates are comparable (strip time if needed, but react-day-picker usually handles day matching well)
    // Actually, react-day-picker compares dates.

    return (
        <div className={cn("rounded-2xl border border-border/50 bg-card/30 backdrop-blur-xl p-4 shadow-xl sticky top-24", className)}>
             <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="w-full flex justify-center p-2"
                modifiers={{
                    booked: highlightedDates
                }}
                modifiersClassNames={{
                    booked: "after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-primary after:rounded-full relative"
                }}
            />
        </div>
    );
}
