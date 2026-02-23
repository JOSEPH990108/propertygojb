import { getUserAppointments } from "@/app/actions/appointment-actions";
import { AppointmentManager } from "@/components/features/appointments/appointment-manager";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Appointments | PropertyGo",
  description: "Manage your property viewings and appointments.",
};

export default async function AppointmentsPage() {
    const { success, data, error } = await getUserAppointments();

    if (!success) {
        return (
            <div className="container py-20 text-center">
                 <h1 className="text-3xl font-bold mb-4">Appointments</h1>
                 <p className="text-destructive">Error: {error || "Failed to load appointments"}</p>
            </div>
        );
    }

    return (
        <div className="container py-8 md:py-12 max-w-7xl mx-auto">
            <div className="mb-8 space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
                <p className="text-muted-foreground">Manage your scheduled property viewings and track your visits.</p>
            </div>

            {/*
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            */}
            <AppointmentManager initialAppointments={data as any} />
        </div>
    );
}
