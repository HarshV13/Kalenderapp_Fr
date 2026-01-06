import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { startOfDay } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { CONFIG } from '@/lib/config';

// This endpoint is called by Netlify Scheduled Functions at midnight Europe/Berlin
// It deletes:
// 1. All past appointments
// 2. All REJECTED and CANCELLED appointments

export async function POST(request: Request) {
    try {
        // Verify the request is from a trusted source
        const authHeader = request.headers.get('authorization');
        const isScheduledJob = authHeader === `Bearer ${process.env.ADMIN_PASSWORD}`;

        if (!isScheduledJob) {
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

        // 1. Delete all past appointments
        const { data: pastData } = await supabaseAdmin
            .from('appointments')
            .delete()
            .lt('start_at', todayMidnightUtc.toISOString())
            .select('id');

        const pastCount = pastData?.length || 0;

        // 2. Delete all REJECTED and CANCELLED appointments (any date)
        const { data: rejectedData } = await supabaseAdmin
            .from('appointments')
            .delete()
            .in('status', ['REJECTED', 'CANCELLED'])
            .select('id');

        const rejectedCount = rejectedData?.length || 0;

        // 3. Delete past blocked times
        const { data: blockedData } = await supabaseAdmin
            .from('blocked_times')
            .delete()
            .lt('end_at', todayMidnightUtc.toISOString())
            .select('id');

        const blockedCount = blockedData?.length || 0;

        const totalDeleted = pastCount + rejectedCount + blockedCount;
        console.log(`Cleanup completed: ${pastCount} past, ${rejectedCount} rejected/cancelled, ${blockedCount} blocked times`);

        return NextResponse.json({
            success: true,
            deletedPastAppointments: pastCount,
            deletedRejectedCancelled: rejectedCount,
            deletedBlockedTimes: blockedCount,
            totalDeleted,
            cleanupDate: todayMidnightUtc.toISOString(),
            message: `Cleanup: ${totalDeleted} Einträge gelöscht`,
        });

    } catch (error) {
        console.error('Error in cleanup:', error);
        return NextResponse.json(
            { error: 'Ein Fehler ist aufgetreten' },
            { status: 500 }
        );
    }
}
