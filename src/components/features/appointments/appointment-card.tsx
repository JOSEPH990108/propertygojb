'use client';

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, User, Phone } from "lucide-react";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Appointment } from "@/types/appointment";

interface AppointmentCardProps {
    appointment: Appointment;
    onViewDetails?: () => void;
}

export function AppointmentCard({ appointment }: AppointmentCardProps) {
    const statusColor = (code: string) => {
        switch (code) {
            case 'CONFIRMED': return "bg-green-500/15 text-green-500 border-green-500/20";
            case 'PENDING': return "bg-yellow-500/15 text-yellow-500 border-yellow-500/20";
            case 'COMPLETED': return "bg-blue-500/15 text-blue-500 border-blue-500/20";
            case 'CANCELLED': return "bg-red-500/15 text-red-500 border-red-500/20";
            case 'NO_SHOW': return "bg-orange-500/15 text-orange-500 border-orange-500/20";
            default: return "bg-gray-500/15 text-gray-500 border-gray-500/20";
        }
    };

    return (
        <Card className="group overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card hover:border-primary/20 transition-all duration-300">
            <CardContent className="p-5 space-y-4">
                {/* Header: Date & Status */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                         <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0">
                            <span className="text-xs font-medium uppercase">{format(new Date(appointment.scheduledAt), "MMM")}</span>
                            <span className="text-xl font-bold">{format(new Date(appointment.scheduledAt), "d")}</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{format(new Date(appointment.scheduledAt), "EEEE, h:mm a")}</p>
                            <h3 className="text-lg font-semibold text-foreground line-clamp-1">{appointment.project.name}</h3>
                        </div>
                    </div>
                     <Badge variant="outline" className={cn("capitalize px-2 py-0.5 text-xs whitespace-nowrap", statusColor(appointment.status.code))}>
                        {appointment.status.name}
                    </Badge>
                </div>

                {/* Location */}
                {appointment.project.address && (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground pl-1">
                        <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary/70" />
                        <span className="line-clamp-1 text-xs">{appointment.project.address}</span>
                    </div>
                )}

                {/* Agent & Actions */}
                <div className="pt-4 mt-2 border-t border-border/50 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8 border border-border">
                            <AvatarImage src={appointment.agent?.image || ""} />
                            <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
                        </Avatar>
                        <div className="text-sm">
                            <p className="font-medium text-foreground text-sm">{appointment.agent?.name || "Unassigned"}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{appointment.agent?.agencyName || "Agent"}</p>
                        </div>
                     </div>

                     <div className="flex gap-2">
                        {appointment.agent?.phoneNumber && (
                             <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-green-500 hover:bg-green-500/10" asChild>
                                <a href={`https://wa.me/${appointment.agent.phoneNumber.replace(/\+/g, '')}`} target="_blank" rel="noopener noreferrer">
                                    <Phone className="w-4 h-4" />
                                </a>
                            </Button>
                        )}
                     </div>
                </div>

                {/* Notes (Optional) */}
                {appointment.notes && (
                    <div className="bg-muted/30 p-3 rounded-md text-xs text-muted-foreground italic border border-border/30 mt-2">
                        "{appointment.notes}"
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
