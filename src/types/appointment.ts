export interface Appointment {
    id: string;
    userId: string;
    agentId?: string | null;
    projectId: string;
    scheduledAt: Date | string; // serialized to string when passed to client
    statusId: string;
    notes?: string | null;
    qrToken?: string | null;
    scannedAt?: Date | null;
    scannedById?: string | null;
    referrerId?: string | null;
    project: {
        id: string;
        name: string;
        slug: string;
        address?: string | null;
    };
    status: {
        id: string;
        code: string;
        name: string;
        color?: string | null;
        description?: string | null;
    };
    agent?: {
        id: string;
        name: string;
        phoneNumber?: string | null;
        image?: string | null;
        agencyName?: string | null;
    } | null;
}
