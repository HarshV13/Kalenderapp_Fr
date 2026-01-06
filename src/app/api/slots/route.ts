import { NextResponse } from 'next/server';
import { getAvailableSlots } from '@/lib/time';
import { dateRangeSchema } from '@/lib/validation';
import { addDays, format } from 'date-fns';
import { CONFIG } from '@/lib/config';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const from = searchParams.get('from');
        const to = searchParams.get('to');

        // Default to today + 3 weeks if not specified
        const today = new Date();
        const defaultFrom = format(today, 'yyyy-MM-dd');
        const defaultTo = format(addDays(today, CONFIG.BOOKING_WINDOW_DAYS), 'yyyy-MM-dd');

        const params = {
            from: from || defaultFrom,
            to: to || defaultTo,
        };

        // Validate parameters
        const validation = dateRangeSchema.safeParse(params);
        if (!validation.success) {
            return NextResponse.json(
                { error: 'Ungültige Parameter', details: validation.error.issues },
                { status: 400 }
            );
        }

        // Get available slots
        const slots = await getAvailableSlots(params.from, params.to);

        return NextResponse.json({
            slots,
            bookingWindow: {
                from: params.from,
                to: params.to,
            },
            config: {
                slotInterval: CONFIG.SLOT_INTERVAL_MINUTES,
                defaultDuration: CONFIG.DEFAULT_DURATION_MINUTES,
                extendedDuration: CONFIG.EXTENDED_DURATION_MINUTES,
                buffer: CONFIG.BUFFER_MINUTES,
                serviceThreshold: CONFIG.SERVICE_THRESHOLD,
            },
        });
    } catch (error) {
        console.error('Error fetching slots:', error);
        return NextResponse.json(
            { error: 'Fehler beim Laden der Termine' },
            { status: 500 }
        );
    }
}
