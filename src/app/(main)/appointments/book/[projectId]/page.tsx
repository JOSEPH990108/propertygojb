import { BookingForm } from "@/components/custom/appointment/BookingForm";

export default async function BookingPage({ params }: { params: Promise<{ projectId: string }> }) {
    const { projectId } = await params;

    return (
        <div className="container max-w-lg py-10">
            <h1 className="text-2xl font-bold mb-6">Book an Appointment</h1>
            <BookingForm projectId={projectId} />
        </div>
    );
}
