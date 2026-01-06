import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { startOfDay } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { CONFIG } from '@/lib/config';

// This endpoint is called by Netlify Scheduled Functions at midnight Europe/Berlin
// It deletes all past appointments (keep the database clean)

export async function POST(request: Request) {
    try {
        // Verify the request is from a trusted source (Netlify scheduled function)
        // In production, you'd want to add proper authentication
        const authHeader = request.headers.get('authorization');
        const isScheduledJob = authHeader === `Bearer ${process.env.ADMIN_PASSWORD}`;

        if (!isScheduledJob) {
            // Allow only if admin authenticated
            console.log('Unauthorized cleanup attempt');
            return NextResponse.json(
                { error: 'Nicht autorisiert' },
                { status: 401 }
            );
        }

        // Get today midnight in Berlin timezone
        const nowInBerlin = toZonedTime(new Date(), CONFIG.TIMEZONE);
        const todayMidnight = startOfDay(nowInBerlin);
        const todayMidnightUtc = fromZonedTime(todayMidnight, CONFIG.TIMEZONE);

        // Delete all appointments that ended before today
        const { data, error, count } = await supabaseAdmin
            .from('appointments')
            .delete()
            .lt('start_at', todayMidnightUtc.toISOString())
            .select('id');

        if (error) {
            console.error('Error during cleanup:', error);
            return NextResponse.json(
                { error: 'Fehler beim Aufräumen' },
                { status: 500 }
            );
        }

        const deletedCount = data?.length || 0;
        console.log(`Cleanup completed: ${deletedCount} past appointments deleted`);

        return NextResponse.json({
            success: true,
            deletedCount,
            cleanupDate: todayMidnightUtc.toISOString(),
            message: `${deletedCount} vergangene Termine wurden gelöscht`,
        });

    } catch (error) {
        console.error('Error in cleanup:', error);
        return NextResponse.json(
            { error: 'Ein Fehler ist aufgetreten' },
            { status: 500 }
        );
    }
}
