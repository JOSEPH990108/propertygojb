
import { NextResponse } from 'next/server';
import { processNoShows } from '@/app/actions/appointment-actions';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        // Basic Authorization for Cron
        const authHeader = request.headers.get('authorization');
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
             return new NextResponse('Unauthorized', { status: 401 });
        }

        const result = await processNoShows();

        if (result.success) {
            return NextResponse.json({ success: true, count: result.count });
        } else {
            return NextResponse.json({ success: false, error: result.error }, { status: 500 });
        }
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
