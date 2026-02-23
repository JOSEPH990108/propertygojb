'use client';

import { useState } from "react";
import { Appointment } from "@/types/appointment";
import { CalendarView } from "./calendar-view";
import { AgendaView } from "./agenda-view";
import { EmptyState } from "./empty-state";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calendar as CalendarIcon, List } from "lucide-react";

interface AppointmentManagerProps {
    initialAppointments: Appointment[];
}

export function AppointmentManager({ initialAppointments }: AppointmentManagerProps) {
    const [date, setDate] = useState<Date | undefined>(undefined);

    // Check if empty
    if (!initialAppointments || initialAppointments.length === 0) {
        return <EmptyState />;
    }

    // Determine highlighted dates
    const highlightedDates = initialAppointments.map(a => new Date(a.scheduledAt));

    const handleDateSelect = (newDate: Date | undefined) => {
        // Toggle if same date selected
        if (date && newDate && date.getTime() === newDate.getTime()) {
            setDate(undefined);
        } else {
            setDate(newDate);
        }
    };

    return (
        <div className="w-full max-w-7xl mx-auto">
            {/* Desktop Layout */}
            <div className="hidden lg:grid grid-cols-12 gap-8 items-start">
                <div className="col-span-4 xl:col-span-3 sticky top-24">
                     <CalendarView
                        date={date}
                        setDate={handleDateSelect}
                        highlightedDates={highlightedDates}
                    />
                </div>
                <div className="col-span-8 xl:col-span-9">
                    <AgendaView
                        appointments={initialAppointments}
                        selectedDate={date}
                        onClearSelection={() => setDate(undefined)}
                    />
                </div>
            </div>

            {/* Mobile Layout */}
            <div className="lg:hidden flex flex-col h-full">
                 <Tabs defaultValue="agenda" className="w-full flex-1 flex flex-col">
                    <TabsList className="grid w-full grid-cols-2 mb-6 sticky top-20 z-10 bg-background/95 backdrop-blur shadow-sm">
                        <TabsTrigger value="agenda" className="gap-2">
                            <List className="w-4 h-4" /> Agenda
                        </TabsTrigger>
                        <TabsTrigger value="calendar" className="gap-2">
                            <CalendarIcon className="w-4 h-4" /> Calendar
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="agenda" className="flex-1 mt-0">
                        <AgendaView
                            appointments={initialAppointments}
                            selectedDate={date}
                            onClearSelection={() => setDate(undefined)}
                        />
                    </TabsContent>

                    <TabsContent value="calendar" className="mt-0">
                         <div className="bg-card rounded-xl border border-border/50 p-4 shadow-sm">
                            <CalendarView
                                date={date}
                                setDate={handleDateSelect}
                                highlightedDates={highlightedDates}
                                className="shadow-none border-0 bg-transparent"
                            />
                        </div>
                        <div className="mt-6 px-4">
                             <h3 className="font-semibold mb-2">Selected Date</h3>
                             {date ? (
                                 <AgendaView
                                    appointments={initialAppointments}
                                    selectedDate={date}
                                    onClearSelection={() => setDate(undefined)}
                                    className="border-t border-border/50 pt-4"
                                />
                             ) : (
                                 <p className="text-muted-foreground text-sm text-center py-8">Select a date above to see appointments.</p>
                             )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
